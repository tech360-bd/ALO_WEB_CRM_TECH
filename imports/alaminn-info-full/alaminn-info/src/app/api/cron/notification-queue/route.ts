import { NextResponse, type NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/notification-queue
 *
 * Reports the in-app notification queue state. The notification-service
 * (port 3005) is an in-memory service — there is no durable queue to
 * inspect, so this endpoint returns a fixed zero-state summary. It exists
 * to give the cron scheduler a consistent surface across all queue types.
 *
 * Recommended cPanel cron schedule: `0/15 * * * *` (every 15 minutes).
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
      `[cron:notification-queue] pending=0 — notification-service is in-memory`
    );

    return NextResponse.json({
      success: true,
      message: "Notification queue scan complete.",
      data: {
        pending: 0,
        note: "notification-service (port 3005) is in-memory — no durable queue to inspect.",
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
