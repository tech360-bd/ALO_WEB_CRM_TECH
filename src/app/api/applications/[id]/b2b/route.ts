import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction, type AuthContext } from '@/lib/auth-middleware';
import {
  canViewB2B,
  canManageB2B,
  canViewB2BCommission,
  sanitizeB2BApplicationRecord,
} from '@/lib/application-manager/service';

const b2bStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'ACKNOWLEDGED', 'DECISION_PENDING', 'OFFER_RECEIVED', 'REJECTED', 'DEFERRED', 'WITHDRAWN']);
const updateSchema = z.object({
  id: z.string().trim().min(1).max(191),
  b2bStatus: b2bStatusSchema.optional(),
  b2bReference: z.string().trim().max(191).optional(),
  nextFollowupAt: z.string().datetime().nullable().optional(),
  b2bInternalNote: z.string().max(10000).optional(),
  b2bCommissionType: z.string().trim().max(191).optional(),
  b2bCommissionAmount: z.number().finite().nonnegative().optional(),
  b2bPaymentCondition: z.string().trim().max(191).optional(),
  b2bClaimStage: z.string().trim().max(191).optional(),
}).strict();
const createSchema = z.object({
  b2bProviderId: z.string().trim().min(1).max(191),
  b2bType: z.enum(['B2B_INBOUND', 'B2B_OUTBOUND']).optional(),
  b2bReference: z.string().trim().max(191).optional(),
  submissionRoute: z.string().trim().max(191).optional(),
  b2bCommissionType: z.string().trim().max(191).optional(),
  b2bCommissionAmount: z.number().finite().nonnegative().optional(),
  b2bPaymentCondition: z.string().trim().max(191).optional(),
  b2bClaimStage: z.string().trim().max(191).optional(),
  b2bInternalNote: z.string().max(10000).optional(),
}).strict();

function isPartner(auth: AuthContext): boolean {
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || auth.roles.some((role) => role.toLowerCase().startsWith('partner')));
}

function hasCommissionWrite(input: Record<string, unknown>): boolean {
  return ['b2bCommissionType', 'b2bCommissionAmount', 'b2bPaymentCondition', 'b2bClaimStage'].some((field) => Object.prototype.hasOwnProperty.call(input, field));
}

async function loadScopedApplication(applicationId: string, auth: AuthContext) {
  const partner = isPartner(auth);
  if (partner && !auth.partnerId) return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });
  const app = await db.application.findFirst({ where: { id: applicationId, ...(partner ? { partnerId: auth.partnerId } : {}) } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });

  const roles = auth.roles.map((role) => role.toLowerCase());
  if (partner) return { app, isPartner: true };
  if (roles.includes('counselor') && app.counselorId !== auth.userId && !auth.permissions.includes('application.view_all')) {
    return NextResponse.json({ success: false, error: 'Application is not assigned to this counselor.' }, { status: 403 });
  }
  if (roles.includes('application_officer') && ![app.applicationOfficer, app.appTeamOfficerId].includes(auth.userId) && !auth.permissions.includes('application.view_all')) {
    return NextResponse.json({ success: false, error: 'Application is not assigned to this officer.' }, { status: 403 });
  }
  return { app, isPartner: false };
}

export const GET = withAuth(async (_req, auth, { params }: any) => {
  if (!canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B details require application.view_b2b permission.' }, { status: 403 });
  }
  const access = await loadScopedApplication(params.id, auth);
  if (access instanceof NextResponse) return access;

  try {
    const records = await db.b2bApplication.findMany({
      where: { applicationId: params.id },
      include: { b2bProvider: true },
      orderBy: { createdAt: 'desc' },
    });
    const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
    const data = records.map((record: any) => sanitizeB2BApplicationRecord(record, canViewCommission));
    await logAuditAction(auth, 'VIEW_B2B_DETAILS', 'Application', params.id, { recordCount: data.length });
    return NextResponse.json({ success: true, data, b2bApplications: data });
  } catch (error) {
    console.error('[application.b2b.get] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B details are temporarily unavailable.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  if (!canManageB2B(auth.roles, auth.permissions) || isPartner(auth)) {
    return NextResponse.json({ success: false, error: 'Forbidden: ALO-side B2B management permission required.' }, { status: 403 });
  }
  const requestBody = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(requestBody);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid B2B application update.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
  if (hasCommissionWrite(requestBody as Record<string, unknown>) && !canViewCommission) {
    return NextResponse.json({ success: false, error: 'B2B commission updates require application.view_b2b_commission permission.' }, { status: 403 });
  }
  const access = await loadScopedApplication(params.id, auth);
  if (access instanceof NextResponse) return access;

  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.b2bApplication.findUnique({ where: { id: body.id } });
      if (!existing) throw Object.assign(new Error('B2B application not found.'), { code: 'B2B_NOT_FOUND' });
      if (existing.applicationId !== params.id) throw Object.assign(new Error('B2B application does not belong to this application.'), { code: 'PARENT_MISMATCH' });
      const changed = await tx.b2bApplication.updateMany({
        where: { id: body.id, applicationId: params.id, b2bStatus: existing.b2bStatus },
        data: {
          ...(body.b2bStatus !== undefined ? { b2bStatus: body.b2bStatus } : {}),
          ...(body.b2bReference !== undefined ? { b2bReference: body.b2bReference } : {}),
          ...(body.nextFollowupAt !== undefined ? { nextFollowupAt: body.nextFollowupAt ? new Date(body.nextFollowupAt) : null } : {}),
          ...(body.b2bInternalNote !== undefined ? { b2bInternalNote: body.b2bInternalNote } : {}),
          ...(canViewCommission ? {
            ...(body.b2bCommissionType !== undefined ? { b2bCommissionType: body.b2bCommissionType } : {}),
            ...(body.b2bCommissionAmount !== undefined ? { b2bCommissionAmount: body.b2bCommissionAmount } : {}),
            ...(body.b2bPaymentCondition !== undefined ? { b2bPaymentCondition: body.b2bPaymentCondition } : {}),
            ...(body.b2bClaimStage !== undefined ? { b2bClaimStage: body.b2bClaimStage } : {}),
          } : {}),
          lastFollowupAt: new Date(),
          updatedBy: auth.userId,
        },
      });
      if (changed.count !== 1) throw Object.assign(new Error('B2B application changed during update.'), { code: 'CONCURRENT_UPDATE' });
      const updated = await tx.b2bApplication.findUnique({ where: { id: body.id }, include: { b2bProvider: true } });
      await tx.applicationStatusLog.create({
        data: {
          applicationId: params.id,
          oldStatus: existing.b2bStatus,
          newStatus: body.b2bStatus || existing.b2bStatus,
          safeStatus: access.app.safeStatus,
          changedBy: auth.userId,
          visibility: 'B2B_CONFIDENTIAL',
          note: 'Confidential B2B application record updated.',
        },
      });
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'UPDATE_B2B_APPLICATION',
          resource: 'B2bApplication',
          resourceId: body.id,
          details: JSON.stringify({ applicationId: params.id, changedFields: Object.keys(requestBody as Record<string, unknown>).filter((field) => field !== 'b2bInternalNote') }),
          actorRole: auth.roles[0] || '',
          studentId: access.app.studentId,
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, data: sanitizeB2BApplicationRecord(result as any, canViewCommission) });
  } catch (error: any) {
    if (['B2B_NOT_FOUND', 'PARENT_MISMATCH', 'CONCURRENT_UPDATE'].includes(error?.code)) {
      const status = error.code === 'B2B_NOT_FOUND' ? 404 : error.code === 'PARENT_MISMATCH' ? 400 : 409;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    console.error('[application.b2b.patch] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B application could not be updated.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req, auth, { params }: any) => {
  if (!canManageB2B(auth.roles, auth.permissions) || isPartner(auth)) {
    return NextResponse.json({ success: false, error: 'Forbidden: ALO-side B2B management permission required.' }, { status: 403 });
  }
  const requestBody = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(requestBody);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid B2B application request.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
  if (hasCommissionWrite(requestBody as Record<string, unknown>) && !canViewCommission) {
    return NextResponse.json({ success: false, error: 'B2B commission updates require application.view_b2b_commission permission.' }, { status: 403 });
  }
  const access = await loadScopedApplication(params.id, auth);
  if (access instanceof NextResponse) return access;
  if (!['SUBMITTED_TO_B2B', 'B2B_SUBMITTED', 'B2B_ACKNOWLEDGED'].includes(access.app.stage)) {
    return NextResponse.json({ success: false, error: 'Move the application through the authorized B2B submission transition before linking a provider.' }, { status: 409 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const provider = await tx.b2bProvider.findFirst({ where: { id: body.b2bProviderId, status: { in: ['ACTIVE', 'active', 'APPROVED', 'approved'] } }, select: { id: true } });
      if (!provider) throw Object.assign(new Error('B2B provider is not active or approved.'), { code: 'PROVIDER_UNAVAILABLE' });
      const b2bType = body.b2bType || 'B2B_OUTBOUND';
      const b2bReference = body.b2bReference || '';
      const existing = await tx.b2bApplication.findUnique({
        where: { applicationId_b2bProviderId_b2bReference: { applicationId: params.id, b2bProviderId: body.b2bProviderId, b2bReference } },
      });
      const record = await tx.b2bApplication.upsert({
        where: { applicationId_b2bProviderId_b2bReference: { applicationId: params.id, b2bProviderId: body.b2bProviderId, b2bReference } },
        update: {
          b2bType,
          submissionRoute: body.submissionRoute || b2bType,
          b2bInternalNote: body.b2bInternalNote || '',
          ...(canViewCommission ? {
            b2bCommissionType: body.b2bCommissionType || '',
            b2bCommissionAmount: body.b2bCommissionAmount ?? 0,
            b2bPaymentCondition: body.b2bPaymentCondition || '',
            b2bClaimStage: body.b2bClaimStage || 'NOT_CLAIMED',
          } : {}),
          updatedBy: auth.userId,
        },
        create: {
          applicationId: params.id,
          b2bProviderId: body.b2bProviderId,
          b2bType,
          b2bReference,
          submissionRoute: body.submissionRoute || b2bType,
          submittedDate: new Date(),
          b2bStatus: 'SUBMITTED',
          b2bCommissionType: canViewCommission ? body.b2bCommissionType || '' : '',
          b2bCommissionAmount: canViewCommission ? body.b2bCommissionAmount ?? 0 : 0,
          b2bPaymentCondition: canViewCommission ? body.b2bPaymentCondition || '' : '',
          b2bClaimStage: canViewCommission ? body.b2bClaimStage || 'NOT_CLAIMED' : 'NOT_CLAIMED',
          b2bInternalNote: body.b2bInternalNote || '',
          createdBy: auth.userId,
        },
        include: { b2bProvider: true },
      });
      await tx.application.update({
        where: { id: params.id },
        data: { isB2b: true, isB2bConfidential: true, b2bProviderId: body.b2bProviderId, b2bType, updatedBy: auth.userId },
      });
      await tx.applicationStatusLog.create({
        data: {
          applicationId: params.id,
          oldStatus: access.app.stage,
          newStatus: access.app.stage,
          safeStatus: access.app.safeStatus,
          changedBy: auth.userId,
          visibility: 'B2B_CONFIDENTIAL',
          note: `B2B provider ${existing ? 'updated' : 'linked'} through the authorized application workflow.`,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: existing ? 'UPDATE_B2B_APPLICATION' : 'CREATE_B2B_APPLICATION',
          resource: 'B2bApplication',
          resourceId: record.id,
          details: JSON.stringify({ applicationId: params.id, b2bProviderId: body.b2bProviderId, b2bType }),
          actorRole: auth.roles[0] || '',
          studentId: access.app.studentId,
        },
      });
      return record;
    });
    return NextResponse.json({ success: true, data: sanitizeB2BApplicationRecord(result as any, canViewCommission) }, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'PROVIDER_UNAVAILABLE') return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    console.error('[application.b2b.post] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B application could not be saved.' }, { status: 503 });
  }
});
