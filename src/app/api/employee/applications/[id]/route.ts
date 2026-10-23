import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { INTERNAL_STAGES, canViewB2B, stripB2BFields } from '@/lib/application-manager/service';
import { ApplicationStageTransitionError, transitionApplicationStage } from '@/lib/application-manager/stage-transition';

const updateSchema = z.object({
  stage: z.enum(INTERNAL_STAGES).optional(),
  reason: z.string().trim().min(3).max(180).optional(),
  notes: z.string().max(10000).optional(),
  deadline: z.string().max(191).optional(),
  counselorId: z.string().max(191).optional(),
  applicationOfficer: z.string().max(191).optional(),
}).strict();

function roleSet(roles: string[]) { return new Set(roles.map((role) => role.toLowerCase())); }
function isBlockedIdentity(userType: string, roles: string[]) {
  return ['student', 'partner'].includes(userType.toLowerCase()) || roles.some((role) => role.toLowerCase().startsWith('partner'));
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;
    const roles = roleSet(auth.roles);
    if (isBlockedIdentity(auth.userType, auth.roles)) return NextResponse.json({ success: false, error: 'Forbidden: employee access only' }, { status: 403 });

    const isSuper = ['super_admin', 'admin'].some((role) => roles.has(role));
    const isApplicationTeam = roles.has('application_team') || roles.has('application_manager');
    const isCounselor = roles.has('counselor') || roles.has('senior_counselor');
    const canManageAll = isSuper || isApplicationTeam || auth.permissions.includes('application.update');
    if (!canManageAll && !isCounselor && !auth.permissions.includes('application.update_assigned')) {
      return NextResponse.json({ success: false, error: 'Insufficient application update permissions' }, { status: 403 });
    }

    const parsed = updateSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid application update', details: parsed.error.flatten() }, { status: 400 });
    const body = parsed.data;
    if (body.stage && !body.reason) return NextResponse.json({ success: false, error: 'A reason (3–180 characters) is required for every stage change.' }, { status: 400 });
    if ((body.counselorId !== undefined || body.applicationOfficer !== undefined) && !canManageAll) {
      return NextResponse.json({ success: false, error: 'Only application managers may reassign an application.' }, { status: 403 });
    }

    const existing = await db.application.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    if (!canManageAll && existing.counselorId !== auth.userId) return NextResponse.json({ success: false, error: 'Not assigned to this application' }, { status: 403 });

    const { stage, reason, ...fields } = body;
    const updated = await db.$transaction(async (tx) => {
      const transition = stage
        ? await transitionApplicationStage(tx, { applicationId: params.id, toStage: stage, actorId: auth.userId, reason: reason! })
        : null;
      const application = await tx.application.update({ where: { id: params.id }, data: { ...fields, updatedBy: auth.userId } });
      if (transition || Object.keys(fields).length > 0) {
        await tx.timelineEvent.create({
          data: {
            studentId: existing.studentId,
            stage: 'APPLICATION_UPDATED',
            title: transition ? `Application stage changed to ${transition.stage}` : 'Application updated',
            description: transition ? `Reason: ${reason}` : `Updated by ${auth.name}`,
          },
        });
      }
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: transition ? 'APPLICATION_STAGE_UPDATED' : 'APPLICATION_UPDATED',
          resource: 'Application',
          resourceId: params.id,
          details: JSON.stringify({ changedFields: Object.keys(fields), ...(transition ? { beforeStage: transition.previousStage, afterStage: transition.stage, reason } : {}) }),
          actorRole: auth.roles[0] || '',
          studentId: existing.studentId,
          beforeValue: JSON.stringify({ stage: existing.stage }),
          afterValue: JSON.stringify({ stage: application.stage }),
        },
      });
      return application;
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof ApplicationStageTransitionError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'INVALID_REASON' ? 400 : ['CONCURRENT_UPDATE', 'DOCUMENTS_NOT_READY'].includes(error.code) ? 409 : 422;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    console.error('[employee-application-update] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update application.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;
    const roles = roleSet(auth.roles);
    if (isBlockedIdentity(auth.userType, auth.roles)) return NextResponse.json({ success: false, error: 'Forbidden: employee access only' }, { status: 403 });
    const canManageAll = ['super_admin', 'admin', 'application_team', 'application_manager'].some((role) => roles.has(role)) || auth.permissions.includes('application.view_all');
    const app = await db.application.findUnique({ where: { id: params.id } });
    if (!app) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
    if (!canManageAll && app.counselorId !== auth.userId) return NextResponse.json({ success: false, error: 'Not assigned to this application' }, { status: 403 });
    const canSeeB2b = canViewB2B(auth.roles, auth.permissions);
    return NextResponse.json({ success: true, data: canSeeB2b ? app : stripB2BFields(app, false, false) });
  } catch (error) {
    console.error('[employee-application-get] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to load application.' }, { status: 500 });
  }
}
