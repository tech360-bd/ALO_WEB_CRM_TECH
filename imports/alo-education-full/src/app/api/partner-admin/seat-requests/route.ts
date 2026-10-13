import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — seat requests
export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get("partnerId");
  const where: any = {};
  if (partnerId) where.partnerId = partnerId;
  const requests = await db.partnerUserSeatRequest.findMany({ where, orderBy: { createdAt: "desc" } });
  return NextResponse.json({ requests });
}

// POST — partner requests extra seats
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { partnerId, requestedBy, currentLimit, requestedExtraSeats, reason } = body;

  const request = await db.partnerUserSeatRequest.create({
    data: { partnerId, requestedBy, currentLimit, requestedExtraSeats, reason, status: "PENDING" },
  });

  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "PartnerUserSeatRequest", resourceId: request.id, details: JSON.stringify({ requestedExtraSeats, reason }) },
  });

  return NextResponse.json({
    request,
    message: "Extra seat request submitted. ALO Education Super Admin will review and approve/reject.",
  });
}

// PATCH — ALO Super Admin approves/rejects
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, status, reviewedBy, reviewNote } = body;

  const request = await db.partnerUserSeatRequest.update({
    where: { id },
    data: { status, reviewedBy, reviewNote },
  });

  await db.auditLog.create({
    data: { userId: reviewedBy, action: "PERMISSION_CHANGE", resource: "PartnerUserSeatRequest", resourceId: id, details: JSON.stringify({ status, extraSeats: request.requestedExtraSeats }) },
  });

  return NextResponse.json({ request, message: `Seat request ${status.toLowerCase()}.` });
}
