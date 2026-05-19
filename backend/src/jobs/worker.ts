// jobs/worker.ts
// BullMQ worker — pulls notification jobs and fans them out via Expo Push.
//
// Run modes:
//   1. In-process (dev): start() is called from src/index.ts when
//      RUN_WORKER_IN_PROCESS=true.
//   2. Standalone (prod recommended): run `node dist/jobs/worker.js`
//      as a separate Railway service.

import 'dotenv/config'
import { Worker, type Job } from 'bullmq'
import { db } from '../db/client'
import {
  NOTIFICATIONS_QUEUE,
  bullConnection,
  sendExpoPush,
  type NotificationJob,
  type ExpoMessage,
} from '../services/notifications'
import { milesToMeters } from '../utils/geo'

let _worker: Worker | null = null

export function start(): Worker {
  if (_worker) return _worker

  _worker = new Worker<NotificationJob>(
    NOTIFICATIONS_QUEUE,
    async (job: Job<NotificationJob>) => {
      const payload = job.data
      switch (payload.kind) {
        case 'nearby_post':
          return handleNearbyPost(payload)
        case 'event_soon':
          return handleEventSoon(payload)
        default: {
          // exhaustive
          const _x: never = payload
          throw new Error('Unknown notification job')
        }
      }
    },
    {
      connection: bullConnection(),
      concurrency: 5,
    }
  )

  _worker.on('failed', (job, err) => {
    console.error(`[worker] ${job?.name} failed:`, err.message)
  })

  _worker.on('completed', (job) => {
    console.log(`[worker] ${job.name} #${job.id} done`)
  })

  console.log('[worker] notifications worker started')
  return _worker
}

// ── Handlers ───────────────────────────────────────────────

async function handleNearbyPost(
  payload: Extract<NotificationJob, { kind: 'nearby_post' }>
): Promise<{ sent: number }> {
  const radiusMeters = milesToMeters(payload.radiusMiles)

  // Find every user within radius of the post's location who has at
  // least one push token. Skip the author. Skip banned users. Skip
  // anyone the author has blocked or who has blocked the author.
  const rows = await db<{ token: string; platform: string }[]>`
    SELECT pt.token, pt.platform
    FROM push_tokens pt
    JOIN users u ON u.id = pt.user_id
    WHERE u.is_banned = FALSE
      AND u.notify_nearby = TRUE
      AND u.id <> ${payload.authorId}
      AND u.location IS NOT NULL
      AND ST_DWithin(
        u.location::geography,
        ST_SetSRID(ST_MakePoint(${payload.lng}, ${payload.lat}), 4326)::geography,
        ${radiusMeters}
      )
      AND NOT EXISTS (
        SELECT 1 FROM blocked_users b
        WHERE (b.blocker_id = ${payload.authorId} AND b.blocked_id = u.id)
           OR (b.blocker_id = u.id AND b.blocked_id = ${payload.authorId})
      )
  `

  if (rows.length === 0) return { sent: 0 }

  const messages: ExpoMessage[] = rows.map((r) => ({
    to: r.token,
    title: 'Something new nearby',
    body: payload.title,
    sound: 'default',
    data: { kind: 'nearby_post', postId: payload.postId },
  }))

  await sendExpoPush(messages)
  return { sent: messages.length }
}

async function handleEventSoon(
  payload: Extract<NotificationJob, { kind: 'event_soon' }>
): Promise<{ sent: number }> {
  // Notify everyone who saved this event.
  const rows = await db<{ token: string }[]>`
    SELECT pt.token
    FROM saved_posts sp
    JOIN push_tokens pt ON pt.user_id = sp.user_id
    JOIN users u ON u.id = sp.user_id
    WHERE sp.post_id = ${payload.postId}
      AND u.is_banned = FALSE
      AND u.notify_event_soon = TRUE
  `

  if (rows.length === 0) return { sent: 0 }

  const messages: ExpoMessage[] = rows.map((r) => ({
    to: r.token,
    title: 'Starting soon',
    body: payload.title,
    sound: 'default',
    data: { kind: 'event_soon', postId: payload.postId },
  }))

  await sendExpoPush(messages)
  return { sent: messages.length }
}

// ── Standalone entrypoint ──────────────────────────────────
// Allow running the worker as its own Node process.
const isMain =
  typeof require !== 'undefined' && require.main === module
  || process.argv[1]?.endsWith('worker.ts')
  || process.argv[1]?.endsWith('worker.js')

if (isMain) {
  start()
}
