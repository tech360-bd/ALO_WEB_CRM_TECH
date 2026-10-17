import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';

/**
 * Logout — deletes the UserSession row so the Bearer token is immediately invalid.
 * Idempotent: if the session doesn't exist or has expired, still returns 200.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    // Already logged out / invalid token — return success (idempotent)
    return NextResponse.json({ success: true, message: 'Already logged out' });
  }

  try {
    await db.userSession.delete({ where: { id: auth.session.id } }).catch(() => {});
    await logAudit({
      userId: auth.user.id,
      action: 'auth.logout',
      module: 'auth',
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });
    return NextResponse.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
