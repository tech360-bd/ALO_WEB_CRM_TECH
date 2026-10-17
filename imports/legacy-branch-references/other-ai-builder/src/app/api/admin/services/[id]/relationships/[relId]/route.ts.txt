import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/admin/services/[id]/relationships/[relId] — delete a relationship
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; relId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN only" }, { status: 403 });
  }

  try {
    const { id, relId } = await params;
    const existing = await db.contentRelationship.findUnique({ where: { id: relId } });
    if (!existing) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }
    // Verify it belongs to this service (either as source or target)
    if (
      !(existing.sourceType === "SERVICE" && existing.sourceId === id) &&
      !(existing.targetType === "SERVICE" && existing.targetId === id)
    ) {
      return NextResponse.json({ error: "Relationship does not belong to this service" }, { status: 404 });
    }

    await db.contentRelationship.delete({ where: { id: relId } });

    await db.auditLog.create({
      data: {
        userId,
        action: "CONTENT_RELATIONSHIP_DELETE",
        resource: "ContentRelationship",
        resourceId: relId,
        details: JSON.stringify({ serviceId: id, sourceType: existing.sourceType, targetType: existing.targetType }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, relId });
  } catch (err: any) {
    console.error("[admin.services.relationships.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete relationship", detail: err.message }, { status: 500 });
  }
}
