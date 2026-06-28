// routes/rooms.ts
// V1: rooms are system-created neighborhood groupings (East Village, NYU, LES).
// A post "belongs" to a room when its location falls within the room's
// neighborhood radius. We use a 0.75-mile default — tight enough that NYU
// posts don't bleed into LES, generous enough for organic clustering.

import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client'
import { requireAuth } from '../middleware/requireAuth'
import { currentUserId } from './_currentUser'
import { toPostDto } from './_dto'
import { milesToMeters } from '../utils/geo'

const ROOM_RADIUS_MILES = 0.75

const uuidParamSchema = z.object({ id: z.string().uuid() })

const roomPostsQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  type: z.enum(['event', 'hangout', 'deal']).optional(),
})

export async function roomRoutes(server: FastifyInstance) {
  // ── GET /rooms ──────────────────────────────────────────
  server.get('/', { preHandler: requireAuth }, async () => {
    const rows = await db`
      SELECT
        id, name, neighborhood,
        ST_X(location::geometry) AS lng,
        ST_Y(location::geometry) AS lat
      FROM rooms
      ORDER BY name ASC
    `
    return {
      rooms: rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        neighborhood: r.neighborhood,
        lat: r.lat != null ? Number(r.lat) : null,
        lng: r.lng != null ? Number(r.lng) : null,
      })),
    }
  })

  // ── GET /rooms/:id/posts ────────────────────────────────
  server.get('/:id/posts', { preHandler: requireAuth }, async (request, reply) => {
    const params = uuidParamSchema.safeParse(request.params)
    if (!params.success) return reply.status(400).send({ error: 'Invalid room id' })
    const query = roomPostsQuerySchema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() })

    const clerkUserId = (request as any).clerkUserId
    const me = await currentUserId(clerkUserId)

    // Resolve the room's anchor point.
    const room = await db<{ id: string; lat: number | null; lng: number | null }[]>`
      SELECT
        id,
        ST_X(location::geometry) AS lng,
        ST_Y(location::geometry) AS lat
      FROM rooms WHERE id = ${params.data.id} LIMIT 1
    `
    if (room.length === 0) return reply.status(404).send({ error: 'Room not found' })
    const r = room[0]
    if (r.lat == null || r.lng == null) {
      // Some seed rooms have no anchor yet — return empty list rather than error.
      return { posts: [], hasMore: false, nextCursor: null }
    }

    const { cursor, limit, type } = query.data
    const radiusMeters = milesToMeters(ROOM_RADIUS_MILES)

    const rows = await db`
      SELECT
        p.id, p.type, p.title, p.description,
        p.media_url, p.media_type, p.cf_stream_id,
        p.like_count, p.save_count, p.event_time, p.created_at, p.neighborhood,
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
      WHERE
        p.is_deleted = FALSE
        AND p.is_flagged = FALSE
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${r.lng}, ${r.lat}), 4326)::geography,
          ${radiusMeters}
        )
        ${type ? db`AND p.type = ${type}` : db``}
        ${cursor ? db`AND p.created_at < ${new Date(cursor)}` : db``}
      ORDER BY p.created_at DESC
      LIMIT ${limit + 1}
    `

    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore
      ? (sliced[sliced.length - 1] as any).created_at
      : null

    return {
      posts: sliced.map((row: any) => toPostDto(row)),
      hasMore,
      nextCursor,
    }
  })
}
