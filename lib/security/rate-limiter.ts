// ============================================================
// Server-side Rate Limiter — Sliding Window
// ============================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — suitable for single-instance deployments.
// For production at scale, replace with Redis/Upstash.
const store = new Map<string, RateLimitEntry>();

// Configuration from environment or defaults
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '20', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

// Periodic cleanup to prevent memory leaks (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Check rate limit for a given user ID.
 * Returns whether the request is allowed and metadata.
 */
export function checkRateLimit(userId: string): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(userId);

  // No existing entry or window expired — fresh window
  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetAt: now + WINDOW_MS,
    };
    store.set(userId, newEntry);

    return {
      allowed: true,
      remaining: MAX_REQUESTS - 1,
      resetAt: newEntry.resetAt,
      limit: MAX_REQUESTS,
    };
  }

  // Within window — increment
  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      limit: MAX_REQUESTS,
    };
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - entry.count,
    resetAt: entry.resetAt,
    limit: MAX_REQUESTS,
  };
}

/**
 * Get rate limit headers for the response.
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(Math.max(0, result.remaining)),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
  };
}
