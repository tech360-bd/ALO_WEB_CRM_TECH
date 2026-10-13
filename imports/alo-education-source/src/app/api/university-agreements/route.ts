import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (status) where.status = status;
  const agreements = await db.universityAgreement.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ agreements });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { universitySlug, universityName, countrySlug, partnershipType, commissionTerms, contactName, contactEmail, contactPhone, officialWebsite, notes, requestedById } = body;
  if (!universitySlug || !universityName) return NextResponse.json({ error: "universitySlug and universityName required" }, { status: 400 });
  const agreement = await db.universityAgreement.create({ data: { agreementCode: `ALO-AGR-${Date.now().toString().slice(-6)}`, universitySlug, universityName, countrySlug, partnershipType, commissionTerms, contactName, contactEmail, contactPhone, officialWebsite, notes, requestedById, status: "REQUESTED" } });
  return NextResponse.json({ agreement });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, approvedById } = body;
  if (!id || !status) return NextResponse.json({ error: "id and status required" }, { status: 400 });
  const updates: any = { status };
  if (status === "APPROVED") { updates.approvedById = approvedById; updates.approvedAt = new Date(); }
  const agreement = await db.universityAgreement.update({ where: { id }, data: updates });
  return NextResponse.json({ agreement });
}
