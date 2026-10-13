import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — B2B providers (restricted to Application Team / Super Admin)
export async function GET() {
  const providers = await db.b2bProvider.findMany({ include: { _count: { select: { b2bApplications: true } } }, orderBy: { name: "asc" } });
  return NextResponse.json({ providers });
}

// POST — create B2B provider
export async function POST(req: NextRequest) {
  const body = await req.json();
  const provider = await db.b2bProvider.create({
    data: {
      providerCode: body.providerCode || `B2B-${Math.floor(Math.random() * 9999)}`,
      name: body.name,
      providerType: body.providerType,
      contactPerson: body.contactPerson,
      email: body.email,
      phone: body.phone,
      portalUrl: body.portalUrl,
      loginNote: body.loginNote,
      commissionRule: body.commissionRule,
      paymentCondition: body.paymentCondition,
      claimStage: body.claimStage,
      status: "ACTIVE",
      createdBy: body.createdBy,
      lastReviewedAt: new Date(),
      internalNote: body.internalNote,
    },
  });
  await db.auditLog.create({ data: { userId: body.createdBy, action: "DATA_IMPORT", resource: "B2bProvider", resourceId: provider.id, details: JSON.stringify({ name: body.name }) } });
  return NextResponse.json({ provider, message: "B2B provider created." });
}
