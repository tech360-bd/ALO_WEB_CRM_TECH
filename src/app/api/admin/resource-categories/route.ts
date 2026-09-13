import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/resource-categories — list all categories for admin
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — SUPER_ADMIN or ADMIN only" }, { status: 403 });
  }

  try {
    const status = req.nextUrl.searchParams.get("status");
    const search = req.nextUrl.searchParams.get("search");

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
      ];
    }

    const categories = await db.resourceCategory.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { resources: true } },
      },
    });

    return NextResponse.json({ categories, total: categories.length });
  } catch (err: any) {
    console.error("[admin.resource-categories.list] error:", err);
    return NextResponse.json({ error: "Failed to list categories" }, { status: 500 });
  }
}

// POST /api/admin/resource-categories — create a category
export async function POST(req: NextRequest) {
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
    const body = await req.json();
    const { slug, name, description, icon, sortOrder = 0, status = "ACTIVE" } = body as any;

    if (!slug || !name) {
      return NextResponse.json({ error: "Missing required fields: slug, name" }, { status: 400 });
    }

    const existing = await db.resourceCategory.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const category = await db.resourceCategory.create({
      data: {
        slug, name,
        description: description || null,
        icon: icon || null,
        sortOrder,
        status,
      },
    });

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
    console.error("[admin.resource-categories.create] error:", err);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}
