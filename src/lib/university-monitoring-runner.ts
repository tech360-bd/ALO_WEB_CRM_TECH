// ============================================================
// ALO Education — Monitoring Run Orchestrator (scheduler-safe)
// ============================================================
//
// Why this file exists (audit finding):
// The lock/run/release logic lived inline inside
// `POST /api/university-monitoring/trigger`, and there was NO scheduled entry
// point at all — `/api/cron/weekly-university-scan` returned
// `503 DISABLED`. So the "7-day monitoring agent" could only ever run if a
// human clicked a button, and the reliability requirements in the spec
// (survive restart, prevent duplicate execution, retry safely, run id,
// started_at/completed_at, retry_count) were only partially met in one copy of
// the code.
//
// This module owns the run lifecycle exactly once, and is shared by:
//   • POST /api/university-monitoring/trigger   (manual, Super Admin)
//   • GET|POST /api/cron/university-monitoring  (scheduler, every 7 days)
//
// Scheduler reliability properties implemented here:
//   • Durable state in MonitoringJob (DB), so a server/app/process restart or
//     a deployment never loses the schedule — `nextRunAt` is recomputed and
//     persisted after every run.
//   • Duplicate execution prevented by a conditional (compare-and-set) lock
//     acquisition: the UPDATE only matches when the row is still unlocked, so
//     two concurrent instances cannot both win.
//   • Crash recovery via `lockExpiresAt` — a lock left behind by a killed
//     process expires and is reclaimed (and the orphaned run is marked FAILED)
//     instead of blocking the schedule forever.
//   • retryCount persisted on VerificationRun so a failed run can be retried
//     safely without creating duplicate university/course records (dedupe is
//     enforced by stable identifiers in the engine).

import { db } from '@/lib/db';
import { runMonitoringCycle, type MonitoringCounts, type RunOptions } from '@/lib/university-monitoring-engine';

/** Stable job identifier — never randomised, so restarts reattach to the same row. */
export const MONITORING_JOB_ID = 'university-monitor-7d';
export const MONITORING_JOB_NAME = 'ALO University & Official Data Monitoring Agent';

/** Cadence required by the spec: every 7 days. */
export const MONITORING_INTERVAL_DAYS = 7;

/** Max wall-clock time a run may hold the lock before it is considered crashed. */
const LOCK_TTL_MS = 30 * 60 * 1000; // 30 minutes

export type RunTrigger = 'SCHEDULER' | 'MANUAL';

export interface StartRunParams {
  trigger: RunTrigger;
  /** Resolved User.id of the Super Admin for manual runs; null for the scheduler. */
  actorId?: string | null;
  actorLabel?: string;
  scope?: string;
  limit?: number;
}

export type StartRunResult =
  | { status: 'COMPLETED' | 'PARTIAL'; runId: string; runKey: string; counts: MonitoringCounts; aiReportSummary: string }
  | { status: 'FAILED'; runId: string; runKey: string; error: string }
  | { status: 'LOCKED'; lockedBy: string; lockExpiresAt: Date | null }
  | { status: 'NOT_DUE'; nextRunAt: Date | null }
  | { status: 'DISABLED' };

/** Exactly seven elapsed days later; independent of the host/server timezone. */
export function computeNextRunAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + MONITORING_INTERVAL_DAYS * 86_400_000);
}

/**
 * Ensure the MonitoringJob row exists. Idempotent, safe to call on every
 * request — this is what makes the schedule survive a fresh deployment or a
 * database that has not been seeded yet.
 */
export async function ensureMonitoringJob() {
  return db.monitoringJob.upsert({
    where: { jobId: MONITORING_JOB_ID },
    update: {},
    create: {
      jobId: MONITORING_JOB_ID,
      name: MONITORING_JOB_NAME,
      description:
        'Polls the persistent seven-day schedule, checks only verified official sources, ' +
        'records snapshots and routes candidate changes to Super Admin review. ' +
        'No extracted information is published automatically.',
      schedule: '*/5 * * * *', // scheduler poll; persisted nextRunAt enforces the seven-day data cycle
      enabled: true,
      nextRunAt: new Date(), // baseline scan is due on first install
      maxRetries: 3,
      retryDelayMs: 60_000,
    },
  });
}

/**
 * Release any lock whose TTL has elapsed, and mark the run it was holding as
 * FAILED so the dashboard does not show a run stuck in RUNNING forever.
 * This is the "survives server restart / process kill" recovery path.
 */
export async function reclaimExpiredLock(): Promise<boolean> {
  const now = new Date();
  const job = await db.monitoringJob.findUnique({ where: { jobId: MONITORING_JOB_ID } });
  if (!job || !job.lockedBy) return false;
  if (job.lockExpiresAt && job.lockExpiresAt > now) return false; // still valid

  // Compare-and-set reclaim: a concurrent runner may have renewed the lease
  // since our read. Never clear a lock unless the row still has this exact
  // expired owner/lease state.
  const reclaimed = await db.monitoringJob.updateMany({
    where: {
      id: job.id,
      lockedBy: job.lockedBy,
      OR: [{ lockExpiresAt: null }, { lockExpiresAt: { lte: now } }],
    },
    data: { lockedBy: null, lockedAt: null, lockExpiresAt: null, lastRunStatus: 'FAILED', failedRuns: { increment: 1 } },
  });
  if (reclaimed.count !== 1) return false;

  if (job.lastRunId) {
    await db.verificationRun
      .updateMany({
        where: { id: job.lastRunId, status: 'RUNNING' },
        data: {
          status: 'FAILED',
          completedAt: now,
          errorMessage: 'Run abandoned — scheduler lock expired (process restart or crash). Reclaimed automatically.',
        },
      })
      .catch(() => undefined);
  }

  await db.monitoringLog
    .create({
      data: {
        jobId: job.id,
        level: 'WARN',
        message: `Stale monitoring lock reclaimed (previous holder: ${job.lockedBy}). The abandoned run was marked FAILED.`,
      },
    })
    .catch(() => undefined);

  return true;
}

/**
 * Atomically acquire the job lock.
 *
 * Uses `updateMany` with the lock state in the WHERE clause so the database
 * performs a conditional update: only ONE concurrent caller can match the
 * "unlocked or expired" predicate and get count === 1. This is what prevents
 * duplicate execution when two app instances fire the cron at the same time.
 */
async function acquireLock(jobRowId: string, instanceId: string): Promise<boolean> {
  const now = new Date();
  const result = await db.monitoringJob.updateMany({
    where: {
      id: jobRowId,
      OR: [{ lockedBy: null }, { lockExpiresAt: { lt: now } }],
    },
    data: {
      lockedBy: instanceId,
      lockedAt: now,
      lockExpiresAt: new Date(now.getTime() + LOCK_TTL_MS),
    },
  });
  return result.count === 1;
}

/** Release the lock, but only if we still own it (never steal another holder's lock). */
async function releaseLock(jobRowId: string, instanceId: string, data: Record<string, unknown>) {
  await db.monitoringJob.updateMany({
    where: { id: jobRowId, lockedBy: instanceId },
    data: { lockedBy: null, lockedAt: null, lockExpiresAt: null, ...data },
  });
}

/** Extend only a still-live lease we own; never revive a lease another runner reclaimed. */
async function renewLock(jobRowId: string, instanceId: string): Promise<boolean> {
  const now = new Date();
  const renewed = await db.monitoringJob.updateMany({
    where: { id: jobRowId, lockedBy: instanceId, lockExpiresAt: { gt: now } },
    data: { lockedAt: now, lockExpiresAt: new Date(now.getTime() + LOCK_TTL_MS) },
  });
  return renewed.count === 1;
}

/** Is the job due to run according to its persisted nextRunAt? */
export async function isDue(): Promise<{ due: boolean; nextRunAt: Date | null; enabled: boolean }> {
  const job = await ensureMonitoringJob();
  if (!job.enabled) return { due: false, nextRunAt: job.nextRunAt, enabled: false };
  // No nextRunAt recorded yet (fresh install) → due immediately.
  const due = !job.nextRunAt || job.nextRunAt <= new Date();
  return { due, nextRunAt: job.nextRunAt, enabled: true };
}

/**
 * Execute one monitoring cycle end-to-end with full lifecycle bookkeeping.
 *
 * `force: true` (manual Super Admin trigger) ignores the nextRunAt gate but
 * still respects the lock, so a human cannot cause a duplicate concurrent run.
 */
export async function startMonitoringRun(
  params: StartRunParams & { force?: boolean },
): Promise<StartRunResult> {
  const { trigger, actorId = null, actorLabel = 'scheduler', scope = 'verified-only', limit, force = false } = params;

  const job = await ensureMonitoringJob();

  if (!job.enabled) return { status: 'DISABLED' };

  // Recover a lock orphaned by a crashed/restarted process before testing it.
  await reclaimExpiredLock();

  if (!force) {
    const due = await isDue();
    if (!due.due) return { status: 'NOT_DUE', nextRunAt: due.nextRunAt };
  }

  const instanceId = `${trigger.toLowerCase()}-${process.pid}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const got = await acquireLock(job.id, instanceId);
  if (!got) {
    const current = await db.monitoringJob.findUnique({ where: { id: job.id } });
    return {
      status: 'LOCKED',
      lockedBy: current?.lockedBy || 'unknown',
      lockExpiresAt: current?.lockExpiresAt ?? null,
    };
  }

  // The run row, job pointer, and audit event are committed atomically after
  // acquiring the lease. A crash cannot leave an untracked RUNNING row.
  const runKey = `VR-${new Date().toISOString().slice(0, 10)}-${Date.now().toString(36).toUpperCase()}`;
  let run: any;
  try {
    run = await db.$transaction(async (tx) => {
      const lease = await tx.monitoringJob.updateMany({
        where: { id: job.id, lockedBy: instanceId, lockExpiresAt: { gt: new Date() } },
        data: { lockedAt: new Date(), lockExpiresAt: new Date(Date.now() + LOCK_TTL_MS) },
      });
      if (lease.count !== 1) throw new Error('Monitoring lease expired before the run could be initialized.');
      const previousRun = job.lastRunId && job.lastRunStatus === 'FAILED'
        ? await tx.verificationRun.findUnique({ where: { id: job.lastRunId }, select: { retryCount: true } })
        : null;
      const retryCount = previousRun?.retryCount ?? 0;
      const createdRun = await tx.verificationRun.create({
        data: { jobId: job.id, runId: runKey, status: 'RUNNING', startedAt: new Date(), retryCount },
      });
      await tx.monitoringJob.update({
        where: { id: job.id },
        data: {
          lastRunId: createdRun.id,
          lastRunStartedAt: new Date(),
          lastRunStatus: 'RUNNING',
          totalRuns: { increment: 1 },
        },
      });
      await tx.monitoringLog.create({
        data: {
          runId: createdRun.id,
          jobId: job.id,
          level: 'AUDIT',
          message: `${trigger === 'SCHEDULER' ? 'Scheduled' : 'Manual'} monitoring run ${runKey} started by ${actorLabel} (scope: ${scope})`,
          metadata: JSON.stringify({ trigger, actorId, actorLabel, scope, instanceId, limit: limit ?? 50 }),
        },
      });
      return createdRun;
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await releaseLock(job.id, instanceId, {
      lastRunCompletedAt: new Date(),
      lastRunStatus: 'FAILED',
      failedRuns: { increment: 1 },
      nextRunAt: new Date(Date.now() + Math.max(60_000, job.retryDelayMs || 60_000)),
    }).catch(() => undefined);
    await db.monitoringLog.create({
      data: { jobId: job.id, level: 'ERROR', message: `Monitoring run ${runKey} could not be initialized: ${message}` },
    }).catch(() => undefined);
    return { status: 'FAILED', runId: '', runKey, error: message };
  }

  let leaseLost = false;
  let renewalInFlight = false;
  const heartbeat = setInterval(() => {
    if (renewalInFlight || leaseLost) return;
    renewalInFlight = true;
    void renewLock(job.id, instanceId)
      .then((renewed) => { if (!renewed) leaseLost = true; })
      .catch((error) => { console.error('[university-monitoring] lock renewal failed', error); })
      .finally(() => { renewalInFlight = false; });
  }, Math.floor(LOCK_TTL_MS / 3));
  heartbeat.unref?.();

  try {
    const result = await runMonitoringCycle(run.id, {
      scope: scope as RunOptions['scope'],
      limit: limit ?? 50,
    });

    const stillOwnsLease = await renewLock(job.id, instanceId);
    clearInterval(heartbeat);
    if (leaseLost || !stillOwnsLease) throw new Error('Monitoring lease was lost; another runner may own the job.');

    const needsRetry = result.counts.failedSources > 0 || result.counts.sourcesDeferred > 0;
    // A run with no configured/due sources is explicitly PARTIAL so dashboards
    // do not mistake an empty queue for verified coverage.
    const status = needsRetry || result.counts.sourcesChecked === 0 ? 'PARTIAL' : 'COMPLETED';

    await db.verificationRun.update({
      where: { id: run.id },
      data: { status, completedAt: new Date(), ...result.counts, aiReportSummary: result.aiReportSummary },
    });

    const retryDelayMs = Math.max(60_000, job.retryDelayMs || 60_000);
    const nextRunAt = needsRetry ? new Date(Date.now() + retryDelayMs) : computeNextRunAt();
    await releaseLock(job.id, instanceId, {
      lastRunCompletedAt: new Date(),
      lastRunStatus: status,
      ...(status === 'COMPLETED' ? { successfulRuns: { increment: 1 } } : {}),
      nextRunAt,
    });

    await db.monitoringLog
      .create({
        data: {
          runId: run.id,
          jobId: job.id,
          level: 'INFO',
          message: `Monitoring run ${runKey} ${status}: ${result.counts.sourcesChecked} sources checked, ${result.counts.changesDetected} changes detected, ${result.counts.criticalChanges} critical. Next run ${nextRunAt.toISOString()}.`,
        },
      })
      .catch(() => undefined);

    // Deliver the 7-day report to Super Admin / AI Command Center /
    // Knowledge Center / Audit Logs (spec: "7-DAY REPORT").
    await deliverRunReport(run.id, runKey, result.counts, result.aiReportSummary, actorId).catch(() => undefined);

    return { status, runId: run.id, runKey, counts: result.counts, aiReportSummary: result.aiReportSummary };
  } catch (err) {
    clearInterval(heartbeat);
    const message = err instanceof Error ? err.message : String(err);

    const failedRetryCount = run.retryCount + 1;
    const retryDelayMs = Math.max(60_000, job.retryDelayMs || 60_000);
    const retryAllowed = failedRetryCount <= Math.max(0, job.maxRetries || 0);
    await db.verificationRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', completedAt: new Date(), errorMessage: message, retryCount: failedRetryCount },
    });

    // Failed work is retried after the configured delay for a bounded number of
    // attempts; the seven-day cadence resumes after retries are exhausted.
    await releaseLock(job.id, instanceId, {
      lastRunCompletedAt: new Date(),
      lastRunStatus: 'FAILED',
      failedRuns: { increment: 1 },
      nextRunAt: retryAllowed ? new Date(Date.now() + retryDelayMs) : computeNextRunAt(),
    });

    await db.monitoringLog
      .create({
        data: { runId: run.id, jobId: job.id, level: 'ERROR', message: `Monitoring run ${runKey} failed: ${message}` },
      })
      .catch(() => undefined);

    return { status: 'FAILED', runId: run.id, runKey, error: message };
  }
}

/**
 * Persist the 7-day report and fan it out to the required destinations.
 * Stored as an AuditLog entry (Audit Logs) and a MonitoringLog AUDIT record
 * (AI Command Center / Super Admin); the Knowledge Center reads approved
 * monitoring output through /api/university-monitoring/search.
 */
export async function deliverRunReport(
  runRowId: string,
  runKey: string,
  counts: MonitoringCounts,
  aiReportSummary: string,
  actorId: string | null,
) {
  const report = {
    title: 'ALO UNIVERSITY DATA MONITORING REPORT',
    runId: runKey,
    generatedAt: new Date().toISOString(),
    universitiesChecked: counts.universitiesChecked,
    sourcesChecked: counts.sourcesChecked,
    coursesChecked: counts.coursesChecked,
    newUniversities: counts.newUniversities,
    newCourses: counts.newCourses,
    updatedCourses: counts.updatedCourses,
    closedCourses: counts.closedCourses,
    feeChanges: counts.feeChanges,
    intakeChanges: counts.intakeChanges,
    deadlineChanges: counts.deadlineChanges,
    requirementChanges: counts.requirementChanges,
    scholarshipChanges: counts.scholarshipChanges,
    governmentChanges: counts.governmentChanges,
    criticalChanges: counts.criticalChanges,
    failedSources: counts.failedSources,
    conflicts: counts.conflicts,
    manualReviewItems: counts.manualReviewItems,
    summary: aiReportSummary,
  };

  await db.auditLog
    .create({
      data: {
        userId: actorId || null,
        action: 'UNIVERSITY_MONITORING_REPORT_GENERATED',
        resource: 'VerificationRun',
        resourceId: runRowId,
        details: JSON.stringify(report),
      },
    })
    .catch(() => undefined);

  await db.monitoringLog
    .create({
      data: {
        runId: runRowId,
        level: 'AUDIT',
        message: `7-day monitoring report generated for ${runKey}`,
        metadata: JSON.stringify(report),
      },
    })
    .catch(() => undefined);

  return report;
}
