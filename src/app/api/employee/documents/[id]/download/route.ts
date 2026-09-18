import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { canViewField, logSecurityAudit } from '@/lib/access-control/central-security-engine';

// ============================================================
// SEC-H fix (2026-09-18): the caller's identity came from a `viewerId` QUERY
// PARAMETER. The authorization check was then `viewerId === doc.employeeId`,
// so an attacker only had to pass the document owner's id as `viewerId` to
// satisfy it and download confidential HR documents. There was no session at
// all.
//
// Identity now comes from the verified session (`authenticateRequest`); a
// client-supplied viewerId is ignored entirely. The existing ownership /
// super_admin / hr_manager rule is kept.
// ============================================================

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const viewerId = auth.userId;
    const userRoles = auth.roles ?? [];

    const doc = await db.employeeDocument.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    // Verify document authorization against the VERIFIED actor.
    const canAccess = viewerId === doc.employeeId || userRoles.includes('super_admin') || userRoles.includes('hr_manager');
    if (!canAccess) {
      return NextResponse.json({ error: 'Unauthorized to download this confidential HR document.' }, { status: 403 });
    }

    // Log download event
    await logSecurityAudit({
      actorId: viewerId,
      actorRole: userRoles.join(','),
      action: 'EMPLOYEE_DOCUMENT_DOWNLOADED',
      targetType: 'EmployeeDocument',
      targetId: id,
    });

    return NextResponse.json({
      success: true,
      downloadUrl: doc.filePath,
      fileName: doc.fileName,
      status: doc.status,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Server error streaming document' }, { status: 500 });
  }
}
