import { NextResponse } from 'next/server';
import { processDueFollowUps } from '@/lib/whatsapp-followup-engine';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const start = Date.now();
  let logId: string | null = null;
  try {
    const log = await db.cronJobLog.create({
      data: { jobName: 'followup-sequence', status: 'running', startedAt: new Date() },
    });
    logId = log.id;
  } catch {}

  try {
    const results = await processDueFollowUps();
    const duration = Date.now() - start;

    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: {
          status: 'success',
          finishedAt: new Date(),
          durationMs: duration,
          metadata: JSON.stringify({ processed: results.length, results }),
        },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, job: 'followup-sequence', processed: results.length, results, durationMs: duration });
  } catch (error: any) {
    const duration = Date.now() - start;
    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: { status: 'failed', finishedAt: new Date(), durationMs: duration, errorMessage: error.message },
      }).catch(() => {});
    }
    return NextResponse.json({ success: false, error: error.message, job: 'followup-sequence' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
