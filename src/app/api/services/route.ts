import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";
import { SPEC_SERVICES } from "@/lib/website/spec-services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/services — list published services (public)
// Supports: ?sortOrder=asc|desc, ?limit=50; unpublished records are never public
export async function GET(req: NextRequest) {
  try {
    // The public endpoint must never expose DRAFT or ARCHIVED content.
    const status = "PUBLISHED";
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100", 10), 200);

    const services = await db.service.findMany({
      where: { status },
      orderBy: [{ sortOrder }, { title: "asc" }],
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        shortDescription: true,
        icon: true,
        heroImage: true,
        ctaLabel: true,
        ctaUrl: true,
        status: true,
        sortOrder: true,
        faqEnabled: true,
        verificationStatus: true,
        lastVerifiedAt: true,
        updatedAt: true,
      },
    });

    // Spec: the directory always offers the 14 canonical services — DB rows
    // win; catalog records fill any gap so no card on /services is ever dead.
    const dbSlugs = new Set(services.map((s) => s.slug));
    const catalog = SPEC_SERVICES.filter((s) => !dbSlugs.has(s.slug)).map((s, i) => ({
      id: `spec_${s.slug}`,
      slug: s.slug,
      title: s.title,
      shortDescription: s.shortDescription,
      icon: s.icon,
      heroImage: '',
      ctaLabel: 'Book Free Consultation',
      ctaUrl: '/book-consultation',
      status: 'PUBLISHED',
      sortOrder: 1000 + i,
      faqEnabled: true,
      verificationStatus: 'pending',
      lastVerifiedAt: null,
      updatedAt: null,
    }));

    // DB items first (by sortOrder), then the 14-spec guaranteed set.
    const merged = [
      ...services,
      ...catalog,
    ];

    return NextResponse.json({ services: merged.slice(0, limit), total: merged.length });
  } catch (err: any) {
    console.error("[services.list] error:", err);
    return NextResponse.json({ error: "Failed to list services" }, { status: 500 });
  }
}

// POST /api/services — create a service (SUPER_ADMIN/ADMIN only — middleware enforced)
// Body: full Service fields + optional faqs[]
async function createService(req: Request, auth: AuthContext) {
  try {
    const body = await req.json();
    const {
      slug, title, shortDescription, description, icon,
      heroImage, content, eligibility, requirements, documents,
      faqEnabled = true, ctaLabel, ctaUrl,
      status = "PUBLISHED", sortOrder = 0,
      sourceUrl, verificationStatus = "VERIFIED",
      lastVerifiedAt,
      faqs = [],
    } = body as any;

    if (!slug || !title || !shortDescription || !description || !icon || !content) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, shortDescription, description, icon, content" },
        { status: 400 }
      );
    }

    const existing = await db.service.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: "Service with this slug already exists" }, { status: 409 });
    }

    const service = await db.service.create({
      data: {
        slug, title, shortDescription, description, icon,
        heroImage: heroImage || undefined,
        content,
        eligibility: eligibility || undefined,
        requirements: requirements ? (typeof requirements === "string" ? requirements : JSON.stringify(requirements)) : undefined,
        documents: documents ? (typeof documents === "string" ? documents : JSON.stringify(documents)) : undefined,
        faqEnabled,
        ctaLabel: ctaLabel || undefined,
        ctaUrl: ctaUrl || undefined,
        status,
        sortOrder,
        sourceUrl: sourceUrl || null,
        verificationStatus,
        lastVerifiedAt: lastVerifiedAt ? new Date(lastVerifiedAt) : new Date(),
        faqs: faqs.length
          ? {
              create: faqs.map((f: any, i: number) => ({
                question: f.question,
                answer: f.answer,
                sortOrder: f.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: { faqs: true },
    });

    // Audit log
    const userId = auth.userId;
    await contentAuditLog.create({
      data: {
        userId,
        action: "SERVICE_CREATE",
        resource: "Service",
        resourceId: service.id,
        details: JSON.stringify({ slug, title, status }),
      },
    }).catch(() => {});

    return NextResponse.json({ service }, { status: 201 });
  } catch (err: any) {
    console.error("[services.create] error:", err);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

export const POST = withAuth(createService, {
  requireUserTypes: ["ADMIN", "SUPER_ADMIN"],
});
