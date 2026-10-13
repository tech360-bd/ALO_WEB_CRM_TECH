import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "ai_approvals.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.aiApproval.findUnique({
    where: { id },
    include: { task: true, reviewer: { select: { id: true, name: true } } },
  });
  if (!item) return fail("Approval not found.", ["not_found"], 404);
  return ok(item);
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "ai_approvals.decide");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.aiApproval.delete({ where: { id } });
    await writeAudit(guard.session, "ai_approval.delete", "AiApproval", id);
    return NextResponse.json({ success: true, message: "Approval deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete approval.", [(e as Error).message], 500);
  }
}
