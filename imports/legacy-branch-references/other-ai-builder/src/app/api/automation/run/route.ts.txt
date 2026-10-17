import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/automation/run
// Manually trigger a specific workflow.
// SUPER_ADMIN / ADMIN only.
// Body: { workflow, targetId?, days? }
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
    const workflow = body?.workflow as string;
    const targetId = body?.targetId as string | undefined;
    const days = Number(body?.days) || 1;

    if (!workflow) {
      return NextResponse.json({ error: "workflow is required" }, { status: 400 });
    }

    const lib = await import("@/lib/automation-engine");
    let result: any;

    switch (workflow) {
      case "lead_welcome":
        if (!targetId) return NextResponse.json({ error: "targetId required for lead_welcome" }, { status: 400 });
        result = await lib.runLeadWelcomeFlow(targetId);
        break;
      case "lead_scoring":
        if (!targetId) return NextResponse.json({ error: "targetId required for lead_scoring" }, { status: 400 });
        result = await lib.runLeadScoring(targetId);
        break;
      case "counselor_assignment":
        if (!targetId) return NextResponse.json({ error: "targetId required for counselor_assignment" }, { status: 400 });
        result = await lib.runCounselorAssignment(targetId);
        break;
      case "follow_up_task":
        if (!targetId) return NextResponse.json({ error: "targetId required for follow_up_task" }, { status: 400 });
        result = await lib.runFollowUpTaskCreation(targetId, days);
        break;
      case "lead_tagging":
        if (!targetId) return NextResponse.json({ error: "targetId required for lead_tagging" }, { status: 400 });
        result = await lib.runLeadTagging(targetId);
        break;
      case "sla_tracking":
        result = await lib.runSlaTracking();
        break;
      case "missing_data_detection":
        result = await lib.runMissingDataDetection(targetId);
        break;
      case "deadline_reminders":
        result = await lib.runDeadlineReminders();
        break;
      case "automated_notifications":
        result = await lib.runAutomatedNotifications();
        break;
      case "report_generation":
        result = await lib.runReportGeneration();
        break;
      case "run_all":
        result = await lib.runAllSchedulerWorkflows();
        break;
      default:
        return NextResponse.json({ error: `Unknown workflow: ${workflow}` }, { status: 400 });
    }

    return NextResponse.json({ workflow, result });
  } catch (err: any) {
    console.error("[automation/run] error", err);
    return NextResponse.json({ error: err?.message || "Workflow run failed" }, { status: 500 });
  }
}
