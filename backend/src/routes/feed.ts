import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client'
import { requireAuth } from '../middleware/requireAuth'
import { getFeedCacheKey, getCached, setCache } from '../services/cache'
import { toPostDto } from './_dto'
import { milesToMeters } from '../utils/geo'

const feedQuery = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(10).default(3),
  type: z.enum(['event', 'hangout', 'deal']).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
})

const goingQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
})

export async function feedRoutes(server: FastifyInstance) {
  // ── GET /feed — nearby posts ────────────────────────────
  server.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const query = feedQuery.safeParse(request.query)
    if (!query.success) {
      return reply.status(400).send({ error: query.error.flatten() })
    }

    const { lat, lng, radius, type, cursor, limit } = query.data
    const clerkUserId = (request as any).clerkUserId

    // 60s TTL cache — only first page, only when no per-user state matters.
    // We bypass cache when the user is signed in because liked/saved is per-user.
    // Practically that means cache mostly helps anonymous load tests; that's fine.
    const cacheKey = getFeedCacheKey(lat, lng, radius, type)
    if (!cursor) {
      const cached = await getCached<{ posts: any[]; nextCursor: string | null; hasMore: boolean }>(cacheKey + ':public')
      // Only serve the cached version to skip the DB when there is no
      // signed-in user. For signed-in users we always re-query for liked/saved.
      if (cached && !clerkUserId) return cached
    }

    const radiusMeters = milesToMeters(radius)

    const rows = await db`
      SELECT
        p.id, p.type, p.title, p.description,
        p.media_url, p.media_type, p.cf_stream_id,
        p.like_count, p.save_count, p.event_time, p.created_at, p.neighborhood,
        ST_X(p.location::geometry) AS lng,
        ST_Y(p.location::geometry) AS lat,
        ROUND(ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        )::numeric / 1609.344, 1) AS distance_miles,
        u.id AS user_id, u.name AS user_name, u.avatar_url,
        EXISTS(
          SELECT 1 FROM post_likes pl
          JOIN users me ON me.clerk_id = ${clerkUserId}
          WHERE pl.post_id = p.id AND pl.user_id = me.id
        ) AS liked,
        EXISTS(
          SELECT 1 FROM saved_posts sp
          JOIN users me ON me.clerk_id = ${clerkUserId}
          WHERE sp.post_id = p.id AND sp.user_id = me.id
        ) AS saved
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE
        p.is_deleted = FALSE
        AND p.is_flagged = FALSE
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
        ${type ? db`AND p.type = ${type}` : db``}
        ${cursor ? db`AND p.created_at < ${new Date(cursor)}` : db``}
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users b
          JOIN users me ON me.clerk_id = ${clerkUserId}
          WHERE (b.blocker_id = me.id AND b.blocked_id = p.user_id)
             OR (b.blocker_id = p.user_id AND b.blocked_id = me.id)
        )
      ORDER BY p.created_at DESC
      LIMIT ${limit + 1}
    `

    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore
      ? (sliced[sliced.length - 1] as any).created_at
      : null

    const result = {
      posts: sliced.map((r: any) => toPostDto(r)),
      nextCursor:
        nextCursor instanceof Date ? nextCursor.toISOString() : nextCursor,
      hasMore,
    }

    if (!cursor) await setCache(cacheKey + ':public', result, 60)
    return result
  })

  // ── GET /feed/trending — most liked in last 24h ─────────
  server.get('/trending', { preHandler: requireAuth }, async (request, reply) => {
    const query = feedQuery.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() })

    // Trending is single-page by design (top-N most-liked in 24h), so we
    // ignore any cursor and never claim more pages — matches docs/api.md
    // and the frontend TrendingResponse ({ posts } only).
    const { lat, lng, radius, type, limit } = query.data
    const radiusMeters = milesToMeters(radius)

    const rows = await db`
      SELECT
        p.id, p.type, p.title, p.description,
        p.media_url, p.media_type, p.cf_stream_id,
        p.like_count, p.save_count, p.event_time, p.created_at, p.neighborhood,
        ST_X(p.location::geometry) AS lng,
        ST_Y(p.location::geometry) AS lat,
        ROUND(ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        )::numeric / 1609.344, 1) AS distance_miles,
        u.id AS user_id, u.name AS user_name, u.avatar_url
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE
        p.is_deleted = FALSE AND p.is_flagged = FALSE
        AND p.created_at > NOW() - INTERVAL '24 hours'
        AND ST_DWithin(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${radiusMeters}
        )
        ${type ? db`AND p.type = ${type}` : db``}
      ORDER BY p.like_count DESC, p.created_at DESC
      LIMIT ${limit}
    `

    return { posts: rows.map((r: any) => toPostDto(r)) }
  })

  // ── GET /feed/going — saved-by-me posts ─────────────────
  server.get('/going', { preHandler: requireAuth }, async (request, reply) => {
    const query = goingQuerySchema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() })

    const { cursor, limit } = query.data
    const clerkUserId = (request as any).clerkUserId

    const rows = await db`
      SELECT
        p.id, p.type, p.title, p.description,
        p.media_url, p.media_type, p.cf_stream_id,
        p.like_count, p.save_count, p.event_time, p.created_at, p.neighborhood,
        ST_X(p.location::geometry) AS lng,
        ST_Y(p.location::geometry) AS lat,
        u.id AS user_id, u.name AS user_name, u.avatar_url,
        sp.saved_at,
        TRUE AS saved
      FROM saved_posts sp
      JOIN posts p ON p.id = sp.post_id
      JOIN users u ON u.id = p.user_id
      JOIN users me ON me.clerk_id = ${clerkUserId}
      WHERE sp.user_id = me.id
        AND p.is_deleted = FALSE
        ${cursor ? db`AND sp.saved_at < ${new Date(cursor)}` : db``}
      ORDER BY sp.saved_at DESC
      LIMIT ${limit + 1}
    `

    const hasMore = rows.length > limit
    const sliced = hasMore ? rows.slice(0, limit) : rows
    const nextCursorRaw = hasMore ? (sliced[sliced.length - 1] as any).saved_at : null

    return {
      posts: sliced.map((r: any) => toPostDto(r)),
      hasMore,
      nextCursor:
        nextCursorRaw instanceof Date ? nextCursorRaw.toISOString() : nextCursorRaw,
    }
  })
}
