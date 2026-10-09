import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('hr_manager');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Admin/HR/Super Admin required' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const department = searchParams.get('department') || '';
    const branch = searchParams.get('branch') || '';
    const status = searchParams.get('status') || '';

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { employeeId: { contains: search } },
      ];
    }
    if (role) where.role = role;
    if (department) where.department = department;
    if (branch) where.branch = branch;
    if (status) where.status = status;

    const employees = await db.employee.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []);

    const portalUsers = await db.portalUser.findMany({
      where: { userType: { not: 'STUDENT' } },
      take: 100,
      select: { id: true, name: true, email: true, userType: true, status: true, roles: { include: { role: true } } },
    }).catch(() => []);

    // Launcher cards with active users, pending tasks, alerts
    const launcherCards = employees.map((emp: any) => ({
      id: emp.id,
      userId: emp.userId,
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      role: emp.role,
      designation: emp.designation,
      department: emp.department,
      branch: emp.branch,
      status: emp.status,
      isOnline: emp.isOnline,
      dashboard: `/employee/${emp.role.toLowerCase().replace(/_/g, '-')}-dashboard`,
      actions: ['OPEN DASHBOARD', 'ACTING-AS', 'PERMISSIONS', 'ACTIVITY', 'AUDIT'],
    }));

    return NextResponse.json({
      success: true,
      employees,
      portalUsers,
      launcherCards,
      count: employees.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper) return NextResponse.json({ success: false, error: 'Super Admin required' }, { status: 403 });

    const body = await req.json();
    const { action, targetUserId, reason } = body;
    if (!action || !targetUserId) return NextResponse.json({ success: false, error: 'action and targetUserId required' }, { status: 400 });

    let result;
    switch (action) {
      case 'suspend':
        result = await db.portalUser.update({ where: { id: targetUserId }, data: { status: 'suspended' } }).catch(() => null);
        break;
      case 'reactivate':
        result = await db.portalUser.update({ where: { id: targetUserId }, data: { status: 'active' } }).catch(() => null);
        break;
      case 'revoke_sessions':
        result = await db.portalSession.updateMany({ where: { userId: targetUserId }, data: { revokedAt: new Date() } }).catch(() => null);
        break;
      case 'force_password_change':
        result = await db.portalUser.update({ where: { id: targetUserId }, data: { firstLoginRequired: true } }).catch(() => null);
        break;
      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    await logAuditAction(auth, `EMPLOYEE_${action.toUpperCase()}`, 'PortalUser', targetUserId, { reason, action });

    return NextResponse.json({ success: true, message: `Employee ${action} completed`, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
