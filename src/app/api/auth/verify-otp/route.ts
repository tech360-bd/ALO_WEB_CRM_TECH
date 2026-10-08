import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
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

    const user = await db.user.findUnique({ where: { email }, select: { id: true, role: true, status: true, emailVerified: true } });
    if (!user) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    const consumed = await consumeEmailOtp({ userId: user.id, email, code: otp, purpose: 'email_verification' });
    if (!consumed) return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });

    const isStudent = user.role.toUpperCase() === 'STUDENT';
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true, ...(isStudent && user.status === 'PENDING' ? { status: 'ACTIVE' } : {}) },
      });
      if (isStudent) {
        await tx.student.updateMany({ where: { userId: user.id }, data: { status: 'active' } });
      }
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'PROFILE_UPDATE',
          resource: 'User',
          resourceId: user.id,
          details: JSON.stringify({ type: 'email_verified' }),
        },
      });
    });

    const partnerNeedsApproval = user.role.toUpperCase() === 'PARTNER' && user.status !== 'ACTIVE';
    return NextResponse.json({
      success: true,
      emailVerified: true,
      approvalRequired: partnerNeedsApproval,
      userStatus: isStudent ? 'ACTIVE' : user.status,
      message: partnerNeedsApproval
        ? 'Email verified. Partner access remains pending separate staff approval.'
        : 'Email verified. You can now sign in.',
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
