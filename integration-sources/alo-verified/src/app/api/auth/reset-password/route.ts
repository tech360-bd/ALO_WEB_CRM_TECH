import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import crypto from 'crypto';

// ============================================================
// RESET PASSWORD API
// POST /api/auth/reset-password
// Public — accepts the signed reset token (from /verify-otp) +
// a new password, verifies the HMAC signature, expires it, and
// sets the new password. Also invalidates all sessions + OTPs.
// ============================================================

// ----------------------------------------------------------
// POST — set a new password using a verified reset token
// ----------------------------------------------------------
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    const body = await request.json().catch(() => ({}));
    const { userId, resetToken, newPassword } = body as {
      userId?: string;
      resetToken?: string;
      newPassword?: string;
    };

    if (!userId || !resetToken || !newPassword) {
      return NextResponse.json(
        { error: 'userId, resetToken and newPassword are required' },
        { status: 400 }
      );
    }

    // Validate the new password strength.
    const pwdError = validatePassword(newPassword);
    if (pwdError) {
      return NextResponse.json({ error: pwdError }, { status: 400 });
    }

    // Verify the reset-token signature.
    const parsed = parseResetToken(resetToken);
    if (!parsed || parsed.userId !== userId) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const expectedSig = signResetToken(parsed.userId, parsed.expiresAtMs);
    if (!safeEqualHex(expectedSig, parsed.signature)) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    if (Date.now() >= parsed.expiresAtMs) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Confirm the user still exists.
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Set the new password + clear the force-change flag.
    const passwordHash = await hashPassword(newPassword);
    await db.user.update({
      where: { id: user.id },
      data: {
        password: passwordHash,
        forcePasswordChange: false,
      },
    });

    // Cleanup: invalidate all password-reset OTPs for this user.
    await db.otpVerification.deleteMany({
      where: { userId: user.id, purpose: 'password_reset' },
    }).catch(() => {
      // Non-critical — best-effort cleanup.
    });

    // Force re-login everywhere by deleting all sessions for this user.
    await db.userSession.deleteMany({ where: { userId: user.id } }).catch(() => {
      // Non-critical — best-effort cleanup.
    });

    await logAudit({
      userId: user.id,
      action: 'auth.password_reset',
      module: 'auth',
      ip,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset. Please login.',
    });
  } catch (error) {
    console.error('[reset-password] POST error:', error);
    return NextResponse.json(
      { error: 'Password reset failed' },
      { status: 500 }
    );
  }
}

// ----------------------------------------------------------
// Helper: validate password strength
// min 8 chars, at least 1 letter + 1 number
// ----------------------------------------------------------
export function validatePassword(pwd: string): string | null {
  if (typeof pwd !== 'string' || pwd.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[a-zA-Z]/.test(pwd)) {
    return 'Password must contain at least one letter';
  }
  if (!/[0-9]/.test(pwd)) {
    return 'Password must contain at least one number';
  }
  return null;
}

// ----------------------------------------------------------
// Helper: parse `<userId>.<expiresAtMs>.<signature>` token
// ----------------------------------------------------------
function parseResetToken(
  token: string
): { userId: string; expiresAtMs: number; signature: string } | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [userId, expiresAtStr, signature] = parts;
  if (!userId || !expiresAtStr || !signature) return null;
  const expiresAtMs = Number(expiresAtStr);
  if (!Number.isFinite(expiresAtMs)) return null;
  return { userId, expiresAtMs, signature };
}

// ----------------------------------------------------------
// Helper: HMAC the (userId, expiresAtMs) pair with OTP_SECRET
// (Mirrors the signer in /verify-otp — must stay in sync.)
// ----------------------------------------------------------
function signResetToken(userId: string, expiresAtMs: number): string {
  const secret = process.env.OTP_SECRET;
  if (!secret) {
    throw new Error(
      'OTP_SECRET environment variable is not configured. Refusing to verify reset token.'
    );
  }
  return crypto
    .createHmac('sha256', secret)
    .update(`${userId}:${expiresAtMs}`)
    .digest('hex');
}

// ----------------------------------------------------------
// Helper: timing-safe hex string comparison
// ----------------------------------------------------------
function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
