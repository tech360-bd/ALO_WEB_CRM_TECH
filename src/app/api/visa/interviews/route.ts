import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const { searchParams } = new URL(req.url);
    const caseId = searchParams.get('caseId');
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');

    const where: any = {};
    if (caseId) where.caseId = caseId;
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    const interviews = await db.visaInterview.findMany({
      where,
      orderBy: { scheduledAt: 'desc' },
      include: { answers: true },
    });

    return NextResponse.json({ success: true, data: interviews });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  try {
    const body = await req.json();
    const { caseId, studentId, interviewType, difficulty, language, scheduledAt } = body;

    const interview = await db.visaInterview.create({
      data: {
        caseId: caseId || '',
        studentId: studentId || '',
        interviewType: interviewType || 'embassy_mock',
        difficulty: difficulty || 'standard',
        language: language || 'english',
        status: 'scheduled',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        officerId: auth.userId,
      },
    });

    return NextResponse.json({ success: true, data: interview });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
