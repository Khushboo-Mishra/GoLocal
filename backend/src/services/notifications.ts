// services/notifications.ts
// Push notifications via Expo Push API, fan-out via BullMQ.
//
// Two job types:
//   - "nearby_post"   — when a post is created, notify users whose
//                       last known location is within 1 mile and who
//                       opted in.
//   - "event_soon"    — fires 1 hour before an event's event_time.
//
// The worker (src/jobs/worker.ts) consumes these and calls Expo.

import { Queue, QueueEvents, type JobsOptions } from 'bullmq'
import IORedis, { type Redis } from 'ioredis'

// ── Redis connection for BullMQ ────────────────────────────
// BullMQ requires a dedicated ioredis instance with maxRetriesPerRequest: null.
let _connection: Redis | null = null
export function bullConnection(): Redis {
  if (_connection) return _connection
  if (!process.env.REDIS_URL) throw new Error('REDIS_URL is not set')
  _connection = new IORedis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    password: process.env.REDIS_TOKEN || undefined,
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  })
  return _connection
}

// ── Job payload types ──────────────────────────────────────
export type NotificationJob =
  | {
      kind: 'nearby_post'
      postId: string
      authorId: string
      lat: number
      lng: number
      title: string
      radiusMiles: number
    }
  | {
      kind: 'event_soon'
      postId: string
      title: string
      eventTime: string  // ISO
    }

// ── Queue (lazy singleton) ─────────────────────────────────
export const NOTIFICATIONS_QUEUE = 'notifications'

let _queue: Queue<NotificationJob> | null = null
export function notificationsQueue(): Queue<NotificationJob> {
  if (_queue) return _queue
  _queue = new Queue<NotificationJob>(NOTIFICATIONS_QUEUE, {
    connection: bullConnection(),
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: { age: 3_600, count: 1_000 },
      removeOnFail: { age: 7 * 24 * 3_600 },
    },
  })
  return _queue
}

// ── Enqueue helpers (called from routes) ───────────────────
export async function enqueueNearbyPost(
  payload: Extract<NotificationJob, { kind: 'nearby_post' }>
): Promise<void> {
  try {
    await notificationsQueue().add('nearby_post', payload)
  } catch (err) {
    // Notifications are non-critical — log and swallow so the
    // user's POST /posts still succeeds.
    console.error('[notifications] enqueue nearby_post failed:', err)
  }
}

export async function enqueueEventSoon(
  payload: Extract<NotificationJob, { kind: 'event_soon' }>,
  fireAtMs: number
): Promise<void> {
  try {
    const delay = Math.max(0, fireAtMs - Date.now())
    const opts: JobsOptions = { delay }
    await notificationsQueue().add('event_soon', payload, opts)
  } catch (err) {
    console.error('[notifications] enqueue event_soon failed:', err)
  }
}

// ── Expo Push API ──────────────────────────────────────────
// Direct REST call; the @expo/server package is heavy and node-fetch is built-in.
// https://docs.expo.dev/push-notifications/sending-notifications/

export interface ExpoMessage {
  to: string                 // ExponentPushToken[xxx...]
  title?: string
  body: string
  data?: Record<string, unknown>
  sound?: 'default' | null
  badge?: number
}

export interface ExpoTicket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send'
const EXPO_CHUNK_SIZE = 100  // Expo's documented batch limit

export async function sendExpoPush(messages: ExpoMessage[]): Promise<ExpoTicket[]> {
  if (messages.length === 0) return []

  const tickets: ExpoTicket[] = []
  for (let i = 0; i < messages.length; i += EXPO_CHUNK_SIZE) {
    const chunk = messages.slice(i, i + EXPO_CHUNK_SIZE)
    const res = await fetch(EXPO_PUSH_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        ...(process.env.EXPO_ACCESS_TOKEN
          ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
          : {}),
      },
      body: JSON.stringify(chunk),
    })

    if (!res.ok) {
      const txt = await res.text()
      throw new Error(`Expo push failed: ${res.status} ${txt}`)
    }

    const json = (await res.json()) as { data?: ExpoTicket[] }
    if (json.data) tickets.push(...json.data)
  }
  return tickets
}

// ── Convenience: lookup tokens for a list of user IDs ──────
// Exposed here so the worker can build batches efficiently.
export { Queue as _Queue, QueueEvents as _QueueEvents }
