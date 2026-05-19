// routes/users.ts
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client'
import { requireAuth } from '../middleware/requireAuth'
import { currentUserId, invalidateCurrentUser } from './_currentUser'
import { toUserDto } from './_dto'
import { latSchema, lngSchema } from '../utils/geo'
import { uploadImage, isImageMime } from '../services/media'

// ── Schemas ────────────────────────────────────────────────
const patchMeSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  radiusMiles: z.union([z.literal(1), z.literal(3), z.literal(5)]).optional(),
  avatarUrl: z.string().url().optional(),
  notifyNearby: z.boolean().optional(),
  notifyEventSoon: z.boolean().optional(),
})

const locationSchema = z.object({ lat: latSchema, lng: lngSchema })

const pushTokenSchema = z.object({
  token: z.string().min(8),
  platform: z.enum(['ios', 'android']),
})

const reportReasonSchema = z.object({
  reason: z.enum(['spam', 'fake', 'inappropriate', 'safety', 'other']),
})

const uuidParamSchema = z.object({ id: z.string().uuid() })

export async function userRoutes(server: FastifyInstance) {
  // ── GET /users/me ────────────────────────────────────────
  server.get('/me', { preHandler: requireAuth }, async (request, reply) => {
    const clerkUserId = (request as any).clerkUserId
    const rows = await db`
      SELECT id, name, avatar_url, radius_miles, created_at
      FROM users
      WHERE clerk_id = ${clerkUserId}
      LIMIT 1
    `
    if (rows.length === 0) {
      return reply.status(404).send({ error: 'User not found — call /auth/sync first' })
    }
    return { user: toUserDto(rows[0]) }
  })

  // ── PATCH /users/me ──────────────────────────────────────
  server.patch('/me', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = patchMeSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }
    const clerkUserId = (request as any).clerkUserId
    const { name, radiusMiles, avatarUrl, notifyNearby, notifyEventSoon } = parsed.data

    const [user] = await db`
      UPDATE users
      SET
        name              = COALESCE(${name ?? null}, name),
        radius_miles      = COALESCE(${radiusMiles ?? null}, radius_miles),
        avatar_url        = COALESCE(${avatarUrl ?? null}, avatar_url),
        notify_nearby     = COALESCE(${notifyNearby ?? null}, notify_nearby),
        notify_event_soon = COALESCE(${notifyEventSoon ?? null}, notify_event_soon),
        updated_at        = NOW()
      WHERE clerk_id = ${clerkUserId}
      RETURNING id, name, avatar_url, radius_miles, created_at
    `
    if (!user) return reply.status(404).send({ error: 'User not found' })
    invalidateCurrentUser(clerkUserId)
    return { user: toUserDto(user) }
  })

  // ── POST /users/me/location ─────────────────────────────
  server.post('/me/location', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = locationSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }
    const clerkUserId = (request as any).clerkUserId
    const { lat, lng } = parsed.data

    const rows = await db`
      UPDATE users
      SET location   = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          updated_at = NOW()
      WHERE clerk_id = ${clerkUserId}
      RETURNING id
    `
    if (rows.length === 0) return reply.status(404).send({ error: 'User not found' })
    return { ok: true }
  })

  // ── POST /users/me/push-token ───────────────────────────
  server.post('/me/push-token', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = pushTokenSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }
    const clerkUserId = (request as any).clerkUserId
    const userId = await currentUserId(clerkUserId)
    if (!userId) return reply.status(404).send({ error: 'User not found' })

    const { token, platform } = parsed.data
    await db`
      INSERT INTO push_tokens (user_id, token, platform)
      VALUES (${userId}, ${token}, ${platform})
      ON CONFLICT (user_id, token)
      DO UPDATE SET platform = EXCLUDED.platform, updated_at = NOW()
    `
    return { ok: true }
  })

  // ── POST /users/me/avatar (multipart) ───────────────────
  server.post('/me/avatar', { preHandler: requireAuth }, async (request, reply) => {
    const clerkUserId = (request as any).clerkUserId
    const userId = await currentUserId(clerkUserId)
    if (!userId) return reply.status(404).send({ error: 'User not found' })

    if (!request.isMultipart()) {
      return reply.status(400).send({ error: 'Expected multipart/form-data' })
    }

    const file = await request.file()
    if (!file) return reply.status(400).send({ error: 'Missing file field' })
    if (!isImageMime(file.mimetype)) {
      return reply.status(400).send({ error: 'Avatar must be an image' })
    }

    const buffer = await file.toBuffer()
    // 5MB cap on avatars (10MB cap on posts)
    if (buffer.length > 5 * 1024 * 1024) {
      return reply.status(400).send({ error: 'Avatar must be under 5MB' })
    }

    const { url } = await uploadImage(buffer, `avatars/${userId}`, file.mimetype)

    await db`
      UPDATE users
      SET avatar_url = ${url}, updated_at = NOW()
      WHERE id = ${userId}
    `

    return { avatarUrl: url }
  })

  // ── POST /users/:id/block ───────────────────────────────
  server.post('/:id/block', { preHandler: requireAuth }, async (request, reply) => {
    const params = uuidParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Invalid user id' })

    const clerkUserId = (request as any).clerkUserId
    const blockerId = await currentUserId(clerkUserId)
    if (!blockerId) return reply.status(404).send({ error: 'User not found' })

    const blockedId = params.data.id
    if (blockerId === blockedId) {
      return reply.status(400).send({ error: "Can't block yourself" })
    }

    await db`
      INSERT INTO blocked_users (blocker_id, blocked_id)
      VALUES (${blockerId}, ${blockedId})
      ON CONFLICT DO NOTHING
    `
    return { ok: true }
  })

  // ── POST /users/:id/report ──────────────────────────────
  server.post('/:id/report', { preHandler: requireAuth }, async (request, reply) => {
    const params = uuidParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Invalid user id' })
    const body = reportReasonSchema.safeParse(request.body)
    if (!body.success) return reply.status(400).send({ error: body.error.flatten() })

    const clerkUserId = (request as any).clerkUserId
    const reporterId = await currentUserId(clerkUserId)
    if (!reporterId) return reply.status(404).send({ error: 'User not found' })

    const targetId = params.data.id
    if (reporterId === targetId) {
      return reply.status(400).send({ error: "Can't report yourself" })
    }

    await db`
      INSERT INTO reports (reporter_id, target_type, target_id, reason)
      VALUES (${reporterId}, 'user', ${targetId}, ${body.data.reason})
    `
    return { ok: true }
  })
}
