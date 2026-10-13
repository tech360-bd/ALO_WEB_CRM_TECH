import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/partner-admin/reports
 *
 * Partner-scoped reports — students, applications, commissions, broken
 * down by month, by university, and by status.
 *
 * Tenant isolation: same as the other partner-admin endpoints.
 */
function resolvePartnerId(auth: { user: { userType: string; referenceId: string | null; roles?: { name: string }[] } }, request: NextRequest): { partnerId: string | null; error?: NextResponse } {
  if (auth.user.userType === 'partner') {
    if (!auth.user.referenceId) return { partnerId: null, error: NextResponse.json({ error: 'Partner record missing on user' }, { status: 400 }) };
    return { partnerId: auth.user.referenceId };
  }
  if (auth.user.userType === 'employee') {
    const userRoles = auth.user.roles?.map((r) => r.name) ?? [];
    if (userRoles.includes('super_admin')) {
      const qp = new URL(request.url).searchParams.get('partnerId');
      return { partnerId: qp || null };
    }
    return { partnerId: null, error: NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 }) };
  }
  return { partnerId: null, error: NextResponse.json({ error: 'Forbidden — insufficient role' }, { status: 403 }) };
}

export async function GET(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['partner_super_admin', 'super_admin']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const { partnerId, error } = resolvePartnerId(auth, request);
    if (error) return error;
    if (!partnerId) {
      return NextResponse.json({ error: 'partnerId is required (use ?partnerId=)' }, { status: 400 });
    }

    // Filter window — default to last 12 months
    const url = new URL(request.url);
    const monthsBack = parseInt(url.searchParams.get('months') || '12', 10);
    const since = new Date();
    since.setMonth(since.getMonth() - monthsBack);

    const where = { partnerId };

    const [
      totalStudents,
      totalApplications,
      commissionAgg,
      commissionByStatus,
      applicationsByStatus,
      applicationsByUniversity,
      recentStudents,
      recentApplications,
    ] = await Promise.all([
      db.student.count({ where }),
      db.application.count({ where }),
      db.commission.aggregate({ where, _sum: { amount: true }, _count: true }),
      db.commission.groupBy({
        by: ['status'],
        where,
        _sum: { amount: true },
        _count: { id: true },
      }),
      db.application.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      db.application.findMany({
        where,
        select: { universityId: true, university: { select: { name: true } } },
      }),
      db.student.findMany({
        where,
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: { id: true, studentId: true, firstName: true, lastName: true, email: true, status: true, createdAt: true },
      }),
      db.application.findMany({
        where: { ...where, createdAt: { gte: since } },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { firstName: true, lastName: true, studentId: true } },
          university: { select: { name: true, country: true } },
          course: { select: { name: true, level: true } },
        },
      }),
    ]);

    // Aggregate applications by university manually (since groupBy w/ relations is limited)
    const uniCounts = new Map<string, { name: string; count: number }>();
    for (const a of applicationsByUniversity) {
      const name = a.university?.name || 'Unknown';
      const cur = uniCounts.get(a.universityId) || { name, count: 0 };
      cur.count += 1;
      uniCounts.set(a.universityId, cur);
    }
    const byUniversity = Array.from(uniCounts.values()).sort((a, b) => b.count - a.count);

    await logAudit({
      userId: auth.user.id,
      action: 'partner_admin_reports_view',
      module: 'partner_admin',
      recordId: partnerId,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      totals: {
        students: totalStudents,
        applications: totalApplications,
        commissions: commissionAgg._count,
        commissionAmount: commissionAgg._sum.amount || 0,
      },
      commissionByStatus: commissionByStatus.map((c) => ({
        status: c.status,
        count: c._count.id,
        amount: c._sum.amount || 0,
      })),
      applicationsByStatus: applicationsByStatus.map((a) => ({
        status: a.status,
        count: a._count.status,
      })),
      applicationsByUniversity: byUniversity,
      recentStudents,
      recentApplications,
    });
  } catch (error) {
    console.error('partner-admin/reports GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
