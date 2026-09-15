import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendWhatsAppMessage } from '@/lib/whatsapp-cloud-api';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const start = Date.now();
  let logId: string | null = null;
  try {
    const log = await db.cronJobLog.create({
      data: { jobName: 'failed-message-retry', status: 'running', startedAt: new Date() },
    });
    logId = log.id;
  } catch {}

  try {
    const now = new Date();
    const pendingRetries = await db.whatsAppRetryQueue.findMany({
      where: {
        status: { in: ['pending', 'retrying'] },
        attemptCount: { lt: 3 },
        nextRetryAt: { lte: now },
      },
      take: 20,
      orderBy: { createdAt: 'asc' },
    });

    const results: any[] = [];

    for (const item of pendingRetries) {
      try {
        const sendResult = await sendWhatsAppMessage({
          to: item.recipientPhone,
          text: item.messageBody,
        });

        await db.whatsAppRetryQueue.update({
          where: { id: item.id },
          data: {
            attemptCount: { increment: 1 },
            status: sendResult.success ? 'sent' : item.attemptCount + 1 >= 2 ? 'failed' : 'retrying',
            lastError: sendResult.error || '',
            nextRetryAt: sendResult.success ? null : new Date(now.getTime() + (item.attemptCount + 1) * 60 * 60 * 1000),
          },
        });

        results.push({ id: item.id, success: sendResult.success });
      } catch (err: any) {
        await db.whatsAppRetryQueue.update({
          where: { id: item.id },
          data: {
            attemptCount: { increment: 1 },
            lastError: err.message,
            status: item.attemptCount + 1 >= 3 ? 'failed' : 'retrying',
            nextRetryAt: new Date(now.getTime() + (item.attemptCount + 1) * 60 * 60 * 1000),
          },
        });
        results.push({ id: item.id, success: false, error: err.message });
      }
    }

    const duration = Date.now() - start;
    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: { status: 'success', finishedAt: new Date(), durationMs: duration, metadata: JSON.stringify({ retried: results.length }) },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, job: 'failed-message-retry', retried: results.length, results, durationMs: duration });
  } catch (error: any) {
    const duration = Date.now() - start;
    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: { status: 'failed', finishedAt: new Date(), durationMs: duration, errorMessage: error.message },
      }).catch(() => {});
    }
    return NextResponse.json({ success: false, error: error.message, job: 'failed-message-retry' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  return GET(req);
}
