import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { requireMonitoringAdmin, requireMonitoringViewer } from '@/lib/university-monitoring-auth';
import { startMonitoringRun } from '@/lib/university-monitoring-runner';

// Backwards-compatible monitoring endpoint. It uses the same durable run
// orchestrator as /trigger and the scheduled cron; it is not a second scanner.
export async function GET(request: Request) {
  const guard = await requireMonitoringViewer(request);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'dashboard';
  if (type === 'logs') {
    const logs = await db.monitoringLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ success: true, data: logs });
  }
  if (type !== 'dashboard') return NextResponse.json({ success: false, error: 'type must be dashboard or logs' }, { status: 400 });

  const job = await db.monitoringJob.findUnique({ where: { jobId: 'university-monitor-7d' } });
  const [sourcesTotal, verifiedActiveSources, pendingChanges, failedSources] = await Promise.all([
    db.officialSource.count(),
    db.officialSource.count({ where: { status: 'ACTIVE', monitoringEnabled: true, verificationStatus: { in: ['verified', 'VERIFIED'] } } }),
    db.dataChange.count({ where: { status: { in: ['PENDING', 'NEEDS_REVIEW', 'RECHECK_REQUESTED'] } } }),
    db.officialSource.count({ where: { consecutiveFailures: { gt: 0 } } }),
  ]);
  const lastRun = job?.lastRunId ? await db.verificationRun.findUnique({ where: { id: job.lastRunId } }) : null;
  const result = {
    totalSources: sourcesTotal,
    verifiedActiveSources,
    pendingChanges,
    failedSources,
    lastRun,
    schedule: job ? {
      enabled: job.enabled,
      nextRunAt: job.nextRunAt,
      lastRunStatus: job.lastRunStatus,
      lockedBy: job.lockedBy,
      lockExpiresAt: job.lockExpiresAt,
      totalRuns: job.totalRuns,
      successfulRuns: job.successfulRuns,
      failedRuns: job.failedRuns,
    } : null,
    monitoringState: verifiedActiveSources === 0 ? 'NEEDS_REVIEW' : lastRun?.status === 'RUNNING' ? 'RUNNING' : lastRun?.status === 'FAILED' || failedSources > 0 ? 'ERROR' : lastRun?.status === 'PARTIAL' ? 'NEEDS_REVIEW' : 'HEALTHY',
  };
  return NextResponse.json({ success: true, data: result });
}

export async function POST(request: Request) {
  const guard = await requireMonitoringAdmin(request);
  if (!guard.ok) return guard.response;
  if (!mutationOriginAllowed(request, guard.actor.auth)) {
    return NextResponse.json({ success: false, error: 'Cross-origin monitoring triggers are not allowed' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || body.action !== 'trigger_scan') {
    return NextResponse.json({ success: false, error: 'Only action "trigger_scan" is supported. Use /api/university-monitoring/trigger for the documented request contract.' }, { status: 400 });
  }
  const scope = typeof body.scope === 'string' ? body.scope : 'verified-only';
  const limit = typeof body.limit === 'number' ? Math.min(500, Math.max(1, Math.floor(body.limit))) : undefined;
  const result = await startMonitoringRun({
    trigger: 'MANUAL',
    actorId: guard.actor.userId,
    actorLabel: guard.actor.email,
    scope,
    limit,
    force: true,
  });
  if (result.status === 'LOCKED') {
    return NextResponse.json({ success: false, error: 'A monitoring run is already in progress', lockedBy: result.lockedBy, lockExpiresAt: result.lockExpiresAt }, { status: 409 });
  }
  if (result.status === 'DISABLED') return NextResponse.json({ success: false, error: 'Monitoring is disabled' }, { status: 409 });
  if (result.status === 'FAILED') return NextResponse.json({ success: false, error: result.error, runId: result.runId }, { status: 500 });
  if (result.status === 'NOT_DUE') return NextResponse.json({ success: true, status: result.status, nextRunAt: result.nextRunAt });
  return NextResponse.json({ success: true, scanId: result.runId, status: result.status, ...result.counts });
}
