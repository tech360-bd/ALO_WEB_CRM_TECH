import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/resources — list all resources for admin
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
    const category = req.nextUrl.searchParams.get("category");
    const search = req.nextUrl.searchParams.get("search");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "200", 10), 500);

    const where: any = {};
    if (status) where.status = status;
    if (category) where.category = { slug: category };
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { excerpt: { contains: search } },
      ];
    }

    const resources = await db.resource.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { title: "asc" }],
      take: limit,
      include: {
        category: { select: { id: true, slug: true, name: true, icon: true } },
        _count: { select: { faqs: true, relationships: true, reverseRelationships: true } },
      },
    });

    return NextResponse.json({ resources, total: resources.length });
  } catch (err: any) {
    console.error("[admin.resources.list] error:", err);
    return NextResponse.json({ error: "Failed to list resources", detail: err.message }, { status: 500 });
  }
}

// POST /api/admin/resources — create a resource
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
    const {
      slug, categoryId, title, excerpt, content,
      authorId, featuredImage, countrySlug, studyLevel,
      readingTime = 5, status = "DRAFT",
      publishedAt, sourceUrl, sourceName, verificationStatus = "VERIFIED",
      seoTitle, seoDescription, tags = [],
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
        publishedAt: publishedAt ? new Date(publishedAt) : (status === "PUBLISHED" ? new Date() : null),
        sourceUrl: sourceUrl || null,
        sourceName: sourceName || null,
        verificationStatus,
        seoTitle: seoTitle || null,
        seoDescription: seoDescription || null,
        tags: Array.isArray(tags) ? JSON.stringify(tags) : (typeof tags === "string" ? tags : "[]"),
      },
      include: { category: true },
    });

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
    console.error("[admin.resources.create] error:", err);
    return NextResponse.json({ error: "Failed to create resource", detail: err.message }, { status: 500 });
  }
}
