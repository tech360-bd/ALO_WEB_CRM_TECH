import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCron } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = await requireCron(req);
  if (denied) return denied;

  const checks: any = {
    timestamp: new Date().toISOString(),
    database: 'unknown',
    whatsappNumbers: 0,
    slaOverdue: 0,
    followUpPending: 0,
    retryQueue: 0,
    webhookEvents: 0,
    recentCrons: [],
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch (err: any) {
    checks.database = `error: ${err.message}`;
  }

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
    }).catch(() => 0);
    checks.recentCrons = await db.cronJobLog.findMany({
      orderBy: { startedAt: 'desc' },
      take: 10,
    });
  } catch (err: any) {
    checks.error = err.message;
  }

  const healthy = checks.database === 'healthy' && checks.whatsappNumbers >= 0;

  return NextResponse.json({
    success: healthy,
    status: healthy ? 'healthy' : 'degraded',
    checks,
  });
}
