import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/live-edit/[id]
// Update an existing LiveEditOverride. Auth: admin only.
// Body: partial LiveEditOverride fields (selector, selectorIndex, attribute, newValue, status, previewOnly, notes, originalValue)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "override id is required" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const data: any = {};
    if (body?.selector !== undefined) data.selector = String(body.selector);
    if (body?.selectorIndex !== undefined) data.selectorIndex = Number(body.selectorIndex) || 0;
    if (body?.attribute !== undefined) data.attribute = String(body.attribute);
    if (body?.originalValue !== undefined) data.originalValue = body.originalValue;
    if (body?.newValue !== undefined) data.newValue = String(body.newValue);
    if (body?.status !== undefined) data.status = String(body.status);
    if (body?.previewOnly !== undefined) data.previewOnly = body.previewOnly === true;
    if (body?.notes !== undefined) data.notes = body.notes;

    const override = await db.liveEditOverride.update({
      where: { id },
      data,
    });
    return NextResponse.json({ override });
  } catch (err: any) {
    console.error("[live-edit/[id] PATCH] error", err);
    return NextResponse.json({ error: err?.message || "Failed to update override" }, { status: 500 });
  }
}

// DELETE /api/live-edit/[id]
// Delete a LiveEditOverride (soft-delete by setting status=ARCHIVED).
// Auth: admin only.
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "override id is required" }, { status: 400 });
    }

    // Hard delete — LiveEditOverride is purely a runtime override; no audit need.
    await db.liveEditOverride.delete({ where: { id } });
    return NextResponse.json({ deleted: true, id });
  } catch (err: any) {
    console.error("[live-edit/[id] DELETE] error", err);
    return NextResponse.json({ error: err?.message || "Failed to delete override" }, { status: 500 });
  }
}
