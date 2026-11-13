import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';

const VIEW_PERMISSIONS = new Set(['a1', 'applications.view_assigned', 'application.view_assigned']);
const UPDATE_STAGE_PERMISSIONS = new Set(['a3', 'applications.update_stage', 'application.stage.update']);
const ALLOWED_SORT_FIELDS = new Set(['createdAt', 'updatedAt', 'stage', 'university', 'country', 'intake']);
const TRANSITIONS: Record<string, string[]> = {
  research: ['shortlisted', 'draft', 'withdrawn'],
  shortlisted: ['research', 'draft', 'withdrawn'],
  draft: ['submitted', 'research', 'withdrawn'],
  submitted: ['under_review', 'offer_received', 'rejected', 'withdrawn'],
  under_review: ['submitted', 'offer_received', 'rejected', 'withdrawn'],
  offer_received: ['conditions_pending', 'deposit_paid', 'withdrawn'],
  conditions_pending: ['offer_received', 'deposit_paid', 'withdrawn'],
  deposit_paid: ['cas_received', 'visa_prep', 'withdrawn'],
  cas_received: ['visa_prep', 'visa_submitted'],
  visa_prep: ['visa_submitted'],
  visa_submitted: ['visa_approved', 'rejected'],
  visa_approved: ['enrolled'],
};
const ALLOWED_STAGES = new Set([...Object.keys(TRANSITIONS), ...Object.values(TRANSITIONS).flat()]);

function uniqueIds(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => Boolean(value)))];
}
function boundedInteger(raw: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
}
async function getActiveEmployee(auth: AuthContext) {
  const employee = await db.employee.findUnique({
    where: { userId: auth.userId },
    select: { id: true, userId: true, employeeId: true, status: true },
  });
  return employee && employee.status.toLowerCase() === 'active' ? employee : null;
}

export const GET = withAuth(async (request: Request, auth: AuthContext) => {
  const employee = await getActiveEmployee(auth);
  if (!employee) return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
  if (!auth.permissions.some((permission) => VIEW_PERMISSIONS.has(permission))) {
    return NextResponse.json({ success: false, error: 'Assigned-application view permission is required.' }, { status: 403 });
  }

  const url = new URL(request.url);
  const page = boundedInteger(url.searchParams.get('page'), 1, 1, 1_000_000);
  const limit = boundedInteger(url.searchParams.get('limit'), 20, 1, 100);
  const search = (url.searchParams.get('search') || '').trim().slice(0, 120);
  const stage = (url.searchParams.get('stage') || '').trim().slice(0, 80);
  const country = (url.searchParams.get('country') || '').trim().slice(0, 80);
  const sortCandidate = url.searchParams.get('sortBy') || 'updatedAt';
  const sortBy = ALLOWED_SORT_FIELDS.has(sortCandidate) ? sortCandidate : 'updatedAt';
  const sortOrder: 'asc' | 'desc' = (url.searchParams.get('sortOrder') || '').toLowerCase() === 'asc' ? 'asc' : 'desc';
  const employeeIds = uniqueIds([employee.id, employee.userId, employee.employeeId]);

  try {
    const assignedStudents = await db.portalStudentProfile.findMany({
      where: { counselorId: { in: employeeIds } },
      select: { id: true },
    });
    const studentProfileIds = assignedStudents.map((student) => student.id);
    if (!studentProfileIds.length) {
      return NextResponse.json({ success: true, data: [], pagination: { page, limit, total: 0, totalPages: 0 } }, { headers: { 'Cache-Control': 'private, no-store' } });
    }

    const where: Record<string, unknown> = { studentProfileId: { in: studentProfileIds } };
    if (search) where.OR = [
      { university: { contains: search } },
      { course: { contains: search } },
      { intake: { contains: search } },
    ];
    if (stage) where.stage = stage;
    if (country) where.country = country;

    const [applications, total] = await Promise.all([
      db.portalStudentApplication.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, studentProfileId: true, university: true, course: true,
          intake: true, country: true, stage: true, nextAction: true,
          deadline: true, createdAt: true, updatedAt: true,
          studentProfile: { select: { fullName: true, studentId: true } },
        },
      }),
      db.portalStudentApplication.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: applications.map(({ studentProfile, ...application }) => ({
        ...application,
        studentName: studentProfile.fullName,
        studentStudentId: studentProfile.studentId,
        allowedNextStages: TRANSITIONS[application.stage.toLowerCase()] || [],
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Assigned applications could not be loaded.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
});

export const PUT = withAuth(async (request: Request, auth: AuthContext) => {
  if (!mutationOriginAllowed(request, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const employee = await getActiveEmployee(auth);
  if (!employee) return NextResponse.json({ success: false, error: 'An active employee record is required.' }, { status: 403 });
  if (!auth.permissions.some((permission) => UPDATE_STAGE_PERMISSIONS.has(permission))) {
    return NextResponse.json({ success: false, error: 'Application-stage update permission is required.' }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: 'A valid JSON body is required.' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const nextStage = typeof body.stage === 'string' ? body.stage.trim().toLowerCase() : '';
  if (!id || id.length > 191 || !ALLOWED_STAGES.has(nextStage)) {
    return NextResponse.json({ success: false, error: 'A valid application id and supported next stage are required.' }, { status: 400 });
  }

  const employeeIds = uniqueIds([employee.id, employee.userId, employee.employeeId]);
  try {
    const application = await db.portalStudentApplication.findFirst({
      where: { id, studentProfile: { counselorId: { in: employeeIds } } },
      select: { id: true, studentProfileId: true, stage: true, university: true },
    });
    if (!application) return NextResponse.json({ success: false, error: 'Assigned application not found.' }, { status: 404 });
    const currentStage = application.stage.toLowerCase();
    if (!TRANSITIONS[currentStage]?.includes(nextStage)) {
      return NextResponse.json({ success: false, error: `Transition from ${currentStage} to ${nextStage} is not permitted.` }, { status: 409 });
    }

    const updated = await db.$transaction(async (tx) => {
      const changed = await tx.portalStudentApplication.updateMany({
        where: { id: application.id, stage: application.stage },
        data: { stage: nextStage },
      });
      if (changed.count !== 1) throw new Error('APPLICATION_STAGE_CONFLICT');
      const row = await tx.portalStudentApplication.findUnique({ where: { id: application.id } });
      await tx.portalTimelineEvent.create({
        data: {
          studentProfileId: application.studentProfileId,
          channel: 'crm',
          messageType: 'application_stage_update',
          content: `Application stage changed from ${application.stage} to ${nextStage}.`,
          senderName: auth.name || 'Employee',
          senderType: 'employee',
          visibility: 'internal_only',
        },
      });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'EMPLOYEE_APPLICATION_STAGE_UPDATED',
          entityType: 'PortalStudentApplication',
          entityId: application.id,
          metadata: JSON.stringify({
            effectiveUserId: auth.userId,
            beforeStage: application.stage,
            afterStage: nextStage,
            ...(auth.actingAsSessionId ? { actingAsSessionId: auth.actingAsSessionId, actingAsRole: auth.actingAsRole } : {}),
          }),
        },
      });
      return row;
    });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    if (error instanceof Error && error.message === 'APPLICATION_STAGE_CONFLICT') {
      return NextResponse.json({ success: false, error: 'Application stage changed concurrently; reload and try again.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Application stage could not be updated.' }, { status: 503 });
  }
});
