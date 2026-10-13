import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/referral-retry
 *
 * Reports the count of HigherStudyReferral records in a "pending"
 * (`created`) or `failed` state. Does NOT actually retry — this is a
 * read-only QA job that surfaces backlog size so an operator can decide
 * whether to run a manual retry pass.
 *
 * Recommended cPanel cron schedule: `30 * * * *` (hourly at :30).
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

    // Schema status values for HigherStudyReferral:
    //   created | transferred | completed | failed | expired
    // "pending" maps to `created` (created but not yet transferred).
    const [pending, failed] = await Promise.all([
      db.higherStudyReferral
        .count({ where: { status: "created" } })
        .catch(() => 0),
      db.higherStudyReferral
        .count({ where: { status: "failed" } })
        .catch(() => 0),
    ]);

    const totalBacklog = pending + failed;

    console.log(
      `[cron:referral-retry] pending=${pending} failed=${failed} total=${totalBacklog} (read-only — no retry performed)`
    );

    return NextResponse.json({
      success: true,
      message: "Referral backlog scan complete (read-only).",
      data: {
        pending,
        failed,
        total: totalBacklog,
        retried: 0,
        note: "Read-only scan — no retries performed. Inspect /api/v1/higher-study/admin/referrals to act.",
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
