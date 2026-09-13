import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dateTo = searchParams.get('dateTo') || new Date().toISOString().split('T')[0];
    const branch = searchParams.get('branch');
    const employee = searchParams.get('employee');

    const analytics = await db.whatsAppAnalyticsDaily.findMany({
      where: {
        date: { gte: dateFrom, lte: dateTo },
      },
      orderBy: { date: 'desc' },
    });

    const totalConversations = await db.communicationThread.count().catch(() => 0);
    const activeConversations = await db.communicationThread.count({ where: { status: 'open' } }).catch(() => 0);
    const slaOverdue = await db.communicationThread.count({ where: { slaDueAt: { lt: new Date() }, status: { not: 'resolved' } } }).catch(() => 0);
    const urgentAlarms = await db.dashboardAlarm.count({ where: { status: 'active' } }).catch(() => 0);
    const followUpPending = await db.whatsAppFollowUpSchedule.count({ where: { status: 'scheduled' } }).catch(() => 0);
    const documentVolume = await db.studentDocument.count().catch(() => 0);
    const contacts = await db.whatsAppContact.count().catch(() => 0);

    // Counselor performance
    const counselorPerf = await db.counselorTask.groupBy({
      by: ['employeeId'],
      _count: { id: true },
      where: { createdAt: { gte: new Date(dateFrom) } },
    }).catch(() => []);

    // Branch performance (from threads)
    const branchPerf = await db.communicationThread.groupBy({
      by: ['assignedToId'],
      _count: { id: true },
    }).catch(() => []);

    return NextResponse.json({
      success: true,
      summary: {
        totalConversations,
        activeConversations,
        slaOverdue,
        urgentAlarms,
        followUpPending,
        documentVolume,
        contacts,
      },
      daily: analytics,
      counselorPerformance: counselorPerf,
      branchPerformance: branchPerf,
      filters: { dateFrom, dateTo, branch, employee },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
