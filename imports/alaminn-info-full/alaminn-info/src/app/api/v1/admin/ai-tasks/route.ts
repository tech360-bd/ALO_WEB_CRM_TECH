import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/ai-tasks — list AI tasks */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "ai_tasks.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const workflow = url.searchParams.get("workflow");
  const { skip, take, page, pageSize } = pagination(req);
  const where: Record<string, unknown> = {};
  if (status && status !== "all") where.status = status;
  if (workflow && workflow !== "all") where.workflow = workflow;
  const [items, total] = await Promise.all([
    db.aiTask.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        requester: { select: { id: true, name: true, email: true } },
        approvals: { include: { reviewer: { select: { id: true, name: true } } } },
      },
    }),
    db.aiTask.count({ where }),
  ]);
  return ok(items, "AI tasks loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

/** POST /api/v1/admin/ai-tasks — create a new AI task */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "ai_tasks.create");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  if (!b.workflow || !b.objective || !b.prompt) {
    return fail("workflow, objective, prompt are required.", ["missing_fields"]);
  }
  try {
    const task = await db.aiTask.create({
      data: {
        requesterId: guard.session.userId,
        workflow: String(b.workflow),
        project: b.project ? String(b.project) : null,
        objective: String(b.objective),
        prompt: String(b.prompt),
        sensitivity: b.sensitivity ? String(b.sensitivity) : "internal",
        outputFormat: b.outputFormat ? String(b.outputFormat) : "markdown",
        approvalRequired: b.approvalRequired !== false,
        deadline: b.deadline ? new Date(String(b.deadline)) : null,
        status: "draft",
      },
    });
    await writeAudit(guard.session, "ai_task.create", "AiTask", task.id, { workflow: task.workflow });
    return ok(task, "AI task created.", {}, 201);
  } catch (e) {
    return fail("Failed to create AI task.", [(e as Error).message], 500);
  }
}
