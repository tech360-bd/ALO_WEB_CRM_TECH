import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { readPrivateFile } from '@/lib/storage/private-file-store';
import { canAccessUccDocumentConversation, canUseUccDocuments, canViewUccB2B } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function safeFilename(value: string): string {
  const name = value.split(/[\\/]/).pop()?.replace(/[\r\n\0]/g, '').trim();
  return (name || 'document').slice(0, 191);
}

function metadataFor(attachment: { ocrExtractedData: string; fileUrl: string; fileName: string }) {
  let metadata: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(attachment.ocrExtractedData || '{}');
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) metadata = parsed;
  } catch { /* malformed/legacy metadata cannot grant access */ }
  let storagePath = typeof metadata.storagePath === 'string' ? metadata.storagePath : '';
  if (!storagePath) {
    try {
      const url = new URL(attachment.fileUrl, 'https://private.invalid');
      const legacyPath = url.searchParams.get('filePath');
      if (legacyPath) storagePath = legacyPath;
    } catch { /* external media links are not private local objects */ }
  }
  return {
    storagePath,
    fileHash: typeof metadata.fileHash === 'string' ? metadata.fileHash : '',
    originalName: typeof metadata.originalName === 'string' ? metadata.originalName : 'document',
  };
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!canUseUccDocuments(auth)) return NextResponse.json({ success: false, error: 'Document access is not permitted.' }, { status: 403 });
  const { id } = await params;

  try {
    const attachment = await db.uccAttachment.findUnique({
      where: { id },
      include: { conversation: { select: { id: true, studentId: true, assignedToUserId: true } } },
    });
    if (!attachment) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    if (!canAccessUccDocumentConversation(auth, attachment.conversation) || !(await canViewUccConversationB2B(auth, attachment.conversation))) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }

    if (attachment.applicationId) {
      const application = await db.application.findUnique({
        where: { id: attachment.applicationId },
        select: { studentId: true, isB2bConfidential: true },
      });
      if (!application || application.studentId !== attachment.studentId || (application.isB2bConfidential && !canViewUccB2B(auth))) {
        return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
      }
    } else if (attachment.studentId) {
      const confidentialApplication = await db.application.findFirst({
        where: { studentId: attachment.studentId, isB2bConfidential: true },
        select: { id: true },
      });
      if (confidentialApplication && !canViewUccB2B(auth)) {
        return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
      }
    }

    const privateMetadata = metadataFor(attachment);
    if (!privateMetadata.storagePath || !privateMetadata.fileHash || !/^[a-f0-9]{64}$/i.test(privateMetadata.fileHash)) {
      return NextResponse.json({ success: false, error: 'This attachment has no verified private file and cannot be downloaded through the CRM.' }, { status: 410 });
    }
    if (!ALLOWED_MIME.has(attachment.mimeType)) {
      return NextResponse.json({ success: false, error: 'Attachment type is not supported for secure download.' }, { status: 415 });
    }

    const bytes = await readPrivateFile(privateMetadata.storagePath);
    if (createHash('sha256').update(bytes).digest('hex') !== privateMetadata.fileHash.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Stored document integrity check failed.' }, { status: 500 });
    }

    await db.$transaction(async (tx) => {
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'UCC_DOCUMENT_DOWNLOADED',
          entityType: 'UccAttachment',
          entityId: attachment.id,
          ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
          userAgent: request.headers.get('user-agent') || '',
          metadata: JSON.stringify({ effectiveUserId: auth.userId, role: auth.roles[0] || auth.userType, conversationId: attachment.conversationId, studentId: attachment.studentId }),
        },
      });
    });

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Length': String(bytes.length),
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename(privateMetadata.originalName))}`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Document is not available from private storage.' }, { status: 503 });
  }
}
