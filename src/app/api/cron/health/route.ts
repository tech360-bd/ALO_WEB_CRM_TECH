import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSafeDatabaseErrorCode } from '@/lib/safe-db-error';
import { requireCron } from '@/lib/cron-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  const denied = await requireCron(req);
  if (denied) return denied;

  const checks: {
    timestamp: string;
    database: 'unknown' | 'healthy' | 'unavailable';
    databaseErrorCode?: string;
    metrics: 'not_checked' | 'healthy' | 'unavailable';
    metricsErrorCode?: string;
    whatsappNumbers: number | null;
    slaOverdue: number | null;
    followUpPending: number | null;
    retryQueue: number | null;
    webhookEvents: number | null;
    recentCrons: Array<{
      id: string;
      jobName: string;
      status: string;
      startedAt: Date;
      finishedAt: Date | null;
      durationMs: number;
    }> | null;
  } = {
    timestamp: new Date().toISOString(),
    database: 'unknown',
    metrics: 'not_checked',
    whatsappNumbers: null,
    slaOverdue: null,
    followUpPending: null,
    retryQueue: null,
    webhookEvents: null,
    recentCrons: null,
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (error) {
    checks.database = 'unavailable';
    checks.databaseErrorCode = getSafeDatabaseErrorCode(error);
    console.error('[cron-health] Database readiness probe failed.', { code: checks.databaseErrorCode });
  }

  if (checks.database === 'healthy') {
    try {
      checks.whatsappNumbers = await db.whatsAppOfficialNumber.count();
      checks.slaOverdue = await db.communicationThread.count({
        where: { slaDueAt: { lt: new Date() }, status: { not: 'resolved' } },
      });
      checks.followUpPending = await db.whatsAppFollowUpSchedule.count({
        where: { status: 'scheduled' },
      });
      checks.retryQueue = await db.whatsAppRetryQueue.count({
        where: { status: { in: ['pending', 'retrying'] } },
      });
      checks.webhookEvents = await db.webhookEvent.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
      checks.recentCrons = await db.cronJobLog.findMany({
        select: {
          id: true,
          jobName: true,
          status: true,
          startedAt: true,
          finishedAt: true,
          durationMs: true,
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      });
      checks.metrics = 'healthy';
    } catch (error) {
      checks.metrics = 'unavailable';
      checks.metricsErrorCode = getSafeDatabaseErrorCode(error);
      console.error('[cron-health] Operational metrics query failed.', { code: checks.metricsErrorCode });
    }
  }

  const healthy = checks.database === 'healthy' && checks.metrics === 'healthy';
  return NextResponse.json(
    {
      success: healthy,
      status: healthy ? 'healthy' : 'degraded',
      checks,
    },
    {
      status: healthy ? 200 : 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    },
  );
}
