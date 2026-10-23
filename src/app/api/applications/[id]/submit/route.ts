import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { canViewB2B, canManageB2B, canViewB2BCommission, stripB2BFields } from '@/lib/application-manager/service';
import { ApplicationStageTransitionError, transitionApplicationStage } from '@/lib/application-manager/stage-transition';
import { reportServerEvent } from '@/lib/analytics/server-conversions';

const submissionMethods = ['DIRECT_UNIVERSITY_PORTAL', 'EMAIL', 'UNIVERSITY_REPRESENTATIVE', 'B2B_INBOUND', 'B2B_OUTBOUND', 'PARTNER_SUBMISSION', 'MANUAL'] as const;
const bodySchema = z.object({
  submissionMethod: z.enum(submissionMethods).default('DIRECT_UNIVERSITY_PORTAL'),
  reason: z.string().trim().min(3).max(180),
  submittedTo: z.string().trim().max(191).optional(),
  acknowledgementNumber: z.string().trim().max(191).optional(),
  note: z.string().trim().max(1000).optional(),
  submittedDate: z.string().trim().max(100).optional(),
  portalReference: z.string().trim().max(191).optional(),
  universityApplicationId: z.string().trim().max(191).optional(),
  expectedResponseDate: z.string().trim().max(100).optional(),
  feeStatus: z.string().trim().max(80).optional(),
  b2bProviderId: z.string().trim().max(191).optional(),
  b2bReference: z.string().trim().max(191).optional(),
}).strict();

export const POST = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map((role) => role.toLowerCase());
  const isPartner = Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
  if (isPartner) return NextResponse.json({ success: false, error: 'Only ALO application staff may record a university submission.' }, { status: 403 });

  const canSubmit = ['super_admin', 'application_manager', 'application_team'].some((role) => roles.includes(role)) || auth.permissions.includes('application.submit');
  if (!canSubmit) return NextResponse.json({ success: false, error: 'Forbidden: application.submit permission required' }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid submission request', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const isB2bSubmission = body.submissionMethod === 'B2B_INBOUND' || body.submissionMethod === 'B2B_OUTBOUND';
  if (isB2bSubmission && !canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B submission requires application.manage_b2b permission.' }, { status: 403 });
  }
  if (isB2bSubmission && !body.b2bProviderId) {
    return NextResponse.json({ success: false, error: 'b2bProviderId is required for a B2B submission.' }, { status: 400 });
  }

  const newStage = isB2bSubmission ? 'SUBMITTED_TO_B2B' : 'SUBMITTED_TO_UNIVERSITY';
  try {
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.application.findUnique({ where: { id: params.id } });
      if (!existing) throw new ApplicationStageTransitionError('NOT_FOUND', 'Application not found.');
      if ((existing.isB2b || existing.isB2bConfidential || String(existing.applicationSource || '').toUpperCase().startsWith('B2B_')) && !canViewB2B(auth.roles, auth.permissions)) {
        throw Object.assign(new Error('B2B application access requires explicit permission.'), { code: 'B2B_PERMISSION_REQUIRED' });
      }
      if (isB2bSubmission) {
        const provider = await tx.b2bProvider.findFirst({
          where: { id: body.b2bProviderId!, status: { in: ['ACTIVE', 'active', 'APPROVED', 'approved'] } },
          select: { id: true },
        });
        if (!provider) throw Object.assign(new Error('B2B provider is not active or approved.'), { code: 'PROVIDER_UNAVAILABLE' });
      }

      const transition = await transitionApplicationStage(tx, {
        applicationId: params.id,
        toStage: newStage,
        actorId: auth.userId,
        reason: body.reason,
        visibility: isB2bSubmission ? 'B2B_CONFIDENTIAL' : 'public_safe',
      });
      const application = await tx.application.update({ where: { id: params.id }, data: { updatedBy: auth.userId } });

      const detailText = [
        `Application submitted via ${body.submissionMethod} to ${body.submittedTo || 'University'}.`,
        body.acknowledgementNumber ? `Acknowledgement: ${body.acknowledgementNumber}.` : '',
        body.portalReference ? `Portal reference: ${body.portalReference}.` : '',
        body.universityApplicationId ? `University application ID: ${body.universityApplicationId}.` : '',
        body.expectedResponseDate ? `Expected response: ${body.expectedResponseDate}.` : '',
        body.feeStatus ? `Fee status: ${body.feeStatus}.` : '',
        body.note || '',
      ].filter(Boolean).join(' ');

      await tx.applicationComment.create({
        data: {
          applicationId: params.id,
          userId: auth.userId,
          role: auth.roles[0] || 'APPLICATION_TEAM',
          commentType: isB2bSubmission ? 'B2B_CONFIDENTIAL' : 'APPLICATION_TEAM_INTERNAL',
          visibility: isB2bSubmission ? 'B2B_CONFIDENTIAL' : 'internal',
          commentText: detailText,
          isB2bConfidential: isB2bSubmission,
        },
      });

      if (isB2bSubmission && body.b2bProviderId) {
        const existingB2b = await tx.b2bApplication.findFirst({ where: { applicationId: params.id, b2bProviderId: body.b2bProviderId } });
        if (existingB2b) {
          await tx.b2bApplication.update({
            where: { id: existingB2b.id },
            data: {
              b2bStatus: 'SUBMITTED',
              submissionRoute: body.submissionMethod,
              b2bReference: body.b2bReference || existingB2b.b2bReference,
              portalReference: body.portalReference || existingB2b.portalReference,
              universityApplicationId: body.universityApplicationId || existingB2b.universityApplicationId,
              lastFollowupAt: new Date(),
            },
          });
        } else {
          await tx.b2bApplication.create({
            data: {
              applicationId: params.id,
              b2bProviderId: body.b2bProviderId,
              b2bType: body.submissionMethod,
              b2bReference: body.b2bReference || '',
              submissionRoute: body.submissionMethod,
              b2bStatus: 'SUBMITTED',
              portalReference: body.portalReference || '',
              universityApplicationId: body.universityApplicationId || '',
              createdBy: auth.userId,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'SUBMIT_APPLICATION',
          resource: 'Application',
          resourceId: params.id,
          details: JSON.stringify({ submissionMethod: body.submissionMethod, submittedTo: body.submittedTo, reason: body.reason, oldStage: transition.previousStage, newStage: transition.stage }),
          actorRole: auth.roles[0] || '',
          studentId: existing.studentId,
          beforeValue: JSON.stringify({ stage: transition.previousStage }),
          afterValue: JSON.stringify({ stage: transition.stage, safeStatus: application.safeStatus }),
        },
      });
      return application;
    });

    // Authoritative business conversion is emitted only after the DB transaction
    // commits. The analytics adapter reports NOT_CONFIGURED instead of inventing
    // delivery/success when no provider is configured.
    reportServerEvent({
      event: 'application_submitted',
      reference: updated.applicationCode || updated.id,
      params: {
        application_reference: updated.applicationCode || '',
        application_stage: updated.stage,
        lead_source: body.submissionMethod,
      },
    });

    const safeUpdated = stripB2BFields(updated as any, canViewB2B(auth.roles, auth.permissions), canViewB2BCommission(auth.roles, auth.permissions));
    return NextResponse.json({ success: true, data: safeUpdated, application: safeUpdated, message: `Application submitted via ${body.submissionMethod}` });
  } catch (error: any) {
    if (error?.code === 'B2B_PERMISSION_REQUIRED') return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    if (error?.code === 'PROVIDER_UNAVAILABLE') return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    if (error instanceof ApplicationStageTransitionError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'INVALID_REASON' ? 400 : ['CONCURRENT_UPDATE', 'DOCUMENTS_NOT_READY'].includes(error.code) ? 409 : 422;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    console.error('[application-submit] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to submit application.' }, { status: 500 });
  }
});

export const PATCH = POST;
