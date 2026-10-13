/**
 * Cron / scheduled-job distributed lease — ALO Education
 *
 * Replaces the broken lock in `src/cron/worker.ts`:
 *
 *   const existing = await db.cronLock?.findUnique(...)          // model did not exist
 *     || await db.deploymentSequence.findUnique(...);            // no owner, no expiry
 *   if (existing.expiresAt > now) return null;                   // always NaN → never true
 *   await db.deploymentSequence.upsert({ update: {}, create });  // permanent, unowned row
 *
 * There is exactly one table behind this module (`CronLock`, additively added
 * in migration 20261013000000_cron_lock). A claim is a single conditional
 * statement, so two processes cannot both hold the same job key:
 *
 *   1. INSERT the key. A unique-constraint violation means somebody holds it.
 *   2. If nobody holds it, UPDATE … WHERE jobKey = ? AND expiresAt <= now.
 *      Only one concurrent caller can win that UPDATE, because the winner's
 *      new `expiresAt` is in the future and the loser re-evaluates the
 *      predicate against the committed row.
 *
 * Everything in this file except `createPrismaCronLockStore` is pure and is
 * exercised by `scripts/cron-scheduler-policy-check.ts` without a database.
 */

export interface CronLockRow {
  jobKey: string;
  ownerId: string;
  lockedAt: Date;
  expiresAt: Date;
}

export interface CronLockOutcome {
  status: string;
  runAt: Date;
  error?: string;
}

/**
 * Storage contract. Implemented by `createPrismaCronLockStore` in production
 * and by `createInMemoryCronLockStore` in tests.
 */
export interface CronLockStore {
  /** Insert a brand new lease. Resolves `false` when the key already exists. */
  insert(row: CronLockRow): Promise<boolean>;
  /**
   * Atomically take over a lease that has expired. MUST be expressed as a
   * single conditional update so concurrent callers cannot both succeed.
   * Resolves the number of rows updated (0 or 1).
   */
  claimExpired(row: CronLockRow, now: Date): Promise<number>;
  /** Give a lease back early. Only the current owner may release it. */
  release(jobKey: string, ownerId: string, releasedAt: Date): Promise<number>;
  /** Persist the outcome of the run that held the lease. */
  recordOutcome(jobKey: string, ownerId: string, outcome: CronLockOutcome): Promise<void>;
}

export type LeaseStatus = 'acquired' | 'reclaimed' | 'held';

export interface LeaseResult {
  status: LeaseStatus;
  jobKey: string;
  ownerId: string;
  /** When the lease this caller holds (or the current holder holds) lapses. */
  expiresAt: Date;
}

/** Hard bounds: a lease is never shorter than 5s nor longer than 6 hours. */
export const MIN_LEASE_SECONDS = 5;
export const MAX_LEASE_SECONDS = 6 * 60 * 60;
export const DEFAULT_LEASE_SECONDS = 300;

/** Clamp a requested TTL into the supported range. Never returns 0/NaN. */
export function normaliseLeaseSeconds(value: unknown, fallback = DEFAULT_LEASE_SECONDS): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(MAX_LEASE_SECONDS, Math.max(MIN_LEASE_SECONDS, Math.floor(n)));
}

/** True while a lease row still covers `now`. */
export function isLeaseLive(row: Pick<CronLockRow, 'expiresAt'>, now: Date): boolean {
  const expires = row.expiresAt instanceof Date ? row.expiresAt.getTime() : NaN;
  if (!Number.isFinite(expires)) return false; // unreadable expiry is never treated as live
  return expires > now.getTime();
}

/** Error text stored on a lease row is bounded by the VARCHAR(191) column. */
export function truncateLockError(message: string, max = 180): string {
  const clean = (message || '').replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, Math.max(0, max - 1))}…`;
}

/** Prisma unique-constraint violation (P2002), without importing Prisma. */
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: unknown }).code;
  if (code === 'P2002') return true;
  const message = String((error as { message?: unknown }).message ?? '');
  return /unique constraint/i.test(message);
}

/**
 * Acquire the lease for one job key.
 *
 * `held` is a normal outcome: another process owns the job right now, so this
 * caller must not execute it. It is never an error and never retried in a tight
 * loop — the caller simply returns and the schedule offers the job again.
 */
export async function acquireCronLease(
  store: CronLockStore,
  params: { jobKey: string; ownerId: string; ttlSeconds?: number; now?: Date },
): Promise<LeaseResult> {
  const jobKey = (params.jobKey || '').trim();
  if (!jobKey) throw new Error('acquireCronLease: jobKey is required');
  const ownerId = (params.ownerId || '').trim() || 'unknown-owner';
  const now = params.now ?? new Date();
  const ttlSeconds = normaliseLeaseSeconds(params.ttlSeconds);
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
  const row: CronLockRow = { jobKey, ownerId, lockedAt: now, expiresAt };

  let inserted = false;
  try {
    inserted = await store.insert(row);
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;
    inserted = false;
  }
  if (inserted) return { status: 'acquired', jobKey, ownerId, expiresAt };

  const claimed = await store.claimExpired(row, now);
  if (claimed > 0) return { status: 'reclaimed', jobKey, ownerId, expiresAt };

  return { status: 'held', jobKey, ownerId, expiresAt };
}

/** Release a lease early. Only the owner can do this; others get 0 rows. */
export async function releaseCronLease(
  store: CronLockStore,
  params: { jobKey: string; ownerId: string; releasedAt?: Date },
): Promise<boolean> {
  const releasedAt = params.releasedAt ?? new Date();
  const updated = await store.release(params.jobKey, params.ownerId, releasedAt);
  return updated > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Prisma-backed store
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Structural subset of PrismaClient this module needs, so the store can be
 * constructed from `db` without importing the generated client type here.
 */
export interface CronLockClient {
  cronLock: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    updateMany(args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
  };
}

export function createPrismaCronLockStore(client: CronLockClient): CronLockStore {
  return {
    async insert(row) {
      try {
        await client.cronLock.create({
          data: {
            jobKey: row.jobKey,
            ownerId: row.ownerId,
            lockedAt: row.lockedAt,
            expiresAt: row.expiresAt,
          },
        });
        return true;
      } catch (error) {
        if (isUniqueViolation(error)) return false;
        throw error;
      }
    },

    async claimExpired(row, now) {
      // Single conditional statement: the WHERE is re-evaluated against the
      // committed row, so only one concurrent claimant can match.
      const result = await client.cronLock.updateMany({
        where: { jobKey: row.jobKey, expiresAt: { lte: now } },
        data: {
          ownerId: row.ownerId,
          lockedAt: row.lockedAt,
          expiresAt: row.expiresAt,
        },
      });
      return result?.count ?? 0;
    },

    async release(jobKey, ownerId, releasedAt) {
      const result = await client.cronLock.updateMany({
        where: { jobKey, ownerId },
        data: { expiresAt: releasedAt },
      });
      return result?.count ?? 0;
    },

    async recordOutcome(jobKey, ownerId, outcome) {
      await client.cronLock.updateMany({
        where: { jobKey, ownerId },
        data: {
          runCount: { increment: 1 },
          lastRunAt: outcome.runAt,
          lastStatus: outcome.status,
          lastError: truncateLockError(outcome.error ?? ''),
        },
      });
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// In-memory store — tests and offline verification only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deterministic store used by the policy check and local verification.
 *
 * This is deliberately NOT wired as a production fallback: silently degrading
 * to an in-process lock would let two application processes run the same job
 * at the same time, which is the exact defect this module exists to remove.
 */
export function createInMemoryCronLockStore(initial: CronLockRow[] = []): CronLockStore & {
  rows: Map<string, CronLockRow & { runCount: number; lastStatus: string; lastError: string }>;
} {
  const rows = new Map<string, CronLockRow & { runCount: number; lastStatus: string; lastError: string }>();
  for (const row of initial) {
    rows.set(row.jobKey, { ...row, runCount: 0, lastStatus: '', lastError: '' });
  }
  return {
    rows,
    async insert(row) {
      if (rows.has(row.jobKey)) return false;
      rows.set(row.jobKey, { ...row, runCount: 0, lastStatus: '', lastError: '' });
      return true;
    },
    async claimExpired(row, now) {
      const existing = rows.get(row.jobKey);
      if (!existing) return 0;
      if (existing.expiresAt.getTime() > now.getTime()) return 0;
      rows.set(row.jobKey, { ...row, runCount: existing.runCount, lastStatus: existing.lastStatus, lastError: existing.lastError });
      return 1;
    },
    async release(jobKey, ownerId, releasedAt) {
      const existing = rows.get(jobKey);
      if (!existing || existing.ownerId !== ownerId) return 0;
      rows.set(jobKey, { ...existing, expiresAt: releasedAt });
      return 1;
    },
    async recordOutcome(jobKey, ownerId, outcome) {
      const existing = rows.get(jobKey);
      if (!existing || existing.ownerId !== ownerId) return;
      rows.set(jobKey, {
        ...existing,
        runCount: existing.runCount + 1,
        lastStatus: outcome.status,
        lastError: truncateLockError(outcome.error ?? ''),
      });
    },
  };
}
