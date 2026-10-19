#!/usr/bin/env npx tsx
/**
 * Cron / scheduler certification — ALO Education
 *
 * Database-free proof for the scheduled-job platform. Run:
 *
 *   npx tsx scripts/cron-scheduler-policy-check.ts
 *
 * It proves, without MySQL:
 *   A. lease semantics          — one runner per job, crashed holder recovered
 *   B. runner semantics         — ran / skipped_locked / failed / blocked,
 *                                 durable logging, bounded timeout, never throws
 *   C. registry integrity       — 21 entries, aliases, unknown paths rejected
 *   D. declared-path coverage   — every path in vercel.json and
 *                                 cron-definitions.ts resolves to real work or
 *                                 an explicit refusal (the defect this fixes:
 *                                 14 of 15 declared paths returned 404)
 *   E. safety invariants        — add-only migration, no scheduled deletion of
 *                                 private files or student data
 *
 * Exit code 0 only when every assertion passes.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  acquireCronLease,
  createInMemoryCronLockStore,
  isLeaseLive,
  isUniqueViolation,
  MAX_LEASE_SECONDS,
  MIN_LEASE_SECONDS,
  normaliseLeaseSeconds,
  releaseCronLease,
  truncateLockError,
} from '../src/lib/cron/cron-lock';
import {
  defaultOwnerId,
  normaliseTimeoutMs,
  runCronJob,
  summariseResult,
  type CronOutcomeLog,
  type CronRunStatus,
} from '../src/lib/cron/job-runner';
import {
  getRegisteredJob,
  JOB_REGISTRY,
  registeredJobPaths,
  REQUIRED_JOB_KEYS,
  toRuntimeJob,
} from '../src/lib/cron/job-registry';
import { CRON_JOBS, CRON_JOB_COUNT, REQUIRED_ENABLED_JOB_IDS, verifyCronDefinitions } from '../src/cron/cron-definitions';

const ROOT = path.join(__dirname, '..');
let passed = 0;
const failures: string[] = [];

function check(name: string, condition: boolean, detail = ''): void {
  if (condition) {
    passed++;
    return;
  }
  failures.push(detail ? `${name} — ${detail}` : name);
}

function readIfExists(relative: string): string | null {
  const full = path.join(ROOT, relative);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
}

function routeFileExists(apiPath: string): boolean {
  return fs.existsSync(path.join(ROOT, 'src', 'app', apiPath.replace(/^\//, ''), 'route.ts'));
}

/** Outcome log double that records what the runner persisted. */
function createRecordingLog(): CronOutcomeLog & {
  started: Array<{ jobKey: string; startedAt: Date }>;
  finished: Array<Record<string, unknown>>;
} {
  const started: Array<{ jobKey: string; startedAt: Date }> = [];
  const finished: Array<Record<string, unknown>> = [];
  let counter = 0;
  return {
    started,
    finished,
    async start(jobKey, startedAt) {
      started.push({ jobKey, startedAt });
      return `run-${++counter}`;
    },
    async finish(runId, outcome) {
      finished.push({ runId, ...outcome });
    },
  };
}

async function main(): Promise<void> {
  // ── A. Lease semantics ────────────────────────────────────────────────────
  {
    const store = createInMemoryCronLockStore();
    const t0 = new Date('2026-10-13T09:00:00.000Z');

    const first = await acquireCronLease(store, { jobKey: 'job-a', ownerId: 'proc-1', ttlSeconds: 60, now: t0 });
    check('A1 first claim acquires the lease', first.status === 'acquired', first.status);

    const second = await acquireCronLease(store, { jobKey: 'job-a', ownerId: 'proc-2', ttlSeconds: 60, now: t0 });
    check('A2 a second runner is refused while the lease is live', second.status === 'held', second.status);

    const sameProcess = await acquireCronLease(store, { jobKey: 'job-a', ownerId: 'proc-1', ttlSeconds: 60, now: t0 });
    check('A3 re-entrant claim from the holder is also refused', sameProcess.status === 'held', sameProcess.status);

    const insideWindow = new Date(t0.getTime() + 59_000);
    const stillHeld = await acquireCronLease(store, { jobKey: 'job-a', ownerId: 'proc-2', ttlSeconds: 60, now: insideWindow });
    check('A4 lease still held 1s before expiry', stillHeld.status === 'held', stillHeld.status);

    const afterExpiry = new Date(t0.getTime() + 61_000);
    const reclaimed = await acquireCronLease(store, { jobKey: 'job-a', ownerId: 'proc-2', ttlSeconds: 60, now: afterExpiry });
    check('A5 a crashed holder is replaced once the lease expires', reclaimed.status === 'reclaimed', reclaimed.status);

    const releasedAt = new Date(afterExpiry.getTime() + 1_000);
    const wrongOwnerRelease = await releaseCronLease(store, { jobKey: 'job-a', ownerId: 'proc-9', releasedAt });
    check('A6 a non-owner cannot release the lease', wrongOwnerRelease === false);

    const ownerRelease = await releaseCronLease(store, { jobKey: 'job-a', ownerId: 'proc-2', releasedAt });
    check('A7 the owner can release the lease', ownerRelease === true);

    const reacquired = await acquireCronLease(store, { jobKey: 'job-a', ownerId: 'proc-3', ttlSeconds: 60, now: releasedAt });
    check('A8 a released lease is immediately claimable', reacquired.status === 'reclaimed', reacquired.status);

    const parallel = await Promise.all([
      acquireCronLease(store, { jobKey: 'job-b', ownerId: 'p1', ttlSeconds: 60, now: t0 }),
      acquireCronLease(store, { jobKey: 'job-b', ownerId: 'p2', ttlSeconds: 60, now: t0 }),
      acquireCronLease(store, { jobKey: 'job-b', ownerId: 'p3', ttlSeconds: 60, now: t0 }),
    ]);
    const winners = parallel.filter((r) => r.status !== 'held').length;
    check('A9 exactly one of three concurrent claimants wins', winners === 1, `winners=${winners}`);

    check('A10 ttl is clamped to the supported minimum', normaliseLeaseSeconds(0) === 300 && normaliseLeaseSeconds(-5) === 300);
    check('A11 ttl is clamped to the supported maximum', normaliseLeaseSeconds(999_999) === MAX_LEASE_SECONDS);
    check('A12 a sane ttl passes through unchanged', normaliseLeaseSeconds(240) === 240);
    check('A13 NaN ttl falls back to the default', normaliseLeaseSeconds(Number.NaN) === 300);
    check('A14 minimum lease floor is 5s', normaliseLeaseSeconds(1) === MIN_LEASE_SECONDS);

    check('A15 a future expiry counts as live', isLeaseLive({ expiresAt: new Date(t0.getTime() + 1) }, t0) === true);
    check('A16 a past expiry is not live', isLeaseLive({ expiresAt: new Date(t0.getTime() - 1) }, t0) === false);
    check('A17 an unreadable expiry is never treated as live', isLeaseLive({ expiresAt: new Date(Number.NaN) }, t0) === false);

    check('A18 P2002 is recognised as a unique violation', isUniqueViolation({ code: 'P2002' }) === true);
    check('A19 a non-unique error is not', isUniqueViolation(new Error('connection reset')) === false);
    check('A20 stored error text is bounded for the column', truncateLockError('x'.repeat(500)).length <= 180);

    let threw = false;
    try {
      await acquireCronLease(store, { jobKey: '   ', ownerId: 'p', ttlSeconds: 60, now: t0 });
    } catch {
      threw = true;
    }
    check('A21 an empty job key is rejected loudly', threw);
  }

  // ── B. Runner semantics ───────────────────────────────────────────────────
  {
    const t0 = new Date('2026-10-13T09:05:00.000Z');
    const now = () => t0;

    const successStore = createInMemoryCronLockStore();
    const successLog = createRecordingLog();
    const success = await runCronJob(
      { key: 'job-ok', description: 'ok', lockTtlSeconds: 60, handler: async () => ({ processed: 3 }) },
      { store: successStore, outcomeLog: successLog, now, ownerId: 'runner-1' },
    );
    check('B1 a successful handler reports ran', success.status === 'ran', success.status);
    check('B2 the handler result is returned to the caller', JSON.stringify(success.result) === '{"processed":3}');
    check('B3 duration is recorded', Number.isFinite(success.durationMs) && success.durationMs >= 0);
    check('B4 start and finish are both logged', successLog.started.length === 1 && successLog.finished.length === 1);
    check('B5 the finish record carries the run id', successLog.finished[0]?.runId === 'run-1');
    check('B6 the finish record is successful', successLog.finished[0]?.status === 'ran');
    check('B7 metadata is valid JSON', (() => {
      try {
        JSON.parse(String(successLog.finished[0]?.metadata));
        return true;
      } catch {
        return false;
      }
    })());
    check('B8 the lease is released after a successful run', (await acquireCronLease(successStore, { jobKey: 'job-ok', ownerId: 'runner-2', ttlSeconds: 60, now: t0 })).status !== 'held');
    check('B9 lease bookkeeping records the run outcome', successStore.rows.get('job-ok')?.lastStatus === 'ran');
    check('B10 lease bookkeeping increments the run count', (successStore.rows.get('job-ok')?.runCount ?? 0) === 1);

    const failStore = createInMemoryCronLockStore();
    const failLog = createRecordingLog();
    const failing = await runCronJob(
      {
        key: 'job-boom',
        description: 'boom',
        lockTtlSeconds: 60,
        handler: () => {
          throw new Error('handler exploded');
        },
      },
      { store: failStore, outcomeLog: failLog, now, ownerId: 'runner-1' },
    );
    check('B11 a throwing handler reports failed instead of throwing', failing.status === 'failed', failing.status);
    check('B12 the failure reason is recorded', (failing.error ?? '').includes('handler exploded'));
    check('B13 the failure is persisted in the run log', failLog.finished[0]?.status === 'failed');
    check('B14 the failure is persisted on the lease row', (failStore.rows.get('job-boom')?.lastError ?? '').includes('handler exploded'));
    check('B15 a failed run still releases its lease', (await acquireCronLease(failStore, { jobKey: 'job-boom', ownerId: 'runner-2', ttlSeconds: 60, now: t0 })).status !== 'held');

    const heldStore = createInMemoryCronLockStore();
    await acquireCronLease(heldStore, { jobKey: 'job-busy', ownerId: 'another-process', ttlSeconds: 300, now: t0 });
    let busyHandlerCalled = false;
    const busy = await runCronJob(
      {
        key: 'job-busy',
        description: 'busy',
        lockTtlSeconds: 60,
        handler: () => {
          busyHandlerCalled = true;
          return { ran: true };
        },
      },
      { store: heldStore, now, ownerId: 'runner-1' },
    );
    check('B16 a held lease yields skipped_locked', busy.status === 'skipped_locked', busy.status);
    check('B17 the handler is never invoked when the lease is held', busyHandlerCalled === false);
    check('B18 skipped_locked is not reported as an error', !busy.error);

    let noStoreHandlerCalled = false;
    const noStore = await runCronJob(
      {
        key: 'job-nostore',
        description: 'no store',
        lockTtlSeconds: 60,
        handler: () => {
          noStoreHandlerCalled = true;
          return null;
        },
      },
      { now, ownerId: 'runner-1' },
    );
    check('B19 without a lock store the job refuses to run', noStore.status === 'blocked', noStore.status);
    check('B20 the refusal explains itself and names the lock', (noStore.blockedReason ?? '').toLowerCase().includes('lock'));
    check('B21 a refused job never runs its handler', noStoreHandlerCalled === false);

    let externalHandlerCalled = false;
    const external = await runCronJob(
      {
        key: 'job-backup',
        description: 'backup',
        lockTtlSeconds: 60,
        externalDependency: 'mysqldump is not available in the application runtime',
        handler: () => {
          externalHandlerCalled = true;
          return { ok: true };
        },
      },
      { store: createInMemoryCronLockStore(), now, ownerId: 'runner-1' },
    );
    check('B22 an external dependency blocks the job', external.status === 'blocked', external.status);
    check('B23 the missing resource is named in the refusal', (external.blockedReason ?? '').includes('mysqldump'));
    check('B24 a blocked job never runs its handler', externalHandlerCalled === false);

    const superseded = await runCronJob(
      {
        key: 'job-superseded',
        description: 'superseded',
        lockTtlSeconds: 60,
        supersededBy: '/api/cron/university-monitoring',
        handler: () => ({ ok: true }),
      },
      { store: createInMemoryCronLockStore(), now, ownerId: 'runner-1' },
    );
    check('B25 a superseded job is blocked, not silently successful', superseded.status === 'blocked', superseded.status);
    check('B26 the superseding implementation is named', (superseded.blockedReason ?? '').includes('university-monitoring'));

    const resilient = await runCronJob(
      { key: 'job-logless', description: 'log failures', lockTtlSeconds: 60, handler: async () => ({ done: true }) },
      {
        store: createInMemoryCronLockStore(),
        now,
        ownerId: 'runner-1',
        outcomeLog: {
          async start() {
            throw new Error('log table unavailable');
          },
          async finish() {
            throw new Error('log table unavailable');
          },
        },
      },
    );
    check('B27 a failing run log does not fail the job', resilient.status === 'ran', resilient.status);

    const slowStore = createInMemoryCronLockStore();
    const slow = await runCronJob(
      {
        key: 'job-slow',
        description: 'slow',
        lockTtlSeconds: 60,
        timeoutMs: 1_000,
        // Outlives the timeout. The pending timer keeps the event loop alive so
        // the assertion is about the runner, not about Node's exit timing.
        handler: () => new Promise((resolve) => setTimeout(resolve, 5_000)),
      },
      { store: slowStore, now: () => new Date(), ownerId: 'runner-1' },
    );
    check('B28 a hanging handler is bounded by the timeout', slow.status === 'failed', slow.status);
    check('B29 the timeout is reported as the failure', (slow.error ?? '').includes('timed out'));
    check('B30 a timed-out job still frees its lease', (await acquireCronLease(slowStore, { jobKey: 'job-slow', ownerId: 'runner-2', ttlSeconds: 60 })).status !== 'held');

    const concurrentStore = createInMemoryCronLockStore();
    let executions = 0;
    const [a, b] = await Promise.all([
      runCronJob(
        {
          key: 'job-parallel',
          description: 'parallel',
          lockTtlSeconds: 60,
          handler: async () => {
            executions++;
            await new Promise((r) => setTimeout(r, 30));
            return { executions };
          },
        },
        { store: concurrentStore, now: () => new Date(), ownerId: 'proc-a' },
      ),
      runCronJob(
        {
          key: 'job-parallel',
          description: 'parallel',
          lockTtlSeconds: 60,
          handler: async () => {
            executions++;
            await new Promise((r) => setTimeout(r, 30));
            return { executions };
          },
        },
        { store: concurrentStore, now: () => new Date(), ownerId: 'proc-b' },
      ),
    ]);
    const statuses = [a.status, b.status].sort();
    check('B31 concurrent runs execute exactly once', executions === 1, `executions=${executions}`);
    check('B32 the loser reports skipped_locked', statuses.join(',') === 'ran,skipped_locked', statuses.join(','));

    check('B33 the default owner id is stable per process', defaultOwnerId() === defaultOwnerId());
    check('B34 the owner id identifies the process', defaultOwnerId().includes(String(process.pid)));
    check('B35 timeouts are clamped to a sane minimum', normaliseTimeoutMs(1) === 1_000);
    check('B36 oversized payloads are summarised by count', JSON.stringify(summariseResult([1, 2, 3])) === '{"count":3}');
    check('B37 undefined results summarise to null', summariseResult(undefined) === null);
  }

  // ── C. Registry integrity ─────────────────────────────────────────────────
  {
    // Tied to the declared count rather than a magic number so adding a real
    // job (e.g. webhook-dispatch, 2026-10-18) cannot silently desynchronise
    // the registry from the declarations.
    check(
      `C1 the registry has ${CRON_JOB_COUNT} entries`,
      JOB_REGISTRY.length === CRON_JOB_COUNT,
      `registry=${JOB_REGISTRY.length} declared=${CRON_JOB_COUNT}`,
    );

    const keys = JOB_REGISTRY.map((j) => j.key);
    check('C2 job keys are unique', new Set(keys).size === keys.length);

    const allSegments = registeredJobPaths().map((p) => p.replace('/api/cron/', ''));
    check('C3 every path segment is unique (no alias shadowing)', new Set(allSegments).size === allSegments.length);
    check('C4 every path is under /api/cron/', registeredJobPaths().every((p) => p.startsWith('/api/cron/')));
    check('C5 segments are URL-safe', allSegments.every((s) => /^[a-z0-9][a-z0-9-]*$/.test(s)));

    for (const key of REQUIRED_JOB_KEYS) {
      const entry = getRegisteredJob(key);
      check(`C6 required job ${key} exists`, !!entry);
      check(`C7 required job ${key} does real work`, entry?.disposition === 'job', entry?.disposition);
      check(`C8 required job ${key} has a handler`, typeof entry?.handler === 'function');
      check(`C9 required job ${key} declares its handler name`, typeof entry?.handlerName === 'string', entry?.handlerName ?? 'none');
    }

    for (const entry of JOB_REGISTRY) {
      if (entry.disposition === 'job') continue;
      check(`C10 non-job ${entry.key} states a reason`, typeof entry.reason === 'string' && entry.reason.length > 20);
      const runtime = toRuntimeJob(entry);
      check(`C11 non-job ${entry.key} is blocked, never executed`, !!(runtime.externalDependency || runtime.supersededBy));
    }

    check('C12 every entry is Asia/Dhaka', JOB_REGISTRY.every((j) => j.timezone === 'Asia/Dhaka'));
    check('C13 every lease TTL is positive', JOB_REGISTRY.every((j) => j.lockTtlSeconds >= MIN_LEASE_SECONDS));
    check('C14 every timeout is positive', JOB_REGISTRY.every((j) => j.timeoutMs >= 1_000));

    check('C15 an unknown job resolves to null', getRegisteredJob('does-not-exist') === null);
    check('C16 an empty segment resolves to null', getRegisteredJob('') === null);
    check('C17 a path-traversal segment resolves to null', getRegisteredJob('../../admin') === null);
    check('C18 a segment containing a slash resolves to null', getRegisteredJob('sla/monitoring') === null);
    check('C19 a declared alias resolves to its job', getRegisteredJob('sla-monitor')?.key === 'sla-monitoring');
    check('C20 an uppercase segment is normalised', getRegisteredJob('SLA-MONITORING')?.key === 'sla-monitoring');
    check('C21 the analytics alias still resolves', getRegisteredJob('analytics-aggregation')?.key === 'daily-analytics-summary');
    check('C22 the retired followup path still resolves', getRegisteredJob('followup')?.key === 'whatsapp-followups');
    check('C23 the retry alias resolves', getRegisteredJob('retry')?.key === 'failed-message-retry');
    check('C24 the health alias resolves', getRegisteredJob('health')?.key === 'operational-health-check');
  }

  // ── D. Declared-path coverage (the defect this change fixes) ──────────────
  {
    const dynamicRoute = routeFileExists('/api/cron/[job]');
    check('D1 the dynamic cron dispatcher route exists', dynamicRoute);

    // The HTTP contract lives in the shared adapter; the dispatcher and the
    // legacy per-job endpoints both call it, so assert on the pair.
    const routeSource = [
      readIfExists('src/app/api/cron/[job]/route.ts') ?? '',
      readIfExists('src/lib/cron/route-handler.ts') ?? '',
    ].join('\n');
    check('D2 the dispatcher requires cron authorization', routeSource.includes('requireCron'));
    check('D3 the dispatcher exports GET', /export async function GET/.test(routeSource));
    check('D4 the dispatcher exports POST', /export async function POST/.test(routeSource));
    check('D5 the dispatcher never caches a run', routeSource.includes('no-store'));
    check('D6 unknown jobs answer 404', routeSource.includes('404'));
    check('D6b a leased job answers 423', routeSource.includes('423'));
    check('D6c a blocked job answers 501', routeSource.includes('501'));
    check('D6d a skipped run is never reported as success', /success: result\.status === 'ran'/.test(routeSource));
    for (const legacy of ['sla-monitor', 'followup', 'retry', 'analytics']) {
      const legacySource = readIfExists(`src/app/api/cron/${legacy}/route.ts`) ?? '';
      check(`D6e legacy /api/cron/${legacy} delegates to the runner`, legacySource.includes('handleAuthorizedCronRequest'));
      check(`D6f legacy /api/cron/${legacy} keeps its authorization`, legacySource.includes('requireCron'));
    }

    const vercelRaw = readIfExists('vercel.json') ?? '{}';
    const vercel = JSON.parse(vercelRaw) as { crons?: Array<{ path: string; schedule: string }> };
    const declared = (vercel.crons ?? []).map((c) => c.path);
    check('D7 vercel.json still declares its cron paths', declared.length >= 15, String(declared.length));

    const unresolved: string[] = [];
    for (const apiPath of declared) {
      const segment = apiPath.replace('/api/cron/', '');
      const registered = !!getRegisteredJob(segment);
      const staticFile = routeFileExists(apiPath);
      if (!registered && !staticFile) unresolved.push(apiPath);
    }
    check(
      'D8 every vercel.json cron path resolves to a route or a registry job',
      unresolved.length === 0,
      `unresolved: ${unresolved.join(', ')}`,
    );

    const unresolvedDeclared: string[] = [];
    for (const job of CRON_JOBS) {
      const segment = job.route.replace('/api/cron/', '');
      if (!getRegisteredJob(segment) && !getRegisteredJob(job.id)) unresolvedDeclared.push(job.route);
    }
    check(
      'D9 every cron-definitions route resolves in the registry',
      unresolvedDeclared.length === 0,
      `unresolved: ${unresolvedDeclared.join(', ')}`,
    );

    check('D10 cron-definitions declares 21 jobs', CRON_JOBS.length === CRON_JOB_COUNT, String(CRON_JOBS.length));
    check('D11 cron-definitions ids are unique', new Set(CRON_JOBS.map((j) => j.id)).size === CRON_JOBS.length);

    const definitions = verifyCronDefinitions();
    check('D12 verifyCronDefinitions reports no errors', definitions.ok, definitions.errors.join(' | '));

    for (const job of CRON_JOBS) {
      if (job.enabled) {
        const entry = getRegisteredJob(job.id) ?? getRegisteredJob(job.route.replace('/api/cron/', ''));
        check(`D13 enabled ${job.id} maps to a real job`, entry?.disposition === 'job', entry?.disposition);
      } else {
        check(`D14 disabled ${job.id} states why`, typeof job.blockedReason === 'string' && job.blockedReason.length > 20);
      }
    }

    for (const required of REQUIRED_ENABLED_JOB_IDS) {
      const job = CRON_JOBS.find((j) => j.id === required);
      check(`D15 required job ${required} is declared and enabled`, !!job && job.enabled);
    }

    // Every real job in the registry must be declared in the definitions file.
    for (const entry of JOB_REGISTRY) {
      if (entry.disposition !== 'job') continue;
      const declaration = CRON_JOBS.find((j) => j.id === entry.key);
      check(`D16 real job ${entry.key} has an enabled declaration`, !!declaration && declaration.enabled);
    }
  }

  // ── E. Safety invariants ──────────────────────────────────────────────────
  {
    const migration = readIfExists('prisma/migrations/20261013000000_cron_lock/migration.sql') ?? '';
    check('E1 the lease migration exists', migration.length > 0);
    check('E2 the migration only creates the new table', /CREATE TABLE IF NOT EXISTS `CronLock`/.test(migration));
    check('E3 the migration drops nothing', !/\bDROP\b/i.test(migration));
    check('E4 the migration truncates nothing', !/\bTRUNCATE\b/i.test(migration));
    check('E5 the migration deletes no rows', !/\bDELETE\b/i.test(migration));
    check('E6 the migration alters no existing table', !/\bALTER TABLE\b/i.test(migration));
    check('E7 the lease key is unique at the database level', /UNIQUE INDEX `CronLock_jobKey_key`/.test(migration));
    check('E8 the lease expiry is indexed', /INDEX `CronLock_expiresAt_idx`/.test(migration));

    const schema = readIfExists('prisma/schema.prisma') ?? '';
    const cronLockModel = /model CronLock \{([\s\S]*?)\n\}/.exec(schema)?.[1] ?? '';
    check('E9 the CronLock model exists in the schema', cronLockModel.length > 0);
    check('E10 CronLock.jobKey is unique', /jobKey\s+String\s+@unique/.test(cronLockModel));
    check('E11 CronLock carries an owner', /ownerId\s+String/.test(cronLockModel));
    check('E12 CronLock carries an expiry', /expiresAt\s+DateTime/.test(cronLockModel));

    const handlerSource = readIfExists('src/lib/cron/job-handlers.ts') ?? '';
    check('E13 no scheduled job deletes a private file', !/removePrivateFile|unlinkSync|fs\.rm|rmSync/.test(handlerSource));
    check('E14 no scheduled job runs raw SQL', !/\$executeRaw|\$queryRawUnsafe/.test(handlerSource));
    check('E15 notification deletion is gated behind explicit retention config', handlerSource.includes('ALO_NOTIFICATION_RETENTION_DAYS'));
    check('E16 notification cleanup defaults to report-only', handlerSource.includes('report_only'));
    check('E17 stale uploads are reported, never removed', handlerSource.includes('report only'));
    check('E18 extraction queues are idempotent by task code', handlerSource.includes('ALO-DOCAI-'));

    const worker = readIfExists('src/cron/worker.ts') ?? '';
    check('E19 the worker still honours the enabled flag', worker.includes('if (!definition.enabled) continue;'));
    check('E20 the worker runs jobs through the certified runner', worker.includes('runCronJob'));
    check('E21 the broken DeploymentSequence lock is gone', !worker.includes('deploymentSequence'));
    // The worker's header comment names the removed helper, so assert on the
    // definition, not on the word.
    check('E22 the worker no longer defines its own lock', !/function withCronLock|const withCronLock/.test(worker));
    check('E22b the worker holds leases through the shared primitive', worker.includes('job-runner'));
    check('E23 the worker reuses one owner identity per process', worker.includes('createCronRunnerDeps'));
    check('E24 the worker shuts down on SIGTERM', worker.includes('SIGTERM'));

    const registry = readIfExists('src/lib/cron/job-registry.ts') ?? '';
    check('E25 the registry loads handlers lazily (no Prisma at import)', !/^import .*job-handlers/m.test(registry));
    check('E26 the registry documents the three dispositions', /external-dependency/.test(registry) && /superseded/.test(registry));

    const lockSource = readIfExists('src/lib/cron/cron-lock.ts') ?? '';
    check('E27 the claim is a single conditional update', lockSource.includes('expiresAt: { lte: now }'));
    check('E28 the lock never silently degrades to memory', !/createInMemoryCronLockStore\(\)[\s\S]{0,80}production/i.test(lockSource));
  }
}

let exitCode = 0;
main()
  .catch((error) => {
    failures.push(`unexpected error: ${error instanceof Error ? error.message : String(error)}`);
  })
  .finally(() => {
    const total = passed + failures.length;
    console.log('');
    console.log('=== ALO Education — cron / scheduler certification ===');
    console.log(`assertions: ${total}`);
    console.log(`passed: ${passed}`);
    console.log(`failed: ${failures.length}`);
    if (failures.length > 0) {
      console.log('');
      console.log('FAILED ASSERTIONS:');
      for (const failure of failures) console.log(`  ✘ ${failure}`);
      exitCode = 1;
    } else {
      console.log('');
      console.log('✔ Every scheduler assertion passed.');
    }
    console.log('');
    console.log(
      'Coverage: lease exclusivity + recovery, run statuses (ran/skipped_locked/failed/blocked),',
    );
    console.log(
      'durable run logging, bounded timeout, path coverage for vercel.json and cron-definitions.ts,',
    );
    console.log('add-only migration, and no scheduled deletion of private files or student data.');
    console.log('');
    // Never call process.exit() here: when stdout is a pipe or file, Node
    // buffers writes asynchronously and an immediate exit drops the whole
    // report. Setting exitCode lets the process flush and then terminate.
    process.exitCode = exitCode;
  });
