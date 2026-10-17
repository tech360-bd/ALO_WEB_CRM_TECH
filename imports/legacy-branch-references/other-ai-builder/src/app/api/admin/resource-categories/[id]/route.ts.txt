import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// PATCH /api/admin/resource-categories/[id] — update a category
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    const existing = await db.resourceCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const body = await req.json();
    const patch: any = { ...body };
    delete patch.id;
    delete patch.resources;
    delete patch.createdAt;

    if (patch.slug && patch.slug !== existing.slug) {
      const clash = await db.resourceCategory.findUnique({ where: { slug: patch.slug } });
      if (clash) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const updated = await db.resourceCategory.update({ where: { id }, data: patch });

    await db.auditLog.create({
      data: {
        userId,
        action: "RESOURCE_CATEGORY_UPDATE",
        resource: "ResourceCategory",
        resourceId: id,
        details: JSON.stringify({ changes: Object.keys(patch) }),
      },
    }).catch(() => {});

    return NextResponse.json({ category: updated });
  } catch (err: any) {
    console.error("[admin.resource-categories.update] error:", err);
    return NextResponse.json({ error: "Failed to update category", detail: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/resource-categories/[id] — delete a category
// Fails if category still has resources (assign them elsewhere first or pass ?force=1 to reassign to "blogs" fallback)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;
    const force = req.nextUrl.searchParams.get("force") === "1";
    const existing = await db.resourceCategory.findUnique({
      where: { id },
      include: { _count: { select: { resources: true } } },
    });
    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    if (existing._count.resources > 0 && !force) {
      return NextResponse.json(
        {
          error: `Category has ${existing._count.resources} resources. Reassign them first or pass ?force=1 to reassign to 'blogs' fallback.`,
        },
        { status: 409 }
      );
    }

    if (existing._count.resources > 0 && force) {
      // Reassign to "blogs" category (assumed to always exist)
      const fallback = await db.resourceCategory.findUnique({ where: { slug: "blogs" } });
      const fallbackId = fallback?.id;
      if (!fallbackId) {
        return NextResponse.json({ error: "Fallback category 'blogs' not found" }, { status: 500 });
      }
      await db.resource.updateMany({
        where: { categoryId: id },
        data: { categoryId: fallbackId },
      });
    }

    await db.resourceCategory.delete({ where: { id } });

    await db.auditLog.create({
      data: {
        userId,
        action: "RESOURCE_CATEGORY_DELETE",
        resource: "ResourceCategory",
        resourceId: id,
        details: JSON.stringify({ slug: existing.slug, force, resourcesReassigned: existing._count.resources }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    console.error("[admin.resource-categories.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete category", detail: err.message }, { status: 500 });
  }
}
