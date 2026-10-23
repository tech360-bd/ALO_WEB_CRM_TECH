import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { computeHrAnalytics } from '@/lib/hrms/analytics';

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;
  const roleSet = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
  const isSuperAdmin = roleSet.has('super_admin');
  const isHrRole = roleSet.has('hr_manager') || roleSet.has('hr');
  const hasAnalyticsPermission = auth.permissions.some((permission) => ['employee.dashboard.view_all', 'hp1', 'ad2'].includes(permission));

  if (roleSet.has('student') || roleSet.has('partner') || (!isSuperAdmin && (!isHrRole || !hasAnalyticsPermission))) {
    return NextResponse.json({ success: false, error: 'Company HR analytics require an authorized HR role and explicit analytics permission.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
  }

  if (!isSuperAdmin) {
    const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { status: true } }).catch(() => null);
    if (!employee || employee.status.toLowerCase() !== 'active') {
      return NextResponse.json({ success: false, error: 'An active HR employee account is required.' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
  }

  const canViewPayroll = isSuperAdmin || auth.permissions.some((permission) => ['hp1', 'f1', 'employee.salary.view_all'].includes(permission));
  try {
    const data = await computeHrAnalytics({ includePayroll: canViewPayroll });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId,
        action: 'HR_ANALYTICS_VIEWED',
        entityType: 'EmployeeHRAnalytics',
        entityId: auth.userId,
        metadata: JSON.stringify({ effectiveUserId: auth.userId, canViewPayroll, ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}) }),
      },
    });
    return NextResponse.json({ success: true, data: { ...data, canViewPayroll, privateDatesVisible: false } }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'HR analytics are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
