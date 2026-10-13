import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.task.findUnique({ where: { id }, include: { assignee: true, contact: true } });
  if (!item) return fail("Task not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  try {
    const updated = await db.task.update({
      where: { id },
      data: {
        ...(b.title !== undefined ? { title: String(b.title) } : {}),
        ...(b.description !== undefined ? { description: b.description ? String(b.description) : null } : {}),
        ...(b.priority !== undefined ? { priority: String(b.priority) } : {}),
        ...(b.status !== undefined ? { status: String(b.status) } : {}),
        ...(b.dueDate !== undefined ? { dueDate: b.dueDate ? new Date(String(b.dueDate)) : null } : {}),
        ...(b.assigneeId !== undefined ? { assigneeId: b.assigneeId ? String(b.assigneeId) : null } : {}),
        ...(b.contactId !== undefined ? { contactId: b.contactId ? String(b.contactId) : null } : {}),
      },
    });
    await writeAudit(guard.session, "task.update", "Task", id);
    return ok(updated, "Task updated.");
  } catch (e) {
    return fail("Failed to update task.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.task.delete({ where: { id } });
    await writeAudit(guard.session, "task.delete", "Task", id);
    return NextResponse.json({ success: true, message: "Task deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete task.", [(e as Error).message], 500);
  }
}
