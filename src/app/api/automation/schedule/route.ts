import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/automation/schedule
// Cron-triggered: runs all scheduler workflows.
// Checks isGlobalAiPaused first — short-circuits if paused.
// PUBLIC route (no session) — typically called by a cron worker with a secret.
export async function POST() {
  try {
    const { isGlobalAiPaused } = await import("@/lib/ai-safety");
    const paused = await isGlobalAiPaused();
    if (paused) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Global AI pause is active — scheduler skipped.",
        results: [],
      });
    }

    const { runAllSchedulerWorkflows } = await import("@/lib/automation-engine");
    const results = await runAllSchedulerWorkflows();

    // Persist metrics for each workflow outcome
    try {
      for (const r of results) {
        await db.auditLog.create({
          data: {
            action: "AUTOMATION_SCHEDULER_TICK",
            resource: "AutomationEngine",
            details: JSON.stringify({
              workflow: r.workflow,
              success: r.success,
              skipped: r.skipped,
              reason: r.reason ?? null,
              eventId: r.eventId ?? null,
              durationMs: r.durationMs ?? 0,
            }),
          },
        }).catch(() => {});
      }
    } catch {}

    return NextResponse.json({ success: true, skipped: false, results });
  } catch (err: any) {
    console.error("[automation/schedule POST] error", err);
    return NextResponse.json({ error: err?.message || "Scheduler run failed" }, { status: 500 });
  }
}

// GET /api/automation/schedule
// Returns recent scheduler tick metrics.
export async function GET() {
  try {
    const recent = await db.auditLog.findMany({
      where: { action: "AUTOMATION_SCHEDULER_TICK" },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        details: true,
        createdAt: true,
      },
    });

    const parsed: Array<Record<string, unknown>> = recent.map((r) => {
      let d: Record<string, unknown> = {};
      try { d = JSON.parse(r.details || "{}"); } catch {}
      return { id: r.id, createdAt: r.createdAt, ...d };
    });

    const total = parsed.length;
    const successes = parsed.filter((p) => p.success === true).length;
    const skipped = parsed.filter((p) => p.skipped === true).length;
    const failed = parsed.filter((p) => p.success === false && !p.skipped).length;

    return NextResponse.json({
      total,
      successes,
      skipped,
      failed,
      recent: parsed,
    });
  } catch (err: any) {
    console.error("[automation/schedule GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load metrics" }, { status: 500 });
  }
}
