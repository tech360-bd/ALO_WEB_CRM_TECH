import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { assignVerifiedRegistration } from '@/lib/crm/verified-registration-assignment';
import { consumeEmailOtp, getRequestIp, issueEmailOtp } from '@/lib/auth/email-otp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const otp = typeof body?.otp === 'string' ? body.otp.trim() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: 'A valid email and six-digit code are required' }, { status: 400 });
    }

    const outcome = await db.$transaction(async tx => {
      const user = await tx.user.findUnique({ where: { email }, select: { id: true, role: true, status: true, emailVerified: true } });
      // Verification is not a way to reactivate suspended/deactivated accounts.
      if (!user || user.emailVerified || !['PENDING', 'ACTIVE'].includes(user.status)) return null;
      const consumed = await consumeEmailOtp({ userId: user.id, email, code: otp, purpose: 'email_verification' }, tx);
      // Resolve normally on invalid codes so attempt counters COMMIT.
      if (!consumed) return null;
      const isStudent = user.role.toUpperCase() === 'STUDENT';
      const nextStatus = isStudent && user.status === 'PENDING' ? 'ACTIVE' : user.status;
      const claimed = await tx.user.updateMany({
        where: { id: user.id, emailVerified: false, status: user.status },
        data: { emailVerified: true, status: nextStatus },
      });
      // Roll back OTP consumption on a concurrent account/status change.
      if (claimed.count !== 1) throw new Error('Verification state changed. Retry.');
      if (isStudent && user.status === 'PENDING') await assignVerifiedRegistration(tx, { domain: 'user', userId: user.id });
      if (isStudent && nextStatus === 'ACTIVE') {
        await tx.student.updateMany({ where: { userId: user.id, suspended: false }, data: { status: 'active' } });
      }
      await tx.portalAuditLog.create({ data: { actorUserId: user.id, action: 'EMAIL_VERIFIED', entityType: 'User', entityId: user.id,
        metadata: JSON.stringify({ identityDomain: 'user', status: nextStatus }) } });
      return { nextStatus, approvalRequired: user.role.toUpperCase() === 'PARTNER' && nextStatus !== 'ACTIVE' };
    }, { maxWait: 5000, timeout: 15000 });
    if (!outcome) return NextResponse.json({ success: false, error: 'Invalid or expired code, or account cannot be verified.' }, { status: 400 });
    return NextResponse.json({
      success: true, emailVerified: true, approvalRequired: outcome.approvalRequired, userStatus: outcome.nextStatus,
      message: outcome.approvalRequired ? 'Email verified. Partner access remains pending separate staff approval.' : 'Email verified. You can now sign in.',
    });
  } catch {
    return NextResponse.json({ error: 'Verification could not be completed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }
    const user = await db.user.findUnique({ where: { email }, select: { id: true, emailVerified: true } });
    // Keep response shape independent of account existence to reduce enumeration.
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true, message: 'If the account can receive verification, a new code will be sent.' });
    }
    const issued = await issueEmailOtp({ userId: user.id, email, ipAddress: getRequestIp(req) });
    if (!issued.ok) {
      const status = issued.reason === 'rate_limited' ? 429 : 503;
      return NextResponse.json({ success: false, error: issued.reason === 'rate_limited' ? 'Verification email limit reached. Try again later.' : 'Verification email could not be delivered.' }, { status });
    }
    return NextResponse.json({ success: true, message: 'A new verification code has been sent.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Verification email could not be sent.' }, { status: 500 });
  }
}
