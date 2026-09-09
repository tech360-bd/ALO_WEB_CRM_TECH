import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const interviewId = context?.params?.id;
    const body = await req.json();
    const { studentFeedback } = body;

    const updated = await db.visaInterview.update({
      where: { id: interviewId },
      data: { studentFeedback: studentFeedback || '' },
    });

    await db.timelineEvent.create({
      data: {
        studentId: updated.studentId,
        stage: 'VISA',
        title: 'Visa Mock Interview Feedback Received',
        description: studentFeedback || 'Officer feedback updated',
        actor: auth.name || 'Staff',
      },
    }).catch(() => null);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
