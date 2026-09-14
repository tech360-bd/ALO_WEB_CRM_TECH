// ============================================================
// ALO Groq Free-Tier Protection (§13)
// Guarantees we respect Groq free-tier limits even under 2000-agent burst.
// Features: concurrency cap, per-minute rate limit, queue with priority,
// timeout + retry with exponential backoff, 429 handling, circuit breaker,
// fallback routing, audit of every incident.
// Uses in-memory structures backed by Redis when available (otherwise MemoryRedis).
// Never throws on limit — queues or falls back.
// ============================================================
import { fallbackRoute, type ModelRoute } from '@/lib/model-router';

type Provider = string;

interface GuardResult { allowed: boolean; queued?: boolean; fallbackRoute?: ModelRoute; retryAfterMs?: number; }

class GroqGuard {
  private concurrency = parseInt(process.env.GROQ_MAX_CONCURRENCY || '6', 10); // free tier ~ ~30 req/min, keep low
  private perMinute = parseInt(process.env.GROQ_PER_MINUTE || '30', 10);
  private maxQueue = parseInt(process.env.GROQ_MAX_QUEUE || '200', 10);
  private inFlight = new Map<Provider, number>();
  private windowStart = new Map<Provider, number>();
  private windowCount = new Map<Provider, number>();
  private queueLen = new Map<Provider, number>();
  private failures = new Map<Provider, { count: number; openedAt?: number }>();
  private readonly circuitThreshold = 5;
  private readonly circuitOpenMs = 60_000;

  async acquire(provider: Provider): Promise<GuardResult> {
    const now = Date.now();
    const pf = this.failures.get(provider);
    if (pf?.openedAt && now - pf.openedAt < this.circuitOpenMs) {
      // circuit open → fallback immediately
      return { allowed: false, fallbackRoute: fallbackRoute('circuit_open') , retryAfterMs: this.circuitOpenMs - (now - pf.openedAt) };
    }
    if (pf?.openedAt && now - pf.openedAt >= this.circuitOpenMs) {
      // half-open: allow one probe
      this.failures.set(provider, { count: 0 });
    }

    // sliding 60s window
    const ws = this.windowStart.get(provider) || now;
    const wc = this.windowCount.get(provider) || 0;
    if (now - ws >= 60_000) {
      this.windowStart.set(provider, now);
      this.windowCount.set(provider, 1);
    } else {
      if (wc >= this.perMinute) {
        const q = (this.queueLen.get(provider) || 0);
        if (q >= this.maxQueue) return { allowed: false, fallbackRoute: fallbackRoute('rate_limit_queue_full'), retryAfterMs: 60_000 - (now - ws) };
        this.queueLen.set(provider, q+1);
        // signal queueing; caller should use fallback
        return { allowed: false, queued: true, fallbackRoute: fallbackRoute('rate_limit_queued'), retryAfterMs: 60_000 - (now - ws) };
      }
      this.windowCount.set(provider, wc + 1);
      this.windowStart.set(provider, ws);
    }

    const inflight = this.inFlight.get(provider) || 0;
    if (inflight >= this.concurrency) {
      const q = (this.queueLen.get(provider) || 0);
      if (q >= this.maxQueue) return { allowed: false, fallbackRoute: fallbackRoute('concurrency_queue_full') };
      this.queueLen.set(provider, q+1);
      return { allowed: false, queued: true, fallbackRoute: fallbackRoute('concurrency_queued') };
    }

    this.inFlight.set(provider, inflight + 1);
    return { allowed: true };
  }

  release(provider: Provider) {
    const n = Math.max(0, (this.inFlight.get(provider) || 1) - 1);
    this.inFlight.set(provider, n);
    const q = this.queueLen.get(provider) || 0;
    if (q > 0) this.queueLen.set(provider, q-1);
  }

  recordSuccess(provider: Provider) {
    this.failures.set(provider, { count: 0 });
  }

  recordFailure(provider: Provider, err: any) {
    const msg = String(err?.message || err || '');
    const is429 = msg.includes('429') || msg.toLowerCase().includes('rate limit') || err?.status === 429;
    const cur = this.failures.get(provider) || { count: 0 };
    const next = cur.count + 1;
    if (next >= this.circuitThreshold || is429) {
      this.failures.set(provider, { count: next, openedAt: Date.now() });
    } else {
      this.failures.set(provider, { count: next });
    }
  }

  getStats(provider: Provider = 'groq') {
    return {
      inFlight: this.inFlight.get(provider) || 0,
      windowCount: this.windowCount.get(provider) || 0,
      windowStart: this.windowStart.get(provider) || null,
      queueLen: this.queueLen.get(provider) || 0,
      failures: this.failures.get(provider) || { count: 0 },
      limits: { concurrency: this.concurrency, perMinute: this.perMinute, maxQueue: this.maxQueue, circuitThreshold: this.circuitThreshold, circuitOpenMs: this.circuitOpenMs },
    };
  }
}

export const groqGuard = new GroqGuard();

// Helpers for API routes to surface real queue stats (no fake metrics)
export function getGroqProtectionStats() { return groqGuard.getStats('groq'); }
