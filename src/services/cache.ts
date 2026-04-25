import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!, {
  password: process.env.REDIS_TOKEN,
  tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  lazyConnect: true,
  enableOfflineQueue: false,
})

redis.on('error', (err) => {
  // Log but don't crash — cache is non-critical
  console.error('[Redis] Connection error:', err.message)
})

// Round lat/lng to 2 decimal places (~1km precision) for cache key
export function getFeedCacheKey(
  lat: number,
  lng: number,
  radius: number,
  type?: string
): string {
  return `feed:${lat.toFixed(2)}:${lng.toFixed(2)}:r${radius}${type ? `:${type}` : ''}`
}

export async function getCached<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key)
    return val ? JSON.parse(val) : null
  } catch {
    return null // Cache miss on error — fall through to DB
  }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value))
  } catch {
    // Non-fatal
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch {
    // Non-fatal
  }
}

export { redis }
