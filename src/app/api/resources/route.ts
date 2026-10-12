import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/resources — list resources with filters (public)
// Filters: category (slug), country (slug), level (studyLevel), search (title/excerpt/tags), tag
export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get("category");
    const country = req.nextUrl.searchParams.get("country");
    const level = req.nextUrl.searchParams.get("level");
    const search = req.nextUrl.searchParams.get("search");
    const tag = req.nextUrl.searchParams.get("tag");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100", 10), 200);

    const where: any = { status: "PUBLISHED", category: { status: "ACTIVE" } };
    if (category) where.category = { slug: category, status: "ACTIVE" };
    if (country) where.countrySlug = country;
    if (level) where.studyLevel = level;
    if (tag) where.tags = { contains: `"${tag}"` };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const resources = await db.resource.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        excerpt: true,
        featuredImage: true,
        countrySlug: true,
        studyLevel: true,
        readingTime: true,
        publishedAt: true,
        updatedAt: true,
        tags: true,
        verificationStatus: true,
        sourceName: true,
        sourceUrl: true,
        lastVerifiedAt: true,
        category: { select: { slug: true, name: true, icon: true } },
      },
    });

    return NextResponse.json({ resources, total: resources.length });
  } catch (err: any) {
    console.error("[resources.list] error:", err);
    return NextResponse.json({ error: "Failed to list resources" }, { status: 500 });
  }
}

// Keep legacy creation URLs on the same authenticated, audited implementation.
export { POST } from "../admin/resources/route";
