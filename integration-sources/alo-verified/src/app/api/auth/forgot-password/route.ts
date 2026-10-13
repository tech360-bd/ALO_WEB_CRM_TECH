import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import crypto from 'crypto';

// ============================================================
// FORGOT PASSWORD API
// POST /api/auth/forgot-password
// Public — generates an OTP for password reset and "sends" it.
// To prevent user enumeration, the response is identical whether
// or not the email/phone matches a user.
// ============================================================

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_PER_HOUR = 3;

// ----------------------------------------------------------
// POST — request a password-reset OTP
// ----------------------------------------------------------
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  // Generic response shape returned whether the user exists or not.
  const genericOk = NextResponse.json({
    success: true,
    message: 'If the email exists, an OTP has been sent',
  });

  try {
    const body = await request.json().catch(() => ({}));
    const { email, phone } = body as { email?: string; phone?: string };

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const normalizedPhone = phone ? String(phone).trim() : null;

    // Look up the user by email first, then by phone.
    const user = normalizedEmail
      ? await db.user.findUnique({ where: { email: normalizedEmail } })
      : await db.user.findFirst({ where: { phone: normalizedPhone ?? undefined } });

    // User enumeration protection: if the user does not exist, return the
    // exact same generic success response.
    if (!user) {
      return genericOk;
    }

    // Rate limit: max 3 OTP requests per identifier per hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const identifierField = normalizedEmail ? 'email' : 'phone';
    const identifierValue = normalizedEmail ?? normalizedPhone;
    const recentCount = await db.otpVerification.count({
      where: {
        [identifierField]: identifierValue,
        purpose: 'password_reset',
        createdAt: { gte: oneHourAgo },
      },
    });

    if (recentCount >= MAX_OTP_PER_HOUR) {
      // Don't leak the rate-limit reason either; return generic OK so an
      // attacker cannot tell whether the rate limit was hit on a real account.
      // (The OTP simply won't arrive.)
      return genericOk;
    }

    // Invalidate any previous unused password-reset OTPs for this identifier.
    await db.otpVerification.updateMany({
      where: {
        [identifierField]: identifierValue,
        purpose: 'password_reset',
        verified: false,
        expiresAt: { gte: new Date() },
      },
      data: { verified: true },
    });

    // Generate + hash the OTP using the same scheme as /api/otp.
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await db.otpVerification.create({
      data: {
        phone: user.phone ?? normalizedPhone,
        email: user.email ?? normalizedEmail,
        otpHash,
        purpose: 'password_reset',
        userId: user.id,
        attempts: 0,
        maxAttempts: 5,
        verified: false,
        expiresAt,
      },
    });

    // In dev: log that an OTP was issued. NEVER log the OTP code itself.
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `[forgot-password] OTP sent to ${user.email} | expires ${expiresAt.toISOString()}`
      );
    }
    // TODO(prod): wire real delivery — email/WhatsApp sender — when credentials available.
    // await sendResetOtpEmail(user.email, otp);
    // if (user.phone) await sendResetOtpWhatsapp(user.phone, otp);

    await logAudit({
      userId: user.id,
      action: 'auth.forgot_password_requested',
      module: 'auth',
      ip,
      userAgent,
    });

    return genericOk;
  } catch (error) {
    console.error('[forgot-password] POST error:', error);
    // Don't leak error details — return generic OK so the endpoint cannot be
    // used to enumerate accounts via error signatures.
    return genericOk;
  }
}

// ----------------------------------------------------------
// Helper: Hash OTP with SHA-256 + OTP_SECRET
// (Mirrors /api/otp — throws if OTP_SECRET is unset; no fallback.)
// ----------------------------------------------------------
function hashOtp(otp: string): string {
  const secret = process.env.OTP_SECRET;
  if (!secret) {
    throw new Error(
      'OTP_SECRET environment variable is not configured. Refusing to hash OTP with a weak fallback.'
    );
  }
  return crypto.createHash('sha256').update(otp + secret).digest('hex');
}
