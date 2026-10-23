import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { canManageB2B, canViewB2B, canViewB2BCommission, sanitizeB2BApplicationRecord } from '@/lib/application-manager/service';

function isPartner(auth: { partnerId?: string; userType: string; roles: string[] }): boolean {
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || auth.roles.some((role) => role.toLowerCase().startsWith('partner')));
}
function sanitize(record: any, canViewCommission: boolean) {
  return sanitizeB2BApplicationRecord(record, canViewCommission);
}

const typeSchema = z.enum(['B2B_INBOUND', 'B2B_OUTBOUND', 'INBOUND', 'OUTBOUND']).optional();
const createSchema = z.object({
  applicationId: z.string().trim().min(1).max(191),
  b2bProviderId: z.string().trim().min(1).max(191),
  b2bType: typeSchema,
  b2bReference: z.preprocess((value) => value == null ? '' : value, z.string().trim().max(191)).optional(),
  submissionRoute: z.preprocess((value) => value == null ? undefined : value, z.string().trim().max(191).optional()),
  b2bCommissionType: z.preprocess((value) => value == null ? '' : value, z.string().trim().max(191)).optional(),
  b2bCommissionAmount: z.preprocess((value) => value == null ? 0 : value, z.number().finite().nonnegative().optional()),
  b2bPaymentCondition: z.preprocess((value) => value == null ? '' : value, z.string().trim().max(191)).optional(),
  b2bClaimStage: z.preprocess((value) => value == null ? 'NOT_CLAIMED' : value, z.string().trim().max(191)).optional(),
  b2bInternalNote: z.preprocess((value) => value == null ? '' : value, z.string().max(10000)).optional(),
  submittedDate: z.string().optional(),
}).strict();
const patchSchema = z.object({
  id: z.string().trim().min(1).max(191),
  b2bStatus: z.enum(['SUBMITTED', 'ACKNOWLEDGED', 'DECISION_PENDING', 'OFFER_RECEIVED', 'REJECTED', 'DEFERRED', 'WITHDRAWN']).optional(),
  nextFollowupAt: z.string().datetime().nullable().optional(),
}).strict();
const B2B_SUBMISSION_STAGES = new Set(['SUBMITTED_TO_B2B', 'B2B_SUBMITTED', 'B2B_ACKNOWLEDGED']);

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canViewB2B(auth.roles, auth.permissions) || isPartner(auth)) return NextResponse.json({ success: false, error: 'B2B access is restricted to authorized ALO staff.' }, { status: 403 });
  const b2bType = req.nextUrl.searchParams.get('b2bType');
  const where: any = {};
  if (b2bType && ['B2B_INBOUND', 'B2B_OUTBOUND'].includes(b2bType)) where.b2bType = b2bType;
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
    const data = records.map((record) => sanitize(record, canViewCommission));
    await db.auditLog.create({
      data: { userId: auth.userId, action: 'VIEW_B2B_APPLICATIONS', resource: 'B2bApplication', resourceId: 'list', details: JSON.stringify({ count: data.length }), actorRole: auth.roles[0] || '' },
    });
    return NextResponse.json({ applications: data, success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'B2B applications are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canManageB2B(auth.roles, auth.permissions) || isPartner(auth)) return NextResponse.json({ success: false, error: 'ALO-side application.manage_b2b permission required.' }, { status: 403 });
  const requestBody = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(requestBody);
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid B2B application request.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
  const writesCommission = requestBody && typeof requestBody === 'object' && ['b2bCommissionType', 'b2bCommissionAmount', 'b2bPaymentCondition', 'b2bClaimStage'].some((field) => Object.prototype.hasOwnProperty.call(requestBody, field));
  if (writesCommission && !canViewCommission) return NextResponse.json({ success: false, error: 'B2B commission updates require application.view_b2b_commission permission.' }, { status: 403 });
  const b2bType = body.b2bType?.endsWith('INBOUND') || body.b2bType === 'INBOUND' ? 'B2B_INBOUND' : 'B2B_OUTBOUND';
  const b2bReference = body.b2bReference || '';
  try {
    const result = await db.$transaction(async (tx) => {
      const application = await tx.application.findUnique({ where: { id: body.applicationId } });
      if (!application) throw Object.assign(new Error('Application not found.'), { code: 'APPLICATION_NOT_FOUND' });
      if (!B2B_SUBMISSION_STAGES.has(application.stage)) throw Object.assign(new Error('Application must pass the authorized B2B submission stage and document gate first.'), { code: 'APPLICATION_STAGE_REQUIRED' });
      const provider = await tx.b2bProvider.findUnique({ where: { id: body.b2bProviderId }, select: { id: true, status: true } });
      if (!provider || !['active', 'approved'].includes(provider.status.toLowerCase())) throw Object.assign(new Error('B2B provider is not active or approved.'), { code: 'PROVIDER_UNAVAILABLE' });

      const existing = await tx.b2bApplication.findFirst({ where: { applicationId: body.applicationId, b2bProviderId: body.b2bProviderId, b2bReference } });
      const record = await tx.b2bApplication.upsert({
        where: { applicationId_b2bProviderId_b2bReference: { applicationId: body.applicationId, b2bProviderId: body.b2bProviderId, b2bReference } },
        update: {
          b2bType,
          submissionRoute: body.submissionRoute || b2bType,
          b2bInternalNote: body.b2bInternalNote || '',
          ...(canViewCommission ? {
            b2bCommissionType: body.b2bCommissionType || '',
            b2bCommissionAmount: body.b2bCommissionAmount || 0,
            b2bPaymentCondition: body.b2bPaymentCondition || '',
            b2bClaimStage: body.b2bClaimStage || 'NOT_CLAIMED',
          } : {}),
          updatedBy: auth.userId,
        },
        create: {
          applicationId: body.applicationId,
          b2bProviderId: body.b2bProviderId,
          b2bType,
          b2bReference,
          submissionRoute: body.submissionRoute || b2bType,
          submittedDate: body.submittedDate && Number.isFinite(Date.parse(body.submittedDate)) ? new Date(body.submittedDate) : new Date(),
          b2bStatus: 'SUBMITTED',
          b2bCommissionType: body.b2bCommissionType || '',
          b2bCommissionAmount: body.b2bCommissionAmount || 0,
          b2bPaymentCondition: body.b2bPaymentCondition || '',
          b2bClaimStage: body.b2bClaimStage || 'NOT_CLAIMED',
          b2bInternalNote: body.b2bInternalNote || '',
          createdBy: auth.userId,
        },
      });
      await tx.application.update({ where: { id: body.applicationId }, data: { isB2b: true, isB2bConfidential: true, b2bProviderId: body.b2bProviderId, b2bType, updatedBy: auth.userId } });
      await tx.applicationStatusLog.create({ data: { applicationId: body.applicationId, oldStatus: application.stage, newStatus: application.stage, safeStatus: application.safeStatus, changedBy: auth.userId, visibility: 'B2B_CONFIDENTIAL', note: `B2B provider ${existing ? 'updated' : 'linked'} on ${application.stage}.` } });
      if (!existing) await tx.applicationComment.create({ data: { applicationId: body.applicationId, userId: auth.userId, role: auth.roles[0] || 'APPLICATION_TEAM', commentType: 'B2B_CONFIDENTIAL', visibility: 'B2B_CONFIDENTIAL', commentText: body.b2bInternalNote || 'Confidential B2B application record created.', isB2bConfidential: true } });
      await tx.auditLog.create({ data: { userId: auth.userId, action: existing ? 'UPDATE_B2B_APPLICATION' : 'CREATE_B2B_APPLICATION', resource: 'B2bApplication', resourceId: record.id, details: JSON.stringify({ applicationId: body.applicationId, b2bProviderId: body.b2bProviderId, b2bType }), actorRole: auth.roles[0] || '', studentId: application.studentId } });
      return record;
    });
    const safeResult = sanitize(result as any, canViewCommission);
    return NextResponse.json({ b2bApp: safeResult, success: true, data: safeResult, message: 'B2B application saved confidentially after the authorized submission gate.' }, { status: 201 });
  } catch (error: any) {
    if (['APPLICATION_NOT_FOUND', 'APPLICATION_STAGE_REQUIRED', 'PROVIDER_UNAVAILABLE'].includes(error?.code)) {
      const status = error.code === 'APPLICATION_NOT_FOUND' ? 404 : error.code === 'APPLICATION_STAGE_REQUIRED' ? 409 : 400;
      return NextResponse.json({ success: false, code: error.code, error: error.message }, { status });
    }
    console.error('[app-manager.b2b-applications] create failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B application could not be saved.' }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canManageB2B(auth.roles, auth.permissions) || isPartner(auth)) return NextResponse.json({ success: false, error: 'ALO-side application.manage_b2b permission required.' }, { status: 403 });
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid B2B status update.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  try {
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.b2bApplication.findUnique({ where: { id: body.id } });
      if (!existing) throw Object.assign(new Error('B2B application not found.'), { code: 'B2B_NOT_FOUND' });
      const application = await tx.application.findUnique({ where: { id: existing.applicationId } });
      if (!application) throw Object.assign(new Error('Parent application not found.'), { code: 'APPLICATION_NOT_FOUND' });
      const changed = await tx.b2bApplication.updateMany({
        where: { id: body.id, b2bStatus: existing.b2bStatus },
        data: { ...(body.b2bStatus ? { b2bStatus: body.b2bStatus } : {}), ...(body.nextFollowupAt !== undefined ? { nextFollowupAt: body.nextFollowupAt ? new Date(body.nextFollowupAt) : null } : {}), lastFollowupAt: new Date(), updatedBy: auth.userId },
      });
      if (changed.count !== 1) throw Object.assign(new Error('B2B application changed during update.'), { code: 'CONCURRENT_UPDATE' });
      const record = await tx.b2bApplication.findUnique({ where: { id: body.id } });
      await tx.applicationStatusLog.create({ data: { applicationId: existing.applicationId, oldStatus: existing.b2bStatus, newStatus: body.b2bStatus || existing.b2bStatus, safeStatus: application.safeStatus, changedBy: auth.userId, visibility: 'B2B_CONFIDENTIAL', note: `B2B status updated to ${body.b2bStatus || existing.b2bStatus}.` } });
      await tx.auditLog.create({ data: { userId: auth.userId, action: 'UPDATE_B2B_APPLICATION', resource: 'B2bApplication', resourceId: body.id, details: JSON.stringify({ oldStatus: existing.b2bStatus, newStatus: body.b2bStatus || existing.b2bStatus }), actorRole: auth.roles[0] || '', studentId: application.studentId } });
      return record;
    });
    const safeUpdated = sanitize(updated as any, canViewB2BCommission(auth.roles, auth.permissions));
    return NextResponse.json({ b2bApp: safeUpdated, success: true, data: safeUpdated, message: 'B2B application updated.' });
  } catch (error: any) {
    if (['B2B_NOT_FOUND', 'APPLICATION_NOT_FOUND', 'CONCURRENT_UPDATE'].includes(error?.code)) {
      const status = error.code.endsWith('NOT_FOUND') ? 404 : 409;
      return NextResponse.json({ success: false, code: error.code, error: error.message }, { status });
    }
    console.error('[app-manager.b2b-applications] update failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'B2B status could not be updated.' }, { status: 503 });
  }
}
