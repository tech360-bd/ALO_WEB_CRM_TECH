import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { sessionId } = body;

      if (sessionId) {
        await db.portalSession.updateMany({
          where: { token: { contains: sessionId } },
          data: { revokedAt: new Date() },
        }).catch(() => {});
      }

      await db.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'ACTING_AS_STOP',
          entityType: 'acting_as_session',
          entityId: sessionId || 'unknown',
          metadata: JSON.stringify({ realActor: auth.actorUserId, sessionId, status: 'revoked', terminated: new Date().toISOString() }),
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, message: 'Exited Acting-As mode and returned to real identity — session terminated immediately when exited or revoked' });
    } catch (e: any) {
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  })(request);
}
