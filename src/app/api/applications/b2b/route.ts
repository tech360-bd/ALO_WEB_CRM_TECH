import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B, canManageB2B, canViewB2BCommission, sanitizeB2BApplicationRecord } from '@/lib/application-manager/service';

function isPartner(auth: { partnerId?: string; userType: string; roles: string[] }): boolean {
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || auth.roles.some((role) => role.toLowerCase().startsWith('partner')));
}

function sanitizeB2b(record: any, canViewCommission: boolean) {
  return sanitizeB2BApplicationRecord(record, canViewCommission);
}

const bodySchema = z.object({
  applicationId: z.string().trim().min(1).max(191),
  b2bProviderId: z.string().trim().min(1).max(191),
  b2bType: z.enum(['B2B_INBOUND', 'B2B_OUTBOUND', 'INBOUND', 'OUTBOUND']).optional(),
  b2bReference: z.string().trim().max(191).optional(),
  submissionRoute: z.string().trim().max(191).optional(),
  b2bCommissionType: z.string().trim().max(191).optional(),
  b2bCommissionAmount: z.number().finite().nonnegative().optional(),
  b2bPaymentCondition: z.string().trim().max(191).optional(),
  b2bClaimStage: z.string().trim().max(191).optional(),
  b2bInternalNote: z.string().max(10000).optional(),
}).strict();

const B2B_SUBMISSION_STAGES = new Set(['SUBMITTED_TO_B2B', 'B2B_SUBMITTED', 'B2B_ACKNOWLEDGED']);

export const GET = withAuth(async (req, auth) => {
  if (!canViewB2B(auth.roles, auth.permissions) || isPartner(auth)) {
    return NextResponse.json({ success: false, error: 'B2B operational access is not permitted.' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const b2bType = searchParams.get('b2bType');
  const providerId = searchParams.get('providerId');
  const status = searchParams.get('status');
  const where: any = {};
  if (b2bType && ['B2B_INBOUND', 'B2B_OUTBOUND'].includes(b2bType)) where.b2bType = b2bType;
  if (providerId && providerId.length <= 191) where.b2bProviderId = providerId;
  if (status && status.length <= 80) where.b2bStatus = status;

  try {
    const records = await db.b2bApplication.findMany({
      where,
      include: {
        b2bProvider: true,
        application: { select: { id: true, applicationCode: true, studentId: true, universityName: true, courseName: true, country: true, intake: true, stage: true, safeStatus: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
    const data = records.map((record) => sanitizeB2b(record, canViewCommission));
    await logAuditAction(auth, 'VIEW_B2B_APPLICATIONS', 'B2bApplication', 'list', { count: data.length });
    return NextResponse.json({ success: true, data, applications: data });
  } catch {
    return NextResponse.json({ success: false, error: 'B2B applications are temporarily unavailable.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req, auth) => {
  if (!canManageB2B(auth.roles, auth.permissions) || isPartner(auth)) {
    return NextResponse.json({ success: false, error: 'ALO-side application.manage_b2b permission required.' }, { status: 403 });
  }
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid B2B application request.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
  const writesCommission = ['b2bCommissionType', 'b2bCommissionAmount', 'b2bPaymentCondition', 'b2bClaimStage'].some((field) => (body as any)[field] !== undefined);
  if (writesCommission && !canViewCommission) return NextResponse.json({ success: false, error: 'B2B commission updates require application.view_b2b_commission permission.' }, { status: 403 });
  const b2bType = body.b2bType?.endsWith('INBOUND') || body.b2bType === 'INBOUND' ? 'B2B_INBOUND' : 'B2B_OUTBOUND';
  const b2bReference = body.b2bReference || '';

  try {
    const result = await db.$transaction(async (tx) => {
      const application = await tx.application.findUnique({ where: { id: body.applicationId } });
      if (!application) throw Object.assign(new Error('Application not found.'), { code: 'APPLICATION_NOT_FOUND' });
      if (!B2B_SUBMISSION_STAGES.has(application.stage)) throw Object.assign(new Error('The application must first pass the authorized B2B submission stage and document gate.'), { code: 'APPLICATION_STAGE_REQUIRED' });
      const provider = await tx.b2bProvider.findUnique({ where: { id: body.b2bProviderId }, select: { id: true, status: true } });
      if (!provider || !['active', 'approved'].includes(provider.status.toLowerCase())) throw Object.assign(new Error('B2B provider is not active or approved.'), { code: 'PROVIDER_UNAVAILABLE' });

      const existing = await tx.b2bApplication.findFirst({ where: { applicationId: body.applicationId, b2bProviderId: body.b2bProviderId, b2bReference } });
      const record = await tx.b2bApplication.upsert({
        where: { applicationId_b2bProviderId_b2bReference: { applicationId: body.applicationId, b2bProviderId: body.b2bProviderId, b2bReference } },
        update: {
          b2bType,
          submissionRoute: body.submissionRoute || b2bType,
          ...(canViewCommission ? {
            b2bCommissionType: body.b2bCommissionType || '',
            b2bCommissionAmount: body.b2bCommissionAmount ?? 0,
            b2bPaymentCondition: body.b2bPaymentCondition || '',
            b2bClaimStage: body.b2bClaimStage || 'NOT_CLAIMED',
          } : {}),
          b2bInternalNote: body.b2bInternalNote || '',
          updatedBy: auth.userId,
        },
        create: {
          applicationId: body.applicationId,
          b2bProviderId: body.b2bProviderId,
          b2bType,
          b2bReference,
          submissionRoute: body.submissionRoute || b2bType,
          submittedDate: new Date(),
          b2bStatus: 'SUBMITTED',
          b2bCommissionType: body.b2bCommissionType || '',
          b2bCommissionAmount: body.b2bCommissionAmount ?? 0,
          b2bPaymentCondition: body.b2bPaymentCondition || '',
          b2bClaimStage: body.b2bClaimStage || 'NOT_CLAIMED',
          b2bInternalNote: body.b2bInternalNote || '',
          createdBy: auth.userId,
        },
      });

      await tx.application.update({
        where: { id: body.applicationId },
        data: { isB2b: true, isB2bConfidential: true, b2bProviderId: body.b2bProviderId, b2bType, updatedBy: auth.userId },
      });
      await tx.applicationStatusLog.create({
        data: { applicationId: body.applicationId, oldStatus: application.stage, newStatus: application.stage, safeStatus: application.safeStatus, changedBy: auth.userId, visibility: 'B2B_CONFIDENTIAL', note: `B2B provider ${existing ? 'updated' : 'linked'} on ${application.stage}.` },
      });
      if (!existing) {
        await tx.applicationComment.create({
          data: { applicationId: body.applicationId, userId: auth.userId, role: auth.roles[0] || 'APPLICATION_TEAM', commentType: 'B2B_CONFIDENTIAL', visibility: 'B2B_CONFIDENTIAL', commentText: body.b2bInternalNote || 'Confidential B2B application record created.', isB2bConfidential: true },
        });
      }
      await tx.auditLog.create({
        data: { userId: auth.userId, action: existing ? 'UPDATE_B2B_APPLICATION' : 'CREATE_B2B_APPLICATION', resource: 'B2bApplication', resourceId: record.id, details: JSON.stringify({ applicationId: body.applicationId, b2bProviderId: body.b2bProviderId, b2bType }), actorRole: auth.roles[0] || '', studentId: application.studentId },
      });
      return record;
    });
    const safeResult = sanitizeB2BApplicationRecord(result as any, canViewCommission);
    return NextResponse.json({ success: true, data: safeResult, message: 'B2B application recorded confidentially after the authorized submission gate.' }, { status: 201 });
  } catch (error: any) {
    if (['APPLICATION_NOT_FOUND', 'APPLICATION_STAGE_REQUIRED', 'PROVIDER_UNAVAILABLE'].includes(error?.code)) {
      const status = error.code === 'APPLICATION_NOT_FOUND' ? 404 : error.code === 'APPLICATION_STAGE_REQUIRED' ? 409 : 400;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    console.error('[applications.b2b] create failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B application could not be saved.' }, { status: 503 });
  }
});
