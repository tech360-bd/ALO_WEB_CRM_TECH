import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const interviewId = context?.params?.id;
    const body = await req.json();
    const { category, question, difficulty, language } = body;

    const q = await db.visaInterviewQuestion.create({
      data: {
        category: category || 'general',
        question: question || '',
        difficulty: difficulty || 'standard',
        language: language || 'english',
      },
    });

    return NextResponse.json({ success: true, data: q });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
