import { contentAuditLog } from "@/lib/content-audit";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/resources/categories — list all resource categories (public)
export async function GET() {
  try {
    const categories = await db.resourceCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { resources: { where: { status: "PUBLISHED" } } } },
      },
    });

    return NextResponse.json({
      categories: categories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        icon: c.icon,
        sortOrder: c.sortOrder,
        resourceCount: (c as any)._count?.resources ?? 0,
      })),
      total: categories.length,
    });
  } catch (err: any) {
    console.error("[resources.categories.list] error:", err);
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
  }
}

// POST /api/resources/categories — create category (admin)
async function createCategory(req: Request, auth: AuthContext) {
  try {
    const body = await req.json();
    const { slug, name, description, icon, sortOrder = 0, status = "ACTIVE" } = body as any;

    if (!slug || !name) {
      return NextResponse.json({ error: "slug and name are required" }, { status: 400 });
    }

    const existing = await db.resourceCategory.findUnique({ where: { slug } });
    if (existing) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });

    const category = await db.resourceCategory.create({
      data: { slug, name, description: description || null, icon: icon || null, sortOrder, status },
    });

    const userId = auth.userId;
    await contentAuditLog.create({
      data: {
        userId,
        action: "RESOURCE_CATEGORY_CREATE",
        resource: "ResourceCategory",
        resourceId: category.id,
        details: JSON.stringify({ slug, name }),
      },
    }).catch(() => {});

    return NextResponse.json({ category }, { status: 201 });
  } catch (err: any) {
    console.error("[resources.categories.create] error:", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}


export const POST = withAuth(createCategory, {
  requireUserTypes: ["ADMIN", "SUPER_ADMIN"],
});
