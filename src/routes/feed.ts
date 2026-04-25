import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client'
import { requireAuth } from '../middleware/requireAuth'
import { getFeedCacheKey, getCached, setCache } from '../services/cache'

const feedQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(0.1).max(10).default(3),
  type: z.enum(['event', 'hangout', 'deal']).optional(),
  cursor: z.string().optional(), // ISO timestamp for pagination
  limit: z.coerce.number().min(1).max(50).default(20),
})

export async function feedRoutes(server: FastifyInstance) {
  // GET /feed — nearby posts
  server.get('/', { preHandler: requireAuth }, async (request, reply) => {
    const query = feedQuerySchema.safeParse(request.query)
    if (!query.success) {
      return reply.status(400).send({ error: query.error.flatten() })
    }

    const { lat, lng, radius, type, cursor, limit } = query.data
    const clerkUserId = (request as any).clerkUserId

    // Try cache first (60s TTL for nearby feed)
    const cacheKey = getFeedCacheKey(lat, lng, radius, type)
    const cached = await getCached(cacheKey)
    if (cached && !cursor) return cached

    const radiusMeters = radius * 1609.34 // miles → meters

    const rows = await db`
      SELECT
        p.id, p.type, p.title, p.description,
        p.media_url, p.media_type, p.cf_stream_id,
        p.like_count, p.save_count, p.event_time, p.created_at,
        ST_X(p.location::geometry) AS lng,
        ST_Y(p.location::geometry) AS lat,
        ROUND(ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) / 1609.34, 1) AS distance_miles,
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
    const posts = hasMore ? rows.slice(0, limit) : rows
    const nextCursor = hasMore ? posts[posts.length - 1].created_at : null

    const result = { posts, nextCursor, hasMore }

    // Cache only first page (no cursor)
    if (!cursor) await setCache(cacheKey, result, 60)

    return result
  })

  // GET /feed/trending — most liked in last 24h
  server.get('/trending', { preHandler: requireAuth }, async (request, reply) => {
    const query = feedQuerySchema.safeParse(request.query)
    if (!query.success) return reply.status(400).send({ error: query.error.flatten() })

    const { lat, lng, radius, type, cursor, limit } = query.data
    const radiusMeters = radius * 1609.34

    const rows = await db`
      SELECT
        p.id, p.type, p.title, p.media_url, p.media_type,
        p.like_count, p.save_count, p.event_time, p.created_at,
        ROUND(ST_Distance(
          p.location::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
        ) / 1609.34, 1) AS distance_miles,
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
        ${cursor ? db`AND p.like_count < ${Number(cursor)}` : db``}
      ORDER BY p.like_count DESC, p.created_at DESC
      LIMIT ${limit}
    `

    return { posts: rows }
  })

  // GET /feed/going — posts the current user has saved
  server.get('/going', { preHandler: requireAuth }, async (request, reply) => {
    const clerkUserId = (request as any).clerkUserId
    const { cursor, limit = 20 } = request.query as any

    const rows = await db`
      SELECT
        p.id, p.type, p.title, p.media_url, p.media_type,
        p.like_count, p.save_count, p.event_time, p.created_at,
        u.name AS user_name, u.avatar_url,
        sp.saved_at
      FROM saved_posts sp
      JOIN posts p ON p.id = sp.post_id
      JOIN users u ON u.id = p.user_id
      JOIN users me ON me.clerk_id = ${clerkUserId}
      WHERE sp.user_id = me.id
        AND p.is_deleted = FALSE
        ${cursor ? db`AND sp.saved_at < ${new Date(cursor)}` : db``}
      ORDER BY sp.saved_at DESC
      LIMIT ${Number(limit) + 1}
    `

    const hasMore = rows.length > Number(limit)
    const posts = hasMore ? rows.slice(0, Number(limit)) : rows
    return { posts, hasMore, nextCursor: hasMore ? posts[posts.length - 1].saved_at : null }
  })
}
