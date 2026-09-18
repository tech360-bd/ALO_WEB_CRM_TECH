import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCron } from "@/lib/cron-auth";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const denied = await requireCron(req);
  if (denied) return denied;

  const start = Date.now();
  let logId: string | null = null;
  try {
    const log = await db.cronJobLog.create({
      data: { jobName: 'daily-analytics-summary', status: 'running', startedAt: new Date() },
    });
    logId = log.id;
  } catch {}

  try {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const totalConversations = await db.communicationThread.count().catch(() => 0);
    const newLeads = await db.lead.count({ where: { createdAt: { gte: yesterday } } }).catch(() => 0);
    const activeConversations = await db.communicationThread.count({ where: { status: 'open' } }).catch(() => 0);
    const unreadConversations = await db.communicationThread.count({ where: { status: 'open' } }).catch(() => 0);
    const aiHandled = await db.socialInboxMessage.count({ where: { aiHandled: true, createdAt: { gte: yesterday } } }).catch(() => 0);
    const slaBreaches = await db.communicationThread.count({ where: { slaDueAt: { lt: new Date() }, status: { not: 'resolved' } } }).catch(() => 0);
    const urgentCases = await db.dashboardAlarm.count({ where: { priority: 'critical', status: 'active' } }).catch(() => 0);
    const followUpSent = await db.whatsAppFollowUpSchedule.count({ where: { status: 'sent', sentAt: { gte: yesterday } } }).catch(() => 0);
    const documentVolume = await db.studentDocument.count({ where: { createdAt: { gte: yesterday } } }).catch(() => 0);

    const existing = await db.whatsAppAnalyticsDaily.findUnique({ where: { date: today } }).catch(() => null);

    const data = {
      date: today,
      totalConversations,
      newLeads,
      activeConversations,
      unreadConversations,
      aiHandled,
      humanHandled: activeConversations - aiHandled,
      aiHandovers: await db.aloAuditLog.count({ where: { action: 'AI_HANDOVER', createdAt: { gte: yesterday } } }).catch(() => 0),
      avgResponseTime: 0,
      slaBreaches,
      escalations: await db.communicationEscalation.count({ where: { createdAt: { gte: yesterday } } }).catch(() => 0),
      urgentCases,
      followUpSent,
      followUpResponses: 0,
      conversionRate: 0,
      documentVolume,
      complaintVolume: await db.dashboardAlarm.count({ where: { alarmType: 'COMPLAINT', createdAt: { gte: yesterday } } }).catch(() => 0),
    };

    const saved = await db.whatsAppAnalyticsDaily.upsert({
      where: { date: today },
      update: data,
      create: data,
    });

    const duration = Date.now() - start;
    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: { status: 'success', finishedAt: new Date(), durationMs: duration, metadata: JSON.stringify(data) },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, job: 'daily-analytics-summary', data: saved, durationMs: duration });
  } catch (error: any) {
    const duration = Date.now() - start;
    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: { status: 'failed', finishedAt: new Date(), durationMs: duration, errorMessage: error.message },
      }).catch(() => {});
    }
    return NextResponse.json({ success: false, error: error.message, job: 'daily-analytics-summary' }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}
