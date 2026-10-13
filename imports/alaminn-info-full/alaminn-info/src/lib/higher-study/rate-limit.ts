/**
 * Higher Study — simple in-memory rate limiter.
 * --------------------------------------------------------------------
 * Per-key request counter using a sliding 1-minute window stored in a
 * Map. Designed for use inside Next.js route handlers (one bucket per
 * IP hash, session ID, or any other stable identifier).
 *
 * NOT a distributed rate limiter — requests across multiple server
 * instances would each maintain their own counter. Acceptable for the
 * Higher Study public APIs where the primary goal is to deter scripted
 * abuse rather than enforce hard quotas.
 *
 * Usage:
 *   import { rateLimit } from "@/lib/higher-study/rate-limit";
 *   if (rateLimit(ipHash, 60)) return jsonResponse(false, "Too many requests", ...);
 */

const WINDOW_MS = 60_000;

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

/**
 * Returns `true` if the caller has exceeded `maxPerMinute` requests in
 * the current 1-minute window. The first request after the window
 * resets opens a fresh window with count=1.
 */
export function rateLimit(key: string, maxPerMinute: number): boolean {
  if (!key) key = "anonymous";
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.reset) {
    buckets.set(key, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > maxPerMinute;
}

/**
 * Returns the current count + reset timestamp for a key (or `null` if
 * the key has no active bucket). Useful for building `X-RateLimit-*`
 * response headers.
 */
export function rateLimitStatus(key: string): {
  count: number;
  reset: number;
  remaining: number;
} | null {
  if (!key) return null;
  const entry = buckets.get(key);
  if (!entry) return null;
  return {
    count: entry.count,
    reset: entry.reset,
    remaining: Math.max(0, 0 - entry.count), // placeholder for symmetry
  };
}

/**
 * Test-only helper to reset the limiter state. Exported so unit tests
 * can isolate rate-limit behaviour; not used by application code.
 */
export function __resetRateLimiterForTests(): void {
  buckets.clear();
}

// Periodic janitor — purge expired buckets every 5 minutes to keep the
// Map bounded. `unref` so the timer never blocks process exit.
if (typeof setInterval !== "undefined") {
  const handle = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of buckets) {
      if (now > v.reset) buckets.delete(k);
    }
  }, 5 * 60_000);
  // unref is only available on Node timers; in edge runtimes the
  // setInterval return is a number, so guard accordingly.
  if (typeof handle === "object" && handle && "unref" in handle) {
    (handle as { unref: () => void }).unref();
  }
}
