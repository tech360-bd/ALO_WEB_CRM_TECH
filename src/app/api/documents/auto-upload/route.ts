import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateUnified } from '@/lib/unified-auth';
import { storePrivateFile, removePrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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

function roleAllowedForStaff(auth: { userType: string; roles: string[] }): boolean {
  const userType = auth.userType.toUpperCase();
  return ['ADMIN', 'SUPER_ADMIN'].includes(userType) || auth.roles.some((role) => [
    'admin', 'super_admin', 'counselor', 'application_team', 'document_officer', 'visa_officer',
  ].includes(role.toLowerCase()));
}

export async function POST(req: NextRequest) {
  const authResult = await authenticateUnified(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult;

  try {
    const form = await req.formData();
    const file = form.get('file');
    const category = typeof form.get('documentType') === 'string'
      ? String(form.get('documentType')).trim()
      : typeof form.get('category') === 'string' ? String(form.get('category')).trim() : '';
    const requestedStudentId = typeof form.get('studentId') === 'string' ? String(form.get('studentId')).trim() : '';
    const fullApplication = String(form.get('fullApplication') || form.get('createApplication') || '').toLowerCase();

    if (fullApplication === 'true' || fullApplication === '1' || fullApplication === 'yes') {
      return NextResponse.json({ success: false, error: 'Document upload does not create applications. Use the application workflow.' }, { status: 400 });
    }
    if (!(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ success: false, error: 'A non-empty file no larger than 20 MB is required.' }, { status: 400 });
    }
    if (!category || category.length > 80 || !/^[\p{L}\p{N} _()./-]+$/u.test(category)) {
      return NextResponse.json({ success: false, error: 'A valid document category is required.' }, { status: 400 });
    }

    let portalProfile: { id: string; studentId: string; userId: string; partnerId: string; counselorId: string } | null = null;
    let studentRecord: { id: string; studentId: string; userId: string | null; name: string; email: string; status: string; suspended: boolean } | null = null;
    let actorId = auth.type === 'student' ? auth.data.studentId : auth.data.userId;
    let studentId = '';

    if (auth.type === 'student') {
      studentId = auth.data.studentId;
      studentRecord = await db.student.findUnique({ where: { id: studentId }, select: { id: true, studentId: true, userId: true, name: true, email: true, status: true, suspended: true } });
      if (!studentRecord || studentRecord.suspended || studentRecord.status !== 'active') {
        return NextResponse.json({ success: false, error: 'Active student profile not found.' }, { status: 403 });
      }
    } else if (auth.data.userType.toUpperCase() === 'STUDENT') {
      if (requestedStudentId) return NextResponse.json({ success: false, error: 'Student accounts may upload only to their own profile.' }, { status: 403 });
      portalProfile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.data.userId },
        select: { id: true, studentId: true, userId: true, partnerId: true, counselorId: true },
      });
      if (!portalProfile) return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });
      studentId = portalProfile.studentId;
    } else {
      if (!roleAllowedForStaff(auth.data)) return NextResponse.json({ success: false, error: 'Document upload is not permitted.' }, { status: 403 });
      if (!requestedStudentId) return NextResponse.json({ success: false, error: 'studentId is required for staff uploads.' }, { status: 400 });
      portalProfile = await db.portalStudentProfile.findFirst({
        where: { OR: [{ id: requestedStudentId }, { studentId: requestedStudentId }] },
        select: { id: true, studentId: true, userId: true, partnerId: true, counselorId: true },
      });
      if (portalProfile) {
        studentId = portalProfile.studentId;
        if (auth.data.userType.toUpperCase() === 'PARTNER' && (!auth.data.partnerId || portalProfile.partnerId !== auth.data.partnerId)) {
          return NextResponse.json({ success: false, error: 'Access denied to this student.' }, { status: 403 });
        }
        const isCounselor = auth.data.roles.some((role) => role.toLowerCase() === 'counselor');
        if (isCounselor && !['ADMIN', 'SUPER_ADMIN'].includes(auth.data.userType.toUpperCase()) && portalProfile.counselorId !== auth.data.userId) {
          return NextResponse.json({ success: false, error: 'Student is not assigned to this counselor.' }, { status: 403 });
        }
      } else {
        studentRecord = await db.student.findFirst({
          where: { OR: [{ id: requestedStudentId }, { studentId: requestedStudentId }] },
          select: { id: true, studentId: true, userId: true, name: true, email: true, status: true, suspended: true },
        });
        if (!studentRecord) return NextResponse.json({ success: false, error: 'Student not found.' }, { status: 404 });
        studentId = studentRecord.id;
      }
    }

    const fileBytes = Buffer.from(await file.arrayBuffer());
    const detectedMime = detectMime(fileBytes);
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!detectedMime || detectedMime !== EXTENSION_MIME[extension] || (file.type && file.type !== detectedMime)) {
      return NextResponse.json({ success: false, error: 'File content does not match an allowed PDF or image type.' }, { status: 400 });
    }

    const stored = await storePrivateFile(fileBytes, file.name);
    let document: any;
    try {
      document = await db.$transaction(async (tx) => {
        if (portalProfile) {
          const doc = await tx.portalStudentDocument.create({
            data: {
              studentProfileId: portalProfile.id,
              name: file.name.slice(0, 191),
              category,
              fileName: file.name.slice(0, 191),
              storagePath: stored.storagePath,
              mimeType: detectedMime,
              fileHash: stored.fileHash,
              fileSize: stored.fileSize,
              status: 'pending',
              uploadedAt: new Date().toISOString(),
            },
            select: { id: true, name: true, category: true, fileName: true, fileSize: true, status: true, uploadedAt: true, createdAt: true },
          });
          await tx.portalAuditLog.create({
            data: { actorUserId: actorId, action: 'DOCUMENT_UPLOADED', entityType: 'PortalStudentDocument', entityId: doc.id, metadata: JSON.stringify({ studentId, category, fileHash: stored.fileHash }) },
          });
          return doc;
        }

        if (!studentRecord) throw new Error('Student record could not be resolved.');
        const doc = await tx.studentDocument.create({
          data: {
            studentId: studentRecord.id,
            category,
            fileName: file.name.slice(0, 191),
            fileUrl: '',
            storagePath: stored.storagePath,
            mimeType: detectedMime,
            fileHash: stored.fileHash,
            fileSize: stored.fileSize,
            status: 'pending_review',
          },
          select: { id: true, category: true, fileName: true, fileSize: true, status: true, createdAt: true },
        });
        await tx.documentVersion.create({
          data: {
            documentId: doc.id,
            version: 1,
            filePath: stored.storagePath,
            fileSize: stored.fileSize,
            fileType: detectedMime,
            uploadedBy: actorId,
            reviewStatus: 'PENDING',
            isLatest: true,
          },
        });
        await tx.documentAudit.create({
          data: { documentId: doc.id, studentId: studentRecord.id, actorId, actorName: auth.data.name, actorRole: auth.type === 'student' ? 'STUDENT' : auth.data.roles[0] || auth.data.userType, action: 'upload', newStatus: 'pending_review', note: 'File bytes stored privately and queued for review.' },
        });
        await tx.studentEvent.create({
          data: { studentId: studentRecord.id, eventType: 'DOCUMENT_UPLOADED', payload: JSON.stringify({ documentId: doc.id, category, fileHash: stored.fileHash, actorId }) },
        });
        return doc;
      });
    } catch (error) {
      await removePrivateFile(stored.storagePath).catch(() => {});
      throw error;
    }

    return NextResponse.json({
      success: true,
      document: {
        ...document,
        downloadUrl: portalProfile
          ? `/api/student-portal/documents/${document.id}/download`
          : `/api/student/documents/${document.id}/download`,
      },
      studentId,
      fileHash: stored.fileHash,
      message: 'Document bytes were stored privately and queued for review.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Document upload could not be completed.' }, { status: 503 });
  }
}
