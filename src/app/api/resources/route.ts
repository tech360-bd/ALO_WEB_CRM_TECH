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

    const where: any = { status: "PUBLISHED" };
    if (category) where.category = { slug: category };
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
    return NextResponse.json({ error: "Failed to list resources", detail: err.message }, { status: 500 });
  }
}

// POST /api/resources — create (admin)
async function createResource(req: Request, auth: AuthContext) {
  try {
    const body = await req.json();
    const {
      slug, categoryId, title, excerpt, content,
      authorId, featuredImage, countrySlug, studyLevel,
      readingTime = 5, status = "PUBLISHED",
      publishedAt, sourceUrl, sourceName, verificationStatus = "VERIFIED",
      seoTitle, seoDescription, tags = [],
      faqs = [],
    } = body as any;

    if (!slug || !categoryId || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: slug, categoryId, title, content" },
        { status: 400 }
      );
    }

    const category = await db.resourceCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const existing = await db.resource.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    }

    const resource = await db.resource.create({
      data: {
        slug, categoryId, title,
        excerpt: excerpt || null,
        content,
        authorId: authorId || null,
        featuredImage: featuredImage || null,
        countrySlug: countrySlug || null,
        studyLevel: studyLevel || null,
        readingTime,
        status,
        publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
        sourceUrl: sourceUrl || null,
        sourceName: sourceName || null,
        verificationStatus,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === "string" ? tags : "[]"),
        faqs: faqs.length
          ? {
              create: faqs.map((f: any, i: number) => ({
                question: f.question, answer: f.answer, sortOrder: f.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: { faqs: true, category: true },
    });

    const userId = auth.userId;
    await db.auditLog.create({
      data: {
        userId,
        action: "RESOURCE_CREATE",
        resource: "Resource",
        resourceId: resource.id,
        details: JSON.stringify({ slug, title, categoryId }),
      },
    }).catch(() => {});

    return NextResponse.json({ resource }, { status: 201 });
  } catch (err: any) {
    console.error("[resources.create] error:", err);
    return NextResponse.json({ error: "Failed to create resource", detail: err.message }, { status: 500 });
  }
}

export const POST = withAuth(createResource, {
  requireUserTypes: ["ADMIN", "SUPER_ADMIN"],
});
