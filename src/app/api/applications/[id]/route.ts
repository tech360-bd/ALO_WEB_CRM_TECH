import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { canViewB2B, canManageB2B, canViewB2BCommission, stripB2BFields, mapStageToSafeStatus, filterCommentsByVisibility, filterDocumentsByVisibility, anonymizeTimelineEvent, INTERNAL_STAGES } from '@/lib/application-manager/service';
import { assertRecordInTenant } from '@/lib/partner-tenant-guard';
import { ApplicationStageTransitionError, transitionApplicationStage } from '@/lib/application-manager/stage-transition';

const applicationPatchSchema = z.object({
  stage: z.enum(INTERNAL_STAGES).optional(),
  reason: z.string().trim().min(3).max(180).optional(),
  universityId: z.string().max(191).nullable().optional(),
  universityName: z.string().max(191).optional(),
  courseId: z.string().max(191).nullable().optional(),
  courseName: z.string().max(191).optional(),
  campusId: z.string().max(191).nullable().optional(),
  country: z.string().max(191).optional(),
  intake: z.string().max(191).optional(),
  intakeId: z.string().max(191).nullable().optional(),
  level: z.string().max(191).optional(),
  deadline: z.string().max(191).optional(),
  deadlineDate: z.string().datetime().nullable().optional(),
  notes: z.string().max(10000).optional(),
  internalNotes: z.string().max(10000).optional(),
}).strict();

function isStudentPortalUser(userType: string, roles: string[]): boolean {
  return userType.toLowerCase() === 'student' || roles.some((role) => role.toLowerCase() === 'student');
}

function studentSafeApplication(application: any) {
  const documents = (Array.isArray(application.documents) ? application.documents : [])
    .filter((document: any) => {
      const visibility = String(document.visibility || '').toLowerCase();
      return visibility === 'student_visible' && !document.isB2bConfidential && !['b2b_confidential', 'b2b_internal'].includes(visibility);
    })
    .map((document: any) => ({
      id: document.id,
      documentType: document.documentType,
      fileName: document.fileName,
      status: document.status,
      visibility: document.visibility,
      version: document.version,
      createdAt: document.createdAt,
      downloadUrl: typeof document.documentId === 'string' && document.documentId
        ? `/api/student/documents/${encodeURIComponent(document.documentId)}/download`
        : null,
    }));
  const comments = (Array.isArray(application.comments) ? application.comments : [])
    .filter((comment: any) => ['student_visible', 'public_safe'].includes(String(comment.visibility || '').toLowerCase()) && !comment.isB2bConfidential)
    .map((comment: any) => ({ id: comment.id, commentText: comment.commentText, createdAt: comment.createdAt }));

  return {
    id: application.id,
    applicationCode: application.applicationCode,
    universityName: application.universityName,
    courseName: application.courseName,
    campusName: application.campusName,
    country: application.country,
    intake: application.intake,
    level: application.level,
    safeStatus: application.safeStatus || mapStageToSafeStatus(application.stage),
    reviewStatus: application.reviewStatus,
    offerStatus: application.offerStatus,
    documentStatus: application.documentStatus,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    documents,
    comments,
  };
}

function partnerSafeApplication(application: any) {
  const documents = (Array.isArray(application.documents) ? application.documents : [])
    .filter((document: any) => String(document.visibility || '').toLowerCase() === 'partner_visible' && !document.isB2bConfidential)
    .map((document: any) => ({ id: document.id, documentType: document.documentType, fileName: document.fileName, status: document.status, visibility: document.visibility, version: document.version, createdAt: document.createdAt }));
  const comments = (Array.isArray(application.comments) ? application.comments : [])
    .filter((comment: any) => ['partner_visible', 'student_visible', 'public_safe'].includes(String(comment.visibility || '').toLowerCase()) && !comment.isB2bConfidential)
    .map((comment: any) => ({ id: comment.id, commentText: comment.commentText, createdAt: comment.createdAt }));
  const deadlines = (Array.isArray(application.deadlines) ? application.deadlines : [])
    .filter((deadline: any) => !String(deadline.deadlineType || '').toLowerCase().startsWith('b2b'))
    .map((deadline: any) => ({ id: deadline.id, deadlineType: deadline.deadlineType, deadlineDate: deadline.deadlineDate, status: deadline.status }));

  return {
    id: application.id,
    applicationCode: application.applicationCode,
    studentId: application.studentId,
    universityName: application.universityName,
    courseName: application.courseName,
    campusName: application.campusName,
    country: application.country,
    intake: application.intake,
    level: application.level,
    safeStatus: application.safeStatus || mapStageToSafeStatus(application.stage),
    reviewStatus: application.reviewStatus,
    offerStatus: application.offerStatus,
    documentStatus: application.documentStatus,
    createdAt: application.createdAt,
    updatedAt: application.updatedAt,
    documents,
    comments,
    deadlines,
  };
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;

  const portal = authRes.type === 'portal' ? authRes.data : null;
  const normalizedRoles = (portal?.roles || []).map((role) => role.toLowerCase());
  const isPartnerUser = Boolean(portal && (portal.partnerId || portal.userType.toLowerCase() === 'partner' || normalizedRoles.some((role) => role.startsWith('partner'))));
  const isPortalStudent = Boolean(portal && isStudentPortalUser(portal.userType, portal.roles));
  if (isPartnerUser && isPortalStudent) {
    return NextResponse.json({ success: false, error: 'Account has conflicting student and partner identities.' }, { status: 403 });
  }
  if (isPartnerUser && !portal?.partnerId) {
    return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });
  }

  const isStudentActor = authRes.type === 'student' || isPortalStudent;
  let ownStudentId: string | null = authRes.type === 'student' ? authRes.data.studentId : null;
  if (isPortalStudent && portal) {
    const [student, profile] = await Promise.all([
      db.student.findFirst({ where: { userId: portal.userId }, select: { id: true } }),
      db.portalStudentProfile.findFirst({ where: { userId: portal.userId }, select: { studentId: true } }),
    ]);
    ownStudentId = student?.id || profile?.studentId || null;
    if (!ownStudentId) return NextResponse.json({ success: false, error: 'Student profile is not linked to this account.' }, { status: 403 });
  }
  if (isStudentActor && !ownStudentId) {
    return NextResponse.json({ success: false, error: 'Student profile is not linked to this account.' }, { status: 403 });
  }

  const app = await db.application.findFirst({
    where: {
      id: params.id,
      ...(isStudentActor && ownStudentId ? { studentId: ownStudentId } : {}),
      ...(isPartnerUser && portal?.partnerId ? { partnerId: portal.partnerId } : {}),
    },
    include: {
      b2bApplications: { include: { b2bProvider: true } },
      statusLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
      comments: { orderBy: { createdAt: 'desc' }, take: 100 },
      documents: { orderBy: { createdAt: 'desc' } },
      deadlines: { orderBy: { deadlineDate: 'asc' } },
      tasks: { orderBy: { dueDate: 'asc' } },
      offer: true,
      casI20Coe: true,
      finance: true,
    },
  });
  if (!app) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });

  if (authRes.type === 'portal') {
    if (isPartnerUser) {
      const tenantDenied = assertRecordInTenant({ ...authRes.data, partnerId: authRes.data.partnerId!, partnerRole: authRes.data.partnerRole || 'PARTNER_VIEWER' }, app, 'Application');
      if (tenantDenied) return tenantDenied;
    } else if (!isPortalStudent) {
      const roles = normalizedRoles;
      const hasGlobalApplicationAccess = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role))
        || authRes.data.permissions.includes('application.view_all')
        || authRes.data.permissions.includes('application.view');
      if (!hasGlobalApplicationAccess) {
        const isAssignedCounselor = roles.includes('counselor') && app.counselorId === authRes.data.userId;
        const isAssignedOfficer = roles.some((role) => ['application_officer', 'document_officer'].includes(role))
          && [app.applicationOfficer, app.appTeamOfficerId].includes(authRes.data.userId);
        const isAssignedVisaOfficer = roles.includes('visa_officer') && app.visaOfficerId === authRes.data.userId;
        const hasScopedAccess = authRes.data.permissions.includes('application.view_assigned') &&
          [app.counselorId, app.applicationOfficer, app.appTeamOfficerId, app.visaOfficerId].includes(authRes.data.userId);
        if (!isAssignedCounselor && !isAssignedOfficer && !isAssignedVisaOfficer && !hasScopedAccess) {
          return NextResponse.json({ success: false, error: 'Application is not within your assigned view scope.' }, { status: 403 });
        }
      }
    }
  }

  let canViewB2BFlag = false;
  let canViewCommission = false;
  if (authRes.type === 'portal') {
    canViewB2BFlag = canViewB2B(authRes.data.roles, authRes.data.permissions);
    canViewCommission = canViewB2BCommission(authRes.data.roles, authRes.data.permissions);
  }

  // Filter comments, documents, timeline by visibility
  const filteredComments = filterCommentsByVisibility((app as any).comments || [], canViewB2BFlag, authRes.type === 'portal' ? authRes.data.roles?.[0] : 'student');
  const filteredDocs = filterDocumentsByVisibility((app as any).documents || [], canViewB2BFlag);
  const anonymizedLogs = (app as any).statusLogs?.map((log: any) => anonymizeTimelineEvent(log, canViewB2BFlag)) || [];

  const withSafe = {
    ...app,
    safeStatus: (app as any).safeStatus || mapStageToSafeStatus(app.stage),
    comments: filteredComments,
    documents: filteredDocs,
    statusLogs: anonymizedLogs,
  };

  const sanitized = stripB2BFields(withSafe, canViewB2BFlag, canViewCommission);

  if (isStudentActor) {
    const studentData = studentSafeApplication(app);
    return NextResponse.json({ success: true, data: studentData, application: studentData, meta: { canViewB2B: false, canViewCommission: false } });
  }
  if (isPartnerUser) {
    const partnerData: Record<string, any> = partnerSafeApplication(withSafe);
    if (canViewB2BFlag) {
      const b2bOnly = stripB2BFields({ b2bApplications: (app as any).b2bApplications || [] }, true, canViewCommission) as any;
      partnerData.b2bApplications = b2bOnly.b2bApplications || [];
    }
    return NextResponse.json({ success: true, data: partnerData, application: partnerData, meta: { canViewB2B: canViewB2BFlag, canViewCommission } });
  }

  return NextResponse.json({ success: true, data: sanitized, application: sanitized, meta: { canViewB2B: canViewB2BFlag, canViewCommission } });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const authRes = await authenticateUnified(req);
  if (authRes instanceof NextResponse) return authRes;
  if (authRes.type === 'student') {
    return NextResponse.json({ success: false, error: 'Students cannot update application directly' }, { status: 403 });
  }

  const roles = authRes.data.roles.map((role) => role.toLowerCase());
  const isPartnerUser = Boolean(authRes.data.partnerId || authRes.data.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
  // Partner changes must use partner-scoped operations; the generic application
  // editor deliberately cannot write partner-owned or B2B-private fields.
  if (isPartnerUser) return NextResponse.json({ success: false, error: 'Use the partner-scoped application workflow to update this application.' }, { status: 403 });

  const canManageAll = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role))
    || authRes.data.permissions.includes('application.update');
  if (!canManageAll && !roles.includes('counselor') && !authRes.data.permissions.includes('application.update_assigned')) {
    return NextResponse.json({ success: false, error: 'Forbidden: application.update permission required' }, { status: 403 });
  }

  const parsed = applicationPatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid application update', details: parsed.error.flatten() }, { status: 400 });
  }
  const body = parsed.data;
  if (body.stage && !body.reason) {
    return NextResponse.json({ success: false, error: 'A reason (3–180 characters) is required for every stage change.' }, { status: 400 });
  }

  const existing = await db.application.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  const canViewB2BForActor = canViewB2B(authRes.data.roles, authRes.data.permissions);
  const isB2bRecord = existing.isB2b === true || existing.isB2bConfidential === true || String(existing.applicationSource || '').toUpperCase().startsWith('B2B_') || String(existing.stage || '').toUpperCase().includes('B2B');
  if (isB2bRecord && !canViewB2BForActor) return NextResponse.json({ success: false, error: 'Forbidden: this application is confidential.' }, { status: 403 });
  if (body.stage && ['SUBMITTED_TO_B2B', 'B2B_SUBMITTED', 'B2B_ACKNOWLEDGED'].includes(body.stage) && !canManageB2B(authRes.data.roles, authRes.data.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B stage transitions require application.manage_b2b permission.' }, { status: 403 });
  }
  const assigned = [existing.counselorId, existing.applicationOfficer, existing.appTeamOfficerId].includes(authRes.data.userId);
  if (!canManageAll && !assigned) {
    return NextResponse.json({ success: false, error: 'Application is not assigned to this account.' }, { status: 403 });
  }

  const { stage, reason, deadlineDate, ...fields } = body;
  const data = {
    ...fields,
    ...(deadlineDate !== undefined ? { deadlineDate: deadlineDate ? new Date(deadlineDate) : null } : {}),
    updatedBy: authRes.data.userId,
  };

  try {
    const updated = await db.$transaction(async (tx) => {
      const transition = stage
        ? await transitionApplicationStage(tx, { applicationId: params.id, toStage: stage, actorId: authRes.data.userId, reason: reason! })
        : null;
      const application = await tx.application.update({ where: { id: params.id }, data });
      await tx.auditLog.create({
        data: {
          userId: authRes.data.userId,
          action: stage ? 'UPDATE_APPLICATION_STAGE' : 'UPDATE_APPLICATION',
          resource: 'Application',
          resourceId: params.id,
          details: JSON.stringify({ changedFields: Object.keys(fields), ...(transition ? { oldStage: transition.previousStage, newStage: transition.stage, reason } : {}) }),
          actorRole: authRes.data.roles[0] || '',
          studentId: existing.studentId,
          beforeValue: JSON.stringify({ stage: existing.stage }),
          afterValue: JSON.stringify({ stage: application.stage }),
        },
      });
      return application;
    });
    const safeUpdated = stripB2BFields(updated as any, canViewB2B(authRes.data.roles, authRes.data.permissions), canViewB2BCommission(authRes.data.roles, authRes.data.permissions));
    return NextResponse.json({ success: true, data: safeUpdated });
  } catch (error) {
    if (error instanceof ApplicationStageTransitionError) {
      const status = error.code === 'NOT_FOUND' ? 404 : error.code === 'INVALID_REASON' ? 400 : ['CONCURRENT_UPDATE', 'DOCUMENTS_NOT_READY'].includes(error.code) ? 409 : 422;
      return NextResponse.json({ success: false, error: error.message, code: error.code }, { status });
    }
    console.error('[application-update] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update application.' }, { status: 500 });
  }
}
