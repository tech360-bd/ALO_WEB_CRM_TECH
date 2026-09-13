import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth-middleware";
import { canViewB2B, canViewB2BCommission } from "@/lib/application-manager/service";

// GET — B2B applications (restricted)
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B access requires application.view_b2b permission' }, { status: 403 });
  }

  const b2bType = req.nextUrl.searchParams.get("b2bType");
  const where: any = {};
  if (b2bType) where.b2bType = b2bType;

  const applications = await db.b2bApplication.findMany({
    where,
    include: { b2bProvider: true, application: true },
    orderBy: { createdAt: "desc" },
  });

  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
  const sanitized = applications.map((app: any) => {
    if (!canViewCommission) {
      const { b2bCommissionAmount, b2bCommissionType, b2bPaymentCondition, b2bClaimStage, ...rest } = app;
      return rest;
    }
    return app;
  });

  return NextResponse.json({ applications: sanitized, success: true, data: sanitized });
}

// POST — create B2B application
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { applicationId, b2bProviderId, b2bType, b2bReference, submissionRoute, submittedDate, b2bCommissionType, b2bCommissionAmount, b2bPaymentCondition, b2bClaimStage, b2bInternalNote, createdBy } = body;

  if (!applicationId || !b2bProviderId) {
    return NextResponse.json({ success: false, error: 'applicationId and b2bProviderId required' }, { status: 400 });
  }

  const b2bApp = await db.b2bApplication.create({
    data: {
      applicationId,
      b2bProviderId,
      b2bType: b2bType || 'B2B_OUTBOUND',
      b2bReference: b2bReference || '',
      submissionRoute: submissionRoute || b2bType || 'B2B_OUTBOUND',
      submittedDate: submittedDate ? new Date(submittedDate) : new Date(),
      b2bCommissionType: b2bCommissionType || '',
      b2bCommissionAmount: b2bCommissionAmount || 0,
      b2bPaymentCondition: b2bPaymentCondition || '',
      b2bClaimStage: b2bClaimStage || 'NOT_CLAIMED',
      b2bInternalNote: b2bInternalNote || '',
      createdBy: createdBy || auth.userId,
      b2bStatus: "SUBMITTED",
    },
  });

  await db.application.update({
    where: { id: applicationId },
    data: { isB2b: true, isB2bConfidential: true, b2bProviderId, b2bType: b2bType || 'B2B_OUTBOUND' },
  });

  // Add confidential timeline entry
  await db.applicationStatusLog.create({
    data: {
      applicationId,
      oldStatus: '',
      newStatus: "B2B_SUBMITTED",
      safeStatus: "Submitted",
      visibility: "B2B_CONFIDENTIAL",
      changedBy: createdBy || auth.userId,
      note: `Application submitted through B2B provider. Type: ${b2bType}. Reference: ${b2bReference || "N/A"}`,
    },
  });

  // Add confidential comment
  await db.applicationComment.create({
    data: {
      applicationId,
      userId: createdBy || auth.userId,
      role: auth.roles[0] || 'APPLICATION_TEAM',
      commentType: "B2B_CONFIDENTIAL",
      visibility: "B2B_CONFIDENTIAL",
      commentText: b2bInternalNote || "B2B application created. Confidential — do not share with student or partner.",
      isB2bConfidential: true,
    },
  });

  await db.auditLog.create({
    data: { userId: createdBy || auth.userId, action: "CREATE_B2B_APPLICATION", resource: "B2bApplication", resourceId: b2bApp.id, details: JSON.stringify({ b2bType, b2bProviderId, applicationId }), actorRole: auth.roles[0] || '' },
  });

  return NextResponse.json({
    b2bApp,
    success: true,
    data: b2bApp,
    message: "B2B application created. Student and partner will NOT see B2B details. Only Application Team and Super Admin can view.",
  });
}

// PATCH — update B2B application status
export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { id, b2bStatus, nextFollowupAt, updatedBy } = body;
  if (!id) return NextResponse.json({ success: false, error: 'id required' }, { status: 400 });

  const b2bApp = await db.b2bApplication.update({
    where: { id },
    data: { b2bStatus, nextFollowupAt: nextFollowupAt ? new Date(nextFollowupAt) : undefined, lastFollowupAt: new Date(), updatedBy: updatedBy || auth.userId },
  });

  await db.auditLog.create({ data: { userId: updatedBy || auth.userId, action: "UPDATE_B2B_APPLICATION", resource: "B2bApplication", resourceId: id, details: JSON.stringify({ b2bStatus }), actorRole: auth.roles[0] || '' } });

  return NextResponse.json({ b2bApp, success: true, data: b2bApp, message: `B2B application status updated to ${b2bStatus}.` });
}
