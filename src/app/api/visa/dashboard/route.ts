import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    const where: any = {};
    if (!isSuper && (auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer'))) {
      where.visaOfficerId = auth.userId;
    }

    const totalAssigned = await db.visaCase.count({ where });
    const highRiskCount = await db.visaCase.count({ where: { ...where, riskLevel: { in: ['high', 'critical'] } } });
    const interviewQueueCount = await db.visaCase.count({ where: { ...where, currentStage: { in: ['AI Interview Pending', 'Officer Review Pending', 'AI_INTERVIEW_PENDING', 'OFFICER_REVIEW_PENDING'] } } });
    const docsPendingCount = await db.visaCase.count({ where: { ...where, currentStage: { in: ['Missing Documents', 'Documents Under Review', 'MISSING_DOCUMENTS', 'DOCUMENTS_UNDER_REVIEW'] } } });
    const avgAgg = await db.visaCase.aggregate({ where, _avg: { readinessScore: true } }).catch(() => ({ _avg: { readinessScore: 0 } }));

    return NextResponse.json({
      success: true,
      metrics: {
        totalAssigned,
        highRiskCount,
        interviewQueueCount,
        docsPendingCount,
        avgReadiness: Math.round(avgAgg._avg.readinessScore || 0),
      },
      emptyState: totalAssigned === 0 ? 'No visa cases assigned — proper empty state, no fake numbers' : null,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch visa dashboard metrics' },
      { status: 500 }
    );
  }
});
