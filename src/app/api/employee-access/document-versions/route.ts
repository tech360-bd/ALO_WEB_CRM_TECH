import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const documentId = req.nextUrl.searchParams.get('documentId');
  if (!documentId) return NextResponse.json({ success: false, error: 'documentId required' }, { status: 400 });

  try {
    const document = await db.employeeDocument.findUnique({ where: { id: documentId }, select: { id: true, employeeId: true, isDeleted: true } });
    if (!document || document.isDeleted) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase()));
    const isOwner = document.employeeId === auth.userId;
    const isHr = ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].some((role) => roles.has(role));
    if (!isOwner && !isHr) return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 });

    const versions = await db.employeeDocumentVersion.findMany({
      where: { OR: [{ employeeDocumentId: document.id }, { documentId: document.id }] },
      select: { id: true, employeeDocumentId: true, documentId: true, version: true, fileName: true, status: true, uploadedBy: true, reviewerId: true, reviewNote: true, createdAt: true },
      orderBy: { version: 'desc' },
    });
    return NextResponse.json({
      success: true,
      versions: versions.map((version) => ({
        ...version,
        downloadUrl: `/api/employee/documents/${document.id}/download?version=${version.version}`,
      })),
      note: 'Version metadata is visible only to the document owner or HR/admin; filesystem paths and storage identifiers are not returned.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Document versions are temporarily unavailable.' }, { status: 503 });
  }
}
