import { NextResponse, type NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/backup
 *
 * Database backups are managed at the infrastructure layer (cPanel cron
 * invoking `scripts/backup-db.ts` directly) — not from within the Next.js
 * process. This endpoint exists as a health/reporting hook so an operator
 * can confirm the cron surface is alive and that the documented backup
 * command is the source of truth.
 *
 * Recommended cPanel cron schedule: `0 2 * * *` (daily at 02:00) running
 *   `cd /path/to/app && npx tsx scripts/backup-db.ts` directly via cPanel.
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
      `[cron:backup] triggered=true — actual backup runs via scripts/backup-db.ts in cPanel cron`
    );

    return NextResponse.json({
      success: true,
      message: "Backup hook acknowledged.",
      data: {
        triggered: true,
        note: "Use scripts/backup-db.ts via cPanel cron for actual backup. This endpoint is a reporting/health hook only and does not perform the backup itself.",
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
