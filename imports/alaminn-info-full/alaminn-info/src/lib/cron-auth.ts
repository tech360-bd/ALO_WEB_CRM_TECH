/**
 * Cron request authentication.
 * --------------------------------
 * Provides a single `verifyCronAuth()` helper used by every endpoint under
 * `/api/cron/*`. All cron endpoints are designed to be invoked by an external
 * scheduler (cPanel cron, systemd timer, etc.) — never by browsers — so they
 * authenticate via a shared `CRON_SECRET` rather than a user session.
 *
 * SECURITY:
 *   - Fail closed: if `CRON_SECRET` is not configured in the environment,
 *     every cron endpoint refuses to run (returns 503) rather than executing
 *     unauthenticated. This prevents accidental open cron endpoints in
 *     misconfigured deployments.
 *   - Constant-time comparison via `timingSafeEqual` to prevent timing
 *     attacks against the secret.
 *   - Accepts the secret via either the `x-cron-secret` header (preferred)
 *     or a `?secret=` query parameter (fallback for schedulers that cannot
 *     set headers). Both are matched in constant time.
 *
 * The header lookup uses the standard `Headers` API which is case-insensitive
 * per the WHATWG fetch spec, so `X-Cron-Secret`, `x-cron-secret`, etc. all
 * resolve to the same value.
 */
import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";

export type CronAuthResult =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: string };

/**
 * Verify that an inbound cron request carries the correct secret.
 *
 * @param request The NextRequest inbound to a `/api/cron/*` route.
 * @returns `{ ok: true }` on success, or `{ ok: false, status, error }` on
 *   failure. `status` is `503` when the server is misconfigured (CRON_SECRET
 *   missing) and `401` for missing/wrong credentials. Callers should return
 *   the status code as-is.
 */
export function verifyCronAuth(request: NextRequest): CronAuthResult {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length === 0) {
    // Fail closed — server is misconfigured. Do not run the cron job.
    return {
      ok: false,
      status: 503,
      error: "CRON_SECRET not configured",
    };
  }

  // Prefer header; fall back to ?secret= query param for legacy schedulers.
  const headerVal = request.headers.get("x-cron-secret");
  const queryVal = request.nextUrl.searchParams.get("secret");
  const provided = headerVal ?? queryVal;

  if (!provided) {
    return {
      ok: false,
      status: 401,
      error: "Missing x-cron-secret header or ?secret= query parameter",
    };
  }

  // Constant-time comparison. timingSafeEqual throws on length mismatch, so
  // we guard with an explicit length check first. Even though the length
  // check leaks the secret length, the actual byte comparison remains
  // constant-time — sufficient for protecting a high-entropy shared secret.
  const a = Buffer.from(secret, "utf8");
  const b = Buffer.from(provided, "utf8");
  if (a.length !== b.length) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  try {
    if (!timingSafeEqual(a, b)) {
      return { ok: false, status: 401, error: "Unauthorized" };
    }
    return { ok: true };
  } catch {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
}
