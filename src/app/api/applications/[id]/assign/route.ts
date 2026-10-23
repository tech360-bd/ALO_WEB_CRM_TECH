import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canManageB2B, canViewB2B, canViewB2BCommission, stripB2BFields } from '@/lib/application-manager/service';

const assignmentSchema = z.object({
  counselorId: z.string().trim().max(191).optional(),
  appTeamOfficerId: z.string().trim().max(191).optional(),
  applicationOfficer: z.string().trim().max(191).optional(),
  visaOfficerId: z.string().trim().max(191).optional(),
}).strict();

function isB2b(application: any): boolean {
  return application.isB2b === true || application.isB2bConfidential === true ||
    String(application.applicationSource || '').toUpperCase().startsWith('B2B_') ||
    String(application.stage || '').toUpperCase().includes('B2B');
}

export const PATCH = withAuth(async (req, auth, { params }: any) => {
  const roles = auth.roles.map((role) => role.toLowerCase());
  const globalAssigner = roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role));
  const canAssign = globalAssigner || auth.permissions.includes('application.update');
  if (!canAssign || auth.partnerId || auth.userType.toLowerCase() === 'partner') {
    return NextResponse.json({ success: false, error: 'Forbidden: application assignment permission required.' }, { status: 403 });
  }

  const parsed = assignmentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid assignment request.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const existing = await db.application.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Application not found.' }, { status: 404 });

  if (isB2b(existing) && !canManageB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B assignment requires explicit management permission.' }, { status: 403 });
  }
  const assigned = [existing.counselorId, existing.applicationOfficer, existing.appTeamOfficerId, existing.visaOfficerId].includes(auth.userId);
  if (!globalAssigner && !auth.permissions.includes('application.view_all') && !assigned) {
    return NextResponse.json({ success: false, error: 'Application is outside your assignment scope.' }, { status: 403 });
  }
  const targetIds = [...new Set([body.counselorId, body.appTeamOfficerId, body.applicationOfficer, body.visaOfficerId].filter((id): id is string => Boolean(id)))];
  const users = targetIds.length ? await db.user.findMany({ where: { id: { in: targetIds }, status: { in: ['ACTIVE', 'active'] } }, select: { id: true, name: true } }) : [];
  if (users.length !== targetIds.length) return NextResponse.json({ success: false, error: 'One or more assignees are invalid or inactive.' }, { status: 400 });
  const userNames = new Map(users.map((user) => [user.id, user.name || '']));
  const employeeRecords = body.counselorId ? await db.employee.findMany({ where: { userId: body.counselorId }, select: { userId: true, name: true } }) : [];
  const counselorName = body.counselorId === undefined
    ? existing.counselorName
    : body.counselorId ? (employeeRecords[0]?.name || userNames.get(body.counselorId) || '') : '';

  const updated = await db.application.update({
    where: { id: params.id },
    data: {
      ...(body.counselorId !== undefined ? { counselorId: body.counselorId, counselorName } : {}),
      ...(body.appTeamOfficerId !== undefined ? { appTeamOfficerId: body.appTeamOfficerId } : {}),
      ...(body.applicationOfficer !== undefined ? { applicationOfficer: body.applicationOfficer } : {}),
      ...(body.visaOfficerId !== undefined ? { visaOfficerId: body.visaOfficerId } : {}),
      updatedBy: auth.userId,
    },
  });
  const isConfidentialB2b = isB2b(existing);
  await db.applicationStatusLog.create({
    data: {
      applicationId: params.id,
      oldStatus: existing.stage,
      newStatus: existing.stage,
      safeStatus: existing.safeStatus || 'UNDER_REVIEW',
      changedBy: auth.userId,
      visibility: isConfidentialB2b ? 'B2B_CONFIDENTIAL' : 'internal',
      note: 'Application assignment updated.',
    },
  });
  const assignmentAudit = {
    counselorId: body.counselorId ?? existing.counselorId,
    appTeamOfficerId: body.appTeamOfficerId ?? existing.appTeamOfficerId,
    applicationOfficer: body.applicationOfficer ?? existing.applicationOfficer,
    visaOfficerId: body.visaOfficerId ?? existing.visaOfficerId,
  };
  await logAuditAction(auth, 'ASSIGN_APPLICATION', 'Application', params.id, assignmentAudit);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'ASSIGN_APPLICATION',
      resource: 'Application',
      resourceId: params.id,
      details: JSON.stringify(assignmentAudit),
      actorRole: auth.roles[0] || '',
      studentId: existing.studentId,
      beforeValue: JSON.stringify({ counselorId: existing.counselorId, appTeamOfficerId: existing.appTeamOfficerId, applicationOfficer: existing.applicationOfficer, visaOfficerId: existing.visaOfficerId }),
      afterValue: JSON.stringify(assignmentAudit),
    },
  });
  const safe = stripB2BFields(updated, canViewB2B(auth.roles, auth.permissions), canViewB2BCommission(auth.roles, auth.permissions));
  return NextResponse.json({ success: true, data: safe, application: safe });
});

export const POST = PATCH;
