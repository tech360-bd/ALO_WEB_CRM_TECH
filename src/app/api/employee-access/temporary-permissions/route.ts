import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || auth.userId;
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');

    if (employeeId !== auth.userId && !isSuper) {
      return NextResponse.json({ success: false, error: 'Permission denied' }, { status: 403 });
    }

    const now = new Date();
    // Auto-expire
    await (db as any).employeeTemporaryPermission.updateMany({
      where: { endDate: { lt: now }, isActive: true },
      data: { isActive: false },
    }).catch(() => {});

    const perms = await (db as any).employeeTemporaryPermission.findMany({
      where: { employeeId, isActive: true },
      orderBy: { endDate: 'asc' },
    }).catch(() => []);

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

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Super Admin required' }, { status: 403 });

    const body = await req.json();
    const { employeeId, featureKey, action, scopeType, scopeId, reason, startDate, endDate } = body;
    if (!employeeId || !featureKey || !endDate) return NextResponse.json({ success: false, error: 'employeeId, featureKey, endDate required' }, { status: 400 });

    const perm = await (db as any).employeeTemporaryPermission.create({
      data: {
        employeeId,
        featureKey,
        action: action || 'view',
        scopeType: scopeType || 'own',
        scopeId: scopeId || '',
        grantedBy: auth.userId,
        reason: reason || '',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: new Date(endDate),
        isActive: true,
      },
    });

    await logAuditAction(auth, 'TEMPORARY_PERMISSION_GRANTED', 'EmployeeTemporaryPermission', perm.id, { employeeId, featureKey, endDate });

    return NextResponse.json({ success: true, data: perm });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
