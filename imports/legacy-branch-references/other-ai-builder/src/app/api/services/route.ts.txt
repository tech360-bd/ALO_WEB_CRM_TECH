import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/services — list published services (public)
// Supports: ?status=DRAFT (admin), ?sortOrder=asc|desc, ?limit=50
export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") || "PUBLISHED";
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
    return NextResponse.json({ error: "Failed to list services", detail: err.message }, { status: 500 });
  }
}

// POST /api/services — create a service (SUPER_ADMIN/ADMIN only — middleware enforced)
// Body: full Service fields + optional faqs[]
export async function POST(req: NextRequest) {
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
      performedBy,
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
        heroImage: heroImage || null,
        content,
        eligibility: eligibility || null,
        requirements: requirements ? (typeof requirements === "string" ? requirements : JSON.stringify(requirements)) : null,
        documents: documents ? (typeof documents === "string" ? documents : JSON.stringify(documents)) : null,
        faqEnabled,
        ctaLabel: ctaLabel || null,
        ctaUrl: ctaUrl || null,
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
    const userId = await resolveUserId(performedBy);
    await db.auditLog.create({
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
    return NextResponse.json({ error: "Failed to create service", detail: err.message }, { status: 500 });
  }
}

// Helper — resolves performedBy (email or id) to a valid User.id for audit
async function resolveUserId(performedBy?: string): Promise<string | null> {
  if (!performedBy) return null;
  if (performedBy.includes("@")) {
    const u = await db.user.findFirst({ where: { email: performedBy.toLowerCase() }, select: { id: true } });
    return u?.id ?? null;
  }
  return performedBy;
}
