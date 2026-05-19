import type { FastifyRequest, FastifyReply } from 'fastify'
import { verifyToken } from '@clerk/backend'

const SECRET_KEY = process.env.CLERK_SECRET_KEY

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '')

  if (!token) {
    return reply.status(401).send({ error: 'Missing authorization token' })
  }

  if (!SECRET_KEY) {
    request.log.error('CLERK_SECRET_KEY is not set')
    return reply.status(500).send({ error: 'Auth not configured' })
  }

  try {
    // verifyToken is the standalone helper exported by @clerk/backend v1.
    // The `sub` claim is the Clerk user ID.
    const payload = await verifyToken(token, { secretKey: SECRET_KEY })
    ;(request as any).clerkUserId = payload.sub
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' })
  }
}
