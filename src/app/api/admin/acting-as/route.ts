import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    if (!auth.roles.includes('super_admin') && !auth.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Super Admin required' }, { status: 403 });
    }

    const logs = await db.portalAuditLog.findMany({
      where: { action: { contains: 'ACTING_AS' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []);

    const crmLogs = await db.crmAuditLog.findMany({
      where: { action: { contains: 'ACTING_AS' } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []);

    return NextResponse.json({
      success: true,
      logs,
      crmLogs,
      count: logs.length + crmLogs.length,
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

    if (!auth.roles.includes('super_admin') && !auth.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Super Admin required' }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, reason } = body;
    if (!targetUserId) return NextResponse.json({ success: false, error: 'targetUserId required' }, { status: 400 });

    const target = await db.portalUser.findUnique({ where: { id: targetUserId }, include: { roles: { include: { role: true } } } });
    if (!target) return NextResponse.json({ success: false, error: 'Target not found' }, { status: 404 });

    await logAuditAction(auth, 'ACTING_AS_STARTED', 'PortalUser', targetUserId, {
      targetName: target.name,
      targetEmail: target.email,
      targetRoles: target.roles.map(r => r.role.name),
      reason,
      realActorUserId: auth.actorUserId,
      actingAsUserId: targetUserId,
      actingAsRole: target.roles[0]?.role.name,
    });

    return NextResponse.json({
      success: true,
      actingAs: target,
      banner: `SUPER ADMIN ACTING AS: ${target.name} (${target.roles[0]?.role.name})`,
      tokenHeader: `x-acting-as-user: ${targetUserId}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
