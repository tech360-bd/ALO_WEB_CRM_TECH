import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateUnified, type UnifiedAuthContext } from '@/lib/unified-auth';
import { removePrivateFile, storePrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const EXTENSION_MIME: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};

function isStudentActor(auth: UnifiedAuthContext): boolean {
  return auth.type === 'student' || auth.data.userType.toUpperCase() === 'STUDENT' || auth.data.roles.some((role) => role.toUpperCase() === 'STUDENT');
}

function isAdmin(auth: UnifiedAuthContext): boolean {
  return auth.type === 'portal' && (
    ['ADMIN', 'SUPER_ADMIN'].includes(auth.data.userType.toUpperCase()) ||
    auth.data.roles.some((role) => ['ADMIN', 'SUPER_ADMIN'].includes(role.toUpperCase()))
  );
}

function hasAnyRole(auth: UnifiedAuthContext, roles: string[]): boolean {
  return auth.type === 'portal' && (
    isAdmin(auth) ||
    auth.data.roles.some((role) => roles.includes(role.toUpperCase())) ||
    roles.includes(auth.data.userType.toUpperCase())
  );
}

function canManageDocuments(auth: UnifiedAuthContext): boolean {
  return hasAnyRole(auth, ['COUNSELOR', 'APPLICATION_TEAM', 'APPLICATION_MANAGER', 'APPLICATION_OFFICER', 'DOCUMENT_OFFICER', 'VISA_OFFICER', 'FRONT_DESK']);
}

function actorId(auth: UnifiedAuthContext): string | null {
  return auth.type === 'portal' ? auth.data.userId : auth.data.studentId;
}

async function studentOwnedBy(auth: UnifiedAuthContext, studentId: string) {
  const student = await db.student.findUnique({ where: { id: studentId }, select: { id: true, userId: true, counselorId: true } });
  if (!student) return null;
  if (isStudentActor(auth)) {
    if (auth.type === 'student') return student.id === auth.data.studentId ? student : null;
    if (auth.type === 'portal') return student.userId === auth.data.userId ? student : null;
    return null;
  }
  if (auth.type !== 'portal') return null;
  if (auth.data.userType.toUpperCase() === 'PARTNER' || auth.data.roles.some((role) => role.toUpperCase().startsWith('PARTNER'))) return null;
  if (!canManageDocuments(auth)) return null;
  const counselorActor = auth.data.userType.toUpperCase() === 'COUNSELOR' || auth.data.roles.some((role) => role.toUpperCase() === 'COUNSELOR');
  if (!isAdmin(auth) && counselorActor && student.counselorId !== auth.data.userId) return null;
  return student;
}

function detectMime(bytes: Buffer): string | null {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  return null;
}

export async function GET(req: NextRequest) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;
  const requestedStudentId = req.nextUrl.searchParams.get('studentId');
  const where: any = {};

  if (isStudentActor(auth)) {
    let ownStudentId = auth.type === 'student' ? auth.data.studentId : null;
    if (!ownStudentId && auth.type === 'portal') {
      const own = await db.student.findFirst({ where: { userId: auth.data.userId }, select: { id: true } });
      ownStudentId = own?.id || null;
    }
    if (!ownStudentId) return NextResponse.json({ documents: [] });
    if (requestedStudentId && requestedStudentId !== ownStudentId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    where.studentId = ownStudentId;
  } else {
    if (auth.type !== 'portal') return NextResponse.json({ error: 'Document access is not permitted.' }, { status: 403 });
    if (!canManageDocuments(auth) || auth.data.userType.toUpperCase() === 'PARTNER' || auth.data.roles.some((role) => role.toUpperCase().startsWith('PARTNER'))) {
      return NextResponse.json({ error: 'Document access is not permitted.' }, { status: 403 });
    }
    if (requestedStudentId) {
      const student = await studentOwnedBy(auth, requestedStudentId);
      if (!student) return NextResponse.json({ error: 'Student not found or access denied.' }, { status: 404 });
      where.studentId = student.id;
    } else if (!isAdmin(auth) && (auth.data.userType.toUpperCase() === 'COUNSELOR' || auth.data.roles.some((role) => role.toUpperCase() === 'COUNSELOR'))) {
      const assignedStudents = await db.student.findMany({ where: { counselorId: auth.data.userId }, select: { id: true } });
      where.studentId = { in: assignedStudents.map((student) => student.id) };
    }
  }

  try {
    const documents = await db.document.findMany({
      where,
      select: {
        id: true, studentId: true, category: true, name: true, required: true, status: true,
        fileName: true, fileType: true, fileSize: true, rejectionReason: true, reviewedAt: true,
        uploadedAt: true, reviewedById: true, createdAt: true, updatedAt: true,
        student: { select: { id: true, studentId: true, name: true } },
      },
      orderBy: [{ studentId: 'asc' }, { category: 'asc' }],
      take: 500,
    });
    return NextResponse.json({ documents: documents.map((document) => ({
      ...document,
      student: { ...document.student, fullName: document.student.name },
      downloadUrl: `/api/documents/${document.id}/download`,
    })) });
  } catch {
    return NextResponse.json({ error: 'Documents are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.type !== 'portal') return NextResponse.json({ error: 'Staff document upload is not permitted.' }, { status: 403 });
  if (isStudentActor(auth) || !canManageDocuments(auth) || auth.data.userType.toUpperCase() === 'PARTNER') {
    return NextResponse.json({ error: 'Staff document upload is not permitted.' }, { status: 403 });
  }

  let form: FormData;
  try { form = await req.formData(); } catch {
    return NextResponse.json({ error: 'A multipart form upload with the actual file bytes is required.' }, { status: 415 });
  }
  const studentId = String(form.get('studentId') || '').trim();
  const category = String(form.get('category') || '').trim();
  const name = String(form.get('name') || '').trim();
  const file = form.get('file');
  const requiredRaw = form.get('required');
  const required = requiredRaw === 'true' || requiredRaw === '1';

  if (!studentId || !category || category.length > 80 || !/^[A-Z0-9_]+$/.test(category) || !(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'Valid student, category, and non-empty file up to 20 MB are required.' }, { status: 400 });
  }
  if (name.length > 191 || (name && /[\u0000-\u001f]/.test(name))) {
    return NextResponse.json({ error: 'Document name is invalid.' }, { status: 400 });
  }
  const student = await studentOwnedBy(auth, studentId);
  if (!student) return NextResponse.json({ error: 'Student not found or access denied.' }, { status: 404 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectMime(bytes);
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  if (!mimeType || EXTENSION_MIME[extension] !== mimeType || (file.type && file.type !== mimeType)) {
    return NextResponse.json({ error: 'File content does not match an allowed PDF or image type.' }, { status: 400 });
  }

  const stored = await storePrivateFile(bytes, file.name);
  const actor = actorId(auth) || '';
  try {
    const document = await db.$transaction(async (tx) => {
      const created = await tx.document.create({
        data: {
          studentId: student.id,
          category,
          name: name || category,
          required,
          fileName: file.name.slice(0, 191),
          fileType: mimeType,
          mimeType,
          fileHash: stored.fileHash,
          fileSize: stored.fileSize,
          storagePath: stored.storagePath,
          status: 'UPLOADED',
          uploadedAt: new Date(),
          reviewedById: null,
        },
      });
      await tx.timelineEvent.create({ data: { studentId: student.id, stage: 'document_uploaded', title: `${created.name} uploaded`, description: 'Document bytes were stored in private storage and queued for review.', actor } });
      await tx.auditLog.create({ data: { userId: actor, action: 'DOC_UPLOAD', resource: 'Document', resourceId: created.id, details: JSON.stringify({ category, studentId: student.id, fileHash: stored.fileHash }) } });
      return created;
    });
    return NextResponse.json({ document: { ...document, downloadUrl: `/api/documents/${document.id}/download` }, message: 'Document bytes were stored privately and queued for review.' }, { status: 201 });
  } catch {
    await removePrivateFile(stored.storagePath).catch(() => {});
    return NextResponse.json({ error: 'Document upload could not be completed.' }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.type !== 'portal') return NextResponse.json({ error: 'Only authorized staff can review documents.' }, { status: 403 });
  if (isStudentActor(auth) || !canManageDocuments(auth) || auth.data.userType.toUpperCase() === 'PARTNER') {
    return NextResponse.json({ error: 'Only authorized staff can review documents.' }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  const status = typeof body?.status === 'string' ? body.status.toUpperCase() : '';
  const rejectionReason = typeof body?.rejectionReason === 'string' ? body.rejectionReason.trim() : '';
  if (!id || !['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
    return NextResponse.json({ error: 'A document id and supported review status are required.' }, { status: 400 });
  }
  if (status === 'REJECTED' && (!rejectionReason || rejectionReason.length > 1000)) {
    return NextResponse.json({ error: 'A rejection reason of at most 1000 characters is required.' }, { status: 400 });
  }
  try {
    const doc = await db.document.findUnique({ where: { id }, select: { id: true, studentId: true, name: true } });
    if (!doc) return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    const student = await studentOwnedBy(auth, doc.studentId);
    if (!student) return NextResponse.json({ error: 'Document review is not permitted for this student.' }, { status: 403 });
    const reviewer = actorId(auth) || '';
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.document.update({
        where: { id },
        data: { status, rejectionReason: status === 'REJECTED' ? rejectionReason : '', reviewedById: reviewer, reviewedAt: new Date() },
      });
      const approved = status === 'APPROVED';
      const stage = approved ? 'document_approved' : status === 'REJECTED' ? 'document_rejected' : 'document_status_updated';
      await tx.timelineEvent.create({ data: { studentId: doc.studentId, stage, title: `${doc.name} status updated`, description: status === 'REJECTED' ? rejectionReason : `Document status changed to ${status}.`, actor: reviewer } });
      await tx.auditLog.create({ data: { userId: reviewer, action: approved ? 'DOC_APPROVE' : status === 'REJECTED' ? 'DOC_REJECT' : 'DOC_REVIEW', resource: 'Document', resourceId: id, details: JSON.stringify({ status, rejectionReason: status === 'REJECTED' ? rejectionReason : undefined }) } });
      return result;
    });
    return NextResponse.json({ document: updated });
  } catch {
    return NextResponse.json({ error: 'Document review could not be completed.' }, { status: 503 });
  }
}
