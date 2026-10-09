import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { writePortalAudit } from '@/lib/transactional-audit';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || auth.userId;
    const employee = await db.employee.findFirst({ where: { OR: [{ id: employeeId }, { userId: employeeId }] } });
    if (!employee) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    if (employee.userId !== auth.userId) {
      const access = await validateRequestAccess({ userId: auth.userId }, 'employee.permissions', 'view', { ownerId: employee.userId });
      if (!access.allowed) return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }
    const now = new Date();
    const perms = await db.employeeTemporaryPermission.findMany({
      where: { employeeId: employee.id, isActive: true, active: true, startDate: { lte: now }, endDate: { gt: now }, expiresAt: { gt: now } },
      orderBy: { endDate: 'asc' },
    });

    return NextResponse.json({ success: true, permissions: perms, note: 'Automatically revoke after expiry' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const access = await validateRequestAccess({ userId: auth.userId }, 'employee.permissions', 'approve');
    if (!access.allowed) return NextResponse.json({ success: false, error: 'Temporary permission approval authority required' }, { status: 403 });

    const body = await req.json();
    const { employeeId, featureKey, action, scopeType, scopeId, reason, startDate, endDate } = body;
    if (!employeeId || !featureKey || !endDate) return NextResponse.json({ success: false, error: 'employeeId, featureKey, endDate required' }, { status: 400 });

    const starts = startDate ? new Date(startDate) : new Date();
    const ends = new Date(endDate);
    if (!Number.isFinite(starts.getTime()) || !Number.isFinite(ends.getTime()) || ends <= starts || ends <= new Date() || !reason?.trim()) {
      return NextResponse.json({ success: false, error: 'Valid start/end dates and a reason are required' }, { status: 400 });
    }
    const employee = await db.employee.findFirst({ where: { OR: [{ id: employeeId }, { userId: employeeId }] } });
    if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'Active employee required' }, { status: 422 });
    if (employee.userId === auth.userId) return NextResponse.json({ success: false, error: 'Cannot grant own temporary permission' }, { status: 403 });
    const perm = await db.$transaction(async tx => {
      const created = await tx.employeeTemporaryPermission.create({
      data: {
        employeeId: employee.id,
        featureKey,
        permissionKey: featureKey,
        expiresAt: ends,
        active: true,
        approvedBy: auth.userId,
        action: action || 'view',
        scopeType: scopeType || 'own',
        scopeId: scopeId || '',
        grantedBy: auth.userId,
        reason: reason || '',
        startDate: starts,
        endDate: ends,
        isActive: true,
      },
    });

      await writePortalAudit(tx, auth, 'TEMPORARY_PERMISSION_GRANTED', 'EmployeeTemporaryPermission', created.id, { employeeId: employee.id, featureKey, endDate, reason }, req);
      return created;
    });

    return NextResponse.json({ success: true, data: perm });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
