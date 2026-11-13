import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { readPrivateFile } from '@/lib/storage/private-file-store';
import { authorizeStaffDocumentRead } from '@/lib/documents/document-access-resolver';

/**
 * GET /api/counselor/documents/[id]/download
 *
 * Staff download for a student document, whichever table it lives in.
 *
 * This route did not exist. The counselor list merged `StudentDocument` and
 * `PortalStudentDocument` into one view, but the only download endpoints for a
 * portal-originated row were `/api/partner/documents/{id}/download` and
 * `/api/student-portal/documents/{id}/download` — both of which (correctly)
 * refuse staff. Document review therefore had no way to open the file it was
 * reviewing.
 *
 * Authorisation is the same shared policy the list uses:
 *   admin → oversight, reviewer roles → whole pipeline,
 *   counselor → only their assigned student,
 *   a partner student with no submitted ALO application → refused unless the
 *   caller is that student's assigned counselor.
 *
 * The stored path, hash and MIME type are never returned; the hash is re-checked
 * against the bytes on disk before anything is streamed.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_MIME = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']);

function safeFilename(value: string): string {
  const name = value.split(/[\\/]/).pop()?.replace(/[\r\n\0]/g, '').trim();
  return (name || 'document').slice(0, 191);
}

function notFound() {
  return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
}

export const GET = withAuth(async (request: Request, auth, context?: { params?: Promise<{ id: string }> }) => {
  const id = ((await context?.params)?.id || '').trim();
  if (!id) return NextResponse.json({ success: false, error: 'Document ID is required.' }, { status: 400 });

  // Resolve which table owns the id without ever trusting the caller for the
  // student identity.
  const studentDocument = await db.studentDocument
    .findFirst({ where: { id }, select: { id: true, studentId: true, fileName: true, storagePath: true, mimeType: true, fileHash: true, isArchived: true } })
    .catch(() => null);
  const portalDocument = studentDocument
    ? null
    : await db.portalStudentDocument
        .findFirst({
          where: { id },
          select: {
            id: true,
            fileName: true,
            storagePath: true,
            mimeType: true,
            fileHash: true,
            isArchived: true,
            studentProfile: { select: { id: true, studentId: true } },
          },
        })
        .catch(() => null);

  const row = studentDocument || portalDocument;
  if (!row) return notFound();

  const studentIdentifier = studentDocument
    ? studentDocument.studentId
    : portalDocument?.studentProfile?.studentId || portalDocument?.studentProfile?.id || '';
  if (!studentIdentifier) return notFound();

  // Archived documents stay retrievable for administrators only — history is
  // preserved, but it is not part of the live review queue.
  const guard = await authorizeStaffDocumentRead({ userId: auth.userId, roles: auth.roles }, studentIdentifier);
  if (!guard.ok) {
    return NextResponse.json({ success: false, error: guard.error }, { status: guard.status });
  }
  if (row.isArchived && guard.decision.via !== 'admin') return notFound();

  if (!row.storagePath || !row.mimeType || !row.fileHash) return notFound();

  try {
    const bytes = await readPrivateFile(row.storagePath);
    if (createHash('sha256').update(bytes).digest('hex') !== row.fileHash.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Stored document integrity check failed.' },
        { status: 500 },
      );
    }

    await db.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: 'DOC_DOWNLOAD',
          resource: studentDocument ? 'StudentDocument' : 'PortalStudentDocument',
          resourceId: row.id,
          details: JSON.stringify({ studentId: guard.resolved.studentId || studentIdentifier, via: guard.decision.via }),
        },
      });
    }).catch(() => null);

    const headers = new Headers({
      'Content-Type': ALLOWED_MIME.has(row.mimeType) ? row.mimeType : 'application/octet-stream',
      'Content-Length': String(bytes.length),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename(row.fileName || 'document'))}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Document is not available from private storage.' },
      { status: 503 },
    );
  }
});
