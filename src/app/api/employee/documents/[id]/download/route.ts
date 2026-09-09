import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { canViewField, logSecurityAudit } from '@/lib/access-control/central-security-engine';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const viewerId = searchParams.get('viewerId') || '';

    if (!viewerId) {
      return NextResponse.json({ error: 'Authentication required for document download.' }, { status: 401 });
    }

    const doc = await db.employeeDocument.findUnique({ where: { id } });
    if (!doc) {
      return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
    }

    const user = await db.user.findUnique({ where: { id: viewerId } });
    const userRoles = user ? [user.role] : [];

    // Verify document authorization
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
