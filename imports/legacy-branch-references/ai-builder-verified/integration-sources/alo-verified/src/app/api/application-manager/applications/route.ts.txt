import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole, counselorScope } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

/**
 * GET /api/application-manager/applications
 *
 * Returns applications filtered by source:
 *  - ?source=DIRECT    → source = 'DIRECT'
 *  - ?source=PARTNER   → source startsWith 'PARTNER'
 *  - ?source=B2B       → source = 'B2B' (confidential — names are masked unless the caller is application_manager/admin/super_admin)
 *  - (no source)       → all applications visible to caller
 *
 * counselorScope is applied: counselors see only their assigned apps.
 *
 * Pagination: ?page= & ?limit=  (default 1 / 25)
 * Search: ?search=  (matches applicationId, student name, university name)
 * Status filter: ?status=
 */
export async function GET(request: NextRequest) {
  const authOrResponse = await requireRole(request, ['application_manager', 'super_admin', 'admin', 'counselor']);
  if (authOrResponse instanceof NextResponse) return authOrResponse;
  const auth = authOrResponse;

  try {
    const url = new URL(request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;
    const search = url.searchParams.get('search') || '';
    const statusFilter = url.searchParams.get('status') || '';
    const sourceParam = (url.searchParams.get('source') || '').toUpperCase();

    const where: Record<string, unknown> = {};

    // Source scoping
    if (sourceParam === 'DIRECT') {
      where.source = 'DIRECT';
    } else if (sourceParam === 'PARTNER') {
      where.source = { in: ['PARTNER_INBOUND', 'PARTNER_OUTBOUND'] };
    } else if (sourceParam === 'B2B') {
      where.source = 'B2B';
    }

    // Status filter
    if (statusFilter) where.status = statusFilter;

    // Search
    if (search) {
      where.OR = [
        { applicationId: { contains: search } },
        { student: { firstName: { contains: search } } },
        { student: { lastName: { contains: search } } },
        { university: { name: { contains: search } } },
      ];
    }

    // Counselor scope — counselors see only their assigned apps.
    // Application.counselorId stores Employee.id (= auth.user.referenceId for employees).
    const scope = counselorScope(auth);
    if (scope?.assignedCounselor) {
      where.counselorId = auth.user.referenceId;
    } else if (auth.user.userType === 'partner') {
      where.partnerId = auth.user.referenceId;
    }

    // B2B confidentiality: only application_manager/admin/super_admin can see B2B rows.
    // Counselors must NOT see B2B applications.
    const userRoles = auth.user.roles?.map((r) => r.name) ?? [];
    const isPrivileged = userRoles.some((r) =>
      ['application_manager', 'super_admin', 'admin'].includes(r)
    );
    if (!isPrivileged && sourceParam !== 'B2B') {
      // Forcibly exclude B2B from non-privileged callers
      where.NOT = { source: 'B2B' };
    }
    if (sourceParam === 'B2B' && !isPrivileged) {
      return NextResponse.json(
        { error: 'Forbidden — B2B applications require application_manager/admin/super_admin role', code: 'B2B_CONFIDENTIAL' },
        { status: 403 }
      );
    }

    const [applications, total] = await Promise.all([
      db.application.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, studentId: true, email: true, phone: true } },
          university: { select: { id: true, name: true, country: true, city: true } },
          course: { select: { id: true, name: true, level: true, tuitionFee: true } },
          partner: isPrivileged ? { select: { id: true, companyName: true, partnerId: true } } : false,
          counselor: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
        },
      }),
      db.application.count({ where }),
    ]);

    // Mask B2B student names for non-application_manager viewers (defense in depth).
    // NB: the 403 check above already rejects this combination, so this branch
    // is a defense-in-depth fallback. We cast to unknown[] to avoid Prisma's
    // strict inferred type mismatch when masking fields.
    let safeRows: unknown[] = applications;
    if (sourceParam === 'B2B' && !isPrivileged) {
      safeRows = applications.map((a) => ({
        ...a,
        student: a.student
          ? { ...a.student, firstName: 'B2B', lastName: 'Student', email: null, phone: null }
          : a.student,
      }));
    }

    await logAudit({
      userId: auth.user.id,
      action: 'app_manager_applications_view',
      module: 'application_manager',
      newData: { source: sourceParam || 'all', status: statusFilter || 'all', search: !!search, count: total },
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return NextResponse.json({
      applications: safeRows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('application-manager/applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
