import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// DELETE /api/content-relationships/[id] — delete relationship (admin)
async function deleteRelationship(
  req: Request,
  auth: AuthContext,
  context?: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context!.params;
    const existing = await db.contentRelationship.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Relationship not found" }, { status: 404 });
    }

    await db.contentRelationship.delete({ where: { id } });

    const userId = auth.userId;
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


export const DELETE = withAuth(deleteRelationship, {
  requireUserTypes: ["ADMIN", "SUPER_ADMIN"],
});
