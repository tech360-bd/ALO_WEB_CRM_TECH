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
  "sla_tracking",
  "missing_data_detection",
  "deadline_reminders",
  "automated_notifications",
  "report_generation",
] as const;

const TARGETED_WORKFLOWS = new Set<string>([
  "lead_scoring",
  "counselor_assignment",
  "follow_up_task_creation",
  "lead_welcome_flow",
  "lead_tagging",
]);

interface WorkflowOutcome {
  success?: boolean;
  skipped?: boolean;
  pauseReason?: string;
  reason?: string;
  error?: string;
  [key: string]: unknown;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const workflow = typeof body?.workflow === "string" ? body.workflow : "";
    if (!VALID_WORKFLOWS.includes(workflow as (typeof VALID_WORKFLOWS)[number])) {
      return NextResponse.json({ success: false, error: "Unsupported automation workflow" }, { status: 400 });
    }

    const targetId = body?.targetId;
    if (targetId !== undefined && (typeof targetId !== "string" || !targetId.trim() || targetId.length > 191)) {
      return NextResponse.json({ success: false, error: "targetId must be a non-empty string of at most 191 characters" }, { status: 400 });
    }
    if (TARGETED_WORKFLOWS.has(workflow) && typeof targetId !== "string") {
      return NextResponse.json({
        success: false,
        error: "targetId is required for this workflow; unscoped bulk execution is disabled",
      }, { status: 400 });
    }

    const days = body?.days;
    if (days !== undefined && (typeof days !== "number" || !Number.isInteger(days) || days < 0 || days > 365)) {
      return NextResponse.json({ success: false, error: "days must be an integer between 0 and 365" }, { status: 400 });
    }

    const dryRun = body?.dryRun === true;
    const result = await runWorkflow(workflow, {
      targetId: typeof targetId === "string" ? targetId.trim() : undefined,
      days,
      actorId: (session.user as { id?: string }).id,
      dryRun,
    }) as WorkflowOutcome | null;

    if (dryRun) {
      return NextResponse.json({
        success: true,
        status: "DRY_RUN",
        message: "No workflow side effects were requested.",
        workflow,
        result,
      });
    }

    if (!result || typeof result !== "object" || typeof result.success !== "boolean") {
      return NextResponse.json({
        success: false,
        status: "UNVERIFIED_RESULT",
        error: "Workflow returned no verifiable success state",
        workflow,
        result,
      }, { status: 502 });
    }

    if (result.success) {
      return NextResponse.json({
        success: true,
        status: result.skipped ? "ALREADY_RECORDED" : "COMPLETED",
        workflow,
        result,
      });
    }

    return NextResponse.json({
      success: false,
      status: result.skipped ? (result.pauseReason || "SKIPPED") : "FAILED",
      error: result.error || "Workflow did not complete successfully",
      workflow,
      result,
    }, { status: result.skipped ? 409 : 422 });
  } catch (error) {
    console.error("[automation.run] error:", error);
    return NextResponse.json({ success: false, status: "FAILED", error: "Automation failed" }, { status: 500 });
  }
}
