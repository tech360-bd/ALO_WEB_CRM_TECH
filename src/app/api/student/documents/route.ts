import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';
import { removePrivateFile, storePrivateFile } from '@/lib/storage/private-file-store';
import { refreshApplicationDocumentStatus } from '@/lib/application-manager/document-readiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};

class VerifiedApplicationDocumentError extends Error {}

function normalizeDocumentCategory(value: string): string {
  const normalized = value.trim().toLowerCase();
  const defaults = ['Passport', 'Academic', 'English', 'SOP', 'CV', 'References'];
  return defaults.find((category) => category.toLowerCase() === normalized) || value.trim();
}

function detectMime(bytes: Buffer): string | null {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  return null;
}

function safeOriginalName(value: string): string | null {
  const name = value.split(/[\\/]/).pop()?.trim() || '';
  if (!name || name.length > 191 || /[\u0000-\u001f]/.test(name)) return null;
  return name;
}

export const GET = withStudentAuth(async (_request, auth) => {
  try {
    const documents = await db.studentDocument.findMany({
      where: { studentId: auth.studentId, isArchived: false },
      select: {
        id: true, category: true, fileName: true, fileSize: true, status: true, version: true,
        previousVersionId: true, reviewedAt: true, createdAt: true, updatedAt: true,
      },
      orderBy: [{ createdAt: 'desc' }, { version: 'desc' }],
      take: 100,
    });
    await db.portalAuditLog.create({
      data: { actorUserId: auth.studentId, action: 'STUDENT_DOCUMENTS_VIEW', entityType: 'StudentDocument', entityId: auth.studentId, metadata: JSON.stringify({ studentId: auth.studentId, count: documents.length }), ipAddress: '', userAgent: '' },
    });
    return NextResponse.json({
      success: true,
      data: documents.map((document) => ({
        ...document,
        uploadedAt: document.createdAt,
        downloadUrl: `/api/student/documents/${document.id}/download`,
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Student documents are temporarily unavailable.' }, { status: 503 });
  }
});

export const POST = withStudentAuth(async (request, auth) => {
  let form: FormData;
  try { form = await request.formData(); } catch {
    return NextResponse.json({ success: false, error: 'Upload actual file bytes using multipart/form-data.' }, { status: 415 });
  }
  const file = form.get('file');
  const categoryInput = String(form.get('documentType') || form.get('category') || '').trim();
  const category = normalizeDocumentCategory(categoryInput);
  if (!(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES || !category || category.length > 80 || /[\u0000-\u001f]/.test(category)) {
    return NextResponse.json({ success: false, error: 'A document type and non-empty file up to 20 MB are required.' }, { status: 400 });
  }
  const fileName = safeOriginalName(file.name);
  if (!fileName) return NextResponse.json({ success: false, error: 'File name is invalid.' }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectMime(bytes);
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  if (!mimeType || MIME_BY_EXTENSION[extension] !== mimeType || (file.type && file.type !== mimeType)) {
    return NextResponse.json({ success: false, error: 'File content does not match an allowed PDF or image type.' }, { status: 400 });
  }

  const stored = await storePrivateFile(bytes, fileName);
  try {
    const document = await db.$transaction(async (tx) => {
      const prior = await tx.studentDocument.findFirst({
        where: { studentId: auth.studentId, category, isArchived: false },
        orderBy: { version: 'desc' },
        select: { id: true, version: true },
      });
      const created = await tx.studentDocument.create({
        data: {
          studentId: auth.studentId,
          category,
          fileName,
          fileUrl: '',
          storagePath: stored.storagePath,
          mimeType,
          fileHash: stored.fileHash,
          fileSize: stored.fileSize,
          status: 'pending_review',
          version: (prior?.version || 0) + 1,
          previousVersionId: prior?.id || '',
        },
        select: { id: true, category: true, fileName: true, fileSize: true, status: true, version: true, createdAt: true },
      });
      await tx.documentAudit.create({
        data: {
          documentId: created.id,
          studentId: auth.studentId,
          actorId: auth.studentId,
          actorName: auth.name,
          actorRole: 'STUDENT',
          action: 'upload',
          previousStatus: '',
          newStatus: 'pending_review',
          note: 'File bytes stored in private storage and queued for review.',
        },
      });
      await tx.studentEvent.create({
        data: { studentId: auth.studentId, eventType: 'DOCUMENT_UPLOADED', payload: JSON.stringify({ documentId: created.id, category, version: created.version, fileHash: stored.fileHash }) },
      });
      await tx.timelineEvent.create({
        data: { studentId: auth.studentId, stage: 'document_uploaded', title: `${category} uploaded`, description: 'File bytes were stored privately and queued for review.', actor: auth.studentId },
      });

      const applications = await tx.application.findMany({ where: { studentId: auth.studentId }, select: { id: true } });
      for (const application of applications) {
        const priorVersions = await tx.applicationDocument.findMany({
          where: { applicationId: application.id, documentType: category },
          select: { id: true, version: true, status: true },
          orderBy: { version: 'desc' },
        });
        const currentVersion = priorVersions.find((row) => row.status !== 'SUPERSEDED');
        if (currentVersion && ['VERIFIED', 'LOCKED'].includes(currentVersion.status.toUpperCase())) {
          throw new VerifiedApplicationDocumentError('A verified application document cannot be replaced without staff approval.');
        }
        await tx.applicationDocument.updateMany({
          where: { applicationId: application.id, documentType: category, status: { notIn: ['VERIFIED', 'LOCKED', 'SUPERSEDED'] } },
          data: { status: 'SUPERSEDED' },
        });
        const version = Math.max(0, ...priorVersions.map((row) => row.version)) + 1;
        await tx.applicationDocument.create({
          data: {
            applicationId: application.id,
            studentId: auth.studentId,
            documentId: created.id,
            documentType: category,
            fileName,
            fileUrl: '',
            status: 'UPLOADED',
            visibility: 'student_visible',
            version,
          },
        });
        await refreshApplicationDocumentStatus(tx, application.id);
      }
      return created;
    });
    return NextResponse.json({
      success: true,
      data: { ...document, downloadUrl: `/api/student/documents/${document.id}/download` },
      message: 'Document bytes were stored privately and queued for review.',
    }, { status: 201 });
  } catch (error) {
    await removePrivateFile(stored.storagePath).catch(() => {});
    if (error instanceof VerifiedApplicationDocumentError) {
      return NextResponse.json({ success: false, error: error.message, code: 'VERIFIED_DOCUMENT_IMMUTABLE' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Document upload could not be completed.' }, { status: 503 });
  }
});
