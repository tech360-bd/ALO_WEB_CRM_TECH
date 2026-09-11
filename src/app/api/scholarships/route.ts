import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/scholarships — list scholarships with filters (public)
// Filters: country (slug), level (studyLevel), status, fundingType, search (name/subject)
export async function GET(req: NextRequest) {
  try {
    const country = req.nextUrl.searchParams.get("country");
    const level = req.nextUrl.searchParams.get("level");
    const status = req.nextUrl.searchParams.get("status");
    const fundingType = req.nextUrl.searchParams.get("fundingType");
    const search = req.nextUrl.searchParams.get("search");
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get("limit") || "100", 10), 200);

    const where: any = {};
    if (country) where.countrySlug = country;
    if (level) where.studyLevel = level;
    if (status) where.status = status;
    else where.status = { in: ["OPEN", "CLOSING_SOON", "UPCOMING"] };
    if (fundingType) where.fundingType = fundingType;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { subject: { contains: search } },
        { eligibility: { contains: search } },
      ];
    }

    const scholarships = await db.scholarship.findMany({
      where,
      orderBy: [{ status: "asc" }, { deadline: "asc" }, { name: "asc" }],
      take: limit,
      select: {
        id: true,
        slug: true,
        scholarshipCode: true,
        name: true,
        countrySlug: true,
        universitySlug: true,
        studyLevel: true,
        subject: true,
        fundingType: true,
        amount: true,
        currency: true,
        deadline: true,
        status: true,
        verificationStatus: true,
        sourceUrl: true,
        sourceName: true,
        lastVerifiedAt: true,
        updatedAt: true,
      },
    });

    // Funding-type / status counts for the sidebar filter UI
    const [fundingTypes, statuses] = await Promise.all([
      db.scholarship.groupBy({ by: ["fundingType"], _count: true }),
      db.scholarship.groupBy({ by: ["status"], _count: true }),
    ]);

    return NextResponse.json({
      scholarships,
      total: scholarships.length,
      filters: {
        fundingTypes: fundingTypes.map((f: any) => ({ label: f.fundingType, count: f._count })),
        statuses: statuses.map((s: any) => ({ label: s.status, count: s._count })),
      },
    });
  } catch (err: any) {
    console.error("[scholarships.list] error:", err);
    return NextResponse.json({ error: "Failed to list scholarships", detail: err.message }, { status: 500 });
  }
}

// POST /api/scholarships — create a scholarship (admin)
export async function POST(req: NextRequest) {
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
      faqs = [], performedBy,
    } = body as any;

    if (!slug || !scholarshipCode || !name || !fundingType) {
      return NextResponse.json(
        { error: "Missing required fields: slug, scholarshipCode, name, fundingType" },
        { status: 400 }
      );
    }

    // Check uniqueness
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
        faqs: faqs.length
          ? {
              create: faqs.map((f: any, i: number) => ({
                question: f.question, answer: f.answer, sortOrder: f.sortOrder ?? i,
              })),
            }
          : undefined,
      },
      include: { faqs: true },
    });

    const userId = await resolveUserId(performedBy);
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
    console.error("[scholarships.create] error:", err);
    return NextResponse.json({ error: "Failed to create scholarship", detail: err.message }, { status: 500 });
  }
}

async function resolveUserId(performedBy?: string): Promise<string | null> {
  if (!performedBy) return null;
  if (performedBy.includes("@")) {
    const u = await db.user.findFirst({ where: { email: performedBy.toLowerCase() }, select: { id: true } });
    return u?.id ?? null;
  }
  return performedBy;
}
