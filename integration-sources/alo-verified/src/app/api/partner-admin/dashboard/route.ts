import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/partner-admin/dashboard
 *
 * Returns KPIs scoped to the caller's partnerId. Tenant isolation:
 *  - userType === 'partner'  → use auth.user.referenceId as partnerId (own tenant)
 *  - userType === 'employee' with role super_admin → may pass ?partnerId= (or all when absent)
 *  - any other role → 403
 *
 * Returns:
 *  - partner: { id, partnerId, companyName, status, commissionRate }
 *  - stats: { studentCount, appCount, commissionTotal, commissionPending, staffCount, seatLimit, seatsUsed, offersCount, visaApprovedCount }
 *  - pipeline: applications grouped by status
 *  - recentApplications: 5 most recent
 *  - recentCommissions: 5 most recent
 */
export async function GET(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['partner_super_admin', 'super_admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    // Resolve the target partnerId (tenant isolation)
    let partnerId: string | null = null;

    if (auth.user.userType === 'partner') {
      partnerId = auth.user.referenceId;
    } else if (auth.user.userType === 'employee') {
      const userRoles = auth.user.roles?.map((r) => r.name) ?? [];
      if (userRoles.includes('super_admin')) {
        // super_admin may pass ?partnerId= for cross-tenant visibility
        const url = new URL(request.url);
        const qp = url.searchParams.get('partnerId');
        partnerId = qp || null;
      } else {
        return NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 });
      }
    }

    if (!partnerId) {
      // super_admin without ?partnerId — return aggregate stats across all partners
      const [studentCount, appCount, commissionAgg, commissionPending, staffCount, offersCount, visaApprovedCount] = await Promise.all([
        db.student.count(),
        db.application.count(),
        db.commission.aggregate({ _sum: { amount: true } }),
        db.commission.count({ where: { status: { in: ['eligible', 'requested', 'under_review'] } } }),
        db.partnerStaff.count(),
        db.application.count({ where: { status: { in: ['conditional_offer', 'unconditional_offer'] } } }),
        db.application.count({ where: { status: 'visa_approved' } }),
      ]);

      const pipeline = await db.application.groupBy({
        by: ['status'],
        _count: { status: true },
        orderBy: { status: 'asc' },
      });

      const [recentApplications, recentCommissions] = await Promise.all([
        db.application.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            student: { select: { firstName: true, lastName: true } },
            university: { select: { name: true } },
          },
        }),
        db.commission.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: { id: true, commissionId: true, amount: true, status: true, createdAt: true },
        }),
      ]);

      await logAudit({
        userId: auth.user.id,
        action: 'partner_admin_dashboard_view',
        module: 'partner_admin',
        ip: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
        newData: { scope: 'all_partners' },
      });

      return NextResponse.json({
        partner: null, // super_admin cross-tenant view
        stats: {
          studentCount,
          appCount,
          commissionTotal: commissionAgg._sum.amount || 0,
          commissionPending,
          staffCount,
          seatLimit: 0, // not applicable in cross-tenant view
          seatsUsed: staffCount,
          offersCount,
          visaApprovedCount,
        },
        pipeline: pipeline.map((p) => ({ status: p.status, count: p._count.status })),
        recentApplications,
        recentCommissions,
      });
    }

    // Partner-scoped view
    const partner = await db.partner.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        partnerId: true,
        companyName: true,
        status: true,
        commissionRate: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: 'Partner record not found' }, { status: 404 });
    }

    const SEAT_LIMIT = 3; // 1 super_admin + 2 staff
    const [
      studentCount,
      appCount,
      commissionAgg,
      commissionPending,
      staffCount,
      offersCount,
      visaApprovedCount,
    ] = await Promise.all([
      db.student.count({ where: { partnerId } }),
      db.application.count({ where: { partnerId } }),
      db.commission.aggregate({ where: { partnerId }, _sum: { amount: true } }),
      db.commission.count({
        where: { partnerId, status: { in: ['eligible', 'requested', 'under_review'] } },
      }),
      db.partnerStaff.count({ where: { partnerId } }),
      db.application.count({
        where: { partnerId, status: { in: ['conditional_offer', 'unconditional_offer'] } },
      }),
      db.application.count({ where: { partnerId, status: 'visa_approved' } }),
    ]);

    const pipeline = await db.application.groupBy({
      by: ['status'],
      where: { partnerId },
      _count: { status: true },
      orderBy: { status: 'asc' },
    });

    const [recentApplications, recentCommissions] = await Promise.all([
      db.application.findMany({
        where: { partnerId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true } },
          university: { select: { name: true } },
        },
      }),
      db.commission.findMany({
        where: { partnerId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, commissionId: true, amount: true, status: true, createdAt: true },
      }),
    ]);

    await logAudit({
      userId: auth.user.id,
      action: 'partner_admin_dashboard_view',
      module: 'partner_admin',
      recordId: partnerId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      partner,
      stats: {
        studentCount,
        appCount,
        commissionTotal: commissionAgg._sum.amount || 0,
        commissionPending,
        staffCount,
        seatLimit: SEAT_LIMIT,
        seatsUsed: 1 + staffCount, // 1 super_admin + PartnerStaff rows
        offersCount,
        visaApprovedCount,
      },
      pipeline: pipeline.map((p) => ({ status: p.status, count: p._count.status })),
      recentApplications,
      recentCommissions,
    });
  } catch (error) {
    console.error('partner-admin/dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
