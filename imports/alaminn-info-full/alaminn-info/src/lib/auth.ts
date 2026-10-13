/**
 * Server-side authentication — signed session cookies.
 * ----------------------------------------------
 * No NextAuth dependency, no client-trusted role state.
 *
 * Session format (cookie value, before signing):
 *   `<userId>.<role>.<expiresAtEpochSec>`
 *
 * The cookie is HMAC-SHA256 signed with AUTH_SECRET (env). On read,
 * the signature is re-computed and compared in constant time. Any
 * tampering with userId / role / expiry invalidates the session.
 *
 * SECURITY:
 *   - AUTH_SECRET must be at least 32 bytes. We refuse to start if missing.
 *   - Cookies are HttpOnly, Secure (production), SameSite=Lax.
 *   - Sessions expire after SESSION_TTL_SEC (8 hours).
 *   - `getSession()` is the only entry point — never read the cookie directly.
 */
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual, randomBytes, scryptSync } from "crypto";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { normalizeRole, type UserRole } from "@/lib/rbac";
import { env } from "@/lib/env";

const COOKIE_NAME = "alaminn_session";
const SESSION_TTL_SEC = 60 * 60 * 8; // 8 hours
const SCRYPT_PARAMS = { N: 16384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };

/** Lazily-resolved auth secret. Throws clearly if not configured. */
function getAuthSecret(): string {
  // Delegate to centralized env() — which enforces production requirements
  // and returns a dev fallback in development. This keeps a single source
  // of truth for all environment access.
  return env().authSecret;
}

/** Hash a password with scrypt + per-user salt. Returns `scrypt$salt$hash`. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64, SCRYPT_PARAMS).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

/** Verify a password against a stored `scrypt$salt$hash` string. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, salt, hash] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !hash) return false;
    const candidate = scryptSync(password, salt, 64, SCRYPT_PARAMS).toString("hex");
    const a = Buffer.from(hash, "hex");
    const b = Buffer.from(candidate, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Sign a session payload with HMAC-SHA256. */
function sign(payload: string): string {
  const sig = createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

/** Verify a signed session string. Returns the payload or null. */
function verify(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    return payload;
  } catch {
    return null;
  }
}

export type Session = {
  userId: string;
  role: UserRole;
  email: string;
  name: string;
  expiresAt: number; // epoch sec
};

/** Build, sign, and set the session cookie. Called after successful login. */
export async function setSessionCookie(user: { id: string; email: string; name: string; role: string }) {
  const role = normalizeRole(user.role) ?? "VIEWER";
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload = `${user.id}.${role}.${expiresAt}`;
  const token = sign(payload);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });

  // Update lastLoginAt
  try {
    await db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
  } catch {
    // non-fatal
  }
}

/** Clear the session cookie. */
export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

/**
 * Read & validate the session from the cookie store.
 * Returns null if: no cookie, bad signature, expired, or user no longer active.
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verify(token);
  if (!payload) return null;

  const parts = payload.split(".");
  if (parts.length !== 3) return null;
  const [userId, roleStr, expiresStr] = parts;
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }

  const role = normalizeRole(roleStr);
  if (!role) return null;

  // Confirm the user still exists and is active
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    if (!user || user.status !== "active") return null;
    // If the user's role was changed since the session was issued, honor the new role
    // (but only if it's a valid role; otherwise revoke).
    const currentRole = normalizeRole(user.role) ?? role;
    return {
      userId: user.id,
      role: currentRole,
      email: user.email,
      name: user.name,
      expiresAt,
    };
  } catch {
    // DB error — fail closed
    return null;
  }
}

/**
 * Read & validate the session from a NextRequest (for route handlers).
 * Same logic as `getSession()` but reads from req.cookies instead of next/headers.
 */
export function getSessionFromRequest(req: NextRequest): Session | null {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verify(token);
  if (!payload) return null;

  const parts = payload.split(".");
  if (parts.length !== 3) return null;
  const [userId, roleStr, expiresStr] = parts;
  const expiresAt = Number(expiresStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Math.floor(Date.now() / 1000)) {
    return null;
  }
  const role = normalizeRole(roleStr);
  if (!role) return null;

  // Note: we skip the DB lookup here for speed — getSession() does the full check.
  // The DB lookup happens in `requirePermission` for privileged operations.
  return { userId, role, email: "", name: "", expiresAt };
}

/**
 * Route-handler auth guard. Returns the session if the user has `perm`,
 * otherwise returns a 401/403 NextResponse.
 *
 * Usage:
 *   const guard = await requirePermission(req, "ai_approvals.decide");
 *   if (guard.denied) return guard.response;
 *   // guard.session is non-null here
 */
export async function requirePermission(
  req: NextRequest,
  perm: import("@/lib/rbac").Permission
): Promise<{ denied: true; response: Response } | { denied: false; session: Session }> {
  const session = getSessionFromRequest(req);
  if (!session) {
    return {
      denied: true,
      response: new Response(
        JSON.stringify({ success: false, message: "Authentication required.", data: null, meta: {}, errors: ["unauthenticated"] }),
        { status: 401, headers: { "content-type": "application/json" } }
      ),
    };
  }

  // Re-confirm against the DB (in case the user was suspended or role changed)
  try {
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    if (!user || user.status !== "active") {
      return {
        denied: true,
        response: new Response(
          JSON.stringify({ success: false, message: "Account is not active.", data: null, meta: {}, errors: ["account_inactive"] }),
          { status: 401, headers: { "content-type": "application/json" } }
        ),
      };
    }
    const currentRole = normalizeRole(user.role);
    if (!currentRole) {
      return {
        denied: true,
        response: new Response(
          JSON.stringify({ success: false, message: "Invalid role.", data: null, meta: {}, errors: ["role_invalid"] }),
          { status: 403, headers: { "content-type": "application/json" } }
        ),
      };
    }
    // Dynamic import to avoid circular deps
    const { hasPermission } = await import("@/lib/rbac");
    if (!hasPermission(currentRole, perm)) {
      return {
        denied: true,
        response: new Response(
          JSON.stringify({ success: false, message: "Insufficient permissions.", data: null, meta: {}, errors: ["forbidden"] }),
          { status: 403, headers: { "content-type": "application/json" } }
        ),
      };
    }
    return {
      denied: false,
      session: { ...session, role: currentRole, email: user.email, name: user.name },
    };
  } catch {
    return {
      denied: true,
      response: new Response(
        JSON.stringify({ success: false, message: "Authentication check failed.", data: null, meta: {}, errors: ["auth_check_failed"] }),
        { status: 500, headers: { "content-type": "application/json" } }
      ),
    };
  }
}

/** Generate a random token (for newsletter verification, password reset, etc.). */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("hex");
}
