import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { readPrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  const partner = await db.partnerProfile.findUnique({ where: { userId: auth.userId }, select: { partnerId: true } });
  if (!partner) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
  const { id } = await params;
  const document = await db.portalStudentDocument.findFirst({
    where: { id, studentProfile: { partnerId: partner.partnerId } },
    select: { id: true, fileName: true, storagePath: true, mimeType: true, fileHash: true },
  });
  if (!document?.storagePath || !document.mimeType || !document.fileHash) {
    return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
  }

  try {
    const bytes = await readPrivateFile(document.storagePath);
    if (createHash('sha256').update(bytes).digest('hex') !== document.fileHash.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Stored document integrity check failed.' }, { status: 500 });
    }
    const allowedMime = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']);
    const contentType = allowedMime.has(document.mimeType) ? document.mimeType : 'application/octet-stream';
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.userId,
        action: 'PARTNER_DOCUMENT_DOWNLOADED',
        entityType: 'PortalStudentDocument',
        entityId: document.id,
        metadata: JSON.stringify({ fileHash: document.fileHash }),
      },
    });
    const headers = new Headers({
      'Content-Type': contentType,
      'Content-Length': String(bytes.length),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.fileName || 'document')}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Document is unavailable from private storage.' }, { status: 503 });
  }
}
