import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { logSecurityAudit } from '@/lib/access-control/central-security-engine';
import { readPrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};
const ALLOWED_MIME = new Set(Object.values(MIME_BY_EXTENSION));
const HR_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER']);

function inferMime(fileName: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  return MIME_BY_EXTENSION[extension] || null;
}

function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop()?.replace(/[\r\n\0]/g, '').trim();
  return (base || 'employee-document').slice(0, 191);
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const url = new URL(req.url);
  const versionRaw = url.searchParams.get('version');
  const versionNumber = versionRaw === null ? null : Number(versionRaw);
  if (versionRaw !== null && (!Number.isSafeInteger(versionNumber) || (versionNumber as number) < 1)) {
    return NextResponse.json({ success: false, error: 'A positive document version is required.' }, { status: 400 });
  }

  try {
    const document = await db.employeeDocument.findUnique({ where: { id } });
    if (!document || document.isDeleted) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });

    const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase()));
    const isOwner = auth.userId === document.employeeId;
    const isHr = [...roles].some((role) => HR_ROLES.has(role));
    if (!isOwner && !isHr) return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 });

    let filePath = document.filePath;
    let fileHash = document.fileHash;
    let mimeType: string | null = document.mimeType;
    let fileName = document.fileName;
    if (versionNumber !== null) {
      const selectedVersion = await db.employeeDocumentVersion.findFirst({
        where: {
          version: versionNumber,
          OR: [{ employeeDocumentId: document.id }, { documentId: document.id }],
        },
      });
      if (!selectedVersion) return NextResponse.json({ success: false, error: 'Document version not found.' }, { status: 404 });
      filePath = selectedVersion.filePath;
      fileHash = selectedVersion.fileHash;
      fileName = selectedVersion.fileName || fileName;
      mimeType = inferMime(fileName);
    }

    // Legacy metadata-only paths and rows without an integrity hash are not
    // served. The owner must re-upload the actual bytes through the secure flow.
    if (!filePath || !fileHash || !mimeType || !ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json({ success: false, error: 'This legacy document has no verified private file. Re-upload the document to enable secure download.' }, { status: 410 });
    }

    const bytes = await readPrivateFile(filePath);
    if (createHash('sha256').update(bytes).digest('hex') !== fileHash) {
      return NextResponse.json({ success: false, error: 'Stored document integrity check failed.' }, { status: 500 });
    }

    await db.$transaction(async (tx) => {
      await logSecurityAudit({
        actorId: auth.actorUserId || auth.userId,
        actorRole: [...roles].join(','),
        action: 'EMPLOYEE_DOCUMENT_DOWNLOADED',
        targetType: 'EmployeeDocument',
        targetId: id,
        newValue: JSON.stringify({ employeeId: document.employeeId, version: versionNumber ?? document.version }),
        ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
        sessionIdentifier: auth.sessionId,
      }, tx);
    });

    return NextResponse.json({
      success: true,
      downloadUrl: doc.filePath ?? "",
      fileName: doc.fileName ?? "document",
      status: doc.status,
    const headers = new Headers({
      'Content-Type': mimeType,
      'Content-Length': String(bytes.length),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename(fileName))}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
  } catch {
    return NextResponse.json({ success: false, error: 'Document is not available from private storage.' }, { status: 503 });
  }
}
