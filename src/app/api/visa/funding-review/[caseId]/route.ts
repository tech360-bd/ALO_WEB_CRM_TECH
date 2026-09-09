import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const review = await db.visaFundingReview.findUnique({
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

    const review = await db.visaFundingReview.upsert({
      where: { caseId },
      create: {
        caseId,
        studentId: body.studentId || '',
        fundingStatus: body.fundingStatus || 'approved',
        sponsor: body.sponsor || '',
        sponsorRelation: body.sponsorRelation || '',
        sponsorOccupation: body.sponsorOccupation || '',
        sponsorIncome: body.sponsorIncome || '',
        sourceOfFund: body.sourceOfFund || '',
        hasBankStatement: body.hasBankStatement || false,
        hasSolvencyCert: body.hasSolvencyCert || false,
        sourceOfFundExplanation: body.sourceOfFundExplanation || '',
        riskWarning: body.riskWarning || 'none',
      },
      update: {
        fundingStatus: body.fundingStatus,
        sponsor: body.sponsor,
        sponsorRelation: body.sponsorRelation,
        sponsorOccupation: body.sponsorOccupation,
        sponsorIncome: body.sponsorIncome,
        sourceOfFund: body.sourceOfFund,
        hasBankStatement: body.hasBankStatement,
        hasSolvencyCert: body.hasSolvencyCert,
        sourceOfFundExplanation: body.sourceOfFundExplanation,
        riskWarning: body.riskWarning,
      },
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
