import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) return NextResponse.json({ success: false, error: 'studentId required' }, { status: 400 });

    // RBAC: counselor can see assigned only
    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('admin');
    if (!isSuper) {
      const student = await db.student.findFirst({ where: { id: studentId } }).catch(() => null) ||
                      await db.portalStudentProfile.findFirst({ where: { studentId } }).catch(() => null);
      const counselorId = (student as any)?.counselorId;
      if (counselorId && counselorId !== auth.userId && !auth.roles.includes('application_team') && !auth.roles.includes('visa_officer')) {
        return NextResponse.json({ success: false, error: 'Not assigned to this student' }, { status: 403 });
      }
    }

    const documents = await db.studentDocument.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, documents, count: documents.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
