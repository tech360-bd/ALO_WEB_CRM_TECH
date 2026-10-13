import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

/* ------------------------------------------------------------------ */
/*  GET — Visa statistics                                              */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireAuth(req);
    if (error) return error;

    const [total, byStatus, byCountry, avgReadiness] = await Promise.all([
      // Total count
      db.visaApplication.count(),

      // By status
      db.visaApplication.groupBy({
        by: ['status'],
        _count: true,
      }),

      // By country
      db.visaApplication.groupBy({
        by: ['country'],
        _count: true,
        where: { country: { not: null } },
      }),

      // Average readiness score
      db.visaApplication.aggregate({
        _avg: { readinessScore: true },
        where: { readinessScore: { not: null } },
      }),
    ]);

    // Approval rate
    const statusMap: Record<string, number> = {};
    for (const s of byStatus) {
      statusMap[s.status] = s._count;
    }
    const decidedCount = (statusMap['APPROVED'] || 0) + (statusMap['REJECTED'] || 0);
    const approvalRate = decidedCount > 0 ? Math.round(((statusMap['APPROVED'] || 0) / decidedCount) * 100) : 0;

    return NextResponse.json({
      total,
      byStatus: statusMap,
      byCountry: byCountry.map((c) => ({ country: c.country, count: c._count })),
      approvalRate,
      avgReadinessScore: avgReadiness._avg.readinessScore
        ? Math.round(avgReadiness._avg.readinessScore)
        : null,
    });
  } catch (error) {
    console.error('Error fetching visa stats:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
