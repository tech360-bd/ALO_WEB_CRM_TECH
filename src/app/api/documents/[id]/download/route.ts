import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateUnified, type UnifiedAuthContext } from '@/lib/unified-auth';
import { readPrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isStudentActor(auth: UnifiedAuthContext): boolean {
  return auth.type === 'student' || auth.data.userType.toUpperCase() === 'STUDENT' || auth.data.roles.some((role) => role.toUpperCase() === 'STUDENT');
}

function isAdmin(auth: UnifiedAuthContext): boolean {
  return auth.type === 'portal' && (
    ['ADMIN', 'SUPER_ADMIN'].includes(auth.data.userType.toUpperCase()) ||
    auth.data.roles.some((role) => ['ADMIN', 'SUPER_ADMIN'].includes(role.toUpperCase()))
  );
}

function canManage(auth: UnifiedAuthContext): boolean {
  return auth.type === 'portal' && (
    isAdmin(auth) ||
    auth.data.roles.some((role) => ['COUNSELOR', 'APPLICATION_TEAM', 'APPLICATION_MANAGER', 'APPLICATION_OFFICER', 'DOCUMENT_OFFICER', 'VISA_OFFICER', 'FRONT_DESK'].includes(role.toUpperCase())) ||
    auth.data.permissions.some((permission) => ['document.view_private', 'application.view_offer', 'application.manage_offer', 'application.manage_cas_i20_coe'].includes(permission))
  );
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const document = await db.document.findUnique({
    where: { id },
    include: { student: { select: { id: true, userId: true, counselorId: true } } },
  });
  if (!document?.storagePath || !document.mimeType || !document.fileHash) {
    return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
  }

  if (isStudentActor(auth)) {
    const ownsDocument = auth.type === 'student'
      ? document.studentId === auth.data.studentId
      : document.student.userId === auth.data.userId;
    if (!ownsDocument) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
  } else {
    if (auth.type !== 'portal') return NextResponse.json({ success: false, error: 'Document access is not permitted.' }, { status: 403 });
    const partnerActor = auth.data.userType.toUpperCase() === 'PARTNER' || auth.data.roles.some((role) => role.toUpperCase().startsWith('PARTNER'));
    if (partnerActor || !canManage(auth)) return NextResponse.json({ success: false, error: 'Document access is not permitted.' }, { status: 403 });
    const isAssignedCounselor = !isAdmin(auth)
      && auth.data.roles.some((role) => role.toUpperCase() === 'COUNSELOR')
      && document.student.counselorId === auth.data.userId;
    if (!isAdmin(auth) && !isAssignedCounselor && auth.data.roles.some((role) => role.toUpperCase() === 'COUNSELOR')) {
      return NextResponse.json({ success: false, error: 'Document access is not permitted.' }, { status: 403 });
    }
  }

  try {
    const bytes = await readPrivateFile(document.storagePath);
    if (createHash('sha256').update(bytes).digest('hex') !== document.fileHash) {
      return NextResponse.json({ success: false, error: 'Stored document integrity check failed.' }, { status: 500 });
    }
    const actor = auth.type === 'student' ? auth.data.studentId : auth.data.userId;
    await db.$transaction(async (tx) => {
      await tx.timelineEvent.create({ data: { studentId: document.studentId, stage: 'document_downloaded', title: 'Document downloaded', description: `Document ${document.id} was downloaded.`, actor } });
      await tx.auditLog.create({ data: { userId: actor, action: 'DOC_DOWNLOAD', resource: 'Document', resourceId: document.id, details: JSON.stringify({ studentId: document.studentId }) } });
    });
    const fileName = document.fileName || 'document';
    const headers = new Headers({
      'Content-Type': document.mimeType,
      'Content-Length': String(bytes.length),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Document is not available from private storage.' }, { status: 503 });
  }
}
