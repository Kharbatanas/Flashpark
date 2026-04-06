/**
 * In-memory sliding-window rate limiter.
 *
 * Works for single-instance deployments. For serverless (Vercel, etc.),
 * replace with @upstash/ratelimit + @upstash/redis:
 *
 *   import { Ratelimit } from '@upstash/ratelimit'
 *   import { Redis } from '@upstash/redis'
 *   const ratelimit = new Ratelimit({
 *     redis: Redis.fromEnv(),
 *     limiter: Ratelimit.slidingWindow(10, '60 s'),
 *   })
 */

interface WindowEntry {
  timestamps: number[]
}

const store = new Map<string, WindowEntry>()
const MAX_STORE_SIZE = 10_000

// Cleanup stale entries every 60s
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      // Remove entries with no timestamps in any reasonable window (5 min)
      if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < now - 300_000) {
        store.delete(key)
      }
    }
  }, 60_000).unref?.()
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number
  /** Window duration in seconds */
  windowSec: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
  headers: Record<string, string>
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSec * 1000
  const windowStart = now - windowMs

  let entry = store.get(key)
  if (!entry) {
    // Evict oldest entry if store is full
    if (store.size >= MAX_STORE_SIZE) {
      const firstKey = store.keys().next().value
      if (firstKey) store.delete(firstKey)
    }
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Remove timestamps outside the current window
  entry.timestamps = entry.timestamps.filter(t => t > windowStart)

  const resetAt = now + windowMs
  const remaining = Math.max(0, config.limit - entry.timestamps.length - 1)

  if (entry.timestamps.length >= config.limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      headers: {
        'X-RateLimit-Limit': String(config.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        'Retry-After': String(config.windowSec),
      },
    }
  }

  entry.timestamps.push(now)

  return {
    allowed: true,
    remaining,
    resetAt,
    headers: {
      'X-RateLimit-Limit': String(config.limit),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
    },
  }
}

/**
 * Extract a client identifier from a request for rate limiting.
 * Uses X-Forwarded-For (reverse proxy) or falls back to a generic key.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
