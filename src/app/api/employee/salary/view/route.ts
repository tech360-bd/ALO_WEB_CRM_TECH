import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { canViewEmployeeSalary } from '@/lib/access-check-engine';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId') || auth.userId;

    const canView = await canViewEmployeeSalary(auth.userId, auth.roles, employeeId);
    if (!canView) {
      await logAuditAction(auth, 'SALARY_VIEW_DENIED', 'EmployeeSalary', employeeId, { attempted: employeeId });
      return NextResponse.json({ success: false, error: 'Permission denied: salary view requires HR_MANAGER or SUPER_ADMIN' }, { status: 403 });
    }

    const salary = await db.employeeSalary.findFirst({
      where: { employeeId },
      orderBy: { createdAt: 'desc' },
    }).catch(() => null);

    const bonuses = await db.employeeBonus.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } }).catch(() => []);
    const increments = await db.employeeIncrement.findMany({ where: { employeeId }, orderBy: { createdAt: 'desc' } }).catch(() => []);

    await logAuditAction(auth, 'SALARY_VIEWED', 'EmployeeSalary', employeeId, {
      viewer: auth.userId,
      target: employeeId,
      isSelf: employeeId === auth.userId,
    });

    // Audit sensitive reveal
    try {
      await (db as any).sensitiveDataRevealLog.create({
        data: {
          employeeId: auth.userId,
          dataType: 'salary',
          studentId: employeeId,
          revealMethod: 'api_view',
          ipAddress: req.headers.get('x-forwarded-for') || '',
        },
      });
    } catch {}

    return NextResponse.json({
      success: true,
      salary,
      bonuses,
      increments,
      privacy: {
        blur: employeeId !== auth.userId,
        pinRequired: true,
        auditLogged: true,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
