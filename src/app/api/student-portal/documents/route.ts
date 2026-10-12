import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    if (auth.userType.toUpperCase() !== 'STUDENT') {
      return NextResponse.json({ success: false, error: 'Student account required.' }, { status: 403 });
    }
    const studentProfile = await db.portalStudentProfile.findUnique({
      where: { userId: auth.userId },
      select: { id: true, studentId: true },
    });
    if (!studentProfile) return NextResponse.json({ success: false, error: 'Student profile not found.' }, { status: 404 });

    const records = await db.portalStudentDocument.findMany({
      where: { studentProfileId: studentProfile.id },
      select: { id: true, name: true, category: true, fileName: true, fileSize: true, status: true, rejectionReason: true, uploadedAt: true, reviewedBy: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    await db.portalAuditLog.create({
      data: { actorUserId: auth.userId, action: 'STUDENT_VIEW_DOCUMENTS', entityType: 'PortalStudentProfile', entityId: studentProfile.id, metadata: JSON.stringify({ count: records.length }) },
    });
    const data = records.map((record) => ({ ...record, downloadUrl: `/api/student-portal/documents/${record.id}/download` }));
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'Student documents are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Metadata-only document creation is disabled. Upload the actual file through the private upload workflow.',
  }, { status: 405 });
}
