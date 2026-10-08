import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { consumeEmailOtp, getRequestIp, issueEmailOtp } from '@/lib/auth/email-otp';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const code = typeof body?.otp === 'string' ? body.otp.trim() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: 'A valid email and six-digit code are required.' }, { status: 400 });
    }
    const user = await db.portalUser.findUnique({ where: { email }, select: { id: true, userType: true, status: true } });
    if (!user || !await consumeEmailOtp({ userId: user.id, email, code, purpose: 'email_verification' })) {
      return NextResponse.json({ success: false, error: 'Invalid or expired code.' }, { status: 400 });
    }

    const isStudent = user.userType === 'STUDENT';
    const nextStatus = isStudent && user.status === 'pending_verification' ? 'active' : user.status;
    await db.portalUser.update({
      where: { id: user.id },
      data: { emailVerified: true, status: nextStatus },
    });
    const approvalRequired = user.userType === 'PARTNER' && nextStatus !== 'active';
    return NextResponse.json({
      success: true,
      emailVerified: true,
      approvalRequired,
      userStatus: nextStatus,
      message: approvalRequired
        ? 'Email verified. Partner access remains pending separate staff approval.'
        : 'Email verified. You can now sign in.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Verification could not be completed.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'A valid email is required.' }, { status: 400 });
    }
    const user = await db.portalUser.findUnique({ where: { email }, select: { id: true, emailVerified: true } });
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true, message: 'If the account can receive verification, a new code will be sent.' });
    }
    const result = await issueEmailOtp({ userId: user.id, email, ipAddress: getRequestIp(request) });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.reason === 'rate_limited' ? 'Verification email limit reached. Try later.' : 'Verification email could not be delivered.' }, { status: result.reason === 'rate_limited' ? 429 : 503 });
    }
    return NextResponse.json({ success: true, message: 'A new verification code has been sent.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Verification email could not be sent.' }, { status: 500 });
  }
}
