import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function POST(req: Request, context?: any) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const sessionId = context?.params?.sessionId;
    const body = await req.json();
    const { question, answer, followUp, score, feedback } = body;

    const recorded = await db.aiInterviewAnswer.create({
      data: {
        sessionId,
        question: question || '',
        answer: answer || '',
        followUp: followUp || '',
        score: score || 0,
        feedback: feedback || '',
      },
    });

    return NextResponse.json({ success: true, data: recorded });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
