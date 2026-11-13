import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { ApplicationStageTransitionError, transitionApplicationStage } from '@/lib/application-manager/stage-transition';
import { canManageB2B, canViewB2B } from '@/lib/application-manager/service';

const handoverBodySchema = z.object({ reason: z.string().trim().min(3).max(180) }).strict();
function isB2bApplication(application: any): boolean {
  return application?.isB2b === true || application?.isB2bConfidential === true || Boolean(application?.b2bProviderId) ||
    String(application?.applicationSource || '').toUpperCase().startsWith('B2B_') || String(application?.stage || '').toUpperCase().includes('B2B');
}
function safeVisaHandoverCase(visaCase: any) {
  if (!visaCase) return null;
  return { id: visaCase.id, caseCode: visaCase.caseCode, applicationId: visaCase.applicationId, currentStage: visaCase.currentStage, createdAt: visaCase.createdAt };
}

const canHandover = (roles: string[], permissions: string[]) => {
  const normalized = roles.map((role) => role.toLowerCase());
  return normalized.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role))
    || permissions.includes('application.manage_cas_i20_coe')
    || permissions.includes('application.manage_visa_handover');
};

export const GET = withAuth(async (_req, auth, { params }: any) => {
  if (!canHandover(auth.roles, auth.permissions) || auth.partnerId) {
    return NextResponse.json({ success: false, error: 'Forbidden: visa handover permission required' }, { status: 403 });
  }
  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  const isB2b = isB2bApplication(app);
  if (isB2b && !canViewB2B(auth.roles, auth.permissions)) return NextResponse.json({ success: false, error: 'Forbidden: B2B application access requires explicit permission.' }, { status: 403 });
  const visaCase = await db.visaCase.findFirst({ where: { applicationId: params.id } });
  await logAuditAction(auth, isB2b ? 'VIEW_B2B_VISA_HANDOVER' : 'VIEW_VISA_HANDOVER', 'Application', params.id);
  const safeVisaCase = safeVisaHandoverCase(visaCase);
  return NextResponse.json({ success: true, data: safeVisaCase, visaCase: safeVisaCase, application: { visaHandoverStatus: app.visaHandoverStatus, safeStatus: app.safeStatus } });
});

export const POST = withAuth(async (req, auth, { params }: any) => {
  if (!canHandover(auth.roles, auth.permissions) || auth.partnerId) {
    return NextResponse.json({ success: false, error: 'Forbidden: visa handover permission required' }, { status: 403 });
  }
  const parsed = handoverBodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'A handover reason of 3–180 characters is required.' }, { status: 400 });
  const reason = parsed.data.reason;

  try {
    const result = await db.$transaction(async (tx) => {
      const app = await tx.application.findUnique({ where: { id: params.id } });
      if (!app) throw new ApplicationStageTransitionError('NOT_FOUND', 'Application not found.');
      const isB2b = isB2bApplication(app);
      if (isB2b && !canManageB2B(auth.roles, auth.permissions)) throw Object.assign(new Error('B2B application handover requires explicit management permission.'), { code: 'B2B_PERMISSION_REQUIRED' });
      const existingVisaCase = await tx.visaCase.findFirst({ where: { applicationId: params.id } });
      if (existingVisaCase) return { visaCase: existingVisaCase, alreadyExists: true };
      if (app.stage === 'VISA_FILE_CREATED') {
        throw new ApplicationStageTransitionError('CONCURRENT_UPDATE', 'Application is marked as handed over but its visa case is missing. Escalate for reconciliation; no duplicate was created.');
      }
      if (!['CAS_RECEIVED', 'I20_RECEIVED', 'COE_RECEIVED', 'VISA_HANDOVER_READY'].includes(app.stage)) {
        throw new ApplicationStageTransitionError('INVALID_TRANSITION', 'Visa handover requires a verified CAS, I-20, COE, or the VISA_HANDOVER_READY stage.');
      }

      if (app.stage !== 'VISA_HANDOVER_READY') {
        await transitionApplicationStage(tx, {
          applicationId: params.id,
          toStage: 'VISA_HANDOVER_READY',
          actorId: auth.userId,
          reason,
        });
      }
      const transition = await transitionApplicationStage(tx, {
        applicationId: params.id,
        toStage: 'VISA_FILE_CREATED',
        actorId: auth.userId,
        reason,
      });
      if (!transition.changed) {
        throw new ApplicationStageTransitionError('CONCURRENT_UPDATE', 'Visa handover has already been processed; reload the application.');
      }

      const visaCase = await tx.visaCase.create({
        data: {
          caseCode: `VISA-${new Date().getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`,
          studentId: app.studentId,
          studentName: '',
          applicationId: params.id,
          destinationCountry: app.country || 'UK',
          university: app.universityName,
          course: app.courseName,
          intake: app.intake,
          currentStage: 'not_started',
          readinessScore: 0,
          riskLevel: 'low',
          counselorId: app.counselorId,
          counselorName: app.counselorName,
          applicationOfficerId: app.appTeamOfficerId || app.applicationOfficer,
          visaOfficerId: app.visaOfficerId || '',
          isUrgent: false,
          nextAction: 'Document checklist preparation',
          responsible: 'Visa Officer',
        },
      });
      await tx.application.update({
        where: { id: params.id },
        data: { visaHandoverStatus: 'VISA_FILE_CREATED', updatedBy: auth.userId },
      });
      await tx.applicationComment.create({
        data: {
          applicationId: params.id,
          userId: auth.userId,
          role: auth.roles[0] || 'APPLICATION_MANAGER',
          commentType: isB2b ? 'B2B_CONFIDENTIAL' : 'VISA_HANDOVER',
          visibility: isB2b ? 'B2B_CONFIDENTIAL' : 'visa_handover',
          commentText: `Visa handover completed. Visa file ${visaCase.caseCode} created. Reason: ${reason}`,
          isB2bConfidential: isB2b,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'VISA_HANDOVER',
          resource: 'Application',
          resourceId: params.id,
          details: JSON.stringify({ visaCaseId: visaCase.id, caseCode: visaCase.caseCode, reason, oldStage: app.stage, newStage: transition.stage }),
          actorRole: auth.roles[0] || '',
          studentId: app.studentId,
          beforeValue: JSON.stringify({ stage: app.stage, visaHandoverStatus: app.visaHandoverStatus }),
          afterValue: JSON.stringify({ stage: 'VISA_FILE_CREATED', visaHandoverStatus: 'VISA_FILE_CREATED' }),
        },
      });
      return { visaCase, alreadyExists: false };
    });

    return NextResponse.json({
      success: true,
      data: safeVisaHandoverCase(result.visaCase),
      visaCase: safeVisaHandoverCase(result.visaCase),
      alreadyExists: result.alreadyExists,
      message: result.alreadyExists ? 'Visa file already exists — existing case returned.' : 'Visa handover complete — visa case created and linked.',
    });
  } catch (error: any) {
    if (error?.code === 'B2B_PERMISSION_REQUIRED') return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    if (error instanceof ApplicationStageTransitionError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'INVALID_REASON' ? 400 : error.code === 'CONCURRENT_UPDATE' ? 409 : 422;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    console.error('[visa-handover] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to complete visa handover.' }, { status: 500 });
  }
});
