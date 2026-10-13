import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission, hashPassword } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";
import { normalizeRole } from "@/lib/rbac";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "users.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, status: true, lastLoginAt: true, createdAt: true, updatedAt: true },
  });
  if (!item) return fail("User not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;

  // Role change requires the higher users.role_assign permission
  if (b.role !== undefined) {
    const guard = await requirePermission(req, "users.role_assign");
    if (guard.denied) return guard.response;
    const normalizedRole = normalizeRole(b.role as string);
    if (!normalizedRole) return fail("Invalid role.", ["invalid_role"]);
    try {
      const updated = await db.user.update({ where: { id }, data: { role: normalizedRole }, select: { id: true, email: true, name: true, role: true, status: true } });
      await writeAudit(guard.session, "user.role_change", "User", id, { newRole: normalizedRole });
      return ok(updated, "User role updated.");
    } catch (e) {
      return fail("Failed to update user role.", [(e as Error).message], 500);
    }
  }

  // Other updates (name, status) only need users.update
  const guard = await requirePermission(req, "users.update");
  if (guard.denied) return guard.response;
  try {
    const updated = await db.user.update({
      where: { id },
      data: {
        ...(b.name !== undefined ? { name: String(b.name) } : {}),
        ...(b.status !== undefined ? { status: String(b.status) } : {}),
        ...(b.email !== undefined ? { email: String(b.email).toLowerCase() } : {}),
        ...(b.password !== undefined ? { passwordHash: hashPassword(String(b.password)) } : {}),
      },
      select: { id: true, email: true, name: true, role: true, status: true },
    });
    await writeAudit(guard.session, "user.update", "User", id, { fields: Object.keys(b) });
    return ok(updated, "User updated.");
  } catch (e) {
    return fail("Failed to update user.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "users.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  if (id === guard.session.userId) return fail("You cannot delete your own account.", ["self_delete"], 400);
  try {
    await db.user.delete({ where: { id } });
    await writeAudit(guard.session, "user.delete", "User", id);
    return NextResponse.json({ success: true, message: "User deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete user.", [(e as Error).message], 500);
  }
}
