import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/content-relationships/[id] — delete relationship (admin)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const performedBy = req.nextUrl.searchParams.get("performedBy") || undefined;

    const existing = await db.contentRelationship.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }

    await db.contentRelationship.delete({ where: { id } });

    const userId = await resolveUserId(performedBy);
    await db.auditLog.create({
      data: {
        userId,
        action: "CONTENT_RELATIONSHIP_DELETE",
        resource: "ContentRelationship",
        resourceId: id,
        details: JSON.stringify({
          sourceType: existing.sourceType,
          sourceId: existing.sourceId,
          targetType: existing.targetType,
          targetId: existing.targetId,
          relationshipType: existing.relationshipType,
        }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[content-relationships.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete relationship", detail: err.message }, { status: 500 });
  }
}

async function resolveUserId(performedBy?: string): Promise<string | null> {
  if (!performedBy) return null;
  if (performedBy.includes("@")) {
    const u = await db.user.findFirst({ where: { email: performedBy.toLowerCase() }, select: { id: true } });
    return u?.id ?? null;
  }
  return performedBy;
}
