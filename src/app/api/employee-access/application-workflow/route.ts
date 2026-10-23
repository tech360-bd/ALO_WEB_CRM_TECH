import { z } from 'zod';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { DEFAULT_APPLICATION_DOCUMENT_REQUIREMENTS, refreshApplicationDocumentStatus } from '@/lib/application-manager/document-readiness';

const bodySchema = z.object({
  studentId: z.string().trim().min(1).max(191),
  country: z.string().trim().min(2).max(80),
  universityId: z.string().trim().max(191).optional(),
  courseId: z.string().trim().max(191).optional(),
  intake: z.string().trim().max(120).optional(),
}).strict();

const STAFF_ROLES = ['super_admin', 'admin', 'application_manager', 'application_team', 'application_officer', 'counselor'];
function isPartner(auth: { partnerId?: string; userType: string; roles: string[] }): boolean {
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || auth.roles.some((role) => role.toLowerCase().startsWith('partner')));
}
function canManageApplications(auth: { roles: string[]; permissions: string[] }): boolean {
  return auth.roles.some((role) => STAFF_ROLES.includes(role.toLowerCase()))
    || auth.permissions.some((permission) => ['application.create', 'application.manage', 'application.update'].includes(permission));
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canManageApplications(auth) || isPartner(auth)) return NextResponse.json({ success: false, error: 'Application workflow access is not permitted.' }, { status: 403 });
  const applicationId = req.nextUrl.searchParams.get('applicationId');
  if (!applicationId) return NextResponse.json({ success: false, error: 'applicationId required' }, { status: 400 });
  const app = await db.application.findUnique({ where: { id: applicationId } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  const roles = auth.roles.map((role) => role.toLowerCase());
  if (roles.includes('counselor') && !roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team', 'application_officer'].includes(role)) && app.counselorId !== auth.userId) {
    return NextResponse.json({ success: false, error: 'Application is not assigned to this counselor.' }, { status: 403 });
  }

  try {
    const [checklist, history, payments, interviews] = await Promise.all([
      (db as any).documentRequirement.findMany({ where: { applicationId } }).catch(() => []),
      db.applicationStageHistory.findMany({ where: { applicationId }, orderBy: { createdAt: 'asc' } }),
      (db as any).universityPayment.findMany({ where: { applicationId } }).catch(() => []),
      (db as any).visaInterview.findMany({ where: { applicationId } }).catch(() => []),
    ]);
    return NextResponse.json({
      success: true,
      application: app,
      serial: app.applicationCode,
      checklist,
      history,
      payments,
      interviews,
      provenance: 'Offer letter provenance is recorded on the application offer and private document record.',
      twoCommentSystems: { studentVisible: 'Student-visible', internal: 'Internal only' },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Application workflow is temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!canManageApplications(auth) || isPartner(auth)) return NextResponse.json({ success: false, error: 'Application creation permission required.' }, { status: 403 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid application request.', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const student = await db.student.findUnique({ where: { id: body.studentId }, select: { id: true, counselorId: true } });
  if (!student) return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
  const roles = auth.roles.map((role) => role.toLowerCase());
  if (roles.includes('counselor') && !roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team', 'application_officer'].includes(role)) && student.counselorId !== auth.userId) {
    return NextResponse.json({ success: false, error: 'Student is not assigned to this counselor.' }, { status: 403 });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const existing = await tx.application.findFirst({
        where: {
          studentId: student.id,
          country: body.country,
          universityId: body.universityId || '',
          courseId: body.courseId || '',
          intake: body.intake || '',
          stage: { notIn: ['CLOSED', 'WITHDRAWN', 'REJECTED'] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) return { application: existing, reused: true };

      const stage = 'APPLICATION_DRAFT';
      const created = await tx.application.create({
        data: {
          studentId: student.id,
          country: body.country,
          universityId: body.universityId || '',
          courseId: body.courseId || '',
          intake: body.intake || '',
          applicationSource: 'DIRECT_ALO_APPLICATION',
          stage,
          safeStatus: 'DRAFT',
          reviewStatus: 'PENDING',
          documentStatus: 'PENDING',
          paymentStatus: 'PENDING',
          offerStatus: 'PENDING',
          casI20CoeStatus: 'NOT_STARTED',
          visaHandoverStatus: 'NOT_READY',
          status: 'active',
          counselorId: student.counselorId || auth.userId,
          createdBy: auth.userId,
        },
      });
      await tx.applicationDocument.createMany({
        data: DEFAULT_APPLICATION_DOCUMENT_REQUIREMENTS.map((requirement) => ({
          applicationId: created.id,
          studentId: student.id,
          documentType: requirement.type,
          fileName: requirement.label,
          status: 'REQUIRED',
          visibility: 'student_visible',
          version: 1,
        })),
      });
      await refreshApplicationDocumentStatus(tx, created.id);
      await tx.applicationStageHistory.create({ data: { applicationId: created.id, stage, status: 'completed', note: 'Application created as a draft by authorized staff.', actor: auth.userId } });
      await tx.applicationStatusLog.create({ data: { applicationId: created.id, oldStatus: '', newStatus: stage, safeStatus: 'DRAFT', changedBy: auth.userId, visibility: 'internal', note: 'Application created as a draft.' } });
      await tx.auditLog.create({ data: { userId: auth.userId, action: 'EMPLOYEE_ACCESS_APPLICATION_CREATED', resource: 'Application', resourceId: created.id, details: JSON.stringify({ studentId: student.id, country: body.country }), actorRole: auth.roles[0] || auth.userType, studentId: student.id } });
      return { application: created, reused: false };
    });

    return NextResponse.json({
      success: true,
      data: result.application,
      serial: result.application.applicationCode,
      reused: result.reused,
      message: result.reused ? 'An active draft for this student, course, country, and intake already exists.' : 'Application draft created with required-document checklist.',
    }, { status: result.reused ? 200 : 201 });
  } catch (error) {
    console.error('[employee-application-workflow] create failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Application draft could not be created.' }, { status: 503 });
  }
}
