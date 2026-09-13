import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map(r => r.toLowerCase());
  const canAssign = roles.includes('super_admin') || roles.includes('application_manager') || roles.includes('application_team') || auth.permissions.includes('application.update');
  if (!canAssign) return NextResponse.json({ success: false, error: 'Forbidden: assign requires application_manager or application_team role' }, { status: 403 });

  const body = await req.json();
  const { counselorId, counselorName, appTeamOfficerId, applicationOfficer, visaOfficerId } = body;

  const existing = await db.application.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  const updated = await db.application.update({
    where: { id: params.id },
    data: {
      counselorId: counselorId ?? existing.counselorId,
      counselorName: counselorName ?? existing.counselorName,
      appTeamOfficerId: appTeamOfficerId ?? (existing as any).appTeamOfficerId,
      applicationOfficer: applicationOfficer ?? existing.applicationOfficer,
      visaOfficerId: visaOfficerId ?? existing.visaOfficerId,
      updatedBy: auth.userId,
    },
  });

  await db.applicationStatusLog.create({
    data: {
      applicationId: params.id,
      oldStatus: existing.stage,
      newStatus: existing.stage,
      safeStatus: (existing as any).safeStatus || 'UNDER_REVIEW',
      changedBy: auth.userId,
      visibility: 'internal',
      note: `Assignment updated — Counselor: ${counselorName || counselorId || 'unchanged'}, App Officer: ${applicationOfficer || appTeamOfficerId || 'unchanged'}`,
    },
  });

  await logAuditAction(auth, 'ASSIGN_APPLICATION', 'Application', params.id, body);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'ASSIGN_APPLICATION',
      resource: 'Application',
      resourceId: params.id,
      details: JSON.stringify(body),
      actorRole: auth.roles[0] || '',
      studentId: existing.studentId,
      beforeValue: JSON.stringify({ counselorId: existing.counselorId, applicationOfficer: existing.applicationOfficer }),
      afterValue: JSON.stringify({ counselorId: updated.counselorId, applicationOfficer: updated.applicationOfficer }),
    },
  });

  return NextResponse.json({ success: true, data: updated, application: updated });
});

export const POST = withAuth(async (req, auth, { params }: any) => {
  return PATCH(req, auth, { params } as any);
});
