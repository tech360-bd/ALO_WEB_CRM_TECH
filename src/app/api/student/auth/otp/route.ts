import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getRequestIp, issueEmailOtp } from '@/lib/auth/email-otp';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    if (!email && !phone) return NextResponse.json({ success: false, error: 'Email or phone is required' }, { status: 400 });

    // Require both supplied identifiers to belong to the same profile; avoid
    // undefined OR branches that can become match-all filters in Prisma.
    const student = await db.student.findFirst({
      where: email && phone ? { email, phone } : email ? { email } : { phone },
    });
    // Do not reveal whether an email or phone belongs to a student.
    if (!student || student.status !== 'active' || student.suspended) {
      return NextResponse.json({ success: true, message: 'If the account is eligible, a verification code will be sent to its registered email.' });
    }
    if (student.userId) {
      const linkedUser = await db.user.findUnique({
        where: { id: student.userId },
        select: { role: true, status: true, emailVerified: true },
      });
      if (!linkedUser || linkedUser.role.toUpperCase() !== 'STUDENT' || linkedUser.status.toLowerCase() !== 'active' || !linkedUser.emailVerified) {
        return NextResponse.json({ success: true, message: 'If the account is eligible, a verification code will be sent to its registered email.' });
      }
    }
    if (!student.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(student.email)) {
      return NextResponse.json({ success: false, error: 'This account has no verified email delivery address. Contact support.' }, { status: 409 });
    }

    const result = await issueEmailOtp({
      userId: student.id,
      email: student.email,
      purpose: 'account_activation',
      ipAddress: getRequestIp(req),
    });
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.reason === 'rate_limited' ? 'Too many code requests. Try again later.' : 'Code delivery is currently unavailable.' }, { status: result.reason === 'rate_limited' ? 429 : 503 });
    }
    return NextResponse.json({ success: true, message: 'A verification code was sent to the registered email.', expiresAt: result.expiresAt.toISOString() });
  } catch {
    return NextResponse.json({ success: false, error: 'Code delivery is currently unavailable.' }, { status: 500 });
  }
}
