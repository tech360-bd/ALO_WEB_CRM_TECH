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
  const item = await db.organization.findUnique({ where: { id }, include: { partnerships: true } });
  if (!item) return fail("Organization not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "contacts.update");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const { name, type, country, website, status } = body as Record<string, string>;
  try {
    const updated = await db.organization.update({
      where: { id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(type !== undefined ? { type: type || null } : {}),
        ...(country !== undefined ? { country: country || null } : {}),
        ...(website !== undefined ? { website: website || null } : {}),
        ...(status !== undefined ? { status } : {}),
      },
    });
    await writeAudit(guard.session, "organization.update", "Organization", id);
    return ok(updated, "Organization updated.");
  } catch (e) {
    return fail("Failed to update organization.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "contacts.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.organization.delete({ where: { id } });
    await writeAudit(guard.session, "organization.delete", "Organization", id);
    return NextResponse.json({ success: true, message: "Organization deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete organization.", [(e as Error).message], 500);
  }
}
