import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B, canViewB2BCommission, stripB2BFields } from '@/lib/application-manager/service';

export const GET = withAuth(async (req, auth, { params }: any) => {
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B access requires application.view_b2b permission' }, { status: 403 });
  }
  const b2bApps = await db.b2bApplication.findMany({
    where: { applicationId: params.id },
    include: { b2bProvider: true },
    orderBy: { createdAt: 'desc' },
  });

  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
  const sanitized = b2bApps.map((app: any) => {
    if (!canViewCommission) {
      const { b2bCommissionAmount, b2bCommissionType, b2bPaymentCondition, b2bClaimStage, ...rest } = app;
      // Also strip provider sensitive fields
      if (rest.b2bProvider) {
        const { loginNote, commissionRule, paymentCondition, internalNote, email, phone, portalUrl, ...providerSafe } = rest.b2bProvider;
        rest.b2bProvider = providerSafe;
      }
      return rest;
    }
    // Even with commission view, strip login credentials unless manage permission
    const { b2bProvider, ...rest } = app as any;
    if (b2bProvider) {
      const { loginNote, ...providerWithoutCreds } = b2bProvider;
      // Only APPLICATION_MANAGER can see loginNote
      const canManage = auth.roles.includes('super_admin') || auth.roles.includes('application_manager') || auth.permissions.includes('application.manage_b2b_providers');
      return { ...rest, b2bProvider: canManage ? b2bProvider : providerWithoutCreds };
    }
    return app;
  });

  await logAuditAction(auth, 'VIEW_B2B_DETAILS', 'Application', params.id);

  return NextResponse.json({ success: true, data: sanitized, b2bApplications: sanitized });
});

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B access requires application.view_b2b permission' }, { status: 403 });
  }
  const body = await req.json();
  // body must contain b2bApplication id in params? Actually we use applicationId + id in body
  // For simplicity, expect body.id is b2bApplication id
  if (!body.id) {
    return NextResponse.json({ success: false, error: 'B2B application id required in body.id' }, { status: 400 });
  }

  const existing = await db.b2bApplication.findUnique({ where: { id: body.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'B2B application not found' }, { status: 404 });
  if (existing.applicationId !== params.id) {
    return NextResponse.json({ success: false, error: 'B2B application does not belong to this application' }, { status: 400 });
  }

  const updated = await db.b2bApplication.update({
    where: { id: body.id },
    data: {
      b2bStatus: body.b2bStatus || existing.b2bStatus,
      b2bReference: body.b2bReference ?? existing.b2bReference,
      nextFollowupAt: body.nextFollowupAt ? new Date(body.nextFollowupAt) : existing.nextFollowupAt,
      lastFollowupAt: new Date(),
      b2bInternalNote: body.b2bInternalNote ?? existing.b2bInternalNote,
      b2bCommissionType: body.b2bCommissionType ?? existing.b2bCommissionType,
      b2bCommissionAmount: body.b2bCommissionAmount ?? existing.b2bCommissionAmount,
      b2bPaymentCondition: body.b2bPaymentCondition ?? existing.b2bPaymentCondition,
      b2bClaimStage: body.b2bClaimStage ?? existing.b2bClaimStage,
      updatedBy: auth.userId,
    },
  });

  await db.applicationStatusLog.create({
    data: {
      applicationId: params.id,
      oldStatus: existing.b2bStatus,
      newStatus: body.b2bStatus || existing.b2bStatus,
      safeStatus: 'SUBMITTED',
      changedBy: auth.userId,
      visibility: 'B2B_CONFIDENTIAL',
      note: `B2B status updated to ${body.b2bStatus || existing.b2bStatus}`,
    },
  });

  await logAuditAction(auth, 'UPDATE_B2B_APPLICATION', 'B2bApplication', body.id, { b2bStatus: body.b2bStatus });
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'UPDATE_B2B_APPLICATION',
      resource: 'B2bApplication',
      resourceId: body.id,
      details: JSON.stringify({ b2bStatus: body.b2bStatus }),
      actorRole: auth.roles[0] || '',
    },
  });

  return NextResponse.json({ success: true, data: updated });
});

export const POST = withAuth(async (req, auth, { params }: any) => {
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }
  const body = await req.json();
  if (!body.b2bProviderId) return NextResponse.json({ success: false, error: 'b2bProviderId required' }, { status: 400 });

  const b2bApp = await db.b2bApplication.create({
    data: {
      applicationId: params.id,
      b2bProviderId: body.b2bProviderId,
      b2bType: body.b2bType || 'B2B_OUTBOUND',
      b2bReference: body.b2bReference || '',
      submissionRoute: body.submissionRoute || 'B2B_OUTBOUND',
      b2bStatus: 'SUBMITTED',
      b2bCommissionType: body.b2bCommissionType || '',
      b2bCommissionAmount: body.b2bCommissionAmount || 0,
      b2bPaymentCondition: body.b2bPaymentCondition || '',
      b2bClaimStage: body.b2bClaimStage || 'NOT_CLAIMED',
      b2bInternalNote: body.b2bInternalNote || '',
      createdBy: auth.userId,
    },
  });

  await db.application.update({
    where: { id: params.id },
    data: { isB2b: true, isB2bConfidential: true, b2bProviderId: body.b2bProviderId, b2bType: body.b2bType || 'B2B_OUTBOUND' },
  });

  await logAuditAction(auth, 'CREATE_B2B_APPLICATION', 'B2bApplication', b2bApp.id);
  return NextResponse.json({ success: true, data: b2bApp });
});
