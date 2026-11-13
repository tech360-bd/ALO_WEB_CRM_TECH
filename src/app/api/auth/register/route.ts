import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { registerStudentAtomically } from '@/lib/student/canonical-student';
import { getRequestIp, issueEmailOtp } from '@/lib/auth/email-otp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ATTRIBUTION_KEYS = [
  'landingPage', 'referrer', 'visitorId',
  'utmSource', 'utmMedium', 'utmCampaign', 'utmContent', 'utmTerm',
  'gclid', 'fbclid',
] as const;

/** Keep only bounded string attribution keys; ignore anything else. */
function readBoundedAttribution(raw: unknown): Record<string, string> | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = source[key];
    if (typeof value !== 'string') continue;
    const cleaned = value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 191);
    if (cleaned !== '') out[key] = cleaned;
  }
  return Object.keys(out).length > 0 ? out : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body?.password === 'string' ? body.password : '';
    const phone = typeof body?.phone === 'string' ? body.phone.trim() : undefined;
    const role = typeof body?.role === 'string' ? body.role.toUpperCase() : 'STUDENT';
    // Spec 1.1 Registration: "accept terms" is a required, server-enforced step,
    // not just a disabled button in the browser. Legacy callers that never sent
    // the flag are accepted only while REGISTRATION_REQUIRE_TERMS is not 'true',
    // so existing integrations keep working and the switch is explicit.
    const termsAccepted = body?.termsAccepted === true || body?.acceptTerms === true;
    // Acquisition attribution forwarded by the registration form. This route
    // validates its body by hand rather than with a schema, so each key is
    // checked and bounded here: only strings, only up to the VARCHAR(191) the
    // attribution migration created, everything else discarded.
    const attribution = readBoundedAttribution(body?.attribution);
    const termsRequired = (process.env.REGISTRATION_REQUIRE_TERMS || 'true') !== 'false';

    if (!name || name.length > 191 || !email || email.length > 191 || (phone?.length || 0) > 40 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 200) {
      return NextResponse.json({ error: 'Valid name, email, and password (8–200 characters) are required' }, { status: 400 });
    }
    if (!['STUDENT', 'PARTNER'].includes(role)) {
      return NextResponse.json({ error: 'This role cannot self-register. Contact ALO Education.' }, { status: 403 });
    }
    if (termsRequired && !termsAccepted) {
      return NextResponse.json(
        { error: 'Please accept the Terms of Service and Privacy Policy to create an account.', code: 'TERMS_NOT_ACCEPTED' },
        { status: 400 },
      );
    }
    // Spec 1.1: the phone number must be unique as well as the email. Phone is
    // stored in several historical formats, so compare the digits-only form to
    // catch the same number written with spaces, dashes or a country prefix.
    if (phone) {
      const digits = phone.replace(/\D/g, '');
      const phoneVariants = [phone];
      if (digits) {
        phoneVariants.push(digits);
        if (digits.length > 10) phoneVariants.push(digits.slice(-10));
        phoneVariants.push(`+${digits}`);
      }
      const phoneOwner = await db.student.findFirst({
        where: { phone: { in: [...new Set(phoneVariants)] } },
        select: { id: true, userId: true },
      });
      if (phoneOwner && phoneOwner.userId) {
        return NextResponse.json(
          { error: 'This phone number is already registered. Sign in instead, or use a different number.', code: 'PHONE_EXISTS' },
          { status: 409 },
        );
      }
    }

    if (await db.portalUser.findUnique({ where: { email }, select: { id: true } })) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    let userId: string;
    let studentId: string | undefined;
    if (role === 'STUDENT') {
      const result = await registerStudentAtomically({ name, email, password, phone, pendingVerification: true, attribution });
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
      user: { id: userId, email, name, role, status: 'PENDING', termsAccepted: termsRequired ? termsAccepted : undefined },
      ...(studentId ? { studentId } : {}),
      message: role === 'PARTNER'
        ? 'Verification email sent. Verify your address; partner access still requires staff approval.'
        : 'Verification email sent. Verify your address before signing in.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Registration could not be completed' }, { status: 500 });
  }
}
