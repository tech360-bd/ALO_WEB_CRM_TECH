import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { env } from "@/lib/env";
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
// Password-reset endpoints are high-value targets for account enumeration
// and email-flooding attacks. Cap to 5 requests per 15 minutes per IP.
// Even though the response is identical whether or not the email exists,
// rate-limiting prevents an attacker from triggering mass emails or
// hammering the DB lookup.
const forgotAttempts = new Map<string, { count: number; reset: number }>();
const FORGOT_LIMIT = 5;
const FORGOT_WINDOW_MS = 15 * 60_000;

function forgotRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = forgotAttempts.get(key);
  if (!entry || now > entry.reset) {
    forgotAttempts.set(key, { count: 1, reset: now + FORGOT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > FORGOT_LIMIT;
}

/**
 * POST /api/v1/auth/forgot-password
 * Body: { email }
 *
 * Looks up the user by email. If found, generates a single-use reset
 * token (32 random bytes hex), stores passwordResetToken + an expiry
 * (now + 1 hour) on the User row, and logs the token to console (so
 * it can be retrieved in dev — no SMTP configured). If the user is
 * not found, returns 200 with the same message — never leaks account
 * existence. Always writes an AuditLog entry.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = ipHash(req);

    // Rate limit BEFORE the DB lookup so an attacker can't brute-force
    // email enumeration. Returns the same response shape so the limit
    // itself doesn't leak.
    if (forgotRateLimited(ip)) {
      return fail(
        "Too many password-reset requests. Please try again later.",
        ["rate_limited"],
        429
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request body.");

    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return fail("Email is required.", ["email_required"], 422);

    const user = await db.user.findUnique({ where: { email } }).catch(() => null);

    if (user) {
      const token = generateToken(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1 hour
      await db.user.update({
        where: { id: user.id },
        data: { passwordResetToken: token, passwordResetExpiresAt: expiresAt },
      });

      // Reset link (the admin reset-password page reads ?token=…)
      const resetUrl = `${env().siteUrl}/admin/reset-password?token=${token}`;

      // Always log the token to console so it can be retrieved in dev
      // (no SMTP configured in this environment).
      console.log(
        `\n┌─── 🔑 PASSWORD RESET TOKEN ───────────────────────────────\n` +
          `│ Email: ${user.email}\n` +
          `│ Token: ${token}\n` +
          `│ Reset URL: ${resetUrl}\n` +
          `│ Expires: ${expiresAt.toISOString()}\n` +
          `└──────────────────────────────────────────────────────────\n`
      );

      // Best-effort: if an email transport IS configured, send the
      // real password-reset email. Never let failure here crash the
      // request — the console log above already gives us a usable link.
      if (env().emailConfigured) {
        try {
          const { sendTransactional } = await import("@/lib/email");
          await sendTransactional(
            "passwordReset",
            {
              name: user.name || user.email,
              resetUrl,
              expiresIn: "1 hour",
            },
            {
              to: user.email,
              ipHash: ip,
              triggeredBy: "auth.password_reset_requested",
            }
          ).catch(() => null);
        } catch {
          // no-op — email transport optional
        }
      }

      // Audit log
      try {
        await db.auditLog.create({
          data: {
            actorId: user.id,
            action: "auth.password_reset_requested",
            resource: "user",
            resourceId: user.id,
            meta: JSON.stringify({ email }),
            ipHash: ip,
          },
        });
      } catch {
        // no-op — audit log failure must not block the flow
      }
    } else {
      // Audit log (no user matched) — still log the attempt so
      // security auditors can spot password-reset enumeration.
      try {
        await db.auditLog.create({
          data: {
            action: "auth.password_reset_requested",
            resource: "user",
            resourceId: "unknown",
            meta: JSON.stringify({ email, matched: false }),
            ipHash: ip,
          },
        });
      } catch {
        // no-op
      }
    }

    // Same response whether or not the email matched — never leak.
    return ok("If the email exists, a reset link has been sent.");
  } catch (e) {
    console.error("[auth/forgot-password] error", e);
    // Even on internal error, don't leak details — return generic 200.
    return ok("If the email exists, a reset link has been sent.");
  }
}
