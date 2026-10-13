import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "ai_tasks.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.aiTask.findUnique({
    where: { id },
    include: { requester: true, approvals: { include: { reviewer: true } } },
  });
  if (!item) return fail("AI task not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "ai_tasks.update");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  try {
    const updated = await db.aiTask.update({
      where: { id },
      data: {
        ...(b.status !== undefined ? { status: String(b.status) } : {}),
        ...(b.result !== undefined ? { result: b.result ? String(b.result) : null } : {}),
        ...(b.objective !== undefined ? { objective: String(b.objective) } : {}),
        ...(b.prompt !== undefined ? { prompt: String(b.prompt) } : {}),
        ...(b.reviewerId !== undefined ? { reviewerId: b.reviewerId ? String(b.reviewerId) : null } : {}),
        ...(b.completedAt !== undefined ? { completedAt: b.completedAt ? new Date(String(b.completedAt)) : null } : {}),
      },
    });
    await writeAudit(guard.session, "ai_task.update", "AiTask", id);
    return ok(updated, "AI task updated.");
  } catch (e) {
    return fail("Failed to update AI task.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "ai_tasks.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.aiTask.delete({ where: { id } });
    await writeAudit(guard.session, "ai_task.delete", "AiTask", id);
    return NextResponse.json({ success: true, message: "AI task deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete AI task.", [(e as Error).message], 500);
  }
}
