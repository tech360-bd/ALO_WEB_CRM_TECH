import { pickEditableContentFields } from "@/lib/content-validation";
import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getContentAdminSession } from "@/lib/content-admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/resource-categories/[id] — update a category
export async function PATCH(
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
    const existing = await db.resourceCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await req.json();
    const patch: any = pickEditableContentFields(body, "resourceCategory");
    delete patch.id;
    delete patch.resources;
    delete patch.createdAt;

    if (patch.slug && patch.slug !== existing.slug) {
      const clash = await db.resourceCategory.findUnique({ where: { slug: patch.slug } });
      if (clash) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const updated = await db.$transaction(async tx => {
      const updated = await tx.resourceCategory.update({ where: { id }, data: patch });
      await contentAuditLog.create({
      data: {
        userId,
        action: "RESOURCE_CATEGORY_UPDATE",
        resource: "ResourceCategory",
        resourceId: id,
        details: JSON.stringify({ changes: Object.keys(patch) }),
      },
    }, tx);
      return updated;
    });

    return NextResponse.json({ category: updated });
  } catch (err: any) {
    console.error("[admin.resource-categories.update] error:", err);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

// DELETE /api/admin/resource-categories/[id] — delete a category
// Fails if category still has resources (assign them elsewhere first or pass ?force=1 to reassign to "blogs" fallback)
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
    const existing = await db.resourceCategory.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    await db.$transaction(async tx => {
      await tx.resourceCategory.update({ where: { id }, data: { status: "ARCHIVED" } });
      await contentAuditLog.create({ data: { userId, action: "RESOURCE_CATEGORY_ARCHIVE", resource: "ResourceCategory", resourceId: id, details: { slug: existing.slug } } }, tx);
    });

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[admin.resource-categories.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
