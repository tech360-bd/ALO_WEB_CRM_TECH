import { NextResponse } from 'next/server';
import { encode } from 'next-auth/jwt';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { createStudentSession } from '@/lib/student-auth';
import { consumeEmailOtp, getRequestIp } from '@/lib/auth/email-otp';

const FAILURE_WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 5;

async function recordAttempt(input: {
  email: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
}) {
  await db.loginAttempt.create({ data: input });
}

async function setStudentPageSessionCookie(response: NextResponse, student: { id: string; email: string; name: string }) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) throw new Error('NEXTAUTH_SECRET must be configured (32+ characters) before portal login');
  const token = await encode({
    token: { sub: student.id, id: student.id, email: student.email, name: student.name, role: 'STUDENT', status: 'ACTIVE' },
    secret,
    maxAge: 24 * 60 * 60,
  });
  const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
  response.cookies.set(secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token', token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 24 * 60 * 60,
  });
  return response;
}

export async function POST(req: Request) {
  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret || secret.length < 32) {
      return NextResponse.json({ success: false, error: 'Student authentication is not configured.' }, { status: 503 });
    }
    const ipAddress = getRequestIp(req);
    const userAgent = (req.headers.get('user-agent') || '').slice(0, 512);
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const otpCode = typeof body?.otpCode === 'string' ? body.otpCode.trim() : '';
    const loginMethod = body?.loginMethod;

    if (loginMethod !== 'password' && loginMethod !== 'otp') {
      return NextResponse.json({ success: false, error: 'Invalid login method' }, { status: 400 });
    }
    if (!email && !phone) return NextResponse.json({ success: false, error: 'Email or phone required' }, { status: 400 });
    if (!email && loginMethod === 'otp') {
      return NextResponse.json({ success: false, error: 'Email is required for secure code delivery' }, { status: 400 });
    }

    const cutoff = new Date(Date.now() - FAILURE_WINDOW_MS);
    const failureCount = await db.loginAttempt.count({
      where: {
        success: false,
        createdAt: { gte: cutoff },
        OR: [{ ipAddress }, ...(email ? [{ email }] : [])],
      },
    });
    if (failureCount >= MAX_FAILURES) {
      return NextResponse.json({ success: false, error: 'Too many failed attempts. Please try again later.' }, { status: 429 });
    }

    // If both identifiers are supplied they must resolve to the same record;
    // never let an omitted OR branch degrade to an unfiltered Prisma condition.
    const student = await db.student.findFirst({
      where: email && phone ? { email, phone } : email ? { email } : { phone },
    });
    const linkedUser = student?.userId
      ? await db.user.findUnique({
          where: { id: student.userId },
          select: { email: true, role: true, status: true, emailVerified: true, passwordHash: true },
        })
      : null;
    const linkedUserIsActive = !student?.userId || !!linkedUser &&
      linkedUser.role.toUpperCase() === 'STUDENT' &&
      linkedUser.status.toLowerCase() === 'active' &&
      linkedUser.emailVerified;

    if (!student || student.status !== 'active' || student.suspended || !linkedUserIsActive) {
      await recordAttempt({ email, ipAddress, userAgent, success: false, failureReason: 'invalid_or_inactive_account' });
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    let authSuccess = false;
    if (loginMethod === 'password') {
      if (!password) return NextResponse.json({ success: false, error: 'Password required' }, { status: 400 });
      // New accounts keep the credential hash on User as the canonical source.
      // Unlinked legacy CRM students retain the old Student.password fallback.
      const passwordHash = linkedUser ? linkedUser.passwordHash : student.password;
      authSuccess = !!passwordHash && await bcrypt.compare(password, passwordHash);
    } else {
      if (!otpCode) return NextResponse.json({ success: false, error: 'OTP required' }, { status: 400 });
      authSuccess = !!student.email && await consumeEmailOtp({
        userId: student.id,
        email: student.email,
        code: otpCode,
        purpose: 'account_activation',
      });
    }

    if (!authSuccess) {
      await recordAttempt({ email: student.email || email, ipAddress, userAgent, success: false, failureReason: `invalid_${loginMethod}` });
      return NextResponse.json({ success: false, error: loginMethod === 'otp' ? 'Invalid or expired code' : 'Invalid credentials' }, { status: 401 });
    }

    await recordAttempt({ email: student.email, ipAddress, userAgent, success: true });
    const token = await createStudentSession(student.id, { ipAddress, userAgent });
    await db.student.update({ where: { id: student.id }, data: { lastLoginAt: new Date() } });

    const response = NextResponse.json({
      success: true,
      student: {
        id: student.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        profileComplete: student.profileComplete,
        journeyStage: student.journeyStage,
      },
    });
    const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
    response.cookies.set('alo_student_session', token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });
    return await setStudentPageSessionCookie(response, student);
  } catch (error) {
    console.error('Student login failed');
    return NextResponse.json({ success: false, error: 'Authentication is temporarily unavailable' }, { status: 503 });
  }
}
