import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/live-edit/[id] — SUPER_ADMIN/ADMIN only. Update an existing override.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { newValue, previewOnly, notes, status, attribute, selector, selectorIndex } = body;

    const existing = await db.liveEditOverride.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Override not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (newValue !== undefined) updateData.newValue = newValue;
    if (previewOnly !== undefined) updateData.previewOnly = previewOnly;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;
    if (attribute !== undefined) updateData.attribute = attribute;
    if (selector !== undefined) updateData.selector = selector;
    if (selectorIndex !== undefined) updateData.selectorIndex = selectorIndex;

    const override = await db.liveEditOverride.update({
      where: { id },
      data: updateData,
    });

    await db.auditLog
      .create({
        data: {
          userId: (session.user as any).id,
          action: "LIVE_EDIT_UPDATE",
          resource: "LiveEditOverride",
          resourceId: id,
          details: JSON.stringify(updateData),
        },
      })
      .catch(() => {});

    return NextResponse.json({ success: true, override });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/live-edit/[id] — soft-delete by setting status to "DELETED".
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await db.liveEditOverride.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Override not found" }, { status: 404 });
    }

    const override = await db.liveEditOverride.update({
      where: { id },
      data: { status: "DELETED" },
    });

    await db.auditLog
      .create({
        data: {
          userId: (session.user as any).id,
          action: "LIVE_EDIT_DELETE",
          resource: "LiveEditOverride",
          resourceId: id,
          details: JSON.stringify({ pageRoute: existing.pageRoute, selector: existing.selector }),
        },
      })
      .catch(() => {});

    return NextResponse.json({ success: true, override, message: "Override soft-deleted." });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
