import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — list extra quota requests
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const where: any = {};
  if (status) where.status = status;
  const requests = await db.extraQuotaRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ requests });
}

// POST — partner requests extra quota
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { partnerId, requestType, currentLimit, requestedLimit, reason } = body;
  const request = await db.extraQuotaRequest.create({
    data: { partnerId, requestType, currentLimit, requestedLimit, reason, status: "PENDING" },
  });
  // Notify Super Admin (in production: send notification)
  return NextResponse.json({ request, message: "Extra quota request submitted. ALO Super Admin will review." });
}

// PATCH — approve/reject extra quota request
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, reviewedBy, reviewNote } = body;
  const request = await db.extraQuotaRequest.update({
    where: { id },
    data: { status, reviewedBy, reviewNote },
  });

  // If approved, update the feature access rule limit
  if (status === "APPROVED") {
    const featureMap: Record<string, string> = {
      EXTRA_IMAGE_QUOTA: "marketing.image.generate",
      EXTRA_VIDEO_QUOTA: "marketing.video.generate",
      EXTRA_MOCK_VOUCHER: "partner.student.benefit",
    };
    const featureKey = featureMap[request.requestType];
    if (featureKey) {
      await db.featureAccessRule.updateMany({
        where: { ownerType: "PARTNER", ownerId: request.partnerId, featureKey },
        data: { limitValue: request.requestedLimit },
      });
    }
  }

  await db.auditLog.create({
    data: {
      userId: reviewedBy,
      action: "PERMISSION_CHANGE",
      resource: "ExtraQuotaRequest",
      resourceId: id,
      details: JSON.stringify({ status, requestType: request.requestType }),
    },
  });

  return NextResponse.json({ request, message: `Request ${status.toLowerCase()}.` });
}
