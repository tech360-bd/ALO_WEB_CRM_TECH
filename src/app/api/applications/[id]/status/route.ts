import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { INTERNAL_STAGES, canViewB2B, canManageB2B, canViewB2BCommission, stripB2BFields } from '@/lib/application-manager/service';
import { ApplicationStageTransitionError, transitionApplicationStage } from '@/lib/application-manager/stage-transition';

const bodySchema = z.object({
  stage: z.enum(INTERNAL_STAGES),
  reason: z.string().trim().min(3).max(180).optional(),
  /** Compatibility alias for older ALO clients; never used as a default reason. */
  note: z.string().trim().min(3).max(180).optional(),
  reviewStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_MORE_INFO']).optional(),
  offerStatus: z.enum(['PENDING', 'CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER', 'REJECTED', 'DEFERRED', 'WITHDRAWN']).optional(),
}).strict();

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map((role) => role.toLowerCase());
  const isPartner = Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
  const canUpdate = roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.update');
  if (isPartner || !canUpdate) return NextResponse.json({ success: false, error: 'Forbidden: authorized ALO application.update permission required.' }, { status: 403 });

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid status transition request', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  const reason = body.reason || body.note;
  if (!reason) return NextResponse.json({ success: false, error: 'A reason (3–180 characters) is required for every stage change.' }, { status: 400 });
  const canSeeB2B = canViewB2B(auth.roles, auth.permissions);
  const targetRequiresB2B = ['SUBMITTED_TO_B2B', 'B2B_SUBMITTED', 'B2B_ACKNOWLEDGED'].includes(body.stage);
  if (targetRequiresB2B && !canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B stage transitions require application.manage_b2b permission.' }, { status: 403 });
  }

  try {
    const updated = await db.$transaction(async (tx) => {
      const existing = await tx.application.findUnique({ where: { id: params.id } });
      if (!existing) throw new ApplicationStageTransitionError('NOT_FOUND', 'Application not found.');
      if ((existing.isB2bConfidential || existing.isB2b) && !canSeeB2B) {
        throw Object.assign(new Error('B2B details require explicit permission.'), { code: 'B2B_PERMISSION_REQUIRED' });
      }
      if (roles.includes('counselor') && existing.counselorId !== auth.userId && !auth.permissions.includes('application.view_all')) {
        throw Object.assign(new Error('Application is not assigned to this counselor.'), { code: 'APPLICATION_SCOPE_DENIED' });
      }
      const transition = await transitionApplicationStage(tx, {
        applicationId: params.id,
        toStage: body.stage,
        actorId: auth.userId,
        reason,
        visibility: existing.isB2bConfidential ? 'B2B_CONFIDENTIAL' : 'public_safe',
      });
      const application = await tx.application.update({
        where: { id: params.id },
        data: {
          ...(body.reviewStatus ? { reviewStatus: body.reviewStatus } : {}),
          ...(body.offerStatus ? { offerStatus: body.offerStatus } : {}),
          updatedBy: auth.userId,
        },
      });
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'UPDATE_APPLICATION_STATUS',
          resource: 'Application',
          resourceId: params.id,
          details: JSON.stringify({ oldStage: transition.previousStage, newStage: transition.stage, reason }),
          actorRole: auth.roles[0] || '',
          studentId: application.studentId,
          beforeValue: JSON.stringify({ stage: transition.previousStage }),
          afterValue: JSON.stringify({ stage: transition.stage, safeStatus: application.safeStatus }),
        },
      });
      return application;
    });
    const safe = stripB2BFields(updated as any, canSeeB2B, canViewB2BCommission(auth.roles, auth.permissions));
    return NextResponse.json({ success: true, data: safe, application: safe });
  } catch (error: any) {
    if (['B2B_PERMISSION_REQUIRED', 'APPLICATION_SCOPE_DENIED'].includes(error?.code)) {
      return NextResponse.json({ success: false, error: error.message }, { status: 403 });
    }
    if (error instanceof ApplicationStageTransitionError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'INVALID_REASON' ? 400 : ['CONCURRENT_UPDATE', 'DOCUMENTS_NOT_READY'].includes(error.code) ? 409 : 422;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    console.error('[application-status] transition failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update application status.' }, { status: 500 });
  }
});

export const POST = PATCH;
