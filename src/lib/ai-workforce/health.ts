/**
 * ALO AI Workforce — health monitor and failure recovery (§20, §29).
 *
 * The monitor reports what is actually true of the installation: which
 * runtimes exist, which are reachable, how deep the queues are, and whether
 * any run is stuck. Recovery is explicit and audited — stuck runs are closed
 * as TIMED_OUT (never left RUNNING for ever, never silently deleted), and
 * failed events are re-queued with a bounded attempt count.
 */
import { db } from '@/lib/db';
import { writeAudit } from './audit';
import { detectRuntimes, probeRuntime, queueDepth, syncRuntimes } from './runtimes';
import { listDeterministicTasks } from './deterministic-engine';

export interface RuntimeHealth {
  runtimeKey: string;
  name: string;
  tier: number;
  kind: string;
  status: string;
  enabled: boolean;
  isPaidService: boolean;
  requiresApiKey: boolean;
  queueDepth: number;
  maxConcurrency: number;
  avgLatencyMs: number;
  successCount: number;
  failureCount: number;
  consecutiveFailures: number;
  lastError: string;
  lastCheckedAt: string | null;
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  database: { reachable: boolean; latencyMs: number; error?: string };
  runtimes: RuntimeHealth[];
  executableRuntimes: number;
  deterministicTasks: number;
  /** True when at least one runtime can serve every supported task. */
  canServeAllTasks: boolean;
  queues: { totalQueued: number; runningRuns: number; stuckRuns: number };
  pendingApprovals: number;
  failedEvents: number;
  paidDependency: boolean;
  notes: string[];
  checkedAt: string;
}

const STUCK_RUN_MS = 10 * 60 * 1000;

export async function systemHealth(options: { probe?: boolean } = {}): Promise<SystemHealth> {
  const notes: string[] = [];
  const startedDb = Date.now();
  let dbReachable = true;
  let dbError: string | undefined;
  try {
    await db.awfModelRuntime.count();
  } catch (error) {
    dbReachable = false;
    dbError = error instanceof Error ? error.message : 'database unreachable';
  }
  const dbLatency = Date.now() - startedDb;

  let rows: Awaited<ReturnType<typeof db.awfModelRuntime.findMany>> = [];
  if (dbReachable) {
    await syncRuntimes().catch(() => undefined);
    rows = await db.awfModelRuntime.findMany({ orderBy: [{ tier: 'asc' }] });
  }

  if (options.probe && dbReachable) {
    for (const runtime of detectRuntimes()) {
      await probeRuntime(runtime).catch(() => undefined);
    }
    rows = await db.awfModelRuntime.findMany({ orderBy: [{ tier: 'asc' }] });
  }

  const runtimes: RuntimeHealth[] = rows.map((row) => ({
    runtimeKey: row.runtimeKey,
    name: row.name,
    tier: row.tier,
    kind: row.kind,
    status: row.status,
    enabled: row.enabled,
    isPaidService: row.isPaidService,
    requiresApiKey: row.requiresApiKey,
    queueDepth: queueDepth(row.runtimeKey),
    maxConcurrency: row.maxConcurrency,
    avgLatencyMs: row.avgLatencyMs,
    successCount: row.successCount,
    failureCount: row.failureCount,
    consecutiveFailures: row.consecutiveFailures,
    lastError: row.lastError,
    lastCheckedAt: row.lastCheckedAt ? row.lastCheckedAt.toISOString() : null,
  }));

  const executable = runtimes.filter((runtime) => runtime.enabled && ['HEALTHY', 'UNKNOWN', 'DEGRADED'].includes(runtime.status));
  const deterministicAvailable = runtimes.some((runtime) => runtime.kind === 'DETERMINISTIC' && runtime.enabled);
  if (!deterministicAvailable) notes.push('the ALO deterministic terminal runtime is not registered; workflows could fail with no fallback');

  const paidDependency = runtimes.some((runtime) => runtime.isPaidService && runtime.enabled && runtime.tier === 1);
  if (paidDependency) notes.push('a paid runtime is registered at tier 1; ALO does not require this and it can be disabled');

  const [runningRuns, stuckRuns, pendingApprovals, failedEvents] = dbReachable
    ? await Promise.all([
        db.awfRun.count({ where: { status: { in: ['RUNNING', 'QUEUED'] } } }),
        db.awfRun.count({ where: { status: { in: ['RUNNING', 'QUEUED'] }, startedAt: { lt: new Date(Date.now() - STUCK_RUN_MS) } } }),
        db.awfApproval.count({ where: { status: 'PENDING' } }),
        db.awfEvent.count({ where: { status: 'FAILED' } }),
      ])
    : [0, 0, 0, 0];

  if (stuckRuns > 0) notes.push(`${stuckRuns} run(s) have exceeded the ${STUCK_RUN_MS / 60000}-minute execution window and need recovery`);

  const status: SystemHealth['status'] = !dbReachable
    ? 'UNHEALTHY'
    : !deterministicAvailable || stuckRuns > 0 || executable.length === 0
      ? 'DEGRADED'
      : 'HEALTHY';

  return {
    status,
    database: { reachable: dbReachable, latencyMs: dbLatency, error: dbError },
    runtimes,
    executableRuntimes: executable.length,
    deterministicTasks: listDeterministicTasks().length,
    canServeAllTasks: deterministicAvailable,
    queues: { totalQueued: runtimes.reduce((sum, runtime) => sum + runtime.queueDepth, 0), runningRuns, stuckRuns },
    pendingApprovals,
    failedEvents,
    paidDependency,
    notes,
    checkedAt: new Date().toISOString(),
  };
}

export interface RecoveryResult {
  timedOutRuns: number;
  requeuedEvents: number;
  expiredApprovals: number;
  purgedMemory: number;
}

/** Idempotent recovery sweep. Safe to run from a cron trigger. */
export async function recoverFailures(): Promise<RecoveryResult> {
  const cutoff = new Date(Date.now() - STUCK_RUN_MS);
  const stuck = await db.awfRun.findMany({
    where: { status: { in: ['RUNNING', 'QUEUED'] }, startedAt: { lt: cutoff } },
    select: { id: true, runCode: true },
    take: 200,
  });
  for (const run of stuck) {
    await db.awfRun.update({
      where: { id: run.id },
      data: {
        status: 'TIMED_OUT',
        errorMessage: 'run exceeded the maximum execution window and was closed by the health monitor',
        errorCategory: 'TIMEOUT',
        endedAt: new Date(),
        automationMode: 'ESCALATED',
      },
    });
    await writeAudit({
      actor: null,
      action: 'RUN_RECOVERED',
      objectType: 'AwfRun',
      objectId: run.id,
      after: { runCode: run.runCode, newStatus: 'TIMED_OUT' },
      result: 'FAILED',
      reason: 'stuck run closed by the health monitor',
    });
  }

  // Failed events become retryable again (bounded to 3 attempts) so no task is lost.
  const requeued = await db.awfEvent.updateMany({
    where: { status: 'FAILED', attempts: { lt: 3 } },
    data: { status: 'RECEIVED' },
  });

  const expired = await db.awfApproval.updateMany({
    where: { status: 'PENDING', expiresAt: { lt: new Date() } },
    data: { status: 'EXPIRED' },
  });

  const purged = await db.awfMemory.deleteMany({ where: { expiresAt: { not: null, lt: new Date() } } });

  return { timedOutRuns: stuck.length, requeuedEvents: requeued.count, expiredApprovals: expired.count, purgedMemory: purged.count };
}
