import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/services — list all services (incl. DRAFT, ARCHIVED) for admin
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
    const status = req.nextUrl.searchParams.get("status"); // optional filter
    const search = req.nextUrl.searchParams.get("search");
    const sortOrder = req.nextUrl.searchParams.get("sortOrder") === "desc" ? "desc" : "asc";
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "200", 10), 500);

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { shortDescription: { contains: search } },
      ];
    }

    const services = await db.service.findMany({
      where,
      orderBy: [{ sortOrder }, { title: "asc" }],
      take: limit,
      include: {
        _count: { select: { faqs: true } },
      },
    });

    return NextResponse.json({ services, total: services.length });
  } catch (err: any) {
    console.error("[admin.services.list] error:", err);
    return NextResponse.json({ error: "Failed to list services", detail: err.message }, { status: 500 });
  }
}

// POST /api/admin/services — create a new service
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
      slug, title, shortDescription, description, icon,
      heroImage, content, eligibility, requirements, documents,
      faqEnabled = true, ctaLabel, ctaUrl,
      status = "DRAFT", sortOrder = 0,
      sourceUrl, verificationStatus = "VERIFIED", lastVerifiedAt,
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
        content: typeof content === "string" ? content : JSON.stringify(content),
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
      },
    });

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
    console.error("[admin.services.create] error:", err);
    return NextResponse.json({ error: "Failed to create service", detail: err.message }, { status: 500 });
  }
}
