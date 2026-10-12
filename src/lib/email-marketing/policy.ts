/**
 * Sending policy: caps, retry backoff, and stale-lock recovery.
 * Pure functions only, so the rules can be unit-tested without a database.
 */

export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
export const RETRY_BASE_DELAY_MS = 5 * 60 * 1000;
export const RETRY_MAX_DELAY_MS = 6 * HOUR_MS;
/** A claimed item older than this is assumed abandoned by a crashed worker and is released. */
export const STALE_LOCK_MS = 15 * 60 * 1000;

/** Exponential backoff: 5 min, 10 min, 20 min, ... capped at 6 h. */
export function retryDelayMs(attemptsSoFar: number): number {
  const exponent = Math.max(1, Math.floor(attemptsSoFar)) - 1;
  return Math.min(RETRY_BASE_DELAY_MS * 2 ** exponent, RETRY_MAX_DELAY_MS);
}

/**
 * Sends the configured caps still allow right now. Counts every SMTP attempt, not
 * only accepted messages, because a provider may count rejected attempts too.
 * Never negative. This is a configured ceiling, not a claim about provider limits.
 */
export function remainingBudget(
  caps: { hourlyCap: number; dailyCap: number },
  attemptsLastHour: number,
  attemptsLast24h: number
): number {
  return Math.max(0, Math.min(caps.hourlyCap - attemptsLastHour, caps.dailyCap - attemptsLast24h));
}
