// routes/posts.ts
// CRUD + interactions for posts.

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client'
import { requireAuth } from '../middleware/requireAuth'
import { currentUserId } from './_currentUser'
import { toPostDto } from './_dto'
import { latSchema, lngSchema } from '../utils/geo'
import {
  uploadImage,
  uploadVideo,
  isImageMime,
  isVideoMime,
} from '../services/media'
import { invalidateCache } from '../services/cache'
import {
  enqueueNearbyPost,
  enqueueEventSoon,
} from '../services/notifications'

// ── Schemas ────────────────────────────────────────────────
const uuidParamSchema = z.object({ id: z.string().uuid() })

const reportReasonSchema = z.object({
  reason: z.enum(['spam', 'fake', 'inappropriate', 'safety', 'other']),
})

const postFieldsSchema = z.object({
  type: z.enum(['event', 'hangout', 'deal']),
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(300).optional(),
  lat: latSchema,
  lng: lngSchema,
  eventTime: z.string().datetime().optional(),
})

// 10MB images, 50MB videos
const IMAGE_LIMIT = 10 * 1024 * 1024
const VIDEO_LIMIT = 50 * 1024 * 1024

export async function postRoutes(server: FastifyInstance) {
  // ── POST /posts ─────────────────────────────────────────
  // multipart/form-data: file + type + title + description? + lat + lng + eventTime?
  // 10 per hour per user (the docs/api.md contract).
  server.post(
    '/',
    {
      preHandler: requireAuth,
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 hour',
          keyGenerator: (req) => (req as any).clerkUserId ?? req.ip,
        },
      },
    },
    async (request, reply) => {
      if (!request.isMultipart()) {
        return reply.status(400).send({ error: 'Expected multipart/form-data' })
      }

      const clerkUserId = (request as any).clerkUserId
      const userId = await currentUserId(clerkUserId)
      if (!userId) return reply.status(404).send({ error: 'User not found' })

      // Walk the multipart parts ourselves so we can capture
      // both the file and the text fields in a single pass.
      let fileBuffer: Buffer | null = null
      let fileMime: string | undefined
      let fileName = 'upload'
      const fields: Record<string, string> = {}

      for await (const part of request.parts()) {
        if (part.type === 'file') {
          fileBuffer = await part.toBuffer()
          fileMime = part.mimetype
          fileName = part.filename || fileName
        } else {
          fields[part.fieldname] = part.value as string
        }
      }

      // Coerce + validate text fields.
      const parsed = postFieldsSchema.safeParse({
        type: fields.type,
        title: fields.title,
        description: fields.description || undefined,
        lat: fields.lat != null ? Number(fields.lat) : undefined,
        lng: fields.lng != null ? Number(fields.lng) : undefined,
        eventTime: fields.eventTime || undefined,
      })
      if (!parsed.success) {
        return reply.status(400).send({ error: parsed.error.flatten() })
      }
      const { type, title, description, lat, lng, eventTime } = parsed.data

      // Media validation + upload — optional. Text-only posts skip
      // the R2/Stream upload entirely and store no media.
      let mediaUrl: string | null = null
      let mediaType: 'image' | 'video' | null = null
      let cfStreamId: string | null = null

      if (fileBuffer) {
        if (isImageMime(fileMime)) {
          if (fileBuffer.length > IMAGE_LIMIT) {
            return reply.status(400).send({ error: 'Image must be under 10MB' })
          }
          const { url } = await uploadImage(
            fileBuffer,
            `posts/${userId}`,
            fileMime!
          )
          mediaUrl = url
          mediaType = 'image'
        } else if (isVideoMime(fileMime)) {
          if (fileBuffer.length > VIDEO_LIMIT) {
            return reply.status(400).send({ error: 'Video must be under 50MB' })
          }
          const { streamId, playbackUrl } = await uploadVideo(
            fileBuffer,
            fileName,
            fileMime
          )
          mediaUrl = playbackUrl
          mediaType = 'video'
          cfStreamId = streamId
        } else {
          return reply.status(400).send({ error: 'Unsupported media type' })
        }
      }

      const [row] = await db`
        INSERT INTO posts (
          user_id, type, title, description,
          media_url, media_type, cf_stream_id,
          location, event_time
        )
        VALUES (
          ${userId}, ${type}, ${title}, ${description ?? null},
          ${mediaUrl}, ${mediaType}, ${cfStreamId},
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${eventTime ?? null}
        )
        RETURNING
          id, type, title, description,
          media_url, media_type, cf_stream_id,
          like_count, save_count, event_time, created_at,
          ${lat}::float8 AS lat, ${lng}::float8 AS lng,
          ${userId}::uuid AS user_id
      `

      // Attach author fields for the DTO (one extra round trip is fine
      // because the author is hot in the connection cache).
      const [author] = await db`
        SELECT name AS user_name, avatar_url FROM users WHERE id = ${userId}
      `

      // Bust the nearby feed cache for this region.
      await invalidateCache(
        `feed:${lat.toFixed(2)}:${lng.toFixed(2)}:*`
      )

      // Fan-out: notify nearby users (1mi radius) + remind savers
      // 1h before an event starts.
      await enqueueNearbyPost({
        kind: 'nearby_post',
        postId: row.id,
        authorId: userId,
        lat,
        lng,
        title,
        radiusMiles: 1,
      })

      if (type === 'event' && eventTime) {
        const fireAt = new Date(eventTime).getTime() - 60 * 60 * 1000
        if (fireAt > Date.now()) {
          await enqueueEventSoon(
            { kind: 'event_soon', postId: row.id, title, eventTime },
            fireAt
          )
        }
      }

      return reply
        .status(201)
        .send({ post: toPostDto({ ...row, ...author, liked: false, saved: false }) })
    }
  )

  // ── GET /posts/:id ──────────────────────────────────────
  server.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = uuidParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Invalid post id' })

    const clerkUserId = (request as any).clerkUserId
    const me = await currentUserId(clerkUserId)

    const rows = await db`
      SELECT
        p.id, p.type, p.title, p.description,
        p.media_url, p.media_type, p.cf_stream_id,
        p.like_count, p.save_count, p.event_time, p.created_at,
        ST_X(p.location::geometry) AS lng,
        ST_Y(p.location::geometry) AS lat,
        u.id AS user_id, u.name AS user_name, u.avatar_url,
        EXISTS(
          SELECT 1 FROM post_likes pl
          WHERE pl.post_id = p.id AND pl.user_id = ${me ?? null}
        ) AS liked,
        EXISTS(
          SELECT 1 FROM saved_posts sp
          WHERE sp.post_id = p.id AND sp.user_id = ${me ?? null}
        ) AS saved
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ${params.data.id}
        AND p.is_deleted = FALSE
      LIMIT 1
    `
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'Post not found' })
    }
    return { post: toPostDto(rows[0]) }
  })

  // ── DELETE /posts/:id (soft delete, owner only) ─────────
  server.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    const params = uuidParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Invalid post id' })

    const clerkUserId = (request as any).clerkUserId
    const me = await currentUserId(clerkUserId)
    if (!me) return reply.status(404).send({ error: 'User not found' })

    const rows = await db`
      SELECT user_id FROM posts WHERE id = ${params.data.id} AND is_deleted = FALSE
    `
    if (rows.length === 0) return reply.status(404).send({ error: 'Post not found' })
    if (rows[0].user_id !== me) {
      return reply.status(403).send({ error: 'Not your post' })
    }

    await db`UPDATE posts SET is_deleted = TRUE WHERE id = ${params.data.id}`
    await invalidateCache('feed:*')
    return { ok: true }
  })

  // ── POST /posts/:id/like (toggle) ───────────────────────
  server.post('/:id/like', { preHandler: requireAuth }, async (request, reply) => {
    const params = uuidParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Invalid post id' })

    const clerkUserId = (request as any).clerkUserId
    const me = await currentUserId(clerkUserId)
    if (!me) return reply.status(404).send({ error: 'User not found' })

    const postId = params.data.id
    const result = await db.begin(async (sql) => {
      const post = await sql`
        SELECT 1 FROM posts WHERE id = ${postId} AND is_deleted = FALSE LIMIT 1
      `
      if (post.length === 0) return null

      const existing = await sql`
        SELECT 1 FROM post_likes WHERE post_id = ${postId} AND user_id = ${me} LIMIT 1
      `

      let liked: boolean
      if (existing.length > 0) {
        await sql`DELETE FROM post_likes WHERE post_id = ${postId} AND user_id = ${me}`
        await sql`UPDATE posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = ${postId}`
        liked = false
      } else {
        await sql`INSERT INTO post_likes (post_id, user_id) VALUES (${postId}, ${me})`
        await sql`UPDATE posts SET like_count = like_count + 1 WHERE id = ${postId}`
        liked = true
      }

      const [updated] = await sql`SELECT like_count FROM posts WHERE id = ${postId}`
      return { liked, likeCount: updated.like_count }
    })

    if (result === null) return reply.status(404).send({ error: 'Post not found' })
    return result
  })

  // ── POST /posts/:id/save (toggle) ───────────────────────
  server.post('/:id/save', { preHandler: requireAuth }, async (request, reply) => {
    const params = uuidParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Invalid post id' })

    const clerkUserId = (request as any).clerkUserId
    const me = await currentUserId(clerkUserId)
    if (!me) return reply.status(404).send({ error: 'User not found' })

    const postId = params.data.id
    const result = await db.begin(async (sql) => {
      const post = await sql`
        SELECT 1 FROM posts WHERE id = ${postId} AND is_deleted = FALSE LIMIT 1
      `
      if (post.length === 0) return null

      const existing = await sql`
        SELECT 1 FROM saved_posts WHERE post_id = ${postId} AND user_id = ${me} LIMIT 1
      `

      let saved: boolean
      if (existing.length > 0) {
        await sql`DELETE FROM saved_posts WHERE post_id = ${postId} AND user_id = ${me}`
        await sql`UPDATE posts SET save_count = GREATEST(save_count - 1, 0) WHERE id = ${postId}`
        saved = false
      } else {
        await sql`INSERT INTO saved_posts (post_id, user_id) VALUES (${postId}, ${me})`
        await sql`UPDATE posts SET save_count = save_count + 1 WHERE id = ${postId}`
        saved = true
      }

      const [updated] = await sql`SELECT save_count FROM posts WHERE id = ${postId}`
      return { saved, saveCount: updated.save_count }
    })

    if (result === null) return reply.status(404).send({ error: 'Post not found' })
    return result
  })

  // ── POST /posts/:id/report ──────────────────────────────
  server.post('/:id/report', { preHandler: requireAuth }, async (request, reply) => {
    const params = uuidParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Invalid post id' })
    const body = reportReasonSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const clerkUserId = (request as any).clerkUserId
    const me = await currentUserId(clerkUserId)
    if (!me) return reply.status(404).send({ error: 'User not found' })

    // 404 if the post is gone so reports can't be fired into the void.
    const exists = await db`
      SELECT 1 FROM posts WHERE id = ${params.data.id} AND is_deleted = FALSE LIMIT 1
    `
    if (exists.length === 0) return reply.status(404).send({ error: 'Post not found' })

    await db`
      INSERT INTO reports (reporter_id, target_type, target_id, reason)
      VALUES (${me}, 'post', ${params.data.id}, ${body.data.reason})
    `
    return { ok: true }
  })
}
