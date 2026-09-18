import { NextResponse } from 'next/server';
import { checkAndEscalateSla } from '@/lib/sla-engine';
import { db } from '@/lib/db';
import { requireCron } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = await requireCron(req);
  if (denied) return denied;

  const start = Date.now();
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;


  let logId: string | null = null;
  try {
    const log = await db.cronJobLog.create({
      data: {
        jobName: 'sla-monitor',
        status: 'running',
        startedAt: new Date(),
      },
    });
    logId = log.id;
  } catch {}

  try {
    const results = await checkAndEscalateSla();

    const duration = Date.now() - start;

    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: {
          status: 'success',
          finishedAt: new Date(),
          durationMs: duration,
          metadata: JSON.stringify({ escalated: results.length, results }),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      job: 'sla-monitor',
      escalated: results.length,
      results,
      durationMs: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - start;
    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: {
          status: 'failed',
          finishedAt: new Date(),
          durationMs: duration,
          errorMessage: error.message,
        },
      }).catch(() => {});
    }
    return NextResponse.json({ success: false, error: error.message, job: 'sla-monitor' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
