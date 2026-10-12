import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { removePrivateFile, storePrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const EXTENSION_MIME: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};

function detectMime(bytes: Buffer): string | null {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  return null;
}

function hasStaffRole(roles: string[], userType: string): boolean {
  const allowed = ['admin', 'super_admin', 'counselor', 'application_team', 'application_manager', 'document_officer', 'visa_officer'];
  return allowed.includes(userType.toLowerCase()) || roles.some((role) => allowed.includes(role.toLowerCase()));
}

export const POST = withAuth(async (req, auth) => {
  if (!hasStaffRole(auth.roles, auth.userType) || auth.userType.toUpperCase() === 'PARTNER') {
    return NextResponse.json({ success: false, error: 'Document upload is not permitted.' }, { status: 403 });
  }
  let form: FormData;
  try { form = await req.formData(); } catch {
    return NextResponse.json({ success: false, error: 'A multipart upload containing the actual file is required.' }, { status: 415 });
  }
  if (['true', '1', 'yes'].includes(String(form.get('fullApplication') || '').toLowerCase())) {
    return NextResponse.json({ success: false, error: 'Document uploads do not create applications. Use the application workflow.' }, { status: 400 });
  }

  const requestedStudentId = String(form.get('studentId') || '').trim();
  const documentType = String(form.get('documentType') || form.get('category') || '').trim();
  const file = form.get('file');
  if (!requestedStudentId || !documentType || documentType.length > 80 || !/^[\p{L}\p{N} _()./-]+$/u.test(documentType) || !(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ success: false, error: 'A student, valid document category, and non-empty file up to 20 MB are required.' }, { status: 400 });
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectMime(bytes);
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!mimeType || EXTENSION_MIME[extension] !== mimeType || (file.type && file.type !== mimeType)) {
    return NextResponse.json({ success: false, error: 'File content does not match an allowed PDF or image type.' }, { status: 400 });
  }

  try {
    const portalProfile = await db.portalStudentProfile.findFirst({
      where: { OR: [{ id: requestedStudentId }, { studentId: requestedStudentId }] },
      select: { id: true, studentId: true, counselorId: true },
    });
    const student = portalProfile ? null : await db.student.findFirst({
      where: { OR: [{ id: requestedStudentId }, { studentId: requestedStudentId }] },
      select: { id: true, studentId: true, counselorId: true, status: true, suspended: true },
    });
    if (!portalProfile && (!student || student.suspended || student.status !== 'active')) {
      return NextResponse.json({ success: false, error: 'Active student profile not found.' }, { status: 404 });
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase()) || auth.roles.some((role) => ['ADMIN', 'SUPER_ADMIN'].includes(role.toUpperCase()));
    const isCounselor = auth.roles.some((role) => role.toUpperCase() === 'COUNSELOR');
    const assignedCounselorId = portalProfile?.counselorId || student?.counselorId || '';
    if (isCounselor && !isAdmin && assignedCounselorId !== auth.userId) {
      return NextResponse.json({ success: false, error: 'Student is not assigned to this counselor.' }, { status: 403 });
    }

    const stored = await storePrivateFile(bytes, file.name);
    try {
      const created = await db.$transaction(async (tx) => {
        if (portalProfile) {
          const document = await tx.portalStudentDocument.create({
            data: {
              studentProfileId: portalProfile.id,
              name: file.name.slice(0, 191),
              category: documentType,
              fileName: file.name.slice(0, 191),
              storagePath: stored.storagePath,
              mimeType,
              fileHash: stored.fileHash,
              fileSize: stored.fileSize,
              status: 'pending',
              uploadedAt: new Date().toISOString(),
              reviewedBy: '',
            },
            select: { id: true, name: true, category: true, fileName: true, fileSize: true, status: true, createdAt: true },
          });
          await tx.portalTimelineEvent.create({
            data: { studentProfileId: portalProfile.id, channel: 'portal', messageType: 'document', content: `A ${documentType} document was uploaded for review.`, senderName: auth.name, senderType: 'employee', visibility: 'student_visible' },
          });
          await tx.portalAuditLog.create({
            data: { actorUserId: auth.userId, action: 'DOCUMENT_UPLOADED_ON_BEHALF', entityType: 'PortalStudentDocument', entityId: document.id, metadata: JSON.stringify({ studentId: portalProfile.studentId, category: documentType, fileHash: stored.fileHash }) },
          });
          return { document, studentId: portalProfile.studentId, kind: 'portal' as const };
        }
        if (!student) throw new Error('Student record not found.');
        const document = await tx.studentDocument.create({
          data: {
            studentId: student.id,
            category: documentType,
            fileName: file.name.slice(0, 191),
            fileUrl: '',
            storagePath: stored.storagePath,
            mimeType,
            fileHash: stored.fileHash,
            fileSize: stored.fileSize,
            status: 'pending_review',
          },
          select: { id: true, category: true, fileName: true, fileSize: true, status: true, version: true, createdAt: true },
        });
        await tx.documentVersion.create({
          data: { documentId: document.id, version: 1, filePath: stored.storagePath, fileSize: stored.fileSize, fileType: mimeType, uploadedBy: auth.userId, reviewStatus: 'PENDING', isLatest: true },
        });
        await tx.documentAudit.create({
          data: { documentId: document.id, studentId: student.id, actorId: auth.userId, actorName: auth.name, actorRole: auth.roles[0] || auth.userType, action: 'upload_on_behalf', newStatus: 'pending_review', note: 'File stored privately and queued for review.' },
        });
        await tx.timelineEvent.create({
          data: { studentId: student.id, stage: 'DOCUMENT_UPLOADED', title: `Document uploaded: ${documentType}`, description: 'A document was uploaded on the student’s behalf and queued for review.', actor: auth.userId },
        });
        return { document, studentId: student.id, kind: 'student' as const };
      });
      return NextResponse.json({ success: true, data: { ...created.document, downloadUrl: created.kind === 'portal' ? `/api/student-portal/documents/${created.document.id}/download` : `/api/student/documents/${created.document.id}/download` }, studentId: created.studentId }, { status: 201 });
    } catch (error) {
      await removePrivateFile(stored.storagePath).catch(() => {});
      throw error;
    }
  } catch {
    return NextResponse.json({ success: false, error: 'Document upload could not be completed.' }, { status: 503 });
  }
});
