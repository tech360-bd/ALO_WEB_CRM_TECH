import { NextResponse, type NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/session-cleanup
 *
 * Alaminn.info uses signed JWT-style session cookies (see `src/lib/auth.ts`)
 * which are stateless — there is no server-side session store to garbage
 * collect. Cookie expiry is enforced by the signed `expiresAt` claim and
 * the cookie's own `maxAge`. This endpoint is a no-op reporting hook that
 * exists to keep the cron surface consistent.
 *
 * Recommended cPanel cron schedule: not required. If you add server-side
 * session storage in the future, schedule `0 5 * * *` (daily at 05:00).
 *
 * Auth: requires `x-cron-secret` header (or `?secret=` query) matching the
 * `CRON_SECRET` environment variable. Returns 401 on auth failure, 503 if
 * the server is misconfigured (no CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
        data: null,
        meta: {},
        errors: [auth.error],
      },
      { status: auth.status }
    );
  }

  try {
    const now = new Date();
    console.log(
      `[cron:session-cleanup] cleaned=0 — sessions are JWT-based (stateless)`
    );

    return NextResponse.json({
      success: true,
      message: "Session cleanup is a no-op.",
      data: {
        cleaned: 0,
        note: "Sessions are JWT-based (stateless); no server-side cleanup needed. Cookie expiry is enforced by the signed expiresAt claim.",
      },
      meta: {
        scannedAt: now.toISOString(),
      },
      errors: [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Cron job failed",
        data: null,
        meta: {},
        errors: [String(error)],
      },
      { status: 500 }
    );
  }
}
