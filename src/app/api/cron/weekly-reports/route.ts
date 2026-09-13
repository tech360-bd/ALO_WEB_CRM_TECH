import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const start = Date.now();
  let logId: string | null = null;
  try {
    const log = await db.cronJobLog.create({
      data: { jobName: 'weekly-reports', status: 'running', startedAt: new Date() },
    });
    logId = log.id;
  } catch {}

  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const periodStart = weekAgo.toISOString().split('T')[0];
    const periodEnd = now.toISOString().split('T')[0];

    // Counselor weekly reports
    const counselors = await db.employee.findMany({ where: { role: 'counselor', status: 'active' } }).catch(() => []);
    for (const counselor of counselors) {
      try {
        const studentsCount = await db.student.count({ where: { counselorId: counselor.id } }).catch(() => 0);
        const tasksCompleted = await db.counselorTask.count({ where: { employeeId: counselor.id, status: 'completed' } }).catch(() => 0);
        const tasksPending = await db.counselorTask.count({ where: { employeeId: counselor.id, status: 'pending' } }).catch(() => 0);

        await db.weeklyReport.create({
          data: {
            employeeId: counselor.id,
            reportType: 'counselor',
            periodStart,
            periodEnd,
            data: JSON.stringify({ studentsCount, tasksCompleted, tasksPending, generatedAt: now.toISOString() }),
          },
        });
      } catch {}
    }

    // Marketing weekly report
    try {
      const campaigns = await db.marketingCampaign.count().catch(() => 0);
      const leads = await db.marketingLead.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => 0);
      await db.weeklyReport.create({
        data: {
          employeeId: 'system',
          reportType: 'marketing',
          periodStart,
          periodEnd,
          data: JSON.stringify({ campaigns, leads, generatedAt: now.toISOString() }),
        },
      });
    } catch {}

    // Visa weekly report
    try {
      const cases = await db.visaCase.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => 0);
      await db.weeklyReport.create({
        data: {
          employeeId: 'system',
          reportType: 'visa',
          periodStart,
          periodEnd,
          data: JSON.stringify({ cases, generatedAt: now.toISOString() }),
        },
      });
    } catch {}

    // Partner weekly report
    try {
      const partnerLeads = await db.partnerLead.count({ where: { createdAt: { gte: weekAgo } } }).catch(() => 0);
      await db.weeklyReport.create({
        data: {
          employeeId: 'system',
          reportType: 'partner',
          periodStart,
          periodEnd,
          data: JSON.stringify({ partnerLeads, generatedAt: now.toISOString() }),
        },
      });
    } catch {}

    const duration = Date.now() - start;
    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: { status: 'success', finishedAt: new Date(), durationMs: duration, metadata: JSON.stringify({ periodStart, periodEnd }) },
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, periodStart, periodEnd, message: 'Weekly reports generated' });
  } catch (error: any) {
    const duration = Date.now() - start;
    if (logId) {
      await db.cronJobLog.update({
        where: { id: logId },
        data: { status: 'failed', finishedAt: new Date(), durationMs: duration, errorMessage: error.message },
      }).catch(() => {});
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) { return GET(req); }
