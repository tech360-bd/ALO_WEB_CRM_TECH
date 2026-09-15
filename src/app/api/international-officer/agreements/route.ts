// International Officer — University Agreements management (wrapper around UniversityAgreement with enhanced queries)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const status = sp.get("status") || undefined;
    const partnershipType = sp.get("partnershipType") || undefined;
    const countrySlug = sp.get("countrySlug") || undefined;
    const universitySlug = sp.get("universitySlug") || undefined;
    const q = sp.get("q") || undefined;
    const limit = sp.get("limit") ? Math.min(100, parseInt(sp.get("limit")!)) : 20;
    const offset = sp.get("offset") ? parseInt(sp.get("offset")!) : 0;

    const where: any = {};
    if (status) where.status = status;
    if (partnershipType) where.partnershipType = partnershipType;
    if (countrySlug) where.countrySlug = countrySlug;
    if (universitySlug) where.universitySlug = universitySlug;
    if (q) where.OR = [{ universityName: { contains: q } }, { contactName: { contains: q } }, { agreementCode: { contains: q } }];

    const [agreements, total] = await Promise.all([
      db.universityAgreement.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
      db.universityAgreement.count({ where }),
    ]);

    return NextResponse.json({ success: true, agreements, total, limit, offset });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const body = await req.json();

    if (!body.universitySlug || !body.universityName) {
      return NextResponse.json({ error: "universitySlug and universityName required" }, { status: 400 });
    }

    // Generate agreement code if not provided
    const agreementCode = body.agreementCode || `ALO-AGR-${Date.now().toString().slice(-6)}${Math.random().toString(36).slice(2,4).toUpperCase()}`;

    const agreement = await db.universityAgreement.create({
      data: {
        agreementCode,
        universitySlug: body.universitySlug,
        universityName: body.universityName,
        countrySlug: body.countrySlug || "",
        status: body.status || "PENDING",
        partnershipType: body.partnershipType || "AGENT",
        commissionTerms: body.commissionTerms || "",
        agreementUrl: body.agreementUrl || null,
        contactName: body.contactName || "",
        contactEmail: body.contactEmail || "",
        contactPhone: body.contactPhone || "",
        officialWebsite: body.officialWebsite || "",
        researchData: body.researchData ? (typeof body.researchData === "string" ? body.researchData : JSON.stringify(body.researchData)) : null,
        notes: body.notes || "",
        requestedById: user.id || user.email || "unknown",
      },
    });

    return NextResponse.json({ success: true, agreement });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = session.user as any;
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const updateData: any = {};
    const fields = ["universityName", "countrySlug", "status", "partnershipType", "commissionTerms", "agreementUrl", "contactName", "contactEmail", "contactPhone", "officialWebsite", "notes"];
    for (const f of fields) if (body[f] !== undefined) updateData[f] = body[f];
    if (body.researchData !== undefined) updateData.researchData = typeof body.researchData === "string" ? body.researchData : JSON.stringify(body.researchData);
    if (body.status === "APPROVED" || body.status === "ACTIVE") {
      updateData.approvedById = user.id || user.email || "unknown";
    }

    const agreement = await db.universityAgreement.update({ where: { id: body.id }, data: updateData });
    return NextResponse.json({ success: true, agreement });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
