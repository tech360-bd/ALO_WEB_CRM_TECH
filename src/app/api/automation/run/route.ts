import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runWorkflow } from "@/lib/automation-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_WORKFLOWS = [
  "lead_scoring",
  "counselor_assignment",
  "follow_up_task_creation",
  "lead_welcome_flow",
  "lead_tagging",
  "content_signal_collection",
  "university_twin_refresh",
  "stale_content_detection",
  "sla_tracking",
  "missing_data_detection",
  "deadline_reminders",
  "automated_notifications",
  "report_generation",
] as const;

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const workflow = String(body.workflow || "");
    if (!VALID_WORKFLOWS.includes(workflow as (typeof VALID_WORKFLOWS)[number])) {
      return NextResponse.json({ error: `Invalid workflow. Valid: ${VALID_WORKFLOWS.join(", ")}` }, { status: 400 });
    }

    const result = await runWorkflow(workflow, {
      targetId: body.targetId,
      days: body.days,
      actorId: (session.user as { id?: string }).id,
      dryRun: body.dryRun === true,
    });
    return NextResponse.json({ success: true, workflow, result });
  } catch (error) {
    console.error("[automation.run] error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Automation failed" }, { status: 500 });
  }
}
