import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { canManageVisaPermission, canViewVisaSensitive, isVisaPartner, isVisaStudent, isVisaSuperAdmin } from '@/lib/visa/access';
import { readPrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isSensitiveCategory(category: string) {
  return ['medical', 'criminal', 'sensitive'].some((part) => category.toLowerCase().includes(part));
}

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    if (isVisaPartner(auth) || isVisaStudent(auth)) return NextResponse.json({ success: false, error: 'This private visa document is not available to this account.' }, { status: 403 });
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Document ID required.' }, { status: 400 });
    const document = await db.studentDocument.findUnique({ where: { id } });
    if (!document || document.isArchived || !document.storagePath || !document.mimeType || !document.fileHash) return NextResponse.json({ success: false, error: 'Private document is not available.' }, { status: 404 });

    let candidates;
    if (document.caseId) {
      const assignedCase = await db.visaCase.findUnique({ where: { id: document.caseId } });
      candidates = assignedCase && assignedCase.studentId === document.studentId ? [assignedCase] : [];
    } else {
      candidates = await db.visaCase.findMany({ where: { studentId: document.studentId }, orderBy: { updatedAt: 'desc' } });
    }
    const visaCase = candidates.find((candidate) => canManageVisaPermission(auth, 'visa.documents.download', candidate));
    if (!visaCase) return NextResponse.json({ success: false, error: 'Assigned visa case and visa.documents.download permission required.' }, { status: 403 });
    if (isSensitiveCategory(document.category) && !canViewVisaSensitive(auth, visaCase)) return NextResponse.json({ success: false, error: 'Explicit sensitive-data permission is required for this document.' }, { status: 403 });

    try {
      await db.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_DOCUMENT_DOWNLOAD', entityType: 'StudentDocument', entityId: id, metadata: JSON.stringify({ caseId: visaCase.id, studentId: document.studentId, category: document.category, fileHash: document.fileHash }), ipAddress: '', userAgent: '' },
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Download could not be audited; the document was not served.' }, { status: 503 });
    }

    const bytes = await readPrivateFile(document.storagePath);
    if (createHash('sha256').update(bytes).digest('hex') !== document.fileHash) return NextResponse.json({ success: false, error: 'Stored document integrity check failed.' }, { status: 500 });

    const fileName = (document.fileName || 'document').replace(/[\r\n\u0000-\u001f]/g, '_').slice(0, 191);
    const headers = new Headers({
      'Content-Type': document.mimeType,
      'Content-Length': String(bytes.length),
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Vary': 'Cookie, Authorization',
    });
    return new NextResponse(new Uint8Array(bytes), { status: 200, headers });
  } catch (error) {
    if (isVisaSuperAdmin(auth)) console.error('[visa-document-download] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Private document download failed.' }, { status: 503 });
  }
});
