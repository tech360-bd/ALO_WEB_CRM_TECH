import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = searchParams.get('userId') || auth.userId;

    // RBAC: own only unless super_admin/admin/hr_manager/branch_manager
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin');
    const isManager = auth.roles.includes('branch_manager') || auth.roles.includes('hr_manager') || auth.roles.includes('country_manager');
    if (userId !== auth.userId && !isSuper && !isManager) {
      return NextResponse.json({ success: false, error: 'Permission denied: can only view own activity' }, { status: 403 });
    }

    const auditLogs = await db.portalAuditLog.findMany({
      where: { actorUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }).catch(() => []);

    const crmLogs = await db.crmAuditLog.findMany({
      where: { actorUserId: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }).catch(() => []);

    const timeline = await db.timelineEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => []);

    // Sensitive access logs
    const sensitiveLogs = await (db as any).sensitiveDataRevealLog.findMany({
      where: { employeeId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => []);

    return NextResponse.json({
      success: true,
      activity: {
        auditLogs,
        crmLogs,
        timeline,
        sensitiveLogs,
      },
      count: auditLogs.length + crmLogs.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
