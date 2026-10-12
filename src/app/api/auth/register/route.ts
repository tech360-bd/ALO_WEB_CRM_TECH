import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { registerStudentAtomically } from '@/lib/student/canonical-student';
import { getRequestIp, issueEmailOtp } from '@/lib/auth/email-otp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : undefined;
    const role = typeof body?.role === 'string' ? body.role.toUpperCase() : 'STUDENT';

    if (!name || name.length > 191 || !email || email.length > 191 || (phone?.length || 0) > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 200) {
      return NextResponse.json({ error: 'Valid name, email, and password (8–200 characters) are required' }, { status: 400 });
    }
    if (!['STUDENT', 'PARTNER'].includes(role)) {
      return NextResponse.json({ error: 'This role cannot self-register. Contact ALO Education.' }, { status: 403 });
    }

    if (await db.portalUser.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    let userId: string;
    let studentId: string | undefined;
    if (role === 'STUDENT') {
      const result = await registerStudentAtomically({ name, email, password, phone, pendingVerification: true });
      if (!result.success) {
        const status = result.errorCode === 'EMAIL_EXISTS' ? 409 : result.errorCode === 'STUDENT_EXISTS_DIFFERENT_OWNER' ? 409 : 500;
        return NextResponse.json({ error: result.error, errorCode: result.errorCode }, { status });
      }
      userId = result.userId!;
      studentId = result.studentId;
    } else {
      const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
      if (existing) return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      const user = await db.user.create({
        data: {
          email,
          name,
          phone,
          passwordHash: await bcrypt.hash(password, 12),
          role: 'PARTNER',
          status: 'PENDING',
          emailVerified: false,
          mustChangePwd: false,
          permissions: '[]',
        },
        select: { id: true },
      });
      userId = user.id;
    }

    const issued = await issueEmailOtp({ userId, email, ipAddress: getRequestIp(req) }).catch(() => ({ ok: false as const, reason: 'delivery_failed' as const }));
    if (!issued.ok) {
      return NextResponse.json({
        success: false,
        error: issued.reason === 'rate_limited' ? 'Verification email limit reached. Try again later.' : 'Account created but verification email could not be delivered. Contact support or retry later.',
        accountCreated: true,
      }, { status: issued.reason === 'rate_limited' ? 429 : 503 });
    }

    return NextResponse.json({
      success: true,
      user: { id: userId, email, name, role, status: 'PENDING' },
      ...(studentId ? { studentId } : {}),
      message: role === 'PARTNER'
        ? 'Verification email sent. Verify your address; partner access still requires staff approval.'
        : 'Verification email sent. Verify your address before signing in.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Registration could not be completed' }, { status: 500 });
  }
}
