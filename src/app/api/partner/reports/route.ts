import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (!auth || auth instanceof NextResponse) {
    return auth instanceof NextResponse ? auth : NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const profile = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });

    if (!profile) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const requestedPeriod = searchParams.get('period') || 'monthly';
    const period = ['monthly', 'weekly', 'yearly'].includes(requestedPeriod) ? requestedPeriod : 'monthly';
    const partnerId = profile.partnerId;

    // Leads by status
    const leadsByStatus = await db.partnerLead.groupBy({
      by: ['status'],
      where: { partnerId },
      _count: { id: true },
    });

    const totalLeads = await db.partnerLead.count({
      where: { partnerId },
    });

    const convertedLeads = await db.partnerLead.count({
      where: { partnerId, status: { in: ['converted', 'enrolled'] } },
    });

    const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 10000) / 100 : 0;

    // Time-series data
    let periodLeads: Array<{ period: string; count: number }> = [];
    const now = new Date();

    if (period === 'weekly') {
      for (let i = 7; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const count = await db.partnerLead.count({
          where: { partnerId, createdAt: { gte: weekStart, lt: weekEnd } },
        });
        periodLeads.push({
          period: `Week ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
          count,
        });
      }
    } else if (period === 'yearly') {
      for (let i = 2; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year + 1, 0, 1);
        const count = await db.partnerLead.count({
          where: { partnerId, createdAt: { gte: yearStart, lt: yearEnd } },
        });
        periodLeads.push({ period: `${year}`, count });
      }
    } else {
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthLabel = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
        const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
        const count = await db.partnerLead.count({
          where: { partnerId, createdAt: { gte: monthStart, lt: monthEnd } },
        });
        periodLeads.push({ period: monthLabel, count });
      }
    }

    const [commissionData, activeStudents, applicationCount] = await Promise.all([
      db.partnerLead.aggregate({
        where: { partnerId },
        _sum: { commissionExpected: true, commissionReceived: true },
      }),
      db.portalStudentProfile.count({ where: { partnerId } }),
      db.portalStudentApplication.count({ where: { studentProfile: { partnerId } } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalLeads,
          convertedLeads,
          conversionRate,
          activeStudents,
          applicationCount,
          commissionExpected: commissionData._sum.commissionExpected || 0,
          commissionReceived: commissionData._sum.commissionReceived || 0,
        },
        leadsByStatus: leadsByStatus.map((s) => ({ status: s.status, count: s._count.id })),
        leadsByPeriod: periodLeads,
        period,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('[PARTNER REPORTS] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate reports' }, { status: 500 });
  }
}
