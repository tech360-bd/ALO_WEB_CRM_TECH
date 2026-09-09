import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function GET(req: Request, context?: any) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const sessionId = context?.params?.sessionId;
    const result = await db.aiInterviewResult.findUnique({
      where: { sessionId },
    });

    if (!result) {
      return NextResponse.json({ success: false, error: 'Result not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
