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

export { POST } from "../../admin/resource-categories/route";
