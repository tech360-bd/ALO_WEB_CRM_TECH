import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

/** GET /api/v1/admin/contacts/[id] */
export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "contacts.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.contact.findUnique({ where: { id } });
  if (!item) return fail("Contact not found.", ["not_found"], 404);
  return ok(item);
}

/** PUT /api/v1/admin/contacts/[id] */
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "contacts.update");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const { fullName, email, phone, organization, role, country, status, tags } = body as Record<string, string>;
  try {
    const updated = await db.contact.update({
      where: { id },
      data: {
        ...(fullName !== undefined ? { fullName } : {}),
        ...(email !== undefined ? { email: email.toLowerCase() } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(organization !== undefined ? { organization: organization || null } : {}),
        ...(role !== undefined ? { role: role || null } : {}),
        ...(country !== undefined ? { country: country || null } : {}),
        ...(status !== undefined ? { status } : {}),
        ...(tags !== undefined ? { tags: tags || null } : {}),
      },
    });
    await writeAudit(guard.session, "contact.update", "Contact", id, { fields: Object.keys(body as object) });
    return ok(updated, "Contact updated.");
  } catch (e) {
    return fail("Failed to update contact.", [(e as Error).message], 500);
  }
}

/** DELETE /api/v1/admin/contacts/[id] */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "contacts.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.contact.delete({ where: { id } });
    await writeAudit(guard.session, "contact.delete", "Contact", id);
    return NextResponse.json({ success: true, message: "Contact deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete contact.", [(e as Error).message], 500);
  }
}
