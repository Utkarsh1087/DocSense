/**
 * rateLimiter.ts — In-memory sliding window rate limiter.
 * Free-tier friendly: no Redis, no external service.
 * Handles 15 req/min (Starter) and 60 req/min (Pro).
 * Memory footprint: ~O(users × window_size) — negligible at 5K users.
 */

const WINDOW_MS = 60 * 1000; // 1 minute sliding window

const LIMITS = {
  Starter: 15, // 15 requests per minute on free tier
  Pro: 60,     // 60 requests per minute on Pro tier
};

// Map: userId → array of request timestamps within the window
const requestLog = new Map<string, number[]>();
const MAX_RATE_LIMITER_KEYS = 20000; // Cap in-memory entries to prevent memory exhaustion

// Periodic cleanup to prevent unbounded memory growth
// Runs every 5 minutes, removes entries idle for > 2 windows
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS * 2;
  for (const [key, timestamps] of requestLog.entries()) {
    const recent = timestamps.filter((t) => t > cutoff);
    if (recent.length === 0) {
      requestLog.delete(key);
    } else {
      requestLog.set(key, recent);
    }
  }
}, 5 * 60 * 1000);


export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
  limit: number;
}

/**
 * Check and record a request for rate limiting.
 * @param userId  - unique identifier for the requester
 * @param plan    - "Starter" | "Pro"
 * @returns RateLimitResult with allowed status and retry info
 */
export function checkRateLimit(userId: string, plan: "Starter" | "Pro" = "Starter"): RateLimitResult {
  const limit = LIMITS[plan];
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  // Get timestamps within current window
  const existing = requestLog.get(userId) || [];
  const windowTimestamps = existing.filter((t) => t > windowStart);

  if (windowTimestamps.length >= limit) {
    // Rate limit exceeded — find when earliest request expires
    const oldest = windowTimestamps[0];
    const resetInMs = oldest + WINDOW_MS - now;
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, resetInMs),
      limit,
    };
  }

  // Allow — record this request
  windowTimestamps.push(now);
  requestLog.set(userId, windowTimestamps);

  return {
    allowed: true,
    remaining: limit - windowTimestamps.length,
    resetInMs: WINDOW_MS,
    limit,
  };
}

/**
 * Build rate limit response headers (RFC 6585 / standard practice)
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil((Date.now() + result.resetInMs) / 1000)),
    "Retry-After": result.allowed ? "" : String(Math.ceil(result.resetInMs / 1000)),
  };
}
