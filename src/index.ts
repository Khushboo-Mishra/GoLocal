import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import sensible from '@fastify/sensible'
import * as Sentry from '@sentry/node'

import { authRoutes } from './routes/auth'
import { feedRoutes } from './routes/feed'
import { postRoutes } from './routes/posts'
import { userRoutes } from './routes/users'
import { roomRoutes } from './routes/rooms'
import { requireAuth } from './middleware/requireAuth'

// ── Sentry ──────────────────────────────────────────────────
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})

// ── Server ──────────────────────────────────────────────────
const server = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
})

// ── Plugins ─────────────────────────────────────────────────
await server.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? false : true,
})

await server.register(multipart, {
  limits: { fileSize: 52_428_800 }, // 50MB max
})

await server.register(rateLimit, {
  global: true,
  max: 200,
  timeWindow: '1 minute',
})

await server.register(sensible)

// ── Health check (no auth) ──────────────────────────────────
server.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version,
}))

// ── Routes ──────────────────────────────────────────────────
await server.register(authRoutes, { prefix: '/auth' })
await server.register(userRoutes, { prefix: '/users' })
await server.register(feedRoutes, { prefix: '/feed' })
await server.register(postRoutes, { prefix: '/posts' })
await server.register(roomRoutes, { prefix: '/rooms' })

// ── Error handler ───────────────────────────────────────────
server.setErrorHandler((error, request, reply) => {
  Sentry.captureException(error)
  server.log.error(error)

  if (error.statusCode) {
    return reply.status(error.statusCode).send({ error: error.message })
  }

  return reply.status(500).send({ error: 'Internal server error' })
})

// ── Start ───────────────────────────────────────────────────
try {
  const port = Number(process.env.PORT) || 3000
  await server.listen({ port, host: '0.0.0.0' })
  console.log(`GoLocal API running on port ${port}`)
} catch (err) {
  server.log.error(err)
  process.exit(1)
}
