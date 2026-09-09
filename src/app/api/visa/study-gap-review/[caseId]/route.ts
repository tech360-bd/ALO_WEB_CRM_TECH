import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const review = await db.visaStudyGapReview.findUnique({
      where: { caseId },
    });
    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const body = await req.json();

    const review = await db.visaStudyGapReview.upsert({
      where: { caseId },
      create: {
        caseId,
        studentId: body.studentId || '',
        hasStudyGap: body.hasStudyGap || false,
        gapDurationMonths: body.gapDurationMonths || 0,
        gapPurpose: body.gapPurpose || '',
        workExpDuringGap: body.workExpDuringGap || '',
        explanationClarity: body.explanationClarity || 'clear',
        riskFlag: body.riskFlag || 'low',
      },
      update: {
        hasStudyGap: body.hasStudyGap,
        gapDurationMonths: body.gapDurationMonths,
        gapPurpose: body.gapPurpose,
        workExpDuringGap: body.workExpDuringGap,
        explanationClarity: body.explanationClarity,
        riskFlag: body.riskFlag,
      },
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
