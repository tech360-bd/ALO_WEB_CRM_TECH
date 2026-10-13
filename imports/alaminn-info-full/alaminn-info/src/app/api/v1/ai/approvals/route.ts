import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash } from "crypto";
import { requirePermission } from "@/lib/auth";
import { sendTransactional } from "@/lib/email";
import { env } from "@/lib/env";

// ─── JSON envelope helpers ──────────────────────────────────────
function ok(data: unknown, message = "OK", meta: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, message, data, meta, errors: [] });
}
function fail(message: string, errors: unknown[] = [], status = 400) {
  return NextResponse.json({ success: false, message, data: null, meta: {}, errors }, { status });
}

// ─── Decision → status mapping ──────────────────────────────────
const DECISION_STATUS: Record<string, string> = {
  approved: "approved",
  rejected: "rejected",
  revision: "revision-requested",
};

const VALID_DECISIONS = new Set(Object.keys(DECISION_STATUS));

// ─── GET: List pending approvals (requires ai_approvals.view) ────
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "ai_approvals.view");
  if (guard.denied) {
    return NextResponse.json(
      { success: false, message: "Authentication required.", data: null, meta: {}, errors: ["unauthenticated"] },
      { status: guard.response.status }
    );
  }

  try {
    const tasks = await db.aiTask.findMany({
      where: { status: { in: ["awaiting-approval", "quality-review", "revision-requested"] } },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { requester: { select: { name: true } } },
    });
    const data = tasks.map((t) => ({
      id: t.id,
      workflow: t.workflow,
      objective: t.objective,
      status: t.status,
      sensitivity: t.sensitivity,
      createdAt: t.createdAt.toISOString(),
      requesterName: t.requester?.name || null,
    }));
    return NextResponse.json({ success: true, message: "Approvals fetched.", data: { tasks: data }, meta: { count: data.length }, errors: [] });
  } catch (e) {
    console.error("[ai/approvals] GET error", e);
    return NextResponse.json({ success: false, message: "Internal error.", data: null, meta: {}, errors: ["server_error"] }, { status: 500 });
  }
}

// ─── POST handler ───────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ─── AUTHORIZATION: requires ai_approvals.decide ───────────────
  const guard = await requirePermission(req, "ai_approvals.decide");
  if (guard.denied) {
    return NextResponse.json(
      { success: false, message: guard.response.status === 401 ? "Authentication required." : "Insufficient permissions.", data: null, meta: {}, errors: [guard.response.status === 401 ? "unauthenticated" : "forbidden"] },
      { status: guard.response.status }
    );
  }
  const reviewerUser = guard.session;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return fail("Invalid request body.");

    // Validate required fields
    const taskId = String(body.taskId || "").trim();
    // Support both `action` and `decision` fields for the approval action
    const decision = String(body.action || body.decision || "").trim();
    const note = body.note ? String(body.note) : null;

    const errors: string[] = [];
    if (!taskId) errors.push("taskId_required");
    if (!decision) errors.push("decision_required");
    else if (!VALID_DECISIONS.has(decision)) errors.push("decision_invalid");
    if (errors.length) return fail("Validation failed.", errors, 422);

    // Find the task
    const task = await db.aiTask.findUnique({ where: { id: taskId } });
    if (!task) return fail("Task not found.", ["task_not_found"], 404);

    // Determine new status
    const newStatus = DECISION_STATUS[decision];

    // Use the authenticated reviewer (NOT a system user)
    const updatedTask = await db.aiTask.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        reviewerId: reviewerUser.userId,
      },
    });

    // Create the approval record
    await db.aiApproval.create({
      data: {
        taskId,
        reviewerId: reviewerUser.userId,
        decision,
        note,
      },
    });

    // Audit log
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const hash = createHash("sha256").update(ip).digest("hex").slice(0, 16);
    await db.auditLog.create({
      data: {
        actorId: reviewerUser.userId,
        action: `ai-task.${decision}`,
        resource: "ai-task",
        resourceId: taskId,
        meta: JSON.stringify({ decision, previousStatus: task.status, newStatus, reviewerEmail: reviewerUser.email }),
        ipHash: hash,
      },
    });

    // Notify the task requester of the decision (approved/rejected/revision).
    // Email failure is logged but never crashes the approval action.
    if (task.requesterId) {
      const requester = await db.user.findUnique({
        where: { id: task.requesterId },
        select: { email: true, name: true },
      });
      if (requester) {
        await sendTransactional(
          "aiTaskCompleted",
          {
            workflow: task.workflow,
            objective: task.objective,
            reviewUrl: `${env().siteUrl}/#staff`,
          },
          {
            to: requester.email,
            ipHash: hash,
            triggeredBy: `ai-task.${decision}`,
          }
        ).catch(() => null);
      }
    }

    return ok(
      {
        id: updatedTask.id,
        workflow: updatedTask.workflow,
        objective: updatedTask.objective,
        status: updatedTask.status,
        sensitivity: updatedTask.sensitivity,
        decision,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerUser.email,
      },
      `Task ${decision}.`,
      { taskId, decision }
    );
  } catch (e) {
    console.error("[ai/approvals] error", e);
    return fail("Internal error.", ["server_error"], 500);
  }
}
