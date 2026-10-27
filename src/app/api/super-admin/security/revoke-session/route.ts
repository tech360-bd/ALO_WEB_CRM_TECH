// POST /api/super-admin/security/revoke-session
//
// Force-logs-out a session. Revocation is a soft write (`revokedAt`) so the
// session row survives for forensics, and the audit record names the target
// user and why the session was killed.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  sessionId: z.string().trim().min(5).max(191),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');

  try {
    const session = await db.portalSession.findUnique({ where: { id: parsed.data.sessionId } });
    if (!session) return notFound('Session not found.');
    if (session.revokedAt) {
      return NextResponse.json({ success: true, sessionId: session.id, alreadyRevoked: true, revokedAt: session.revokedAt.toISOString() });
    }

    await db.$transaction(async (tx) => {
      await tx.portalSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      await writePortalAudit(tx, auth, 'SESSION_REVOKED', 'PortalSession', session.id, {
        reason: parsed.data.reason,
        targetUserId: session.userId,
        deviceName: session.deviceName,
        ipAddress: session.ipAddress,
      }, request);
    });

    return NextResponse.json({ success: true, sessionId: session.id, targetUserId: session.userId, revoked: true });
  } catch (error) {
    return unavailable('super-admin/security/revoke-session', error);
  }
}

export const POST = withAuth(handlePost);
