// routes/auth.ts
import type { FastifyInstance } from 'fastify'
import { db } from '../db/client'
import { requireAuth } from '../middleware/requireAuth'

export async function authRoutes(server: FastifyInstance) {
  // POST /auth/sync — called after Clerk sign-in, creates/updates user record
  server.post('/sync', { preHandler: requireAuth }, async (request, reply) => {
    const clerkUserId = (request as any).clerkUserId
    const { name, avatarUrl } = request.body as any

    const [user] = await db`
      INSERT INTO users (clerk_id, name, avatar_url)
      VALUES (${clerkUserId}, ${name}, ${avatarUrl ?? null})
      ON CONFLICT (clerk_id) DO UPDATE
        SET name = EXCLUDED.name,
            updated_at = NOW()
      RETURNING *
    `

    return { user }
  })
}
