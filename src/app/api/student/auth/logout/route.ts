import { NextResponse } from 'next/server';
import { authenticateStudentRequest, revokeAllStudentSessions } from '@/lib/student-auth';

export async function POST(req: Request) {
  try {
    const authResult = await authenticateStudentRequest(req);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await revokeAllStudentSessions(authResult.studentId, 'logout');

    return NextResponse.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
