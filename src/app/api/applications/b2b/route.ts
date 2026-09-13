import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B } from '@/lib/application-manager/service';

export const GET = withAuth(async (req, auth) => {
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B access requires application.view_b2b permission' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const b2bType = searchParams.get('b2bType');
  const providerId = searchParams.get('providerId');
  const status = searchParams.get('status');
  const where: any = {};
  if (b2bType) where.b2bType = b2bType;
  if (providerId) where.b2bProviderId = providerId;
  if (status) where.b2bStatus = status;

  const apps = await db.b2bApplication.findMany({
    where,
    include: { b2bProvider: true, application: true },
    orderBy: { createdAt: 'desc' },
  });

  await logAuditAction(auth, 'VIEW_B2B_APPLICATIONS', 'B2bApplication', 'list');

  return NextResponse.json({ success: true, data: apps, applications: apps });
});

export const POST = withAuth(async (req, auth) => {
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B creation requires application.view_b2b permission' }, { status: 403 });
  }
  const body = await req.json();
  const required = ['applicationId', 'b2bProviderId'];
  for (const f of required) {
    if (!body[f]) return NextResponse.json({ success: false, error: `${f} required` }, { status: 400 });
  }

  const app = await db.b2bApplication.create({
    data: {
      applicationId: body.applicationId,
      b2bProviderId: body.b2bProviderId,
      b2bType: body.b2bType || 'B2B_OUTBOUND',
      b2bReference: body.b2bReference || '',
      submissionRoute: body.submissionRoute || body.b2bType || 'B2B_OUTBOUND',
      b2bStatus: body.b2bStatus || 'SUBMITTED',
      b2bCommissionType: body.b2bCommissionType || '',
      b2bCommissionAmount: body.b2bCommissionAmount || 0,
      b2bPaymentCondition: body.b2bPaymentCondition || '',
      b2bClaimStage: body.b2bClaimStage || 'NOT_CLAIMED',
      b2bInternalNote: body.b2bInternalNote || '',
      createdBy: auth.userId,
    },
  });

  // Update parent application to mark B2B
  await db.application.update({
    where: { id: body.applicationId },
    data: { isB2b: true, isB2bConfidential: true, b2bProviderId: body.b2bProviderId, b2bType: body.b2bType || 'B2B_OUTBOUND' },
  });

  await db.applicationStatusLog.create({
    data: {
      applicationId: body.applicationId,
      oldStatus: '',
      newStatus: 'B2B_SUBMITTED',
      safeStatus: 'SUBMITTED',
      changedBy: auth.userId,
      visibility: 'B2B_CONFIDENTIAL',
      note: `Submitted through B2B provider ${body.b2bProviderId} — confidential`,
    },
  });

  await db.applicationComment.create({
    data: {
      applicationId: body.applicationId,
      userId: auth.userId,
      role: auth.roles[0] || 'APPLICATION_TEAM',
      commentType: 'B2B_CONFIDENTIAL',
      visibility: 'B2B_CONFIDENTIAL',
      commentText: body.b2bInternalNote || 'B2B application created — confidential, not visible to student/partner',
      isB2bConfidential: true,
    },
  });

  await logAuditAction(auth, 'CREATE_B2B_APPLICATION', 'B2bApplication', app.id);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'CREATE_B2B_APPLICATION',
      resource: 'B2bApplication',
      resourceId: app.id,
      details: JSON.stringify({ applicationId: body.applicationId, b2bProviderId: body.b2bProviderId, b2bType: body.b2bType }),
      actorRole: auth.roles[0] || '',
    },
  });

  return NextResponse.json({ success: true, data: app, message: 'B2B application created — student and partner will NOT see B2B details' });
});
