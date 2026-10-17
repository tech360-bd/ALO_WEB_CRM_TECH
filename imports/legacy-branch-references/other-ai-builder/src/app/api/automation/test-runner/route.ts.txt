import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/automation/test-runner
// Manually trigger a test scenario.
// SUPER_ADMIN / ADMIN only.
// Body: { scenario }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN required" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const scenario = body?.scenario as string;
    if (!scenario) {
      return NextResponse.json({ error: "scenario is required" }, { status: 400 });
    }

    const startedAt = Date.now();
    const { isGlobalAiPaused } = await import("@/lib/ai-safety");
    const paused = await isGlobalAiPaused();

    let result: Record<string, unknown> = { scenario, paused };

    if (!paused) {
      // Run a minimal smoke test — pick one workflow based on scenario
      const lib = await import("@/lib/automation-engine");
      if (scenario === "sla_smoke") {
        result.slaTracking = await lib.runSlaTracking().catch((e) => ({ error: e?.message }));
      } else if (scenario === "notifications_smoke") {
        result.notifications = await lib.runAutomatedNotifications().catch((e) => ({ error: e?.message }));
      } else if (scenario === "reports_smoke") {
        result.report = await lib.runReportGeneration().catch((e) => ({ error: e?.message }));
      } else if (scenario === "missing_data_smoke") {
        result.missingData = await lib.runMissingDataDetection().catch((e) => ({ error: e?.message }));
      } else {
        return NextResponse.json({ error: `Unknown scenario: ${scenario}` }, { status: 400 });
      }
    }

    const durationMs = Date.now() - startedAt;

    // Record test run as audit log
    await db.auditLog.create({
      data: {
        action: "AUTOMATION_TEST_RUN",
        resource: "AutomationEngine",
        userId: (session.user as any).id,
        details: JSON.stringify({ scenario, durationMs, ...result }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, durationMs, ...result });
  } catch (err: any) {
    console.error("[automation/test-runner POST] error", err);
    return NextResponse.json({ error: err?.message || "Test run failed" }, { status: 500 });
  }
}

// GET /api/automation/test-runner
// Returns recent test-run audit logs.
export async function GET() {
  try {
    const recent = await db.auditLog.findMany({
      where: { action: "AUTOMATION_TEST_RUN" },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, details: true, createdAt: true, userId: true },
    });
    const parsed = recent.map((r) => {
      let d: Record<string, unknown> = {};
      try { d = JSON.parse(r.details || "{}"); } catch {}
      return { id: r.id, createdAt: r.createdAt, userId: r.userId, ...d };
    });
    return NextResponse.json({ recent: parsed });
  } catch (err: any) {
    console.error("[automation/test-runner GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load test runs" }, { status: 500 });
  }
}
