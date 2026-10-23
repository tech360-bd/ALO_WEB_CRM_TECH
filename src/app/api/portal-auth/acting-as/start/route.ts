import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

const MAX_REASON_LENGTH = 500;
const SESSION_MINUTES = 30;

function isSuperAdmin(auth: AuthContext): boolean {
  return auth.roles.some((role) => role.toLowerCase() === 'super_admin');
}

async function handleStart(request: Request, auth: AuthContext) {
  if (!isSuperAdmin(auth) || auth.actorUserId !== auth.userId) {
    return NextResponse.json({ success: false, error: 'A non-acting Super Admin session is required.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: 'A valid request body is required.' }, { status: 400 });
  }

  const targetUserId = typeof body.targetUserId === 'string' ? body.targetUserId.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  if (!targetUserId || targetUserId.length > 191 || reason.length < 8 || reason.length > MAX_REASON_LENGTH) {
    return NextResponse.json({ success: false, error: 'targetUserId and a reason of 8–500 characters are required.' }, { status: 400 });
  }
  if (targetUserId === auth.actorUserId) {
    return NextResponse.json({ success: false, error: 'Acting-As cannot target the real actor.' }, { status: 400 });
  }

  try {
    const [target, employee] = await Promise.all([
      db.portalUser.findUnique({
        where: { id: targetUserId },
        select: { id: true, email: true, name: true, userType: true, status: true, emailVerified: true, roles: { include: { role: true } } },
      }),
      db.employee.findUnique({
        where: { userId: targetUserId },
        select: { id: true, role: true, status: true },
      }),
    ]);

    const targetRoles = target?.roles.map(({ role }) => role.name) || [];
    if (
      !target
      || target.userType !== 'EMPLOYEE'
      || target.status.toLowerCase() !== 'active'
      || !target.emailVerified
      || !employee
      || employee.status.toLowerCase() !== 'active'
      || targetRoles.some((role) => ['admin', 'super_admin'].includes(role.toLowerCase()))
    ) {
      return NextResponse.json({ success: false, error: 'An active, verified employee account is required.' }, { status: 403 });
    }

    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + SESSION_MINUTES * 60 * 1000);
    const token = randomBytes(32).toString('hex');
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 191) || '';
    const userAgent = request.headers.get('user-agent')?.slice(0, 191) || '';

    const actingAsSession = await db.$transaction(async (tx) => {
      const session = await tx.portalSession.create({
        data: {
          userId: auth.actorUserId,
          token,
          deviceName: `ALO_ACTING_AS:${target.id}`,
          ipAddress,
          userAgent,
          expiresAt,
        },
        select: { id: true, expiresAt: true },
      });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId,
          action: 'ACTING_AS_START',
          entityType: 'acting_as_session',
          entityId: session.id,
          metadata: JSON.stringify({
            realActorUserId: auth.actorUserId,
            realActorName: auth.actorName,
            effectiveUserId: target.id,
            effectiveName: target.name,
            effectiveEmail: target.email,
            effectiveRole: employee.role,
            reason,
            sessionId: session.id,
            expiresAt: session.expiresAt.toISOString(),
            status: 'active',
          }),
          ipAddress,
          userAgent,
        },
      });
      return session;
    });

    const response = NextResponse.json({
      success: true,
      actingAsSession: {
        id: actingAsSession.id,
        sessionId: actingAsSession.id,
        realActor: auth.actorUserId,
        realActorName: auth.actorName,
        effectiveUserId: target.id,
        effectiveRole: employee.role,
        effectiveName: target.name,
        reason,
        expiry: actingAsSession.expiresAt.toISOString(),
        status: 'active',
      },
    });
    const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
    response.cookies.set('alo_acting_as_session', actingAsSession.id, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MINUTES * 60,
      expires: actingAsSession.expiresAt,
    });
    return response;
  } catch {
    return NextResponse.json({ success: false, error: 'Acting-As session could not be created and audited.' }, { status: 503 });
  }
}

export const POST = withAuth(handleStart);
