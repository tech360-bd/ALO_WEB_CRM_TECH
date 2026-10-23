import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { POST as startActingAs } from '@/app/api/portal-auth/acting-as/start/route';
import { POST as stopActingAs } from '@/app/api/portal-auth/acting-as/stop/route';

export const POST = startActingAs;

export async function GET(request: NextRequest) {
  const authResult = await authenticateRequest(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;

  if (!auth.actingAsSessionId) {
    const response = NextResponse.json({ success: true, isActing: false, realActor: { userId: auth.actorUserId, name: auth.actorName } });
    response.cookies.set('alo_acting_as_session', '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0, expires: new Date(0), secure: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://') });
    return response;
  }

  const audit = await db.portalAuditLog.findFirst({
    where: { entityType: 'acting_as_session', entityId: auth.actingAsSessionId, action: 'ACTING_AS_START', actorUserId: auth.actorUserId },
    select: { metadata: true },
  });
  let reason = '';
  try { reason = JSON.parse(audit?.metadata || '{}').reason || ''; } catch { /* malformed legacy metadata is not trusted */ }

  return NextResponse.json({
    success: true,
    isActing: true,
    actingAs: {
      sessionId: auth.actingAsSessionId,
      userId: auth.userId,
      name: auth.name,
      role: auth.actingAsRole || auth.roles[0] || auth.userType,
      reason,
      expiresAt: auth.actingAsExpiresAt?.toISOString() || null,
    },
    realActor: { userId: auth.actorUserId, name: auth.actorName, email: auth.actorEmail },
  });
}

export async function DELETE(request: NextRequest) {
  return stopActingAs(request);
}
