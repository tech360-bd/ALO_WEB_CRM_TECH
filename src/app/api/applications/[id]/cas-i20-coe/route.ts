import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { ApplicationStageTransitionError, transitionApplicationStage } from '@/lib/application-manager/stage-transition';
import { canViewB2B, canViewB2BCommission, stripB2BFields } from '@/lib/application-manager/service';
import { PrivateApplicationDocumentError, resolveApplicationDocumentLink, sanitizeApplicationDocumentLink } from '@/lib/application-manager/private-document-link';

const documentTypes = ['CAS', 'I20', 'I-20', 'COE', 'LOA', 'PAL', 'OFFER_VISA_LETTER'] as const;
const documentStatuses = ['NOT_STARTED', 'REQUESTED', 'PENDING', 'RECEIVED', 'ISSUED', 'REJECTED'] as const;
const bodySchema = z.object({
  documentType: z.enum(documentTypes).optional(),
  status: z.enum(documentStatuses).optional(),
  reason: z.string().trim().min(3).max(180).optional(),
  requestedDate: z.string().datetime().nullable().optional(),
  receivedDate: z.string().datetime().nullable().optional(),
  referenceNumber: z.string().max(191).nullable().optional(),
  fileUrl: z.string().max(1000).nullable().optional(),
  conditionNote: z.string().max(10000).nullable().optional(),
  nextStep: z.string().max(1000).nullable().optional(),
}).strict();

function canReadCas(roles: string[], permissions: string[], counselorId: string, userId: string): boolean {
  const normalized = roles.map((role) => role.toLowerCase());
  if (normalized.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team', 'application_officer', 'visa_officer'].includes(role))) return true;
  if (permissions.includes('application.view_cas_i20_coe') || permissions.includes('application.manage_cas_i20_coe')) return true;
  return normalized.includes('counselor') && counselorId === userId;
}

function stageForDocument(documentType: string, status: string): string | null {
  const type = documentType.toUpperCase().replace('-', '');
  const received = status === 'RECEIVED' || status === 'ISSUED';
  const pending = status === 'PENDING' || status === 'REQUESTED';
  if (!received && !pending) return null;
  if (type === 'CAS') return received ? 'CAS_RECEIVED' : 'CAS_PENDING';
  if (type === 'I20') return received ? 'I20_RECEIVED' : 'I20_PENDING';
  if (type === 'COE') return received ? 'COE_RECEIVED' : 'COE_PENDING';
  return null;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  if (authRes.type !== 'portal' && authRes.type !== 'student') return NextResponse.json({ success: false, error: 'CAS/I-20/COE access is not permitted.' }, { status: 403 });
  const portal = authRes.type === 'portal' ? authRes.data : null;
  const roles = (portal?.roles || []).map((role) => role.toLowerCase());
  const isPartner = Boolean(portal && (portal.partnerId || portal.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner'))));
  if (isPartner) return NextResponse.json({ success: false, error: 'Partner access to private visa documents is not permitted.' }, { status: 403 });

  const app = await db.application.findFirst({ where: {
    id: params.id,
    ...(authRes.type === 'student' ? { studentId: authRes.data.studentId } : {}),
  } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  if (portal && !canReadCas(portal.roles, portal.permissions, app.counselorId, portal.userId)) {
    return NextResponse.json({ success: false, error: 'Application is not within your CAS/I-20/COE view permission scope.' }, { status: 403 });
  }

  const record = await db.applicationCasI20Coe.findUnique({ where: { applicationId: params.id } });
  const casRecord = record ? { ...record, fileUrl: await sanitizeApplicationDocumentLink(db, app.studentId, record.fileUrl) } : null;
  const canViewB2BFlag = portal ? canViewB2B(portal.roles, portal.permissions) : false;
  const canViewCommission = portal ? canViewB2BCommission(portal.roles, portal.permissions) : false;
  const sanitizedApplication = stripB2BFields(app as any, canViewB2BFlag, canViewCommission) as any;
  const applicationSummary = {
    casI20CoeStatus: app.casI20CoeStatus,
    safeStatus: app.safeStatus,
    country: app.country,
    ...(authRes.type === 'portal' && sanitizedApplication.stage !== undefined ? { stage: sanitizedApplication.stage } : {}),
  };
  return NextResponse.json({ success: true, data: casRecord, casI20Coe: casRecord, application: applicationSummary });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  if (authRes.type === 'student') return NextResponse.json({ success: false, error: 'Students cannot manage CAS/I-20/COE' }, { status: 403 });

  const roles = authRes.data.roles.map((role) => role.toLowerCase());
  const isPartner = Boolean(authRes.data.partnerId || authRes.data.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
  if (isPartner) return NextResponse.json({ success: false, error: 'Only ALO visa/application staff may manage CAS/I-20/COE records.' }, { status: 403 });
  const canManage = ['super_admin', 'application_manager', 'application_team'].some((role) => roles.includes(role)) || authRes.data.permissions.includes('application.manage_cas_i20_coe');
  if (!canManage) return NextResponse.json({ success: false, error: 'Forbidden: manage_cas_i20_coe permission required' }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid CAS/I-20/COE update', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const app = await tx.application.findUnique({ where: { id: params.id } });
      if (!app) throw new ApplicationStageTransitionError('NOT_FOUND', 'Application not found.');
      if ((app.isB2b || app.isB2bConfidential || String(app.applicationSource || '').toUpperCase().startsWith('B2B_')) && !canViewB2B(authRes.data.roles, authRes.data.permissions)) {
        throw Object.assign(new Error('B2B application access requires explicit permission.'), { code: 'B2B_PERMISSION_REQUIRED' });
      }
      const existing = await tx.applicationCasI20Coe.findUnique({ where: { applicationId: params.id } });
      const fileUrl = body.fileUrl !== undefined
        ? await resolveApplicationDocumentLink(tx, app.studentId, body.fileUrl)
        : await sanitizeApplicationDocumentLink(tx, app.studentId, existing?.fileUrl);
      const documentType = body.documentType || existing?.documentType || 'CAS';
      const status = body.status || existing?.status || 'PENDING';
      const nextStage = stageForDocument(documentType, status);
      if (nextStage && nextStage !== app.stage && !body.reason) {
        throw new ApplicationStageTransitionError('INVALID_REASON', 'A reason (3–180 characters) is required for a CAS/I-20/COE stage change.');
      }

      const transition = nextStage
        ? await transitionApplicationStage(tx, { applicationId: params.id, toStage: nextStage, actorId: authRes.data.userId, reason: body.reason || `CAS/I-20/COE status changed to ${status}` })
        : null;
      const record = await tx.applicationCasI20Coe.upsert({
        where: { applicationId: params.id },
        update: {
          ...(body.documentType !== undefined ? { documentType: body.documentType } : {}),
          ...(body.status !== undefined ? { status: body.status } : {}),
          ...(body.requestedDate !== undefined ? { requestedDate: body.requestedDate ? new Date(body.requestedDate) : null } : {}),
          ...(body.receivedDate !== undefined ? { receivedDate: body.receivedDate ? new Date(body.receivedDate) : null } : {}),
          ...(body.referenceNumber !== undefined ? { referenceNumber: body.referenceNumber ?? '' } : {}),
          fileUrl,
          ...(body.conditionNote !== undefined ? { conditionNote: body.conditionNote ?? '' } : {}),
          ...(body.nextStep !== undefined ? { nextStep: body.nextStep ?? '' } : {}),
        },
        create: {
          applicationId: params.id,
          documentType,
          status,
          requestedDate: body.requestedDate ? new Date(body.requestedDate) : null,
          receivedDate: body.receivedDate ? new Date(body.receivedDate) : null,
          referenceNumber: body.referenceNumber || '',
          fileUrl,
          conditionNote: body.conditionNote || '',
          nextStep: body.nextStep || '',
        },
      });
      const application = await tx.application.update({
        where: { id: params.id },
        data: { casI20CoeStatus: status, updatedBy: authRes.data.userId },
      });
      await tx.auditLog.create({
        data: {
          userId: authRes.data.userId,
          action: 'MANAGE_CAS_I20_COE',
          resource: 'Application',
          resourceId: params.id,
          details: JSON.stringify({ documentType, status, reason: body.reason, ...(transition ? { oldStage: transition.previousStage, newStage: transition.stage } : {}) }),
          actorRole: authRes.data.roles[0] || '',
          studentId: app.studentId,
          beforeValue: JSON.stringify({ stage: app.stage, casI20CoeStatus: app.casI20CoeStatus }),
          afterValue: JSON.stringify({ stage: application.stage, casI20CoeStatus: application.casI20CoeStatus }),
        },
      });
      return { record, application };
    });
    const safeApplication = stripB2BFields(result.application as any, canViewB2B(authRes.data.roles, authRes.data.permissions), canViewB2BCommission(authRes.data.roles, authRes.data.permissions));
    return NextResponse.json({ success: true, data: result.record, casI20Coe: result.record, application: safeApplication, message: 'CAS/I-20/COE updated' });
  } catch (error: any) {
    if (error?.code === 'B2B_PERMISSION_REQUIRED') return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    if (error instanceof PrivateApplicationDocumentError) {
      return NextResponse.json({ success: false, error: error.message, code: 'PRIVATE_DOCUMENT_REQUIRED' }, { status: 400 });
    }
    if (error instanceof ApplicationStageTransitionError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'INVALID_REASON' ? 400 : ['CONCURRENT_UPDATE', 'DOCUMENTS_NOT_READY'].includes(error.code) ? 409 : 422;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    console.error('[application-cas-i20-coe] update failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update CAS/I-20/COE.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return POST(req, { params });
}
