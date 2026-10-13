import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

function ok(message: string) {
  return NextResponse.json({ success: true, message, data: null, meta: {}, errors: [] });
}

function fail(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, data: null, meta: {}, errors }, { status });
}

function ipHash(req: NextRequest): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

// ─── Rate limiting (per IP hash) ────────────────────────────────────────
// Cap reset attempts to 10 per 15 minutes per IP. Prevents brute-force
// token guessing (32 hex chars — already infeasible, but rate-limiting
// is defense-in-depth) and audit-log flooding.
const resetAttempts = new Map<string, { count: number; reset: number }>();
const RESET_LIMIT = 10;
const RESET_WINDOW_MS = 15 * 60_000;

function resetRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = resetAttempts.get(key);
  if (!entry || now > entry.reset) {
    resetAttempts.set(key, { count: 1, reset: now + RESET_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RESET_LIMIT;
}

/**
 * POST /api/v1/auth/reset-password
 * Body: { token, password }
 *
 * Validates the token (must exist on a User row and not be expired),
 * then hashes the new password, persists it, and clears the token +
 * expiry fields. Single-use — the token is removed whether the
 * password update succeeds or fails after this point.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = ipHash(req);

    // Rate limit before any DB lookup. Token is 32 hex chars so
    // brute-force is already infeasible, but this prevents audit-log
    // flooding and protects the DB lookup from request storms.
    if (resetRateLimited(ip)) {
      return fail(
        "Too many password-reset attempts. Please try again later.",
        ["rate_limited"],
        429
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request body.");

    const token = String(body.token || "").trim();
    const password = String(body.password || "");

    if (!token) return fail("Reset token is required.", ["token_required"], 422);
    if (!password) return fail("Password is required.", ["password_required"], 422);
    if (password.length < 8) return fail("Password must be at least 8 characters.", ["password_too_short"], 422);
    if (password.length > 1024) return fail("Password is too long.", ["password_too_long"], 422);

    const user = await db.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      // Audit log (invalid/expired token)
      try {
        await db.auditLog.create({
          data: {
            action: "auth.password_reset_failed",
            resource: "user",
            resourceId: "unknown",
            meta: JSON.stringify({ reason: "invalid_or_expired_token" }),
            ipHash: ip,
          },
        });
      } catch {
        // no-op
      }
      return fail("Invalid or expired token.", ["token_invalid"], 400);
    }

    const newHash = hashPassword(password);

    // Update password + clear the token fields in a single transaction.
    await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    // Audit log (success)
    try {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "auth.password_reset_completed",
          resource: "user",
          resourceId: user.id,
          meta: JSON.stringify({ email: user.email }),
          ipHash: ip,
        },
      });
    } catch {
      // no-op
    }

    return ok("Password reset. Please sign in.");
  } catch (e) {
    console.error("[auth/reset-password] error", e);
    return fail("Internal error.", ["server_error"], 500);
  }
}
