import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requirePartnerContext } from '@/lib/partner-tenant-guard';
import { consumeEmailOtp, getRequestIp, issueEmailOtp } from '@/lib/auth/email-otp';

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
function validEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const authResult = await requirePartnerContext(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;
  if (auth.actorUserId !== auth.userId) return NextResponse.json({ success: false, error: 'Email changes are not allowed while impersonating another account.' }, { status: 403 });
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: 'Cross-origin email verification request denied.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!validEmail(email)) return NextResponse.json({ success: false, error: 'Enter a valid email address.' }, { status: 400 });

  try {
    const [user, existing] = await Promise.all([
      db.portalUser.findUnique({ where: { id: auth.userId }, select: { id: true, email: true } }),
      db.portalUser.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if (!user) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
    if (user.email.toLowerCase() === email) return NextResponse.json({ success: false, error: 'This is already your verified email address.' }, { status: 400 });
    if (existing && existing.id !== auth.userId) return NextResponse.json({ success: false, error: 'That email address is already used by another account.' }, { status: 409 });

    const result = await issueEmailOtp({ userId: auth.userId, email, purpose: 'email_change', ipAddress: getRequestIp(request) });
    if (!result.ok) return NextResponse.json({ success: false, error: result.reason === 'rate_limited' ? 'Email verification limit reached. Try again later.' : 'Verification email could not be delivered.' }, { status: result.reason === 'rate_limited' ? 429 : 503 });
    return NextResponse.json({ success: true, expiresAt: result.expiresAt, message: 'A verification code was sent to the new email address.' });
  } catch (error) {
    console.error('[PARTNER EMAIL CHANGE] OTP request error:', error);
    return NextResponse.json({ success: false, error: 'Email verification could not be started.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const authResult = await requirePartnerContext(request);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;
  if (auth.actorUserId !== auth.userId) return NextResponse.json({ success: false, error: 'Email changes are not allowed while impersonating another account.' }, { status: 403 });
  if (!sameOrigin(request)) return NextResponse.json({ success: false, error: 'Cross-origin email change denied.' }, { status: 403 });

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const otp = typeof body?.otp === 'string' ? body.otp.trim() : '';
  if (!validEmail(email) || !/^\d{6}$/.test(otp)) return NextResponse.json({ success: false, error: 'A valid email and six-digit verification code are required.' }, { status: 400 });

  try {
    const [user, existing] = await Promise.all([
      db.portalUser.findUnique({ where: { id: auth.userId }, select: { id: true, email: true } }),
      db.portalUser.findUnique({ where: { email }, select: { id: true } }),
    ]);
    if (!user) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
    if (user.email.toLowerCase() === email) return NextResponse.json({ success: false, error: 'This is already your current email address.' }, { status: 400 });
    if (existing && existing.id !== auth.userId) return NextResponse.json({ success: false, error: 'That email address is already used by another account.' }, { status: 409 });
    if (!await consumeEmailOtp({ userId: auth.userId, email, code: otp, purpose: 'email_change' })) {
      return NextResponse.json({ success: false, error: 'Verification code is invalid, expired, or already used.' }, { status: 400 });
    }

    const updatedUser = await db.$transaction(async (tx) => {
      const updated = await tx.portalUser.update({ where: { id: auth.userId }, data: { email, emailVerified: true, updatedAt: new Date() }, select: { id: true, email: true, phone: true } });
      await tx.portalSession.updateMany({ where: { userId: auth.userId, id: { not: auth.sessionId }, revokedAt: null }, data: { revokedAt: new Date() } });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.userId,
          action: 'PARTNER_EMAIL_CHANGED',
          entityType: 'PortalUser',
          entityId: auth.userId,
          metadata: JSON.stringify({ previousEmailChanged: true, newEmailVerifiedWithOtp: true }),
          ipAddress: getRequestIp(request),
          userAgent: request.headers.get('user-agent') || '',
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, data: { user: updatedUser }, message: 'Email address verified and updated. Other active sessions were revoked.' });
  } catch (error: any) {
    if (error?.code === 'P2002') return NextResponse.json({ success: false, error: 'That email address is already used by another account.' }, { status: 409 });
    console.error('[PARTNER EMAIL CHANGE] Verification error:', error);
    return NextResponse.json({ success: false, error: 'Verified email could not be updated.' }, { status: 500 });
  }
}
