/**
 * ALO Education — background worker / scheduler
 *
 * The 15 declarations in `./cron-definitions.ts` are the single source of
 * truth for *when* something runs; `@/lib/cron/job-registry` is the single
 * source of truth for *what* runs. This file is only the loop that joins them.
 *
 * What changed on 2026-10-13 (cron certification pass):
 *   • the local `withCronLock` was removed. It read `DeploymentSequence`, which
 *     has no owner and no expiry column, so `expiresAt > now` was always false
 *     and the acquired "lock" was an unowned permanent row — two processes could
 *     run the same job at the same time.
 *   • jobs now run through `runCronJob`, which holds a real lease
 *     (`CronLock`), writes a start/finish row to `CronJobLog`, records failures
 *     instead of swallowing them, and is bounded by a timeout.
 *   • the twelve logging-only handlers were deleted. Every job body now lives
 *     in `@/lib/cron/job-handlers` and performs real work; declarations whose
 *     work genuinely cannot happen here are reported as blocked with a reason.
 *
 * Usage: npx tsx src/cron/worker.ts      (requires DATABASE_URL + ALO_CRON_SECRET is not needed here)
 */

import { db } from '@/lib/db';
import { createCronRunnerDeps, logCronEvent, runCronJob } from '@/lib/cron/job-runner';
import { getRegisteredJob, toRuntimeJob } from '@/lib/cron/job-registry';
import { parseCronExpression } from '@/lib/cron/parse-cron';
import { CRON_JOBS } from './cron-definitions';

const TICK_MS = 60_000;
const SKIP_IF_RUN_WITHIN_MS = 55_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Last time this process fired a job, so one tick cannot run it twice. */
const lastFiredAt = new Map<string, number>();

/** True when the job's schedule last fired inside the current minute. */
export function isDue(cronExpression: string, timezone: string, now: Date): boolean {
  try {
    const reference = new Date(now.getTime() + 1000);
    const previous = parseCronExpression(cronExpression, timezone, reference).prev().toDate();
    return now.getTime() - previous.getTime() < TICK_MS;
  } catch {
    return false;
  }
}

async function tick(now: Date): Promise<void> {
  for (const definition of CRON_JOBS) {
    if (!definition.enabled) continue;
    if (!isDue(definition.cronExpression, definition.timezone, now)) continue;

    const firedAt = lastFiredAt.get(definition.id) ?? 0;
    if (now.getTime() - firedAt < SKIP_IF_RUN_WITHIN_MS) continue;

    const entry = getRegisteredJob(definition.id) ?? getRegisteredJob(definition.route.replace('/api/cron/', ''));
    if (!entry) {
      logCronEvent({
        level: 'warn',
        job: definition.id,
        op: 'dispatch',
        status: 'no_registry_entry',
        message: 'skip: declared job has no registry entry',
      });
      continue;
    }
    if (entry.disposition !== 'job') {
      logCronEvent({
        level: 'warn',
        job: definition.id,
        op: 'dispatch',
        status: entry.disposition,
        message: entry.reason,
      });
      continue;
    }

    lastFiredAt.set(definition.id, now.getTime());
    const result = await runCronJob(toRuntimeJob(entry), createCronRunnerDeps(db));
    if (result.status !== 'ran' && result.status !== 'skipped_locked') {
      logCronEvent({
        level: 'error',
        job: definition.id,
        op: 'dispatch',
        status: result.status,
        error: result.error ?? result.blockedReason,
      });
    }
  }
}

async function main(): Promise<void> {
  const deps = createCronRunnerDeps(db);
  logCronEvent({
    level: 'info',
    op: 'worker.start',
    jobs: CRON_JOBS.length,
    owner: deps.ownerId,
    message: 'ALO Education scheduler started (Asia/Dhaka, CronLock leases)',
  });

  CRON_JOBS.forEach((job) =>
    logCronEvent({
      level: 'info',
      job: job.id,
      op: 'worker.definition',
      schedule: job.cronExpression,
      timezone: job.timezone,
      lockTtlMinutes: job.lockTtlMinutes,
      enabled: job.enabled,
    }),
  );

  let stopping = false;
  const stop = (signal: string) => {
    if (stopping) return;
    stopping = true;
    logCronEvent({ level: 'info', op: 'worker.stop', signal });
    process.exit(0);
  };
  process.on('SIGTERM', () => stop('SIGTERM'));
  process.on('SIGINT', () => stop('SIGINT'));

  while (!stopping) {
    const now = new Date();
    try {
      await tick(now);
    } catch (error) {
      logCronEvent({
        level: 'error',
        op: 'worker.tick',
        error: error instanceof Error ? error.message : String(error),
      });
    }
    await delay(TICK_MS);
  }
}

// Only start the loop when executed directly (never on import, so tests and the
// HTTP dispatcher can reuse the module safely).
const invokedDirectly =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  /worker\.(ts|js|mts|cts)$/.test(process.argv[1] ?? '') &&
  process.env.ALO_CRON_WORKER !== 'off';

if (invokedDirectly) {
  main().catch((error) => {
    logCronEvent({
      level: 'error',
      op: 'worker.crash',
      error: error instanceof Error ? error.message : String(error),
    });
    process.exit(1);
  });
}
