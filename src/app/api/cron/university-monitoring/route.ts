// ============================================================
// ALO Education — 7-Day University & Official Data Monitoring Cron
// ============================================================
//
// This is the scheduled entry point for the
// "ALO University & Official Data Monitoring Agent".
//
// Before this route existed the agent had no scheduler at all:
// /api/cron/weekly-university-scan returned 503 DISABLED, and the only way to
// start a cycle was a human clicking "Trigger" in the Super Admin UI.
//
// Call this every day from the platform scheduler (cPanel cron, Vercel cron,
// systemd timer, PM2 cron or a k8s CronJob). The 7-day cadence itself is
// enforced in the database via MonitoringJob.nextRunAt, NOT by the crontab
// line — so the schedule survives server restarts, app restarts, deployments
// and process restarts, and firing this endpoint more often than every 7 days
// is harmless (it returns NOT_DUE).
//
// Auth: scheduler secret (Authorization: Bearer $ALO_CRON_SECRET) or an
// authenticated Super Admin session. Never anonymous.

import { NextResponse } from 'next/server';
import { authorizeMonitoringRun } from '@/lib/university-monitoring-auth';
import { startMonitoringRun, isDue, ensureMonitoringJob } from '@/lib/university-monitoring-runner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function handle(req: Request) {
  const guard = await authorizeMonitoringRun(req);
  if (!guard.ok) return guard.response;

  const url = new URL(req.url);
  // `force=1` lets a Super Admin bypass the nextRunAt gate (the lock still applies).
  const force = url.searchParams.get('force') === '1' && guard.via === 'session';
  const scope = url.searchParams.get('scope') || 'verified-only';
  const limitParam = url.searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 50, 1), 500) : undefined;

  await ensureMonitoringJob();

  const result = await startMonitoringRun({
    trigger: guard.via === 'secret' ? 'SCHEDULER' : 'MANUAL',
    actorId: guard.actor?.userId ?? null,
    actorLabel: guard.actor?.email ?? 'platform-scheduler',
    scope,
    limit,
    force,
  });

  switch (result.status) {
    case 'DISABLED': {
      const job = await ensureMonitoringJob();
      return NextResponse.json(
        { success: true, status: 'DISABLED', message: 'Monitoring job is disabled.', nextRunAt: job.nextRunAt },
        { status: 200 },
      );
    }
    case 'NOT_DUE':
      return NextResponse.json({
        success: true,
        status: 'NOT_DUE',
        message: 'Not due yet — the 7-day interval has not elapsed.',
        nextRunAt: result.nextRunAt,
      });
    case 'LOCKED':
      // 409 so an over-eager scheduler can distinguish "already running".
      return NextResponse.json(
        {
          success: false,
          status: 'LOCKED',
          message: 'A monitoring run is already in progress; duplicate execution prevented.',
          lockedBy: result.lockedBy,
          lockExpiresAt: result.lockExpiresAt,
        },
        { status: 409 },
      );
    case 'FAILED':
      return NextResponse.json(
        { success: false, status: 'FAILED', runId: result.runId, runKey: result.runKey, error: result.error },
        { status: 500 },
      );
    default:
      return NextResponse.json({
        success: true,
        status: result.status,
        runId: result.runId,
        runKey: result.runKey,
        ...result.counts,
        aiReportSummary: result.aiReportSummary,
      });
  }
}

export async function GET(req: Request) {
  return handle(req);
}

export async function POST(req: Request) {
  return handle(req);
}

/** Lightweight status probe for the dashboard widget / uptime checks. */
export async function HEAD(req: Request) {
  const guard = await authorizeMonitoringRun(req);
  if (!guard.ok) return new NextResponse(null, { status: guard.response.status });
  const due = await isDue();
  return new NextResponse(null, {
    status: 200,
    headers: {
      'x-monitoring-due': String(due.due),
      'x-monitoring-enabled': String(due.enabled),
      'x-monitoring-next-run': due.nextRunAt ? due.nextRunAt.toISOString() : '',
    },
  });
}
