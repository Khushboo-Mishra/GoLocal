// routes/rooms.ts
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/requireAuth'

export async function roomRoutes(server: FastifyInstance) {
  server.get('/', { preHandler: requireAuth }, async () => ({ todo: true }))
  server.get('/:id/posts', { preHandler: requireAuth }, async () => ({ todo: true }))
}
