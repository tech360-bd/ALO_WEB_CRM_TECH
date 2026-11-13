import { z } from 'zod';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { canViewB2B, canViewB2BCommission, filterDocumentsByVisibility } from '@/lib/application-manager/service';
import { nextDocumentVersion } from '@/lib/documents/document-rejection';
import { refreshApplicationDocumentStatus } from '@/lib/application-manager/document-readiness';

const uploadSchema = z.object({
  documentType: z.string().trim().min(1).max(80),
  documentId: z.string().max(191).optional(),
  status: z.enum(['REQUIRED', 'UPLOADED', 'PENDING', 'STUDENT_SUBMITTED']).optional(),
  fileName: z.string().max(191).optional(),
  visibility: z.enum(['student_visible', 'partner_visible', 'internal', 'b2b_confidential']).optional(),
  isB2bConfidential: z.boolean().optional(),
  supersedeVerified: z.boolean().optional(),
  supersedeReason: z.string().trim().max(180).optional(),
}).strict();

function portalIsPartner(auth: { partnerId?: string; userType: string; roles: string[] }) {
  const roles = auth.roles.map((role) => role.toLowerCase());
  return Boolean(auth.partnerId || auth.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner')));
}

function portalIsStudent(auth: { userType: string; roles: string[] }) {
  const roles = auth.roles.map((role) => role.toLowerCase());
  return auth.userType.toLowerCase() === 'student' || roles.includes('student');
}

async function resolveOwnStudentId(userId: string): Promise<string | null> {
  const [student, profile] = await Promise.all([
    db.student.findFirst({ where: { userId }, select: { id: true } }),
    db.portalStudentProfile.findFirst({ where: { userId }, select: { studentId: true } }),
  ]);
  return student?.id || profile?.studentId || null;
}

async function isAssignedApplicationStaff(auth: { userId: string; roles: string[]; permissions: string[] }, application: any): Promise<boolean> {
  const roles = auth.roles.map((role) => role.toLowerCase());
  if (roles.includes('counselor') && application.counselorId === auth.userId) return true;
  if (roles.some((role) => ['application_officer', 'document_officer'].includes(role)) &&
      [application.applicationOfficer, application.appTeamOfficerId].includes(auth.userId)) return true;
  if (roles.includes('visa_officer')) {
    if (application.visaOfficerId === auth.userId) return true;
    const visaCase = await db.visaCase.findFirst({ where: { applicationId: application.id, visaOfficerId: auth.userId }, select: { id: true } });
    if (visaCase) return true;
  }
  return auth.permissions.includes('application.view_assigned') &&
    [application.counselorId, application.applicationOfficer, application.appTeamOfficerId, application.visaOfficerId].includes(auth.userId);
}

export const GET = withAuth(async (_req, auth, { params }: any) => {
  const isPartner = portalIsPartner(auth);
  const isStudent = portalIsStudent(auth);
  const roles = auth.roles.map((role) => role.toLowerCase());
  const isManager = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.view_all');
  if (isPartner && !auth.partnerId) return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });

  const ownStudentId = isStudent ? await resolveOwnStudentId(auth.userId) : null;
  if (isStudent && !ownStudentId) return NextResponse.json({ success: false, error: 'Student profile is not linked to this account.' }, { status: 403 });
  const canAttemptAssignedView = roles.some((role) => ['counselor', 'application_officer', 'document_officer', 'visa_officer'].includes(role)) || auth.permissions.includes('application.view_assigned');
  if (!isManager && !isPartner && !isStudent && !canAttemptAssignedView) {
    return NextResponse.json({ success: false, error: 'Application document view permission required.' }, { status: 403 });
  }

  const app = await db.application.findFirst({ where: {
    id: params.id,
    ...(isPartner ? { partnerId: auth.partnerId } : {}),
    ...(isStudent ? { studentId: ownStudentId! } : {}),
  } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  if (!isManager && !isPartner && !isStudent && !(await isAssignedApplicationStaff(auth, app))) {
    return NextResponse.json({ success: false, error: 'Application is not assigned to this account.' }, { status: 403 });
  }

  const docs = await db.applicationDocument.findMany({ where: { applicationId: params.id }, orderBy: { createdAt: 'desc' } });
  const canViewB2BFlag = canViewB2B(auth.roles, auth.permissions);
  const canViewCommission = canViewB2BCommission(auth.roles, auth.permissions);
  let visible = filterDocumentsByVisibility(docs, canViewB2BFlag);
  if (isPartner) visible = visible.filter((document) => document.visibility === 'partner_visible');
  if (isStudent) visible = visible.filter((document) => document.visibility === 'student_visible' && !document.isB2bConfidential);

  const data = visible.map((document) => {
    if (isPartner) {
      const { reviewerId: _reviewerId, reviewerNote: _reviewerNote, fileUrl: _fileUrl, documentId: _documentId, studentId: _studentId, isB2bConfidential: _confidential, ...safe } = document as any;
      return { ...safe, fileUrl: '', downloadUrl: null };
    }
    if (isStudent) {
      return {
        id: document.id,
        applicationId: document.applicationId,
        documentType: document.documentType,
        fileName: document.fileName,
        status: document.status,
        visibility: document.visibility,
        version: document.version,
        fileUrl: '',
        downloadUrl: document.documentId ? `/api/student/documents/${document.documentId}/download` : null,
      };
    }
    return {
      ...document,
      fileUrl: '',
      downloadUrl: typeof document.documentId === 'string' && document.documentId
        ? `/api/visa/documents/${document.documentId}/download`
        : null,
    };
  });
  try {
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'VIEW_APPLICATION_DOCUMENTS',
        resource: 'Application',
        resourceId: app.id,
        details: JSON.stringify({ documentCount: data.length, documentIds: data.map((document: any) => document.id), accessType: isStudent ? 'STUDENT_OWN' : isPartner ? 'PARTNER_SCOPED' : 'STAFF' }),
        actorRole: auth.roles[0] || '',
        studentId: app.studentId,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Document access could not be audited; retry after service recovery.' }, { status: 503 });
  }
  return NextResponse.json({ success: true, data, documents: data, total: data.length, hidden: docs.length - data.length, canViewB2B: canViewB2BFlag, canViewCommission });
});

export const POST = withAuth(async (req, auth, { params }: any) => {
  const parsed = uploadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid application document request', details: parsed.error.flatten() }, { status: 400 });
  const body = parsed.data;
  const roles = auth.roles.map((role) => role.toLowerCase());
  const isPartner = portalIsPartner(auth);
  const isStudent = portalIsStudent(auth);
  if (isStudent) return NextResponse.json({ success: false, error: 'Students must upload documents through the private student-document workflow.' }, { status: 403 });
  if (isPartner && !auth.partnerId) return NextResponse.json({ success: false, error: 'Partner identity is not linked to this account.' }, { status: 403 });
  const canManageRequirements = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || auth.permissions.includes('application.manage_documents');
  if (body.status === 'REQUIRED' && !canManageRequirements) return NextResponse.json({ success: false, error: 'Only application staff may add a document requirement.' }, { status: 403 });
  const requestsB2bConfidential = body.isB2bConfidential === true || body.visibility === 'b2b_confidential';
  if (requestsB2bConfidential && !canViewB2B(auth.roles, auth.permissions)) return NextResponse.json({ success: false, error: 'Forbidden: B2B confidential document requires permission' }, { status: 403 });
  if (isPartner && requestsB2bConfidential) return NextResponse.json({ success: false, error: 'Partner submissions cannot mark documents ALO-side B2B confidential.' }, { status: 403 });
  const canUpload = auth.permissions.includes('application.upload_documents') || roles.some((role) => ['counselor', 'application_officer', 'document_officer'].includes(role));
  if (!canManageRequirements && !isPartner && !canUpload) {
    return NextResponse.json({ success: false, error: 'Forbidden: application.upload_documents permission required' }, { status: 403 });
  }

  const app = await db.application.findFirst({ where: { id: params.id, ...(isPartner ? { partnerId: auth.partnerId } : {}) } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
  if (!canManageRequirements && !isPartner && !(await isAssignedApplicationStaff(auth, app))) {
    return NextResponse.json({ success: false, error: 'Application is not assigned to this account.' }, { status: 403 });
  }

  let linkedStudentDocument: { id: string; fileName: string; status: string; reviewedBy: string; reviewerNote: string; storagePath: string | null; mimeType: string | null; fileHash: string | null } | null = null;
  if (body.documentId) {
    linkedStudentDocument = await db.studentDocument.findFirst({
      where: { id: body.documentId, studentId: app.studentId, isArchived: false },
      select: { id: true, fileName: true, status: true, reviewedBy: true, reviewerNote: true, storagePath: true, mimeType: true, fileHash: true },
    });
    if (!linkedStudentDocument?.storagePath || !linkedStudentDocument.mimeType || !linkedStudentDocument.fileHash) return NextResponse.json({ success: false, error: 'A linked private student document with stored bytes is required.' }, { status: 404 });
  } else if (body.status !== 'REQUIRED') {
    return NextResponse.json({ success: false, error: 'Document bytes must be stored through the private upload workflow and linked by documentId.' }, { status: 400 });
  }

  const normalizedStatus = linkedStudentDocument
    ? ['approved', 'verified'].includes(linkedStudentDocument.status.toLowerCase())
      ? 'VERIFIED'
      : ['rejected', 'needs_update'].includes(linkedStudentDocument.status.toLowerCase())
        ? 'REJECTED'
        : 'UPLOADED'
    : 'REQUIRED';
  if (linkedStudentDocument && body.status === 'REQUIRED') return NextResponse.json({ success: false, error: 'A linked upload cannot be marked as a missing requirement.' }, { status: 400 });

  try {
    const doc = await db.$transaction(async (tx) => {
      const priorVersions = await tx.applicationDocument.findMany({
        where: { applicationId: params.id, documentType: body.documentType },
        select: { id: true, version: true, status: true },
        orderBy: { version: 'desc' },
      });
      const verifiedPrior = priorVersions.find((document) => ['VERIFIED', 'LOCKED'].includes(document.status.toUpperCase()));
      if (verifiedPrior) {
        const privileged = roles.some((role) => ['super_admin', 'admin', 'application_manager'].includes(role)) || auth.permissions.includes('application.supersede_verified_document');
        if (!body.supersedeVerified || !privileged || !body.supersedeReason) {
          throw new Error('VERIFIED_IMMUTABLE');
        }
      }
      if (priorVersions.length > 0) {
        await tx.applicationDocument.updateMany({
          where: {
            applicationId: params.id,
            documentType: body.documentType,
            ...(verifiedPrior ? { status: { notIn: ['SUPERSEDED'] } } : { status: { notIn: ['VERIFIED', 'LOCKED', 'SUPERSEDED'] } }),
          },
          data: { status: 'SUPERSEDED' },
        });
      }
      const version = nextDocumentVersion(priorVersions.map((document) => document.version));
      const created = await tx.applicationDocument.create({
        data: {
          applicationId: params.id,
          studentId: app.studentId,
          documentId: linkedStudentDocument?.id || '',
          documentType: body.documentType,
          fileName: linkedStudentDocument?.fileName || body.fileName || '',
          fileUrl: '',
          status: normalizedStatus,
          reviewerId: linkedStudentDocument?.reviewedBy || '',
          reviewerNote: linkedStudentDocument?.reviewerNote || body.supersedeReason || '',
          visibility: isPartner ? 'partner_visible' : body.visibility || 'internal',
          version,
          isB2bConfidential: requestsB2bConfidential,
        },
      });
      await refreshApplicationDocumentStatus(tx, params.id);
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'LINK_APPLICATION_DOCUMENT',
          resource: 'ApplicationDocument',
          resourceId: created.id,
          details: JSON.stringify({ applicationId: params.id, documentType: body.documentType, version, documentId: linkedStudentDocument?.id || null, supersedeReason: body.supersedeReason || null }),
          actorRole: auth.roles[0] || '',
          studentId: app.studentId,
        },
      });
      return created;
    });
    const safeDocument = isPartner
      ? { id: doc.id, applicationId: doc.applicationId, documentType: doc.documentType, fileName: doc.fileName, status: doc.status, visibility: doc.visibility, version: doc.version }
      : { ...doc, fileUrl: '', downloadUrl: doc.documentId ? `/api/visa/documents/${doc.documentId}/download` : null };
    return NextResponse.json({ success: true, data: safeDocument, document: safeDocument });
  } catch (error) {
    if (error instanceof Error && error.message === 'VERIFIED_IMMUTABLE') {
      return NextResponse.json({ success: false, code: 'VERIFIED_IMMUTABLE', error: 'A VERIFIED document cannot be overwritten without an authorized supersede reason.' }, { status: 409 });
    }
    console.error('[application-document-link] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to update application documents.' }, { status: 500 });
  }
});
