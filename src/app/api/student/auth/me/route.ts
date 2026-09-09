import { NextResponse } from 'next/server';
import { authenticateStudentRequest } from '@/lib/student-auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const authResult = await authenticateStudentRequest(req);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const student = await db.student.findUnique({
      where: { id: authResult.studentId }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const applicationsCount = await (db as any).application?.count({ where: { studentId: student.id } }).catch(() => 0) || 0;
    const documentsCount = await (db as any).document?.count({ where: { studentId: student.id } }).catch(() => 0) || 0;
    const unreadMessagesCount = await (db as any).message?.count({ where: { studentId: student.id, isRead: false } }).catch(() => 0) || 0;

    return NextResponse.json({
      success: true,
      data: {
        ...student,
        applicationsCount,
        documentsCount,
        unreadMessagesCount
      }
    });

  } catch (error) {
    console.error('Me error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
