import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/admin/scholarships — list all scholarships for admin
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
    const country = req.nextUrl.searchParams.get("country");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "200", 10), 500);

    const where: any = {};
    if (status) where.status = status;
    if (country) where.countrySlug = country;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { slug: { contains: search } },
        { scholarshipCode: { contains: search } },
        { subject: { contains: search } },
      ];
    }

    const scholarships = await db.scholarship.findMany({
      where,
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take: limit,
      include: {
        _count: { select: { faqs: true } },
      },
    });

    return NextResponse.json({ scholarships, total: scholarships.length });
  } catch (err: any) {
    console.error("[admin.scholarships.list] error:", err);
    return NextResponse.json({ error: "Failed to list scholarships", detail: err.message }, { status: 500 });
  }
}

// POST /api/admin/scholarships — create a scholarship
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
      slug, scholarshipCode, name,
      countrySlug, universitySlug, courseSlug,
      studyLevel, subject, fundingType,
      amount, currency, coverage,
      eligibility, minimumRequirements, documentsRequired,
      applicationMethod, applicationUrl,
      openingDate, deadline, decisionDate,
      status = "OPEN", verificationStatus = "VERIFIED",
      sourceUrl, sourceName, lastVerifiedAt,
    } = body as any;

    if (!slug || !scholarshipCode || !name || !fundingType) {
      return NextResponse.json(
        { error: "Missing required fields: slug, scholarshipCode, name, fundingType" },
        { status: 400 }
      );
    }

    const bySlug = await db.scholarship.findUnique({ where: { slug } });
    if (bySlug) return NextResponse.json({ error: "Slug already in use" }, { status: 409 });
    const byCode = await db.scholarship.findUnique({ where: { scholarshipCode } });
    if (byCode) return NextResponse.json({ error: "Scholarship code already in use" }, { status: 409 });

    const scholarship = await db.scholarship.create({
      data: {
        slug, scholarshipCode, name,
        countrySlug: countrySlug || null,
        universitySlug: universitySlug || null,
        courseSlug: courseSlug || null,
        studyLevel: studyLevel || null,
        subject: subject || null,
        fundingType,
        amount: amount || null,
        currency: currency || null,
        coverage: coverage ? (typeof coverage === "string" ? coverage : JSON.stringify(coverage)) : null,
        eligibility: eligibility || null,
        minimumRequirements: minimumRequirements ? (typeof minimumRequirements === "string" ? minimumRequirements : JSON.stringify(minimumRequirements)) : null,
        documentsRequired: documentsRequired ? (typeof documentsRequired === "string" ? documentsRequired : JSON.stringify(documentsRequired)) : null,
        applicationMethod: applicationMethod || null,
        applicationUrl: applicationUrl || null,
        openingDate: openingDate || null,
        deadline: deadline || null,
        decisionDate: decisionDate || null,
        status,
        verificationStatus,
        sourceUrl: sourceUrl || null,
        sourceName: sourceName || null,
        lastVerifiedAt: lastVerifiedAt ? new Date(lastVerifiedAt) : new Date(),
      },
    });

    await db.auditLog.create({
      data: {
        userId,
        action: "SCHOLARSHIP_CREATE",
        resource: "Scholarship",
        resourceId: scholarship.id,
        details: JSON.stringify({ slug, scholarshipCode, name }),
      },
    }).catch(() => {});

    return NextResponse.json({ scholarship }, { status: 201 });
  } catch (err: any) {
    console.error("[admin.scholarships.create] error:", err);
    return NextResponse.json({ error: "Failed to create scholarship", detail: err.message }, { status: 500 });
  }
}
