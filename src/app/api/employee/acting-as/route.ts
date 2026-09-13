import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    // Only super_admin can act as
    if (!auth.roles.includes('super_admin') && !auth.roles.includes('SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'Only SUPER_ADMIN can use Acting-As' }, { status: 403 });
    }

    const body = await req.json();
    const { targetUserId, reason } = body;
    if (!targetUserId) return NextResponse.json({ success: false, error: 'targetUserId required' }, { status: 400 });

    const targetUser = await db.portalUser.findUnique({
      where: { id: targetUserId },
      include: { roles: { include: { role: true } } },
    });

    if (!targetUser) return NextResponse.json({ success: false, error: 'Target user not found' }, { status: 404 });
    if (targetUser.status !== 'active') return NextResponse.json({ success: false, error: `Target account is ${targetUser.status}` }, { status: 403 });

    // Audit log for acting-as start
    await logAuditAction(auth, 'ACTING_AS_STARTED', 'PortalUser', targetUserId, {
      targetUserId,
      targetEmail: targetUser.email,
      targetName: targetUser.name,
      targetRoles: targetUser.roles.map(r => r.role.name),
      reason: reason || 'Super Admin acting-as for support',
      realActorUserId: auth.actorUserId,
      actingAsUserId: targetUserId,
      actingAsRole: targetUser.roles[0]?.role.name || 'UNKNOWN',
    });

    // Also log to CrmAuditLog for cross-reference
    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.actorUserId,
        actorRole: 'super_admin',
        action: 'ACTING_AS_STARTED',
        targetCollection: 'PortalUser',
        targetId: targetUserId,
        beforeData: JSON.stringify({ actor: auth.actorUserId }),
        afterData: JSON.stringify({ actingAs: targetUserId, targetName: targetUser.name, reason }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Acting as ${targetUser.name} (${targetUser.email})`,
      actingAs: {
        userId: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        roles: targetUser.roles.map(r => r.role.name),
        userType: targetUser.userType,
      },
      realActor: {
        userId: auth.actorUserId,
        name: auth.actorName,
        email: auth.actorEmail,
      },
      banner: `SUPER ADMIN ACTING AS: ${targetUser.name} (${targetUser.roles[0]?.role.name || 'EMPLOYEE'})`,
      instructions: 'Use header x-acting-as-user: targetUserId for subsequent requests. All actions will be audited with realActorUserId.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    // Audit log for acting-as stop
    await logAuditAction(auth, 'ACTING_AS_STOPPED', 'PortalUser', auth.userId, {
      realActorUserId: auth.actorUserId,
      stoppedActingAs: auth.userId !== auth.actorUserId ? auth.userId : 'unknown',
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.actorUserId,
        actorRole: 'super_admin',
        action: 'ACTING_AS_STOPPED',
        targetCollection: 'PortalUser',
        targetId: auth.userId,
        afterData: JSON.stringify({ stoppedAt: new Date().toISOString() }),
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: 'Acting-As session stopped',
      realActor: auth.actorUserId,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const isActing = auth.actorUserId !== auth.userId;

    const recentActingLogs = await db.portalAuditLog.findMany({
      where: { action: { contains: 'ACTING_AS' } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }).catch(() => []);

    return NextResponse.json({
      success: true,
      isActing,
      currentUser: {
        userId: auth.userId,
        name: auth.name,
        email: auth.email,
        roles: auth.roles,
      },
      realActor: {
        userId: auth.actorUserId,
        name: auth.actorName,
        email: auth.actorEmail,
      },
      banner: isActing ? `SUPER ADMIN ACTING AS: ${auth.name} (${auth.roles[0] || 'EMPLOYEE'})` : null,
      recentLogs: recentActingLogs,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
