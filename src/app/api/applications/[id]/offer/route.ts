import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { ApplicationStageTransitionError, transitionApplicationStage } from '@/lib/application-manager/stage-transition';
import { canViewB2B, canViewB2BCommission, stripB2BFields } from '@/lib/application-manager/service';
import { PrivateApplicationDocumentError, resolveApplicationDocumentLink, sanitizeApplicationDocumentLink } from '@/lib/application-manager/private-document-link';

const offerStatuses = ['DECISION_PENDING', 'CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER', 'REJECTED', 'DEFERRED', 'WITHDRAWN', 'MORE_DOCUMENTS_REQUESTED', 'INTERVIEW_REQUIRED', 'APPLICATION_FEE_PENDING', 'DEPOSIT_REQUIRED'] as const;
const bodySchema = z.object({
  offerStatus: z.enum(offerStatuses).optional(),
  reason: z.string().trim().min(3).max(180).optional(),
  offerLetterUrl: z.string().max(1000).nullable().optional(),
  offerConditions: z.string().max(10000).nullable().optional(),
  conditionDeadline: z.string().datetime().nullable().optional(),
  scholarship: z.string().max(191).nullable().optional(),
  scholarshipAmount: z.number().finite().nonnegative().optional(),
  depositAmount: z.number().finite().nonnegative().optional(),
  depositDeadline: z.string().datetime().nullable().optional(),
  decisionDate: z.string().datetime().nullable().optional(),
  decisionNote: z.string().max(5000).nullable().optional(),
}).strict();

const OFFER_STAGE: Record<string, string | null> = {
  DECISION_PENDING: 'DECISION_PENDING',
  CONDITIONAL_OFFER: 'CONDITIONAL_OFFER',
  UNCONDITIONAL_OFFER: 'UNCONDITIONAL_OFFER',
  REJECTED: 'REJECTED',
  DEFERRED: 'DEFERRED',
  WITHDRAWN: 'WITHDRAWN',
  MORE_DOCUMENTS_REQUESTED: 'MORE_DOCUMENTS_REQUESTED',
  INTERVIEW_REQUIRED: 'INTERVIEW_REQUIRED',
  APPLICATION_FEE_PENDING: null,
  DEPOSIT_REQUIRED: 'DEPOSIT_PENDING',
};

function canReadOffers(roles: string[], permissions: string[], counselorId: string, userId: string): boolean {
  const normalized = roles.map((role) => role.toLowerCase());
  const globalRoles = ['super_admin', 'admin', 'application_manager', 'application_team', 'application_officer', 'visa_officer'];
  if (normalized.some((role) => globalRoles.includes(role))) return true;
  if (permissions.includes('application.view_offer') || permissions.includes('application.manage_offer')) return true;
  return normalized.includes('counselor') && counselorId === userId;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  if (authRes.type !== 'portal' && authRes.type !== 'student') return NextResponse.json({ success: false, error: 'Offer access is not permitted.' }, { status: 403 });
  const portal = authRes.type === 'portal' ? authRes.data : null;
  const roles = (portal?.roles || []).map((role) => role.toLowerCase());
  const isPartner = Boolean(portal && (portal.partnerId || portal.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner'))));
  if (isPartner) return NextResponse.json({ success: false, error: 'Partner access to private offer records is not permitted.' }, { status: 403 });

  const app = await db.application.findFirst({
    where: { id: params.id, ...(authRes.type === 'student' ? { studentId: authRes.data.studentId } : {}) },
  });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  if (portal && !canReadOffers(portal.roles, portal.permissions, app.counselorId, portal.userId)) {
    return NextResponse.json({ success: false, error: 'Application is not within your offer-view permission scope.' }, { status: 403 });
  }

  const records = await db.applicationOffer.findMany({ where: { applicationId: params.id }, orderBy: { createdAt: 'desc' } });
  const offers = await Promise.all(records.map(async (record) => ({
    ...record,
    offerLetterUrl: await sanitizeApplicationDocumentLink(db, app.studentId, record.offerLetterUrl),
  })));
  const canViewB2BFlag = portal ? canViewB2B(portal.roles, portal.permissions) : false;
  const canViewCommission = portal ? canViewB2BCommission(portal.roles, portal.permissions) : false;
  const sanitizedApplication = stripB2BFields(app as any, canViewB2BFlag, canViewCommission) as any;
  const applicationSummary = {
    offerStatus: app.offerStatus,
    safeStatus: app.safeStatus,
    ...(authRes.type === 'portal' && sanitizedApplication.stage !== undefined ? { stage: sanitizedApplication.stage } : {}),
  };
  return NextResponse.json({ success: true, data: offers, offers, application: applicationSummary });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  if (authRes.type === 'student') return NextResponse.json({ success: false, error: 'Students cannot manage offers' }, { status: 403 });

  const roles = authRes.data.roles.map((role) => role.toLowerCase());
  const isPartner = Boolean(authRes.data.partnerId || authRes.data.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
  if (isPartner) return NextResponse.json({ success: false, error: 'Only ALO application staff may record university offer decisions.' }, { status: 403 });
  const canManageOffer = ['super_admin', 'application_manager', 'application_team'].some((role) => roles.includes(role)) || authRes.data.permissions.includes('application.manage_offer');
  if (!canManageOffer) return NextResponse.json({ success: false, error: 'Forbidden: manage_offer permission required' }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid offer update', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const nextStage = body.offerStatus ? OFFER_STAGE[body.offerStatus] : null;
  if (nextStage && !body.reason) return NextResponse.json({ success: false, error: 'A reason (3–180 characters) is required for an offer decision.' }, { status: 400 });

  try {
    const result = await db.$transaction(async (tx) => {
      const app = await tx.application.findUnique({ where: { id: params.id } });
      if (!app) throw new ApplicationStageTransitionError('NOT_FOUND', 'Application not found.');
      if ((app.isB2b || app.isB2bConfidential || String(app.applicationSource || '').toUpperCase().startsWith('B2B_')) && !canViewB2B(authRes.data.roles, authRes.data.permissions)) {
        throw Object.assign(new Error('B2B application access requires explicit permission.'), { code: 'B2B_PERMISSION_REQUIRED' });
      }

      const priorOffer = await tx.applicationOffer.findUnique({ where: { applicationId: params.id } });
      const offerLetterUrl = body.offerLetterUrl !== undefined
        ? await resolveApplicationDocumentLink(tx, app.studentId, body.offerLetterUrl)
        : await sanitizeApplicationDocumentLink(tx, app.studentId, priorOffer?.offerLetterUrl);
      const transition = nextStage
        ? await transitionApplicationStage(tx, { applicationId: params.id, toStage: nextStage, actorId: authRes.data.userId, reason: body.reason! })
        : null;
      const offer = await tx.applicationOffer.upsert({
        where: { applicationId: params.id },
        update: {
          ...(body.offerStatus !== undefined ? { offerStatus: body.offerStatus } : {}),
          offerLetterUrl,
          ...(body.offerConditions !== undefined ? { offerConditions: body.offerConditions ?? '' } : {}),
          ...(body.conditionDeadline !== undefined ? { conditionDeadline: body.conditionDeadline ? new Date(body.conditionDeadline) : null } : {}),
          ...(body.scholarship !== undefined ? { scholarship: body.scholarship ?? '' } : {}),
          ...(body.scholarshipAmount !== undefined ? { scholarshipAmount: body.scholarshipAmount } : {}),
          ...(body.depositAmount !== undefined ? { depositAmount: body.depositAmount } : {}),
          ...(body.depositDeadline !== undefined ? { depositDeadline: body.depositDeadline ? new Date(body.depositDeadline) : null } : {}),
          ...(body.decisionDate !== undefined ? { decisionDate: body.decisionDate ? new Date(body.decisionDate) : null } : {}),
          ...(body.decisionNote !== undefined ? { decisionNote: body.decisionNote ?? '' } : {}),
        },
        create: {
          applicationId: params.id,
          offerStatus: body.offerStatus || 'DECISION_PENDING',
          offerLetterUrl,
          offerConditions: body.offerConditions || '',
          conditionDeadline: body.conditionDeadline ? new Date(body.conditionDeadline) : null,
          scholarship: body.scholarship || '',
          scholarshipAmount: body.scholarshipAmount || 0,
          depositAmount: body.depositAmount || 0,
          depositDeadline: body.depositDeadline ? new Date(body.depositDeadline) : null,
          decisionDate: body.decisionDate ? new Date(body.decisionDate) : null,
          decisionNote: body.decisionNote || '',
        },
      });
      const application = await tx.application.update({
        where: { id: params.id },
        data: {
          ...(body.offerStatus ? { offerStatus: body.offerStatus } : {}),
          updatedBy: authRes.data.userId,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: authRes.data.userId,
          action: 'MANAGE_OFFER',
          resource: 'Application',
          resourceId: params.id,
          details: JSON.stringify({ offerStatus: body.offerStatus, reason: body.reason, ...(transition ? { oldStage: transition.previousStage, newStage: transition.stage } : {}) }),
          actorRole: authRes.data.roles[0] || '',
          studentId: app.studentId,
          beforeValue: JSON.stringify({ stage: app.stage, offerStatus: app.offerStatus }),
          afterValue: JSON.stringify({ stage: application.stage, offerStatus: application.offerStatus }),
        },
      });
      return { offer, application };
    });
    const safeApplication = stripB2BFields(result.application as any, canViewB2B(authRes.data.roles, authRes.data.permissions), canViewB2BCommission(authRes.data.roles, authRes.data.permissions));
    return NextResponse.json({ success: true, data: result.offer, offer: result.offer, application: safeApplication, message: 'Offer updated' });
  } catch (error: any) {
    if (error?.code === 'B2B_PERMISSION_REQUIRED') return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    if (error instanceof PrivateApplicationDocumentError) {
      return NextResponse.json({ success: false, error: error.message, code: 'PRIVATE_DOCUMENT_REQUIRED' }, { status: 400 });
    }
    if (error instanceof ApplicationStageTransitionError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'INVALID_REASON' ? 400 : ['CONCURRENT_UPDATE', 'DOCUMENTS_NOT_READY'].includes(error.code) ? 409 : 422;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    console.error('[application-offer] update failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update offer.' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  return POST(req, { params });
}
