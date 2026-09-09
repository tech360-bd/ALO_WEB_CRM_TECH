import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const interviewId = context?.params?.id;
    const body = await req.json();
    const { questionId, question, answer, followUp, score, feedback } = body;

    const recorded = await db.visaInterviewAnswer.create({
      data: {
        interviewId,
        questionId: questionId || '',
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
});
