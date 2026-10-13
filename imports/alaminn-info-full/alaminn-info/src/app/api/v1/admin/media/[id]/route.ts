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
  const item = await db.mediaAsset.findUnique({ where: { id } });
  if (!item) return fail("Media asset not found.", ["not_found"], 404);
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
    const updated = await db.mediaAsset.update({
      where: { id },
      data: {
        ...(b.altText !== undefined ? { altText: b.altText ? String(b.altText) : null } : {}),
        ...(b.category !== undefined ? { category: b.category ? String(b.category) : null } : {}),
      },
    });
    await writeAudit(guard.session, "media.update", "MediaAsset", id);
    return ok(updated, "Media asset updated.");
  } catch (e) {
    return fail("Failed to update media asset.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "resources.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.mediaAsset.delete({ where: { id } });
    await writeAudit(guard.session, "media.delete", "MediaAsset", id);
    return NextResponse.json({ success: true, message: "Media asset deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete media asset.", [(e as Error).message], 500);
  }
}
