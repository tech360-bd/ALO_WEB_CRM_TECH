/**
 * Cron job runner — ALO Education
 *
 * Every scheduled job in the platform goes through `runCronJob`. It provides,
 * in one place, the guarantees the task list requires of cron automation:
 *
 *   • duplicate execution is impossible while a lease is live   (§ lock)
 *   • a crashed holder is replaced once its lease expires        (§ recovery)
 *   • start and finish are recorded durably with duration+status (§ log)
 *   • failures are recorded, never swallowed                     (§ failure)
 *   • execution is bounded by a timeout                          (§ no hanging)
 *   • the runner itself never throws at the caller               (§ CLI safe)
 *   • a job that genuinely needs an external resource returns
 *     `blocked` with the exact reason instead of pretending      (§ no fake data)
 *
 * The runner is deliberately dependency-injected: the lease store and the
 * outcome log are passed in, so the semantics are provable without MySQL
 * (`scripts/cron-scheduler-policy-check.ts`).
 */

import os from 'os';
import {
  acquireCronLease,
  createPrismaCronLockStore,
  releaseCronLease,
  truncateLockError,
  type CronLockClient,
  type CronLockStore,
  type LeaseStatus,
} from './cron-lock';

export type CronRunStatus = 'ran' | 'skipped_locked' | 'failed' | 'blocked';

export interface CronJobContext {
  now: Date;
  jobKey: string;
  ownerId: string;
  runId: string | null;
  /** Upper bound on records a job may touch in one run. */
  limit: number;
}

export interface CronJobRuntime {
  /** Stable registry key (`sla-monitoring`, `whatsapp-followups`, …). */
  key: string;
  description: string;
  /** Lease duration. Must exceed the expected runtime, not the schedule gap. */
  lockTtlSeconds: number;
  timeoutMs?: number;
  /**
   * Set when the job cannot run in this deployment because a resource outside
   * the application is missing (binary, provider credential, backup target).
   * The runner then returns `blocked` and NEVER calls the handler.
   */
  externalDependency?: string;
  /** Human-readable reason a key is served by another real job/route. */
  supersededBy?: string;
  handler: (ctx: CronJobContext) => Promise<unknown> | unknown;
}

export interface CronJobRunResult {
  jobKey: string;
  status: CronRunStatus;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  lockStatus: LeaseStatus | null;
  runId: string | null;
  result?: unknown;
  error?: string;
  blockedReason?: string;
}

/** Durable start/finish records (CronJobLog). Optional so tests stay DB-free. */
export interface CronOutcomeLog {
  start(jobKey: string, startedAt: Date): Promise<string | null>;
  finish(
    runId: string | null,
    outcome: {
      status: CronRunStatus;
      finishedAt: Date;
      durationMs: number;
      errorMessage: string;
      metadata: string;
    },
  ): Promise<void>;
}

export interface CronRunnerDeps {
  /** When absent the job is refused — an unlocked job must never run. */
  store?: CronLockStore | null;
  outcomeLog?: CronOutcomeLog | null;
  now?: () => Date;
  ownerId?: string;
  timeoutMs?: number;
  /** Structured, secret-free progress logging. */
  onEvent?: (event: Record<string, unknown>) => void;
}

export const MIN_JOB_TIMEOUT_MS = 1_000;
export const MAX_JOB_TIMEOUT_MS = 15 * 60 * 1000;
export const DEFAULT_JOB_TIMEOUT_MS = 120_000;

export function normaliseTimeoutMs(value: unknown, fallback = DEFAULT_JOB_TIMEOUT_MS): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(MAX_JOB_TIMEOUT_MS, Math.max(MIN_JOB_TIMEOUT_MS, Math.floor(n)));
}

/** Process identity used as the lease owner. Unique per process, not per user. */
export function defaultOwnerId(): string {
  let host = 'unknown-host';
  try {
    host = os.hostname();
  } catch {
    /* hostname is best-effort */
  }
  return `${host}:${process.pid}`;
}

/**
 * Bound a promise by a timeout without leaking a timer that keeps the process
 * (or a `tsx` script) alive.
 */
export async function withTimeout<T>(
  work: Promise<T>,
  timeoutMs: number,
  label: string,
): Promise<T> {
  const ms = normaliseTimeoutMs(timeoutMs);
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        // Deliberately NOT unref'd: an unref'd timer does not keep the event
        // loop alive, so a CLI (`npx tsx src/cron/worker.ts`, a verification
        // script) whose only pending work is this timer would exit silently
        // with no result and no output. The timer is always cleared in the
        // `finally` below, so it cannot leak into a caller.
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.name;
  return String(error);
}

/**
 * Run one scheduled job under a lease with durable outcome logging.
 *
 * Resolves for every outcome — `ran`, `skipped_locked`, `failed`, `blocked`.
 * Callers branch on `status`; they never need try/catch.
 */
export async function runCronJob(
  job: CronJobRuntime,
  deps: CronRunnerDeps = {},
): Promise<CronJobRunResult> {
  const now = deps.now ?? (() => new Date());
  const startedAt = now();
  const ownerId = deps.ownerId ?? defaultOwnerId();
  const timeoutMs = normaliseTimeoutMs(job.timeoutMs ?? deps.timeoutMs);

  const base = {
    jobKey: job.key,
    startedAt: startedAt.toISOString(),
    durationMs: 0,
    lockStatus: null as LeaseStatus | null,
    runId: null as string | null,
  };

  const finish = (
    status: CronRunStatus,
    extra: Partial<CronJobRunResult> = {},
  ): CronJobRunResult => {
    const finishedAt = now();
    return {
      ...base,
      ...extra,
      status,
      finishedAt: finishedAt.toISOString(),
      durationMs: Math.max(0, finishedAt.getTime() - startedAt.getTime()),
    };
  };

  // 1. Refuse jobs whose precondition is genuinely external.
  if (job.externalDependency) {
    return finish('blocked', { blockedReason: job.externalDependency });
  }

  // 1b. Refuse jobs whose work is implemented somewhere else. Reporting
  //     success here would claim work that this path did not do.
  if (job.supersededBy) {
    return finish('blocked', { blockedReason: `superseded: ${job.supersededBy}` });
  }

  // 2. Refuse to run unlocked. A missing store means "cannot prove exclusivity",
  //    and running anyway is how duplicate sends happen.
  const store = deps.store;
  if (!store) {
    return finish('blocked', {
      blockedReason:
        'cron lock store is unavailable — refusing to run a scheduled job without an exclusive lease',
    });
  }

  // 3. Claim the lease.
  let leaseStatus: LeaseStatus;
  try {
    const lease = await acquireCronLease(store, {
      jobKey: job.key,
      ownerId,
      ttlSeconds: job.lockTtlSeconds,
      now: startedAt,
    });
    leaseStatus = lease.status;
  } catch (error) {
    deps.onEvent?.({
      level: 'error',
      job: job.key,
      op: 'lease.claim',
      error: errorMessage(error),
    });
    return finish('failed', {
      error: `lease acquisition failed: ${errorMessage(error)}`,
    });
  }

  if (leaseStatus === 'held') {
    deps.onEvent?.({ level: 'info', job: job.key, op: 'lease.held', owner: ownerId });
    return finish('skipped_locked', { lockStatus: 'held' });
  }

  // 4. Durable start record.
  let runId: string | null = null;
  try {
    runId = (await deps.outcomeLog?.start(job.key, startedAt)) ?? null;
  } catch (error) {
    deps.onEvent?.({
      level: 'warn',
      job: job.key,
      op: 'log.start',
      error: errorMessage(error),
    });
  }

  // 5. Execute, bounded.
  let status: CronRunStatus = 'ran';
  let result: unknown;
  let failure = '';
  try {
    result = await withTimeout(Promise.resolve(job.handler({
      now: startedAt,
      jobKey: job.key,
      ownerId,
      runId,
      limit: 100,
    })), timeoutMs, `cron job ${job.key}`);
  } catch (error) {
    status = 'failed';
    failure = errorMessage(error);
  }

  const finishedAt = now();
  const durationMs = Math.max(0, finishedAt.getTime() - startedAt.getTime());

  // 6. Record the outcome (never let bookkeeping hide the real result).
  try {
    await store.recordOutcome(job.key, ownerId, {
      status,
      runAt: finishedAt,
      error: failure,
    });
  } catch (error) {
    deps.onEvent?.({
      level: 'warn',
      job: job.key,
      op: 'lease.record',
      error: errorMessage(error),
    });
  }
  try {
    await deps.outcomeLog?.finish(runId, {
      status,
      finishedAt,
      durationMs,
      errorMessage: truncateLockError(failure),
      metadata: JSON.stringify({
        ownerId,
        lockStatus: leaseStatus,
        timedOut: /timed out after/.test(failure),
        summary: summariseResult(result),
      }),
    });
  } catch (error) {
    deps.onEvent?.({
      level: 'warn',
      job: job.key,
      op: 'log.finish',
      error: errorMessage(error),
    });
  }

  // 7. Hand the lease back so a retry does not wait for the TTL. The next run
  //    of a *failed* job is the scheduler's decision, not the lease's.
  try {
    await releaseCronLease(store, { jobKey: job.key, ownerId, releasedAt: finishedAt });
  } catch (error) {
    deps.onEvent?.({
      level: 'warn',
      job: job.key,
      op: 'lease.release',
      error: errorMessage(error),
    });
  }

  deps.onEvent?.({
    level: status === 'failed' ? 'error' : 'info',
    job: job.key,
    op: 'run',
    status,
    durationMs,
    runId,
  });

  return finish(status, {
    lockStatus: leaseStatus,
    runId,
    result,
    error: failure || undefined,
  });
}

/**
 * Small, JSON-safe digest of a handler result so CronJobLog.metadata stays
 * bounded (a job may return hundreds of rows).
 */
export function summariseResult(result: unknown): unknown {
  if (result === undefined || result === null) return null;
  if (Array.isArray(result)) return { count: result.length };
  if (typeof result === 'object') {
    const record = result as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    let keys = 0;
    for (const [key, value] of Object.entries(record)) {
      if (value === undefined) continue;
      const isPrimitive =
        value === null || ['string', 'number', 'boolean'].includes(typeof value);
      if (!isPrimitive && !Array.isArray(value)) continue;
      out[key] = Array.isArray(value) ? { count: value.length } : value;
      if (++keys >= 20) break;
    }
    return out;
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Production wiring helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Process-local owner id, generated once per process. */
let cachedOwnerId: string | null = null;
export function processOwnerId(): string {
  if (!cachedOwnerId) cachedOwnerId = defaultOwnerId();
  return cachedOwnerId;
}

/** Minimal structural client the CronJobLog adapter needs. */
export interface CronLogClient {
  cronJobLog: {
    create(args: { data: Record<string, unknown> }): Promise<{ id: string }>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<unknown>;
  };
}

export function createCronOutcomeLog(client: CronLogClient): CronOutcomeLog {
  return {
    async start(jobKey, startedAt) {
      const row = await client.cronJobLog.create({
        data: { jobName: jobKey, status: 'running', startedAt },
      });
      return row?.id ?? null;
    },
    async finish(runId, outcome) {
      if (!runId) return;
      await client.cronJobLog.update({
        where: { id: runId },
        data: {
          status: outcome.status === 'ran' ? 'success' : 'failed',
          finishedAt: outcome.finishedAt,
          durationMs: outcome.durationMs,
          errorMessage: outcome.errorMessage,
          metadata: outcome.metadata,
        },
      });
    },
  };
}

/** Structural client for the lease store + job log (PrismaClient satisfies it). */
export interface CronRunnerClient extends CronLockClient {
  cronJobLog: CronLogClient['cronJobLog'];
}

/**
 * Wire the runner to a live Prisma client. Returns deps for `runCronJob`.
 * Bookkeeping failures degrade to console events instead of aborting a job
 * whose business effect already happened.
 */
export function createCronRunnerDeps(client: CronRunnerClient): CronRunnerDeps {
  return {
    store: createPrismaCronLockStore(client),
    outcomeLog: createCronOutcomeLog(client),
    ownerId: processOwnerId(),
    onEvent: (event) => logCronEvent(event),
  };
}

/** Single structured log line per event. Never logs bodies, tokens or PII. */
export function logCronEvent(event: Record<string, unknown>): void {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      service: 'cron',
      ...event,
    });
    if (event.level === 'error') console.error(`[cron] ${line}`);
    else if (event.level === 'warn') console.warn(`[cron] ${line}`);
    else console.log(`[cron] ${line}`);
  } catch {
    /* logging must never break a job */
  }
}
