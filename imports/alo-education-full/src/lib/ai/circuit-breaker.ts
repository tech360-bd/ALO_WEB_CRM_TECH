/**
 * ALO Education — Circuit Breaker
 * Task ID: 7-ai-gateway
 *
 * Protects against cascading failures when the upstream AI provider
 * (Groq) becomes unhealthy.
 *
 * States:
 *   CLOSED    → normal operation; failures are counted.
 *   OPEN      → all requests fail-fast; waits `resetTimeoutMs`.
 *   HALF_OPEN → allows up to `halfOpenMaxAttempts` probes; if any
 *                succeeds → CLOSED; if all fail → OPEN.
 *
 * Default: 5 consecutive failures → OPEN for 60 s → HALF_OPEN (1 probe).
 */

import type { CircuitBreakerConfig, CircuitBreakerSnapshot, CircuitState } from './types';

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
  halfOpenMaxAttempts: 1,
};

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitState = 'CLOSED';
  private failureCount = 0;
  private successCount = 0;
  private halfOpenAttempts = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private lastError: string | null = null;

  constructor(config?: Partial<CircuitBreakerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Whether a request is allowed to proceed.
   * In OPEN state the breaker will transition to HALF_OPEN if the
   * reset timeout has elapsed, otherwise the request is rejected.
   */
  canExecute(): boolean {
    if (this.state === 'CLOSED') return true;

    if (this.state === 'OPEN') {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs
      ) {
        this.transitionTo('HALF_OPEN');
        return true;
      }
      return false;
    }

    // HALF_OPEN — allow up to halfOpenMaxAttempts
    return this.halfOpenAttempts < this.config.halfOpenMaxAttempts;
  }

  /**
   * Record a successful call.
   */
  recordSuccess(): void {
    this.successCount += 1;
    this.lastSuccessTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.transitionTo('CLOSED');
    }

    // In CLOSED state, reset failure streak on success
    this.failureCount = 0;
  }

  /**
   * Record a failed call.
   */
  recordFailure(error?: string): void {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    this.lastError = error ?? 'Unknown error';

    if (this.state === 'HALF_OPEN') {
      this.halfOpenAttempts += 1;
      // If all half-open probes failed, go back to OPEN
      if (this.halfOpenAttempts >= this.config.halfOpenMaxAttempts) {
        this.transitionTo('OPEN');
      }
      return;
    }

    // CLOSED → check threshold
    if (this.failureCount >= this.config.failureThreshold) {
      this.transitionTo('OPEN');
    }
  }

  /**
   * Execute `fn` through the circuit breaker.
   * Throws if the circuit is open (with a descriptive message).
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      const waitMs = this.lastFailureTime
        ? Math.max(0, this.config.resetTimeoutMs - (Date.now() - this.lastFailureTime))
        : this.config.resetTimeoutMs;
      throw new Error(
        `Circuit breaker OPEN — provider unavailable. Retry after ${Math.ceil(waitMs / 1000)}s.`
      );
    }

    try {
      const result = await fn();
      this.recordSuccess();
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.recordFailure(msg);
      throw err;
    }
  }

  /** Current state */
  getState(): CircuitState {
    // Auto-transition from OPEN → HALF_OPEN if timeout elapsed
    if (
      this.state === 'OPEN' &&
      this.lastFailureTime &&
      Date.now() - this.lastFailureTime >= this.config.resetTimeoutMs
    ) {
      this.transitionTo('HALF_OPEN');
    }
    return this.state;
  }

  /** Full snapshot for monitoring */
  getSnapshot(): CircuitBreakerSnapshot {
    return {
      state: this.getState(),
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      lastError: this.lastError,
    };
  }

  /** Manually reset the breaker (e.g. after config change) */
  reset(): void {
    this.transitionTo('CLOSED');
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.lastError = null;
  }

  // ----------------------------------------------------------
  // Internal
  // ----------------------------------------------------------

  private transitionTo(newState: CircuitState): void {
    const prev = this.state;
    this.state = newState;

    if (newState === 'HALF_OPEN') {
      this.halfOpenAttempts = 0;
    }
    if (newState === 'CLOSED') {
      this.failureCount = 0;
    }

    console.log(
      `[CircuitBreaker] ${prev} → ${newState}` +
        (this.lastError ? ` (last error: ${this.lastError})` : '')
    );
  }
}

/** Singleton circuit breaker for the Groq provider */
export const groqCircuitBreaker = new CircuitBreaker();
