import { NextRequest, NextResponse } from "next/server";
import { mutationOriginAllowed } from "@/lib/request-origin";
import { requireMonitoringAdmin } from "@/lib/university-monitoring-auth";
import { startMonitoringRun } from "@/lib/university-monitoring-runner";

// POST /api/university-monitoring/trigger
// Super Admin: manually trigger a monitoring run (bypasses the 7-day gate but
// still respects the distributed lock, so it can never cause a duplicate
// concurrent run).
//
// SECURITY: this route previously had NO authentication and took the acting
// user from the request body, so any anonymous caller could start outbound
// scraping runs attributed to the Super Admin. The actor now comes from the
// authenticated session and must hold SUPER_ADMIN.
//
// The run lifecycle (lock, VerificationRun, logging, nextRunAt, retry
// bookkeeping, report delivery) lives in university-monitoring-runner.ts and
// is shared with the scheduled cron entry point.
export async function POST(req: NextRequest) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  if (!mutationOriginAllowed(req, guard.actor.auth)) {
    return NextResponse.json({ error: "Cross-origin monitoring triggers are not allowed" }, { status: 403 });
  }
  const actor = guard.actor;

  const body = await req.json().catch(() => ({}));
  const { scope = "verified-only", limit } = body as { scope?: string; limit?: number };

  const result = await startMonitoringRun({
    trigger: "MANUAL",
    actorId: actor.userId,
    actorLabel: actor.email,
    scope,
    limit: typeof limit === "number" ? Math.min(Math.max(limit, 1), 500) : undefined,
    force: true,
  });

  switch (result.status) {
    case "DISABLED":
      return NextResponse.json(
        { error: "Monitoring job is disabled. Enable it before triggering a run." },
        { status: 409 },
      );
    case "LOCKED":
      return NextResponse.json(
        {
          error: "A monitoring run is already in progress",
          lockedBy: result.lockedBy,
          lockExpiresAt: result.lockExpiresAt,
        },
        { status: 409 },
      );
    case "NOT_DUE":
      // Unreachable with force:true, but keeps the switch exhaustive.
      return NextResponse.json({ status: "NOT_DUE", nextRunAt: result.nextRunAt });
    case "FAILED":
      return NextResponse.json({ error: result.error, runId: result.runId }, { status: 500 });
    default:
      return NextResponse.json({
        runId: result.runId,
        runKey: result.runKey,
        status: result.status,
        ...result.counts,
        aiReportSummary: result.aiReportSummary,
      });
  }
}
