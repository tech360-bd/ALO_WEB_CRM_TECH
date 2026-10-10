import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;

  try {
    const partner = await db.partnerProfile.findUnique({ where: { userId: auth.userId }, select: { partnerId: true } });
    if (!partner) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const rawStatus = (searchParams.get('status') || '').trim();
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 20;
    const skip = (page - 1) * limit;
    const leadsWhere: Record<string, unknown> = { partnerId: partner.partnerId };
    if (rawStatus) {
      leadsWhere.commissionStatus = { in: [...new Set([rawStatus, rawStatus.toLowerCase(), rawStatus.toUpperCase()])] };
    }

    const [leads, total, totalLeads, studentCount, commissionTotals, statusGroups, paymentHistory] = await Promise.all([
      db.partnerLead.findMany({ where: leadsWhere, orderBy: [{ createdAt: 'desc' }, { id: 'asc' }], skip, take: limit }),
      db.partnerLead.count({ where: leadsWhere }),
      db.partnerLead.count({ where: { partnerId: partner.partnerId } }),
      db.portalStudentProfile.count({ where: { partnerId: partner.partnerId } }),
      db.partnerLead.aggregate({ where: { partnerId: partner.partnerId }, _sum: { commissionExpected: true, commissionReceived: true } }),
      db.partnerLead.groupBy({
        by: ['commissionStatus'],
        where: { partnerId: partner.partnerId },
        _count: { _all: true },
        _sum: { commissionExpected: true, commissionReceived: true },
      }),
      db.partnerLead.findMany({
        where: { partnerId: partner.partnerId, commissionReceived: { gt: 0 } },
        orderBy: { updatedAt: 'desc' },
        take: 100,
        select: { id: true, studentId: true, studentName: true, partnerRef: true, commissionExpected: true, commissionReceived: true, commissionStatus: true, createdAt: true, updatedAt: true },
      }),
    ]);

    const totalCommissionExpected = Number(commissionTotals._sum.commissionExpected || 0);
    const totalCommissionReceived = Number(commissionTotals._sum.commissionReceived || 0);
    const totalCommissionPending = Math.max(0, totalCommissionExpected - totalCommissionReceived);
    const statusBreakdown: Record<string, { count: number; expected: number; received: number }> = {};
    for (const group of statusGroups) {
      const key = group.commissionStatus || 'none';
      statusBreakdown[key] = {
        count: group._count._all,
        expected: Number(group._sum.commissionExpected || 0),
        received: Number(group._sum.commissionReceived || 0),
      };
    }

    const summary = {
      totalCommissionExpected,
      totalCommissionPaid: totalCommissionReceived,
      totalCommissionPending,
      totalLeads,
      activeStudents: studentCount,
      leadLevelExpected: totalCommissionExpected,
      leadLevelReceived: totalCommissionReceived,
      leadLevelPending: totalCommissionPending,
      statusBreakdown,
    };
    return NextResponse.json({
      success: true,
      data: { summary, paymentHistory, leads, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
    });
  } catch (error) {
    console.error('[PARTNER COMMISSION GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Partner commission data could not be loaded.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  return NextResponse.json({ success: false, error: 'Commission payouts can only be recorded by authorized finance staff.' }, { status: 403 });
}
