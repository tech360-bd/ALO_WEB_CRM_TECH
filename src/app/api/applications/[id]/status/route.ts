import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { mapStageToSafeStatus } from '@/lib/application-manager/service';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map(r => r.toLowerCase());
  const canUpdate = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || auth.permissions.includes('application.update');
  if (!canUpdate) return NextResponse.json({ success: false, error: 'Forbidden: status update requires application_manager role' }, { status: 403 });

  const body = await req.json();
  if (!body.stage) return NextResponse.json({ success: false, error: 'stage required' }, { status: 400 });

  const existing = await db.application.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  const safeStatus = body.safeStatus || mapStageToSafeStatus(body.stage);

  const updated = await db.application.update({
    where: { id: params.id },
    data: {
      stage: body.stage,
      safeStatus,
      status: body.status || existing.status,
      reviewStatus: body.reviewStatus || (existing as any).reviewStatus,
      documentStatus: body.documentStatus || (existing as any).documentStatus,
      offerStatus: body.offerStatus || (existing as any).offerStatus,
      updatedBy: auth.userId,
    },
  });

  await db.applicationStageHistory.create({
    data: {
      applicationId: params.id,
      stage: body.stage,
      status: 'completed',
      note: body.note || `Stage changed from ${existing.stage} to ${body.stage}`,
      actor: auth.userId,
    },
  }).catch(() => {});

  await db.applicationStatusLog.create({
    data: {
      applicationId: params.id,
      oldStatus: existing.stage,
      newStatus: body.stage,
      safeStatus,
      changedBy: auth.userId,
      visibility: (existing as any).isB2bConfidential ? 'B2B_CONFIDENTIAL' : 'public_safe',
      note: body.note || `Stage changed from ${existing.stage} to ${body.stage}`,
    },
  });

  await logAuditAction(auth, 'UPDATE_STATUS', 'Application', params.id, body);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'UPDATE_APPLICATION_STATUS',
      resource: 'Application',
      resourceId: params.id,
      details: JSON.stringify({ oldStage: existing.stage, newStage: body.stage, safeStatus }),
      actorRole: auth.roles[0] || '',
      studentId: existing.studentId,
      beforeValue: JSON.stringify({ stage: existing.stage, safeStatus: (existing as any).safeStatus }),
      afterValue: JSON.stringify({ stage: body.stage, safeStatus }),
    },
  });

  return NextResponse.json({ success: true, data: updated, application: updated });
});

export const POST = PATCH;
