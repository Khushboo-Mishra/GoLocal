// routes/_currentUser.ts
// Resolve the internal users.id given a Clerk JWT subject.
// Tiny in-memory cache to keep this off the DB on every request.

import { db } from '../db/client'

const cache = new Map<string, { id: string; expires: number }>()
const TTL_MS = 60_000

export async function currentUserId(clerkUserId: string): Promise<string | null> {
  if (!clerkUserId) return null

  const hit = cache.get(clerkUserId)
  const now = Date.now()
  if (hit && hit.expires > now) return hit.id

  const rows = await db<{ id: string; is_banned: boolean }[]>`
    SELECT id, is_banned FROM users WHERE clerk_id = ${clerkUserId} LIMIT 1
  `
  const row = rows[0]
  if (!row || row.is_banned) {
    cache.delete(clerkUserId)
    return null
  }
  cache.set(clerkUserId, { id: row.id, expires: now + TTL_MS })
  return row.id
}

export function invalidateCurrentUser(clerkUserId: string) {
  cache.delete(clerkUserId)
}
