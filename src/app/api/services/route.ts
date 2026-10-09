import { contentAuditLog } from "@/lib/content-audit";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

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

    return NextResponse.json({ services, total: services.length });
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
      sourceUrl, verificationStatus = "PENDING",
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
        sourceUrl: sourceUrl || "",
        verificationStatus,
        lastVerifiedAt: verificationStatus === "VERIFIED" && sourceUrl && lastVerifiedAt ? new Date(lastVerifiedAt) : null,
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
