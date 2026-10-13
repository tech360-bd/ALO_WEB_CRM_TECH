import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — B2B applications (restricted)
export async function GET(req: NextRequest) {
  const b2bType = req.nextUrl.searchParams.get("b2bType");
  const where: any = {};
  if (b2bType) where.b2bType = b2bType;
  const applications = await db.b2bApplication.findMany({
    where,
    include: { b2bProvider: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ applications });
}

// POST — create B2B application
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { applicationId, b2bProviderId, b2bType, b2bReference, submissionRoute, submittedDate, b2bCommissionType, b2bCommissionAmount, b2bPaymentCondition, b2bClaimStage, b2bInternalNote, createdBy } = body;

  const b2bApp = await db.b2bApplication.create({
    data: {
      applicationId,
      b2bProviderId,
      b2bType,
      b2bReference,
      submissionRoute,
      submittedDate,
      b2bCommissionType,
      b2bCommissionAmount,
      b2bPaymentCondition,
      b2bClaimStage,
      b2bInternalNote,
      createdBy,
      b2bStatus: "SUBMITTED",
    },
  });

  // Add confidential timeline entry
  await db.applicationStatusLog.create({
    data: {
      applicationId,
      newStatus: "B2B_SUBMITTED",
      safeStatus: "Submitted",
      visibility: "B2B_CONFIDENTIAL",
      note: `Application submitted through B2B provider. Type: ${b2bType}. Reference: ${b2bReference || "N/A"}`,
    },
  });

  // Add confidential comment
  await db.applicationComment.create({
    data: {
      applicationId,
      commentType: "B2B_CONFIDENTIAL",
      visibility: "B2B_CONFIDENTIAL",
      commentText: b2bInternalNote || "B2B application created. Confidential — do not share with student or partner.",
      isB2bConfidential: true,
    },
  });

  await db.auditLog.create({
    data: { userId: createdBy, action: "DATA_IMPORT", resource: "B2bApplication", resourceId: b2bApp.id, details: JSON.stringify({ b2bType, b2bProviderId, applicationId }) },
  });

  return NextResponse.json({
    b2bApp,
    message: "B2B application created. Student and partner will NOT see B2B details. Only Application Team and Super Admin can view.",
  });
}

// PATCH — update B2B application status
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, b2bStatus, nextFollowupAt, updatedBy } = body;
  const b2bApp = await db.b2bApplication.update({
    where: { id },
    data: { b2bStatus, nextFollowupAt, lastFollowupAt: new Date() },
  });
  await db.auditLog.create({ data: { userId: updatedBy, action: "AI_ACTION", resource: "B2bApplication", resourceId: id, details: JSON.stringify({ b2bStatus }) } });
  return NextResponse.json({ b2bApp, message: `B2B application status updated to ${b2bStatus}.` });
}
