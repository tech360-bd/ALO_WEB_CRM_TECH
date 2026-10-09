import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getContentAdminSession } from "@/lib/content-admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/admin/relationships/[id] — delete a content relationship
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getContentAdminSession(req);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const existing = await db.contentRelationship.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }

    await db.contentRelationship.delete({ where: { id } });

    await contentAuditLog.create({
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
    console.error("[admin.relationships.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete relationship" }, { status: 500 });
  }
}
