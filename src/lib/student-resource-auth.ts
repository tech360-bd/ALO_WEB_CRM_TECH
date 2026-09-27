import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { db } from '@/lib/db';

/**
 * Resolve the authenticated student's canonical Student.id for student-owned
 * resources. Both the dedicated student session and the legacy portal/NextAuth
 * session are supported, but a caller can never select another student by
 * putting an arbitrary id in a query string or request body.
 */
export async function requireStudentResource(
  request: Request,
  requestedStudentId?: string | null,
): Promise<{ studentId: string } | NextResponse> {
  const authResult = await authenticateUnified(request);
  if (authResult instanceof NextResponse) return authResult;

  let studentId: string | null = null;
  if (authResult.type === 'student') {
    studentId = authResult.data.studentId;
  } else if (authResult.data.userType.toUpperCase() === 'STUDENT') {
    const student = await db.student.findFirst({
      where: { userId: authResult.data.userId },
      select: { id: true },
    });
    studentId = student?.id || null;
  }

  if (!studentId) {
    return NextResponse.json({ error: 'Student access required' }, { status: 403 });
  }
  if (requestedStudentId && requestedStudentId !== studentId) {
    return NextResponse.json({ error: 'You can only access your own student data' }, { status: 403 });
  }

  return { studentId };
}
