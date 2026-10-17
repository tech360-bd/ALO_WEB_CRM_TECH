import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/application-manager/dashboard
 *
 * Aggregated KPIs + pipeline view for application_manager / super_admin / admin.
 * Returns:
 *  - totals: { direct, partner, b2b, all }
 *  - byStatus: applications grouped by status
 *  - bySource: applications grouped by source
 *  - submissionQueue: count of applications ready to advance (status = submitted)
 *  - recentActivity: 10 most recent status-history rows with app + actor context
 */
export async function GET(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['application_manager', 'super_admin', 'admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const [
      directCount,
      partnerCount,
      b2bCount,
      totalCount,
      draftCount,
      submittedCount,
      underReviewCount,
      offerCount,
      depositCount,
      casCount,
      visaCount,
      enrolledCount,
      rejectedCount,
      withdrawnCount,
      submissionQueueCount,
    ] = await Promise.all([
      db.application.count({ where: { source: 'DIRECT' } }),
      db.application.count({ where: { source: { in: ['PARTNER_INBOUND', 'PARTNER_OUTBOUND'] } } }),
      db.application.count({ where: { source: 'B2B' } }),
      db.application.count(),
      db.application.count({ where: { status: 'draft' } }),
      db.application.count({ where: { status: 'submitted' } }),
      db.application.count({ where: { status: 'under_review' } }),
      db.application.count({ where: { status: { in: ['conditional_offer', 'unconditional_offer'] } } }),
      db.application.count({ where: { status: 'deposit_paid' } }),
      db.application.count({ where: { status: 'cas_received' } }),
      db.application.count({ where: { status: { in: ['visa_applied', 'visa_approved', 'visa_refused'] } } }),
      db.application.count({ where: { status: 'enrolled' } }),
      db.application.count({ where: { status: 'rejected' } }),
      db.application.count({ where: { status: 'withdrawn' } }),
      db.application.count({ where: { status: 'submitted' } }),
    ]);

    const [byStatus, bySource] = await Promise.all([
      db.application.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { status: 'asc' },
      }),
      db.application.groupBy({
        by: ['source'],
        _count: { source: true },
        orderBy: { source: 'asc' },
      }),
    ]);

    const recentActivity = await db.applicationStatusHistory.findMany({
      take: 10,
      orderBy: { changedAt: 'desc' },
      include: {
        application: {
          select: {
            id: true,
            applicationId: true,
            student: { select: { firstName: true, lastName: true } },
            university: { select: { name: true } },
          },
        },
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'app_manager_dashboard_view',
      module: 'application_manager',
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      totals: {
        direct: directCount,
        partner: partnerCount,
        b2b: b2bCount,
        all: totalCount,
      },
      pipeline: {
        draft: draftCount,
        submitted: submittedCount,
        under_review: underReviewCount,
        offers: offerCount,
        deposit_paid: depositCount,
        cas_received: casCount,
        visa: visaCount,
        enrolled: enrolledCount,
        rejected: rejectedCount,
        withdrawn: withdrawnCount,
      },
      submissionQueue: submissionQueueCount,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count.status })),
      bySource: bySource.map((s) => ({ source: s.source, count: s._count.source })),
      recentActivity: recentActivity.map((h) => ({
        id: h.id,
        applicationId: h.application?.applicationId,
        fromStatus: h.fromStatus,
        toStatus: h.toStatus,
        note: h.note,
        changedAt: h.changedAt,
        studentName: h.application?.student
          ? `${h.application.student.firstName} ${h.application.student.lastName}`
          : null,
        universityName: h.application?.university?.name ?? null,
      })),
    });
  } catch (error) {
    console.error('application-manager/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
