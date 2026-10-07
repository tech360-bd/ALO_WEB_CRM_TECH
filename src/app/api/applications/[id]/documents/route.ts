import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { canViewB2B, filterDocumentsByVisibility } from '@/lib/application-manager/service';
import { nextDocumentVersion } from '@/lib/documents/document-rejection';

export const GET = withAuth(async (req, auth, { params }: any) => {
  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  const docs = await db.applicationDocument.findMany({ where: { applicationId: params.id }, orderBy: { createdAt: 'desc' } });

  const canViewB2BFlag = canViewB2B(auth.roles, auth.permissions);
  const filtered = filterDocumentsByVisibility(docs, canViewB2BFlag);

  return NextResponse.json({ success: true, data: filtered, documents: filtered, total: docs.length, hidden: docs.length - filtered.length });
});

export const POST = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  if (!body.documentType) return NextResponse.json({ success: false, error: 'documentType required' }, { status: 400 });

  const validStatuses = ['REQUIRED', 'UPLOADED', 'MISSING', 'REJECTED', 'EXPIRED', 'UNDER_REVIEW', 'VERIFIED', 'LOCKED', 'REQUEST_AGAIN', 'PENDING', 'STUDENT_SUBMITTED', 'SUPERSEDED'];
  if (body.status && !validStatuses.includes(body.status)) {
    return NextResponse.json({ success: false, error: `Invalid status. Must be one of ${validStatuses.join(', ')}` }, { status: 400 });
  }

  if (body.isB2bConfidential && !canViewB2B(auth.roles, auth.permissions)) {
    return NextResponse.json({ success: false, error: 'Forbidden: B2B confidential document requires permission' }, { status: 403 });
  }

  const app = await db.application.findUnique({ where: { id: params.id } });
  if (!app) return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });

  // §136 — the requirement stays ONE requirement: every upload for the same
  // (applicationId, documentType) is a new VERSION of it, computed server-side
  // (the client never supplies the version number).
  const priorVersions = await db.applicationDocument.findMany({
    where: { applicationId: params.id, documentType: body.documentType },
    select: { id: true, version: true, status: true },
  });
  const verifiedPrior = priorVersions.find((d) => ['VERIFIED', 'LOCKED'].includes(d.status));
  if (verifiedPrior) {
    // §137 — verified documents are immutable; replacement goes through the
    // explicit supersede workflow (authorized role + recorded reason).
    const privileged = auth.roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'APPLICATION_MANAGER'].includes(String(r).toUpperCase()));
    const reason = String(body.supersedeReason || '').trim();
    if (!body.supersedeVerified || !privileged || !reason) {
      return NextResponse.json(
        {
          success: false,
          code: 'VERIFIED_IMMUTABLE',
          error:
            'A VERIFIED document already exists for this requirement and cannot be overwritten. ' +
            'To correct it, submit again with supersedeVerified=true together with a recorded ' +
            'supersedeReason (authorized role required).',
          existingVersion: verifiedPrior.version,
        },
        { status: 409 },
      );
    }
  }
  const version = nextDocumentVersion(priorVersions.map((d) => d.version));

  // §136/§137 — older versions become SUPERSEDED: the newest is the only
  // ACTIVE version, and every old version stays stored and auditable.
  if (priorVersions.length > 0) {
    await db.applicationDocument.updateMany({
      where: {
        applicationId: params.id,
        documentType: body.documentType,
        ...(verifiedPrior ? {} : { status: { notIn: ['VERIFIED', 'LOCKED'] } }),
      },
      data: { status: 'SUPERSEDED' },
    });
  }

  const doc = await db.applicationDocument.create({
    data: {
      applicationId: params.id,
      studentId: app.studentId,
      documentId: body.documentId || '',
      documentType: body.documentType,
      fileName: body.fileName || '',
      fileUrl: body.fileUrl || '',
      status: body.status || 'UPLOADED',
      reviewerId: '',
      reviewerNote: body.reviewerNote || '',
      visibility: body.visibility || 'internal',
      version,
      isB2bConfidential: body.isB2bConfidential || false,
    },
  });

  await logAuditAction(auth, 'UPLOAD_DOCUMENT', 'ApplicationDocument', doc.id);
  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: 'UPLOAD_DOCUMENT',
      resource: 'ApplicationDocument',
      resourceId: doc.id,
      details: JSON.stringify({ applicationId: params.id, documentType: body.documentType }),
      actorRole: auth.roles[0] || '',
      studentId: app.studentId,
    },
  });

  return NextResponse.json({ success: true, data: doc, document: doc });
});
