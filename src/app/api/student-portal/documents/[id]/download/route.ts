import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { readPrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.userType.toUpperCase() !== 'STUDENT') {
    return NextResponse.json({ success: false, error: 'Student account required.' }, { status: 403 });
  }
  const { id } = await params;
  const profile = await db.portalStudentProfile.findUnique({ where: { userId: auth.userId }, select: { id: true } });
  if (!profile) return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });
  const document = await db.portalStudentDocument.findFirst({
    where: { id, studentProfileId: profile.id },
    select: { id: true, fileName: true, storagePath: true, mimeType: true, fileHash: true, status: true },
  });
  if (!document?.storagePath || !document.mimeType || !document.fileHash) {
    return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
  }

  try {
    const bytes = await readPrivateFile(document.storagePath);
    if (createHash('sha256').update(bytes).digest('hex') !== document.fileHash) {
      return NextResponse.json({ success: false, error: 'Stored document integrity check failed.' }, { status: 500 });
    }
    await db.portalAuditLog.create({
      data: { actorUserId: auth.userId, action: 'STUDENT_DOWNLOAD_DOCUMENT', entityType: 'PortalStudentDocument', entityId: document.id, metadata: JSON.stringify({ status: document.status }) },
    });
    const headers = new Headers({
      'Content-Type': document.mimeType,
      'Content-Length': String(bytes.length),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName || 'document')}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Document is not available from private storage.' }, { status: 503 });
  }
}
