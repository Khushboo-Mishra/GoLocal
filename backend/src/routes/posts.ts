// routes/posts.ts — stub with all endpoints documented
// TODO: implement each handler. API contract in docs/api.md
import type { FastifyInstance } from 'fastify'
import { requireAuth } from '../middleware/requireAuth'

export async function postRoutes(server: FastifyInstance) {
  // POST /posts — create a new post with media upload
  server.post('/', { preHandler: requireAuth }, async (request, reply) => {
    return reply.status(501).send({ error: 'Not implemented yet' })
  })

  // GET /posts/:id — single post detail
  server.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
    return reply.status(501).send({ error: 'Not implemented yet' })
  })

  // DELETE /posts/:id — soft delete (owner only)
  server.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
    return reply.status(501).send({ error: 'Not implemented yet' })
  })

  // POST /posts/:id/like — toggle like
  server.post('/:id/like', { preHandler: requireAuth }, async (request, reply) => {
    return reply.status(501).send({ error: 'Not implemented yet' })
  })

  // POST /posts/:id/save — toggle save
  server.post('/:id/save', { preHandler: requireAuth }, async (request, reply) => {
    return reply.status(501).send({ error: 'Not implemented yet' })
  })

  // POST /posts/:id/report — report a post
  server.post('/:id/report', { preHandler: requireAuth }, async (request, reply) => {
    return reply.status(501).send({ error: 'Not implemented yet' })
  })
}
