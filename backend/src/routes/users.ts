// routes/users.ts
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/requireAuth'

export async function userRoutes(server: FastifyInstance) {
  server.get('/me', { preHandler: requireAuth }, async () => ({ todo: true }))
  server.patch('/me', { preHandler: requireAuth }, async () => ({ todo: true }))
  server.post('/me/location', { preHandler: requireAuth }, async () => ({ todo: true }))
  server.post('/me/push-token', { preHandler: requireAuth }, async () => ({ todo: true }))
  server.post('/me/avatar', { preHandler: requireAuth }, async () => ({ todo: true }))
  server.post('/:id/block', { preHandler: requireAuth }, async () => ({ todo: true }))
  server.post('/:id/report', { preHandler: requireAuth }, async () => ({ todo: true }))
}
