import { NextResponse, type NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/email-queue
 *
 * Reports the email queue state. In this deployment there is no
 * persistent email-queue table — the in-process `email-worker` mini-service
 * (port 3002) handles sending with its own retry+backoff, and the audit
 * log captures each attempt. This endpoint is a placeholder that returns a
 * zero-state summary so the cron scheduler has a consistent surface to hit.
 *
 * Recommended cPanel cron schedule: `15 * * * *` (hourly at :15).
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
      `[cron:email-queue] queued=0 failed=0 — email-worker mini-service handles queueing+retries`
    );

    return NextResponse.json({
      success: true,
      message: "Email queue scan complete.",
      data: {
        queued: 0,
        failed: 0,
        note: "No persistent email-queue table. The email-worker mini-service (port 3002) handles sending, retries, and audit logging.",
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
