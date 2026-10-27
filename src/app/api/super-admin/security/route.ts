// GET  /api/super-admin/security — Security Center snapshot
// POST /api/super-admin/security — revoke a session / unlock an account
//
// Reading the security centre is itself a sensitive event and is audited.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';

export const dynamic = 'force-dynamic';

const windowStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d;
};

async function handleGet(_request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  try {
    const since = windowStart();
    const [failedLogins, activeSessions, securityEvents, permissionAudits, suspendedAccounts] = await Promise.all([
      db.loginAttempt.count({ where: { success: false, createdAt: { gte: since } } }).catch(() => 0),
      db.portalSession.findMany({
        where: { revokedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
          id: true,
          userId: true,
          deviceName: true,
          ipAddress: true,
          createdAt: true,
          expiresAt: true,
          user: { select: { email: true, name: true, userType: true } },
        },
      }).catch(() => []),
      db.employeeSecurityEvent.findMany({
        where: { isResolved: false },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }).catch(() => []),
      db.portalAuditLog.findMany({
        where: {
          createdAt: { gte: since },
          action: { in: ['PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'PERMISSION_GROUP_ASSIGNED', 'PERMISSION_GROUP_REVOKED', 'EMPLOYEE_STATUS_CHANGED'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: { id: true, action: true, entityType: true, entityId: true, actorUserId: true, createdAt: true },
      }).catch(() => []),
      db.employee.count({ where: { status: { in: ['suspended', 'locked'] } } }),
    ]);

    await logAuditAction(auth, 'SECURITY_CENTER_VIEWED', 'SecurityCenter', 'snapshot', {
      sessions: activeSessions.length,
      unresolvedEvents: securityEvents.length,
    });

    return NextResponse.json({
      success: true,
      summary: {
        failedLoginAttempts7d: failedLogins,
        activeSessions: activeSessions.length,
        unresolvedSecurityEvents: securityEvents.length,
        suspendedAccounts,
        rbacChanges7d: permissionAudits.length,
      },
      sessions: activeSessions.map((session) => ({
        id: session.id,
        userId: session.userId,
        email: session.user?.email || '',
        name: session.user?.name || '',
        userType: session.user?.userType || '',
        deviceName: session.deviceName.startsWith('ALO_ACTING_AS:') ? 'Acting-As session' : session.deviceName || 'Unknown device',
        isActingAs: session.deviceName.startsWith('ALO_ACTING_AS:'),
        ipAddress: session.ipAddress,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      })),
      events: securityEvents.map((event) => ({
        id: event.id,
        employeeId: event.employeeId,
        eventType: event.eventType,
        severity: event.severity,
        description: event.description,
        ipAddress: event.ipAddress,
        createdAt: event.createdAt.toISOString(),
      })),
      rbacChanges: permissionAudits.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        actorUserId: row.actorUserId,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[super-admin/security] failed', error);
    return NextResponse.json({ success: false, error: 'Security Center is temporarily unavailable.' }, { status: 503 });
  }
}

const RevokeSession = z.object({
  action: z.literal('revoke_session'),
  sessionId: z.string().trim().min(1).max(191),
  reason: z.string().trim().min(8).max(500),
}).strict();

const UnlockUser = z.object({
  action: z.literal('unlock_user'),
  userId: z.string().trim().min(1).max(191),
  reason: z.string().trim().min(8).max(500),
}).strict();

const Body = z.discriminatedUnion('action', [RevokeSession, UnlockUser]);

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid request body.' },
      { status: 400 },
    );
  }

  try {
    if (parsed.data.action === 'revoke_session') {
      const session = await db.portalSession.findUnique({ where: { id: parsed.data.sessionId } });
      if (!session) {
        return NextResponse.json({ success: false, error: 'Session not found.' }, { status: 404 });
      }
      await db.$transaction(async (tx) => {
        await tx.portalSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
        await writePortalAudit(tx, auth, 'SESSION_REVOKED', 'PortalSession', session.id, {
          reason: parsed.data.reason,
          targetUserId: session.userId,
          wasActingAs: session.deviceName.startsWith('ALO_ACTING_AS:'),
        }, request);
      });
      return NextResponse.json({ success: true, revoked: session.id });
    }

    const user = await db.portalUser.findUnique({ where: { id: parsed.data.userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }
    const employee = await db.employee.findUnique({ where: { userId: user.id } });
    await db.$transaction(async (tx) => {
      await tx.portalUser.update({ where: { id: user.id }, data: { status: 'active' } });
      if (employee) {
        await tx.employee.update({ where: { id: employee.id }, data: { status: 'active' } });
      }
      await writePortalAudit(tx, auth, 'ACCOUNT_UNLOCKED', 'PortalUser', user.id, {
        reason: parsed.data.reason,
        before: { status: user.status },
        employeeId: employee?.employeeId || null,
      }, request);
    });
    return NextResponse.json({ success: true, unlocked: user.id });
  } catch (error) {
    console.error('[super-admin/security POST] failed', error);
    return NextResponse.json({ success: false, error: 'Security action could not be applied and audited.' }, { status: 503 });
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
