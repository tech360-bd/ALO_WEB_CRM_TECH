import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/resources/[id] — single resource with FAQs + relationships
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN only" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const resource = await db.resource.findUnique({
      where: { id },
      include: {
        category: true,
        faqs: { orderBy: { sortOrder: "asc" } },
        relationships: { orderBy: { sortOrder: "asc" } },
        reverseRelationships: { orderBy: { sortOrder: "asc" } },
      },
    });
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }
    return NextResponse.json({ resource });
  } catch (err: any) {
    console.error("[admin.resources.get] error:", err);
    return NextResponse.json({ error: "Failed to fetch resource", detail: err.message }, { status: 500 });
  }
}

// PATCH /api/admin/resources/[id] — update resource
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const existing = await db.resource.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const body = await req.json();
    const patch: any = { ...body };
    delete patch.id;
    delete patch.faqs;
    delete patch.relationships;
    delete patch.reverseRelationships;
    delete patch.createdAt;
    delete patch.updatedAt;
    delete patch.category; // joined relation

    if (Array.isArray(patch.tags)) patch.tags = JSON.stringify(patch.tags);
    if (patch.publishedAt) patch.publishedAt = new Date(patch.publishedAt);
    if (patch.lastVerifiedAt) patch.lastVerifiedAt = new Date(patch.lastVerifiedAt);

    if (patch.slug && patch.slug !== existing.slug) {
      const clash = await db.resource.findUnique({ where: { slug: patch.slug } });
      if (clash) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }
    if (patch.categoryId && patch.categoryId !== existing.categoryId) {
      const cat = await db.resourceCategory.findUnique({ where: { id: patch.categoryId } });
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const updated = await db.resource.update({
      where: { id },
      data: patch,
      include: {
        faqs: { orderBy: { sortOrder: "asc" } },
        category: true,
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "RESOURCE_UPDATE",
        resource: "Resource",
        resourceId: id,
        details: JSON.stringify({ changes: Object.keys(patch) }),
      },
    }).catch(() => {});

    return NextResponse.json({ resource: updated });
  } catch (err: any) {
    console.error("[admin.resources.update] error:", err);
    return NextResponse.json({ error: "Failed to update resource", detail: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/resources/[id] — soft delete (set status to ARCHIVED)
// Pass ?hard=1 to hard delete (cascades FAQs + relationships)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    const hard = req.nextUrl.searchParams.get("hard") === "1";
    const existing = await db.resource.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (hard) {
      await db.resource.delete({ where: { id } });
    } else {
      await db.resource.update({ where: { id }, data: { status: "ARCHIVED" } });
    }

    await db.auditLog.create({
      data: {
        userId,
        action: hard ? "RESOURCE_DELETE" : "RESOURCE_ARCHIVE",
        resource: "Resource",
        resourceId: id,
        details: JSON.stringify({ slug: existing.slug, hard }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, id, hard });
  } catch (err: any) {
    console.error("[admin.resources.delete] error:", err);
    return NextResponse.json({ error: "Failed to delete resource", detail: err.message }, { status: 500 });
  }
}
