import { NextResponse } from 'next/server';
import { authenticateStudentRequest, revokeAllStudentSessions } from '@/lib/student-auth';

function clearPageSessionCookie(response: NextResponse) {
  const secure = process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://');
  response.cookies.set('alo_student_session', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  response.cookies.set(secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token', '', {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });
  return response;
}

export async function POST(req: Request) {
  try {
    const authResult = await authenticateStudentRequest(req);
    
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    await revokeAllStudentSessions(authResult.studentId, 'logout');

    return clearPageSessionCookie(NextResponse.json({ success: true, message: 'Logged out successfully' }));
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
