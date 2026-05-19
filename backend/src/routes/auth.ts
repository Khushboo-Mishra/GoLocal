// routes/auth.ts
// POST /auth/sync — called right after Clerk sign-in. Idempotent.
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db/client'
import { requireAuth } from '../middleware/requireAuth'
import { toUserDto } from './_dto'

const syncBodySchema = z.object({
  name: z.string().trim().min(1).max(60),
  avatarUrl: z.string().url().optional().nullable(),
})

export async function authRoutes(server: FastifyInstance) {
  server.post('/sync', { preHandler: requireAuth }, async (request, reply) => {
    const parsed = syncBodySchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() })
    }
    const clerkUserId = (request as any).clerkUserId
    const { name, avatarUrl } = parsed.data

    const [user] = await db`
      INSERT INTO users (clerk_id, name, avatar_url)
      VALUES (${clerkUserId}, ${name}, ${avatarUrl ?? null})
      ON CONFLICT (clerk_id) DO UPDATE
        SET name       = EXCLUDED.name,
            avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
            updated_at = NOW()
      RETURNING id, name, avatar_url, radius_miles, created_at
    `

    return { user: toUserDto(user) }
  })
}
