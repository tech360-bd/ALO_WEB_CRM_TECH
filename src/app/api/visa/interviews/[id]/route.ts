import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    const interview = await db.visaInterview.findUnique({
      where: { id },
      include: { answers: true },
    });

    if (!interview) {
      return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    const body = await req.json();
    const { status, overallScore, verdict, officerNotes, studentFeedback } = body;

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (overallScore !== undefined) dataToUpdate.overallScore = overallScore;
    if (verdict !== undefined) dataToUpdate.verdict = verdict;
    if (officerNotes !== undefined) dataToUpdate.officerNotes = officerNotes;
    if (studentFeedback !== undefined) dataToUpdate.studentFeedback = studentFeedback;

    const updated = await db.visaInterview.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
  }
});
