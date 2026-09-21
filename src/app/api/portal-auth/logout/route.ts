// ============================================================
// POST /api/portal-auth/logout
// Revoke the current session (and optionally all sessions for the user)
// ============================================================

import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { NextResponse } from 'next/server';

function clearPageSessionCookie(response: NextResponse) {
  const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
  response.cookies.set(secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export async function POST(request: Request) {
  try {
    // Validate the session token from Authorization header
    const authResult = await authenticateRequest(request);

    // If authenticateRequest returned a NextResponse (error), return it
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const auth = authResult;
    const body = await request.json().catch(() => ({}));
    const logoutAll = body.logoutAll === true;

    if (logoutAll) {
      // Revoke ALL active sessions for this user
      const result = await db.portalSession.updateMany({
        where: {
          userId: auth.userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
        },
      });

      return clearPageSessionCookie(NextResponse.json({
        success: true,
        message: 'All sessions revoked successfully.',
        revokedCount: result.count,
      }));
    } else {
      // Revoke only the current session
      const session = await db.portalSession.findUnique({
        where: { id: auth.sessionId },
      });

      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found.' },
          { status: 404 }
        );
      }

      await db.portalSession.update({
        where: { id: auth.sessionId },
        data: {
          revokedAt: new Date(),
        },
      });

      return clearPageSessionCookie(NextResponse.json({
        success: true,
        message: 'Logged out successfully.',
      }));
    }
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
