import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "contacts.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.note.findUnique({ where: { id }, include: { author: true, contact: true } });
  if (!item) return fail("Note not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "contacts.update");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  try {
    const updated = await db.note.update({
      where: { id },
      data: {
        ...(b.body !== undefined ? { body: String(b.body) } : {}),
        ...(b.contactId !== undefined ? { contactId: b.contactId ? String(b.contactId) : null } : {}),
      },
    });
    await writeAudit(guard.session, "note.update", "Note", id);
    return ok(updated, "Note updated.");
  } catch (e) {
    return fail("Failed to update note.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "contacts.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.note.delete({ where: { id } });
    await writeAudit(guard.session, "note.delete", "Note", id);
    return NextResponse.json({ success: true, message: "Note deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete note.", [(e as Error).message], 500);
  }
}
