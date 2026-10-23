import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

function clearActingAsCookie(response: NextResponse) {
  const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
  response.cookies.set('alo_acting_as_session', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export async function POST(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;
  const actingAsSessionId = auth.actingAsSessionId;

  if (!actingAsSessionId) {
    // Also clears a stale/expired/revoked cookie. It cannot create or extend a session.
    if (!auth.roles.some((role) => role.toLowerCase() === 'super_admin')) {
      return NextResponse.json({ success: false, error: 'No active Acting-As session.' }, { status: 409 });
    }
    return clearActingAsCookie(NextResponse.json({ success: true, alreadyStopped: true }));
  }

  try {
    const now = new Date();
    const result = await db.$transaction(async (tx) => {
      const activeSession = await tx.portalSession.findFirst({
        where: {
          id: actingAsSessionId,
          userId: auth.actorUserId,
          revokedAt: null,
          expiresAt: { gt: now },
          deviceName: { startsWith: 'ALO_ACTING_AS:' },
        },
      });
      if (!activeSession) return false;
      await tx.portalSession.update({ where: { id: activeSession.id }, data: { revokedAt: now } });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'ACTING_AS_STOP',
          entityType: 'acting_as_session',
          entityId: activeSession.id,
          metadata: JSON.stringify({
            realActorUserId: auth.actorUserId,
            effectiveUserId: auth.userId,
            actingAsRole: auth.actingAsRole,
            sessionId: activeSession.id,
            status: 'revoked',
            revokedAt: now.toISOString(),
          }),
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 191) || '',
          userAgent: request.headers.get('user-agent')?.slice(0, 191) || '',
        },
      });
      return true;
    });

    if (!result) {
      return clearActingAsCookie(NextResponse.json({ success: false, error: 'Acting-As session is no longer active.' }, { status: 409 }));
    }
    return clearActingAsCookie(NextResponse.json({ success: true, message: 'Acting-As session revoked; returning to the authenticated Super Admin.' }));
  } catch {
    return NextResponse.json({ success: false, error: 'Acting-As session could not be stopped or audited.' }, { status: 503 });
  }
}
