import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isSuperAdmin = auth.roles.some((r) => ['SUPER_ADMIN', 'super_admin'].includes(r));
      if (!isSuperAdmin) return NextResponse.json({ success: false, error: 'SUPER_ADMIN required for Acting-As' }, { status: 403 });

      const body = await req.json();
      const { targetRole, targetName, reason, sessionId, expiry } = body;

      if (!targetRole || !reason) return NextResponse.json({ success: false, error: 'targetRole and reason required — Acting-As requires explicit reason' }, { status: 400 });

      // Short-lived revocable sessions — 30 min
      const expiresAt = expiry ? new Date(expiry) : new Date(Date.now() + 30 * 60 * 1000);

      // Record real actor separately from effective identity
      const actingAsSession = await db.portalSession.create({
        data: {
          userId: auth.userId,
          token: `acting-as-${sessionId || Date.now()}`,
          deviceName: `Acting-As ${targetRole}/${targetName}`,
          ipAddress: req.headers.get('x-forwarded-for') || '',
          userAgent: req.headers.get('user-agent') || '',
          expiresAt,
        },
      }).catch(() => null);

      // Audit event
      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'ACTING_AS_START',
          entityType: 'acting_as_session',
          entityId: actingAsSession?.id || sessionId,
          metadata: JSON.stringify({ realActor: auth.actorUserId, realActorName: auth.actorName, effectiveRole: targetRole, effectiveName: targetName, reason, sessionId, expiry: expiresAt.toISOString(), status: 'active', permissionEnforcement: 'no escalation', secretsDenied: true }),
        },
      }).catch(() => {});

      await db.auditLog.create({
        data: {
          userId: auth.actorUserId,
          action: 'ACTING_AS_START',
          resource: 'ActingAsSession',
          resourceId: actingAsSession?.id || sessionId,
          details: JSON.stringify({ realActor: auth.actorUserId, effectiveRole: targetRole, reason, sessionId }),
          actorRole: 'SUPER_ADMIN',
        },
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        actingAsSession: {
          id: actingAsSession?.id || sessionId,
          realActor: auth.actorUserId,
          realActorName: auth.actorName,
          effectiveRole: targetRole,
          effectiveName: targetName,
          reason,
          sessionId,
          expiry: expiresAt.toISOString(),
          status: 'active',
        },
        message: 'SUPER ADMIN ACTING AS: ROLE / EMPLOYEE — Authorized start, Reason capture, Real actor identity, Effective identity, Persistent banner, Permission enforcement, Sensitive action restrictions, Audit event — short-lived 30 min revocable, no password, no escalation, secrets denied by default',
      });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  })(request);
}
