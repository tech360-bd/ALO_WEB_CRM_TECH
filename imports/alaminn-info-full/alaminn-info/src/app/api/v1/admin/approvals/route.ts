import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/approvals — list pending AI approvals */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "ai_approvals.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const status = url.searchParams.get("status") || "pending";
  const { skip, take, page, pageSize } = pagination(req);

  const where = status === "all" ? {} : { task: { status } };
  const [items, total] = await Promise.all([
    db.aiApproval.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        task: { select: { id: true, workflow: true, objective: true, status: true, sensitivity: true, result: true, prompt: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    }),
    db.aiApproval.count({ where }),
  ]);
  // Also surface AiTasks awaiting-approval that have no approval row yet
  const pendingTasks = await db.aiTask.findMany({
    where: { status: "awaiting-approval" },
    include: { requester: { select: { name: true } }, approvals: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return ok({ approvals: items, pendingTasks }, "Approvals loaded.", { total, page, pageSize, count: items.length, pendingCount: pendingTasks.length });
}

/** POST /api/v1/admin/approvals — decide (approve/reject/revision) on a task */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "ai_approvals.decide");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const { taskId, decision, note } = body as Record<string, string>;
  if (!taskId || !decision) return fail("taskId and decision are required.", ["missing_fields"]);
  if (!["approved", "rejected", "revision"].includes(decision)) {
    return fail("decision must be approved | rejected | revision.", ["invalid_decision"]);
  }
  try {
    const task = await db.aiTask.findUnique({ where: { id: taskId } });
    if (!task) return fail("Task not found.", ["not_found"], 404);

    const approval = await db.aiApproval.create({
      data: {
        taskId,
        reviewerId: guard.session.userId,
        decision,
        note: note || null,
      },
    });

    // Update task status based on decision
    const newStatus = decision === "approved" ? "approved" : decision === "rejected" ? "rejected" : "revision-requested";
    await db.aiTask.update({ where: { id: taskId }, data: { status: newStatus, reviewerId: guard.session.userId } });

    await writeAudit(guard.session, "ai_approval.decide", "AiApproval", approval.id, { taskId, decision });
    return ok(approval, `Approval ${decision}.`, {}, 201);
  } catch (e) {
    return fail("Failed to record approval.", [(e as Error).message], 500);
  }
}
