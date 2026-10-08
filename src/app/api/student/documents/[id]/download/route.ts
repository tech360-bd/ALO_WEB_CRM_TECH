import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';
import { readPrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateStudentRequest(request);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const document = await db.studentDocument.findFirst({
    where: { id, studentId: auth.studentId },
    select: { id: true, category: true, fileName: true, storagePath: true, mimeType: true, fileHash: true },
  });
  if (!document?.storagePath || !document.mimeType || !document.fileHash) {
    return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
  }
  try {
    const bytes = await readPrivateFile(document.storagePath);
    if (createHash('sha256').update(bytes).digest('hex') !== document.fileHash) {
      return NextResponse.json({ success: false, error: 'Stored document integrity check failed.' }, { status: 500 });
    }
    await db.$transaction(async (tx) => {
      await tx.studentEvent.create({
        data: { studentId: auth.studentId, eventType: 'DOCUMENT_DOWNLOADED', payload: JSON.stringify({ documentId: document.id, category: document.category }) },
      });
      await tx.documentAudit.create({
        data: { documentId: document.id, studentId: auth.studentId, actorId: auth.studentId, actorName: auth.name, actorRole: 'STUDENT', action: 'download', newStatus: '', note: 'Authorized student download.' },
      });
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
