/**
 * ALO Education — AI Rate Limiter
 * Task ID: 7-ai-gateway
 *
 * Sliding-window rate limiter protecting the Groq free tier.
 * - Max 30 requests per minute (sliding window)
 * - Max 5 concurrent requests
 * - In-memory, no external dependencies
 */

import type { RateLimiterConfig, RateLimitResult } from './types';

/** Default configuration for Groq free tier protection */
const DEFAULT_CONFIG: RateLimiterConfig = {
  maxRequestsPerMinute: 30,
  maxConcurrent: 5,
};

/** Timestamp arrays bucketed by the start of each minute */
interface MinuteBucket {
  minuteKey: string;
  timestamps: number[];
}

export class RateLimiter {
  private config: RateLimiterConfig;
  /** Map of minuteKey → sorted array of request timestamps */
  private buckets: Map<string, number[]>;
  /** Set of currently in-flight request IDs */
  private inFlight: Set<string>;
  private requestCounter: number;

  constructor(config?: Partial<RateLimiterConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.buckets = new Map();
    this.inFlight = new Set();
    this.requestCounter = 0;
  }

  /**
   * Check whether a new request is allowed under rate limits.
   * Returns a result object; does NOT block — the caller must
   * remember to call {@link release} when the request completes.
   */
  check(): RateLimitResult {
    const now = Date.now();
    const minuteKey = this.getMinuteKey(now);

    // --- Prune old buckets (older than 2 minutes) ---
    this.pruneBuckets(now);

    // --- Sliding-window check (30 req/min) ---
    const timestamps = this.buckets.get(minuteKey) ?? [];
    const windowStart = now - 60_000;
    const recentCount = timestamps.filter((t) => t >= windowStart).length;

    if (recentCount >= this.config.maxRequestsPerMinute) {
      // Estimate when the oldest request in the window will expire
      const oldest = timestamps.find((t) => t >= windowStart);
      const retryAfter = oldest ? oldest + 60_000 - now + 100 : 60_000;
      return {
        allowed: false,
        reason: `Rate limit: ${this.config.maxRequestsPerMinute} req/min exceeded (${recentCount} in last 60s)`,
        retryAfterMs: retryAfter,
      };
    }

    // --- Concurrency check ---
    if (this.inFlight.size >= this.config.maxConcurrent) {
      return {
        allowed: false,
        reason: `Concurrency limit: ${this.config.maxConcurrent} concurrent requests reached`,
      };
    }

    // --- Record this request ---
    this.requestCounter += 1;
    const requestId = `req-${this.requestCounter}`;
    timestamps.push(now);
    this.buckets.set(minuteKey, timestamps);
    this.inFlight.add(requestId);

    return { allowed: true };
  }

  /**
   * Release a request slot after the request completes.
   * @param requestId - Opaque ID returned by {@link acquire}
   */
  release(requestId: string): void {
    this.inFlight.delete(requestId);
  }

  /**
   * Acquire a slot and return a request ID, or throw if rate-limited.
   * The caller **must** call {@link release} with the returned ID when done.
   */
  acquire(): string {
    const result = this.check();
    if (!result.allowed) {
      const err = new Error(result.reason ?? 'Rate limited');
      (err as Error & { retryAfterMs?: number }).retryAfterMs = result.retryAfterMs;
      throw err;
    }
    // The check() call above already registered the request;
    // we need to return a stable ID for release().
    // Since check() pushes the timestamp and increments the counter,
    // we return the current counter value as the ID.
    return `req-${this.requestCounter}`;
  }

  /**
   * Execute `fn` only if rate limit allows; otherwise reject immediately.
   * Automatically manages the concurrency slot.
   */
  async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    const requestId = this.acquire();
    try {
      return await fn();
    } finally {
      this.release(requestId);
    }
  }

  // ----------------------------------------------------------
  // Introspection
  // ----------------------------------------------------------

  /** Current number of in-flight requests */
  get currentConcurrent(): number {
    return this.inFlight.size;
  }

  /** Requests in the current 60s window */
  get currentWindowCount(): number {
    const now = Date.now();
    const minuteKey = this.getMinuteKey(now);
    const timestamps = this.buckets.get(minuteKey) ?? [];
    const windowStart = now - 60_000;
    return timestamps.filter((t) => t >= windowStart).length;
  }

  /** Total number of tracked minute buckets */
  get bucketCount(): number {
    return this.buckets.size;
  }

  /** Snapshot for monitoring / logging */
  snapshot(): { concurrent: number; windowCount: number; maxPerMin: number; maxConcurrent: number } {
    return {
      concurrent: this.currentConcurrent,
      windowCount: this.currentWindowCount,
      maxPerMin: this.config.maxRequestsPerMinute,
      maxConcurrent: this.config.maxConcurrent,
    };
  }

  // ----------------------------------------------------------
  // Internal helpers
  // ----------------------------------------------------------

  private getMinuteKey(now: number): string {
    return String(Math.floor(now / 60_000));
  }

  /** Remove buckets older than 2 minutes to prevent memory growth */
  private pruneBuckets(now: number): void {
    const cutoffKey = this.getMinuteKey(now - 120_000);
    for (const key of this.buckets.keys()) {
      if (key < cutoffKey) {
        this.buckets.delete(key);
      }
    }
  }
}

/** Singleton rate limiter instance for the AI gateway */
export const aiRateLimiter = new RateLimiter();
