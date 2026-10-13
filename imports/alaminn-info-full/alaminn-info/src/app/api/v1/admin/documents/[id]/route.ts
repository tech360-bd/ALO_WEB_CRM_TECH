import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "resources.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.document.findUnique({ where: { id }, include: { uploadedBy: true } });
  if (!item) return fail("Document not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "resources.update");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  try {
    const updated = await db.document.update({
      where: { id },
      data: {
        ...(b.title !== undefined ? { title: String(b.title) } : {}),
        ...(b.category !== undefined ? { category: b.category ? String(b.category) : null } : {}),
        ...(b.description !== undefined ? { description: b.description ? String(b.description) : null } : {}),
      },
    });
    await writeAudit(guard.session, "document.update", "Document", id);
    return ok(updated, "Document updated.");
  } catch (e) {
    return fail("Failed to update document.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "resources.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.document.delete({ where: { id } });
    await writeAudit(guard.session, "document.delete", "Document", id);
    return NextResponse.json({ success: true, message: "Document deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete document.", [(e as Error).message], 500);
  }
}
