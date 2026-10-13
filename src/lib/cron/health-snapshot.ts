/**
 * Operational health snapshot — single implementation.
 *
 * Extracted from `src/app/api/cron/health/route.ts` so the HTTP probe and the
 * scheduled `operational-health-check` job can never disagree about what
 * "healthy" means. Read-only: it performs no writes.
 *
 * Error codes are passed through `getSafeDatabaseErrorCode` so a failure never
 * leaks connection strings, credentials or stack traces to a caller.
 */

import { db } from '@/lib/db';
import { getSafeDatabaseErrorCode } from '@/lib/safe-db-error';

export interface OperationalHealthSnapshot {
  timestamp: string;
  database: 'healthy' | 'unavailable';
  databaseErrorCode?: string;
  metrics: 'healthy' | 'unavailable';
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
}

export function isSnapshotHealthy(snapshot: OperationalHealthSnapshot): boolean {
  return snapshot.database === 'healthy' && snapshot.metrics === 'healthy';
}

export async function collectOperationalHealth(now: Date = new Date()): Promise<OperationalHealthSnapshot> {
  const snapshot: OperationalHealthSnapshot = {
    timestamp: now.toISOString(),
    database: 'unavailable',
    metrics: 'unavailable',
    whatsappNumbers: null,
    slaOverdue: null,
    followUpPending: null,
    retryQueue: null,
    webhookEvents: null,
    recentCrons: null,
  };

  try {
    await db.$queryRaw`SELECT 1`;
    snapshot.database = 'healthy';
  } catch (error) {
    snapshot.databaseErrorCode = getSafeDatabaseErrorCode(error);
    console.error('[health-snapshot] Database readiness probe failed.', {
      code: snapshot.databaseErrorCode,
    });
    return snapshot;
  }

  try {
    snapshot.whatsappNumbers = await db.whatsAppOfficialNumber.count();
    snapshot.slaOverdue = await db.communicationThread.count({
      where: { slaDueAt: { lt: now }, status: { not: 'resolved' } },
    });
    snapshot.followUpPending = await db.whatsAppFollowUpSchedule.count({
      where: { status: 'scheduled' },
    });
    snapshot.retryQueue = await db.whatsAppRetryQueue.count({
      where: { status: { in: ['pending', 'retrying'] } },
    });
    snapshot.webhookEvents = await db.webhookEvent.count({
      where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
    });
    snapshot.recentCrons = await db.cronJobLog.findMany({
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
    snapshot.metrics = 'healthy';
  } catch (error) {
    snapshot.metrics = 'unavailable';
    snapshot.metricsErrorCode = getSafeDatabaseErrorCode(error);
    console.error('[health-snapshot] Operational metrics query failed.', {
      code: snapshot.metricsErrorCode,
    });
  }

  return snapshot;
}
