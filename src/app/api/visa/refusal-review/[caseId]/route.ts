import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const review = await db.visaRefusalReview.findUnique({
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

    const review = await db.visaRefusalReview.upsert({
      where: { caseId },
      create: {
        caseId,
        studentId: body.studentId || '',
        hasVisaRefusal: body.hasVisaRefusal || false,
        refusalCountry: body.refusalCountry || '',
        refusalReason: body.refusalReason || '',
        refusalLetterUrl: body.refusalLetterUrl || '',
        improvementPlan: body.improvementPlan || '',
        humanReviewStatus: body.humanReviewStatus || 'pending',
      },
      update: {
        hasVisaRefusal: body.hasVisaRefusal,
        refusalCountry: body.refusalCountry,
        refusalReason: body.refusalReason,
        refusalLetterUrl: body.refusalLetterUrl,
        improvementPlan: body.improvementPlan,
        humanReviewStatus: body.humanReviewStatus,
      },
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
