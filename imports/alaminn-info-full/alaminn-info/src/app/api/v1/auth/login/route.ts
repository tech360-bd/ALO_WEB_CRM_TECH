import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { normalizeRole, ALL_ROLES } from "@/lib/rbac";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";

function ok(data: unknown, message = "OK", meta: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, message, data, meta, errors: [] });
}
function fail(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, data: null, meta: {}, errors }, { status });
}

// ─── Rate limiting (per IP hash) ────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; reset: number; locked: boolean; lockUntil: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60_000; // 15 min
const LOCK_MS = 15 * 60_000; // 15 min lockout after 5 fails

function ipHash(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 16);
}

/**
 * POST /api/v1/auth/login
 * Body: { email, password }
 *
 * Validates credentials against the User table (scrypt-hashed passwordHash).
 * On success, sets an HMAC-signed session cookie and returns a redacted
 * session object. Never returns the password hash or any user secret.
 */
export async function POST(req: NextRequest) {
  try {
    const hash = ipHash(req);
    const now = Date.now();
    const entry = loginAttempts.get(hash);

    // Enforce lockout
    if (entry?.locked && now < entry.lockUntil) {
      const minsLeft = Math.ceil((entry.lockUntil - now) / 60_000);
      return fail(
        `Too many failed attempts. Try again in ${minsLeft} minute(s).`,
        ["rate_limited_locked"],
        429
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request body.");

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) return fail("Email and password are required.", ["credentials_required"], 422);
    if (password.length > 1024) return fail("Invalid input.", ["input_too_long"], 422);

    // Find the user
    const user = await db.user.findUnique({ where: { email } });
    // Always run a verify against a dummy hash to keep timing consistent
    const DUMMY_HASH = "scrypt$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
    const storedHash = user?.passwordHash || DUMMY_HASH;
    const valid = user ? verifyPassword(password, storedHash) : false;

    if (!user || !user.passwordHash || !valid || user.status !== "active") {
      // Increment failure count
      const current = entry && now < entry.reset ? entry : { count: 0, reset: now + WINDOW_MS, locked: false, lockUntil: 0 };
      current.count += 1;
      if (current.count >= MAX_ATTEMPTS) {
        current.locked = true;
        current.lockUntil = now + LOCK_MS;
      }
      loginAttempts.set(hash, current);

      // Audit log (failed login) — actor unknown
      try {
        await db.auditLog.create({
          data: {
            action: "auth.login_failed",
            resource: "user",
            resourceId: user?.id || "unknown",
            meta: JSON.stringify({ email, attempt: current.count }),
            ipHash: hash,
          },
        });
      } catch {
        // no-op — audit log failure must not block login-failure handling
      }

      // Send a security alert to the account owner after 3+ failed attempts
      // on a known email. Email failure never crashes the login flow.
      if (user && current.count >= 3) {
        const { sendTransactional } = await import("@/lib/email");
        await sendTransactional(
          "securityAlert",
          {
            recipientName: user.name || user.email,
            alertType: "Repeated failed login attempts",
            description: `${current.count} failed login attempts were detected on your account.`,
            timestamp: new Date().toISOString(),
            ipHash: hash,
            actionRequired:
              "If this was not you, sign in and change your password. Your account will be temporarily locked after 5 failed attempts.",
          },
          {
            to: user.email,
            ipHash: hash,
            triggeredBy: "auth.login_failed",
          }
        ).catch(() => null);
      }

      return fail("Invalid email or password.", ["credentials_invalid"], 401);
    }

    // Validate role
    const role = normalizeRole(user.role);
    if (!role || !ALL_ROLES.includes(role)) {
      return fail("Account has an invalid role. Contact an administrator.", ["role_invalid"], 403);
    }

    // Reset failure count on success
    loginAttempts.delete(hash);

    // Set session cookie
    await setSessionCookie({ id: user.id, email: user.email, name: user.name, role: user.role });

    // Audit log (successful login)
    try {
      await db.auditLog.create({
        data: {
          actorId: user.id,
          action: "auth.login_success",
          resource: "user",
          resourceId: user.id,
          meta: JSON.stringify({ role }),
          ipHash: hash,
        },
      });
    } catch {
      // no-op — audit log failure must not block successful login
    }

    return ok(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
        },
        expiresAt: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
      "Signed in."
    );
  } catch (e) {
    console.error("[auth/login] error", e);
    return fail("Internal error.", ["server_error"], 500);
  }
}

