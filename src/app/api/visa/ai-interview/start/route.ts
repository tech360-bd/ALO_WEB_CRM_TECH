import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function POST(req: Request) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { interviewType } = body;

    const session = await db.aiInterviewSession.create({
      data: {
        studentId: auth.studentId,
        interviewType: interviewType || 'embassy_mock',
        status: 'in_progress',
      },
    });

    return NextResponse.json({ success: true, sessionId: session.id, session });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
