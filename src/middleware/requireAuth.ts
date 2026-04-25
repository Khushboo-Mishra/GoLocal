import type { FastifyRequest, FastifyReply } from 'fastify'
import { createClerkClient } from '@clerk/backend'

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! })

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = request.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return reply.status(401).send({ error: 'Missing authorization token' })
  }

  try {
    const payload = await clerk.verifyToken(token)
    // Attach clerk user ID to request for use in route handlers
    ;(request as any).clerkUserId = payload.sub
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' })
  }
}
