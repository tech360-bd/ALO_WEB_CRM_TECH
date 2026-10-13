import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import crypto from 'crypto';

// ============================================================
// VERIFY OTP (PASSWORD RESET) API
// POST /api/auth/verify-otp
// Public — verifies the password-reset OTP and returns a
// short-lived, signed reset token (HMAC) that the reset-password
// route re-verifies without needing DB-side state.
// ============================================================

const RESET_TOKEN_TTL_MINUTES = 10;

// ----------------------------------------------------------
// POST — verify OTP, return signed reset token
// ----------------------------------------------------------
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { email, phone, otp } = body as {
      email?: string;
      phone?: string;
      otp?: string;
    };

    if (!email && !phone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 }
      );
    }
    if (!otp) {
      return NextResponse.json(
        { error: 'OTP code is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const normalizedPhone = phone ? String(phone).trim() : null;

    // Look up the user (must match an existing account).
    const user = normalizedEmail
      ? await db.user.findUnique({ where: { email: normalizedEmail } })
      : await db.user.findFirst({ where: { phone: normalizedPhone ?? undefined } });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Most recent unverified, unexpired password-reset OTP for this user.
    const otpRecord = await db.otpVerification.findFirst({
      where: {
        userId: user.id,
        purpose: 'password_reset',
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Lockout check.
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      // Mark used so no further attempts are possible.
      await db.otpVerification.update({
        where: { id: otpRecord.id },
        data: { verified: true },
      });
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      );
    }

    // Increment attempts BEFORE checking the hash so a wrong guess counts.
    const updated = await db.otpVerification.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    const isValid = verifyOtpHash(String(otp), otpRecord.otpHash);
    if (!isValid) {
      const remaining = Math.max(0, updated.maxAttempts - updated.attempts);
      return NextResponse.json(
        {
          error: 'Invalid OTP',
          attemptsRemaining: remaining,
        },
        { status: 400 }
      );
    }

    // OTP matches — mark verified.
    await db.otpVerification.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Issue a short-lived signed reset token.
    // Format: `<userId>.<expiresAtMs>.<signature>`
    // Signature = HMAC-SHA256(OTP_SECRET, `${userId}:${expiresAtMs}`)
    const expiresAtMs = Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000;
    const signature = signResetToken(user.id, expiresAtMs);
    const resetToken = `${user.id}.${expiresAtMs}.${signature}`;
    const expiresAtIso = new Date(expiresAtMs).toISOString();

    await logAudit({
      userId: user.id,
      action: 'auth.otp_verified_for_reset',
      module: 'auth',
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      resetToken,
      userId: user.id,
      expiresAt: expiresAtIso,
    });
  } catch (error) {
    console.error('[verify-otp] POST error:', error);
    return NextResponse.json(
      { error: 'OTP verification failed' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------
// Helper: HMAC the (userId, expiresAtMs) pair with OTP_SECRET.
// Throws if OTP_SECRET is unset — no fallback.
// ----------------------------------------------------------
export function signResetToken(userId: string, expiresAtMs: number): string {
  const secret = process.env.OTP_SECRET;
  if (!secret) {
    throw new Error(
      'OTP_SECRET environment variable is not configured. Refusing to sign reset token.'
    );
  }
  return crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${expiresAtMs}`)
    .digest('hex');
}

// ----------------------------------------------------------
// Helper: Hash OTP with SHA-256 + OTP_SECRET (mirrors /api/otp)
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

// ----------------------------------------------------------
// Helper: Timing-safe OTP hash verification
// ----------------------------------------------------------
function verifyOtpHash(otp: string, hash: string): boolean {
  const computed = hashOtp(otp);
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(hash));
  } catch {
    return false;
  }
}
