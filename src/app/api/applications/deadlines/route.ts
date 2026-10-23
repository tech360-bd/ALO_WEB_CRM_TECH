import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canManageB2B, canViewB2B, canViewB2BCommission } from '@/lib/application-manager/service';

const DEADLINE_TYPES = ['APPLICATION_DEADLINE', 'DOCUMENT_DEADLINE', 'OFFER_CONDITION_DEADLINE', 'DEPOSIT_DEADLINE', 'CAS_DEADLINE', 'I20_DEADLINE', 'COE_DEADLINE', 'B2B_FOLLOWUP_DEADLINE', 'UNIVERSITY_FOLLOWUP_DEADLINE'] as const;
const deadlineCreateSchema = z.object({
  applicationId: z.string().trim().min(1).max(191),
  deadlineDate: z.string().datetime({ offset: true }).or(z.string().date()),
  deadlineType: z.enum(DEADLINE_TYPES).default('APPLICATION_DEADLINE'),
  status: z.enum(['PENDING', 'DUE_TODAY', 'DUE_IN_3_DAYS', 'DUE_IN_7_DAYS', 'OVERDUE', 'COMPLETED']).default('PENDING'),
  assignedTo: z.string().trim().max(191).optional(),
  note: z.string().trim().max(2000).optional(),
}).strict();

function partnerActor(auth: any): boolean {
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || auth.roles.some((role: string) => role.toLowerCase().startsWith('partner')));
}
function appScope(auth: any): Record<string, any> | null {
  const roles = auth.roles.map((role: string) => role.toLowerCase());
  if (partnerActor(auth)) return auth.partnerId ? { partnerId: auth.partnerId } : null;
  if (roles.some((role: string) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.view_all')) return {};
  if (roles.includes('counselor') || auth.userType.toLowerCase() === 'counselor') return { counselorId: auth.userId };
  if (roles.includes('visa_officer')) return { visaOfficerId: auth.userId };
  if (auth.permissions.includes('application.view_assigned')) return { OR: [
    { counselorId: auth.userId }, { applicationOfficer: auth.userId }, { appTeamOfficerId: auth.userId }, { visaOfficerId: auth.userId },
  ] };
  return null;
}
function applicationFilter(scope: Record<string, any>, canSeeB2b: boolean): Record<string, any> {
  if (canSeeB2b) return scope;
  const nonB2b = {
    isB2b: false,
    isB2bConfidential: false,
    applicationSource: { notIn: ['B2B_INBOUND_APPLICATION', 'B2B_OUTBOUND_APPLICATION'] },
    b2bApplications: { none: {} },
  };
  return Object.keys(scope).length ? { AND: [scope, nonB2b] } : nonB2b;
}
function safeDeadline(record: any) {
  const { application, ...deadline } = record;
  return {
    ...deadline,
    ...(application ? { application: {
      applicationCode: application.applicationCode,
      studentId: application.studentId,
      universityName: application.universityName,
      courseName: application.courseName,
      country: application.country,
    } } : {}),
  };
}

export const GET = withAuth(async (req, auth) => {
  const roles = auth.roles.map((role) => role.toLowerCase());
  const canRead = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team', 'counselor', 'visa_officer'].includes(role)) ||
    auth.permissions.includes('application.view_all') || auth.permissions.includes('application.view_assigned');
  if (!canRead) return NextResponse.json({ success: false, error: 'Forbidden: application deadline view permission required.' }, { status: 403 });
  const scope = appScope(auth);
  if (scope === null) return NextResponse.json({ success: false, error: 'Forbidden: application is outside your deadline scope.' }, { status: 403 });
  const canSeeB2b = canViewB2B(auth.roles, auth.permissions);
  const canSeeCommission = canViewB2BCommission(auth.roles, auth.permissions);
  const applicationId = new URL(req.url).searchParams.get('applicationId');
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const due = url.searchParams.get('due');
  if (type?.toUpperCase().startsWith('B2B_') && !canSeeB2b) return NextResponse.json({ success: false, error: 'Forbidden: B2B deadline filtering requires permission.' }, { status: 403 });
  if (status && !['PENDING', 'DUE_TODAY', 'DUE_IN_3_DAYS', 'DUE_IN_7_DAYS', 'OVERDUE', 'COMPLETED'].includes(status)) return NextResponse.json({ success: false, error: 'Invalid deadline status.' }, { status: 400 });
  if (due && !['TODAY', 'DUE_TODAY', '3_DAYS', '7_DAYS', 'OVERDUE'].includes(due)) return NextResponse.json({ success: false, error: 'Invalid due filter.' }, { status: 400 });

  const where: Record<string, any> = { application: applicationFilter(scope, canSeeB2b) };
  if (status) where.status = status;
  if (type) where.deadlineType = type;
  if (applicationId) where.applicationId = applicationId;
  if (due) {
    const now = new Date();
    if (due === 'OVERDUE') where.deadlineDate = { lt: now };
    else if (due === 'TODAY' || due === 'DUE_TODAY') {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      where.deadlineDate = { gte: today, lt: tomorrow };
    } else if (due === '3_DAYS') where.deadlineDate = { lte: new Date(Date.now() + 3 * 86400000), gte: now };
    else if (due === '7_DAYS') where.deadlineDate = { lte: new Date(Date.now() + 7 * 86400000), gte: now };
  }

  try {
    const records = await db.applicationDeadline.findMany({
      where,
      include: { application: { select: { applicationCode: true, studentId: true, universityName: true, courseName: true, country: true } } },
      orderBy: { deadlineDate: 'asc' },
      take: 500,
    });
    const withSla = records.map((record: any) => {
      const diff = new Date(record.deadlineDate).getTime() - Date.now();
      let slaStatus = 'ON_TRACK';
      if (diff < 0) slaStatus = 'OVERDUE';
      else if (diff <= 86400000) slaStatus = 'DUE_TODAY';
      else if (diff <= 3 * 86400000) slaStatus = 'DUE_IN_3_DAYS';
      else if (diff <= 7 * 86400000) slaStatus = 'DUE_IN_7_DAYS';
      const safe = safeDeadline(record);
      return { ...safe, slaStatus };
    });
    if (canSeeB2b && applicationId) await logAuditAction(auth, 'VIEW_B2B_APPLICATION_DEADLINES', 'Application', applicationId, { count: withSla.length });
    return NextResponse.json({ success: true, data: withSla, deadlines: withSla, meta: { canViewB2B: canSeeB2b, canViewB2BCommission: canSeeCommission } });
  } catch (error) {
    console.error('[application-deadlines.get] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to load application deadlines.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req, auth) => {
  const roles = auth.roles.map((role) => role.toLowerCase());
  const canWrite = roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.create_deadline');
  if (!canWrite || partnerActor(auth)) return NextResponse.json({ success: false, error: 'Forbidden: application deadline write permission required.' }, { status: 403 });
  const parsed = deadlineCreateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid deadline request.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const scope = appScope(auth);
  if (scope === null) return NextResponse.json({ success: false, error: 'Forbidden: application is outside your deadline scope.' }, { status: 403 });
  const isGlobal = roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.view_all');
  const canSeeB2b = canViewB2B(auth.roles, auth.permissions);
  const application = await db.application.findFirst({ where: { AND: [{ id: body.applicationId }, applicationFilter(scope, canSeeB2b)] } });
  if (!application) return NextResponse.json({ success: false, error: 'Application not found in your authorized scope.' }, { status: 404 });
  const applicationIsB2b = application.isB2b || application.isB2bConfidential || String(application.applicationSource || '').toUpperCase().startsWith('B2B_') || String(application.stage || '').toUpperCase().includes('B2B');
  if (applicationIsB2b && !canManageB2B(auth.roles, auth.permissions)) return NextResponse.json({ success: false, error: 'Forbidden: B2B deadline changes require management permission.' }, { status: 403 });
  if (body.deadlineType.startsWith('B2B_') && !canManageB2B(auth.roles, auth.permissions)) return NextResponse.json({ success: false, error: 'Forbidden: B2B deadline changes require management permission.' }, { status: 403 });
  if (!isGlobal && body.assignedTo && body.assignedTo !== auth.userId) return NextResponse.json({ success: false, error: 'Only managers may assign deadlines to other users.' }, { status: 403 });
  const deadlineDate = new Date(body.deadlineDate);
  if (Number.isNaN(deadlineDate.getTime())) return NextResponse.json({ success: false, error: 'Invalid deadlineDate.' }, { status: 400 });
  try {
    const record = await db.applicationDeadline.create({ data: {
      applicationId: body.applicationId,
      deadlineType: body.deadlineType,
      deadlineDate,
      status: body.status,
      assignedTo: body.assignedTo || auth.userId,
      note: body.note || '',
    } });
    await logAuditAction(auth, 'CREATE_DEADLINE', 'ApplicationDeadline', record.id, { applicationId: body.applicationId, deadlineType: body.deadlineType });
    await db.auditLog.create({ data: {
      userId: auth.userId,
      action: 'CREATE_DEADLINE',
      resource: 'ApplicationDeadline',
      resourceId: record.id,
      details: JSON.stringify({ applicationId: body.applicationId, deadlineType: body.deadlineType }),
      actorRole: auth.roles[0] || '',
      studentId: application.studentId,
    } });
    return NextResponse.json({ success: true, data: safeDeadline(record), deadline: safeDeadline(record) }, { status: 201 });
  } catch (error) {
    console.error('[application-deadlines.post] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Failed to create application deadline.' }, { status: 503 });
  }
});
