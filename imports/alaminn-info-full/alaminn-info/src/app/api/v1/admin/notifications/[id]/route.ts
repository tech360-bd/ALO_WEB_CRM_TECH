import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

/** PUT /api/v1/admin/notifications/[id] — toggle read/unread */
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const { read } = body as Record<string, boolean>;
  try {
    const updated = await db.notification.update({ where: { id }, data: { read: !!read } });
    return ok(updated, "Notification updated.");
  } catch (e) {
    return fail("Failed to update notification.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.notification.delete({ where: { id } });
    await writeAudit(guard.session, "notification.delete", "Notification", id);
    return NextResponse.json({ success: true, message: "Notification deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete notification.", [(e as Error).message], 500);
  }
}
