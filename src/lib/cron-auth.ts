import { NextResponse } from "next/server";
import crypto from "crypto";
import { authenticateRequest, type AuthContext } from "@/lib/auth-middleware";

/**
 * Shared authorization guard for `/api/cron/*` endpoints.
 *
 * Why this exists (2026-09-18 audit): every cron route was reachable by any
 * anonymous caller. Seven had no check at all, and two (`sla-monitor`,
 * `weekly-university-scan`) contained a guard whose body was empty — the
 * condition was evaluated and then nothing was returned, so the request always
 * proceeded. Because these are plain GET routes, a single unauthenticated
 * request could trigger outbound WhatsApp follow-ups, generate reports, drain
 * retry queues or start scraping jobs.
 *
 * Accepted callers, in order:
 *   1. An external scheduler presenting the cron secret
 *      (`Authorization: Bearer <secret>` or `x-cron-secret`), compared in
 *      constant time.
 *   2. An authenticated SUPER_ADMIN/ADMIN session, so the admin UI can trigger
 *      a job manually.
 *
 * Fails closed: in production a missing or too-short secret rejects everything
 * rather than silently allowing the request.
 *
 * Derived from the one correct implementation already in the repo
 * (`src/app/api/automation/schedule/route.ts` → `verifyCronSecret`).
 */

const MIN_SECRET_LENGTH = 16;

/** Roles allowed to trigger a cron job interactively from an admin session. */
const ALLOWED_SESSION_ROLES = ["super_admin", "admin", "SUPER_ADMIN", "ADMIN"];

function constantTimeEqual(provided: string, expected: string): boolean {
  try {
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** True when a usable cron secret is configured on this server. */
export function isCronSecretConfigured(): boolean {
  const expected = process.env.ALO_CRON_SECRET ?? process.env.CRON_SECRET;
  return !!expected && expected.length >= MIN_SECRET_LENGTH;
}

/** Verify the scheduler secret. Never logs or echoes the value. */
export function verifyCronSecret(req: Request): boolean {
  const expected = process.env.ALO_CRON_SECRET ?? process.env.CRON_SECRET;
  if (!expected || expected.length < MIN_SECRET_LENGTH) return false;

  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const headerSecret =
    req.headers.get("x-cron-secret") ?? req.headers.get("x-alo-cron-secret") ?? "";
  const provided = bearer || headerSecret;
  if (!provided) return false;

  return constantTimeEqual(provided, expected);
}

export type CronAuthResult =
  | { ok: true; via: "secret" | "session"; auth?: AuthContext }
  | { ok: false; response: NextResponse };

/**
 * Authorize a cron request. Returns the caller context, or a ready-to-return
 * 401 response.
 */
export async function authorizeCronRequest(req: Request): Promise<CronAuthResult> {
  if (verifyCronSecret(req)) return { ok: true, via: "secret" };

  // Fall back to an authenticated privileged session (admin UI trigger).
  const session = await authenticateRequest(req);
  if (!(session instanceof NextResponse)) {
    const isPrivileged =
      session.userType === "SUPER_ADMIN" ||
      session.userType === "ADMIN" ||
      session.roles.some((r) => ALLOWED_SESSION_ROLES.includes(r));
    if (isPrivileged) return { ok: true, via: "session", auth: session };
  }

  const isProduction = (process.env.NODE_ENV ?? "production") === "production";

  // Fail closed in production. Outside production, still reject when a secret
  // IS configured but wrong — a misconfigured dev caller should not pass.
  if (isProduction || isCronSecretConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Unauthorized",
          hint: isCronSecretConfigured()
            ? "Provide Authorization: Bearer $ALO_CRON_SECRET or an admin session."
            : "ALO_CRON_SECRET is not configured on this server (>= 16 chars required).",
        },
        { status: 401 }
      ),
    };
  }

  return { ok: true, via: "secret" };
}

/**
 * Convenience wrapper: authorize, and hand back a 401 immediately when denied.
 *
 *   const denied = await requireCron(req);
 *   if (denied) return denied;
 */
export async function requireCron(req: Request): Promise<NextResponse | null> {
  const result = await authorizeCronRequest(req);
  return result.ok ? null : result.response;
}
