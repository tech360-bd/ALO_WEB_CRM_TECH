import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (!id) return NextResponse.json({ success: false, error: 'Case ID required' }, { status: 400 });

    const visaCase = await db.visaCase.findUnique({
      where: { id },
    });

    if (!visaCase) {
      return NextResponse.json({ success: false, error: 'Visa case not found' }, { status: 404 });
    }

    const [interviews, fundingReview, studyGapReview, refusalReview, sensitiveReview] = await Promise.all([
      db.visaInterview.findMany({ where: { caseId: id }, include: { answers: true } }),
      db.visaFundingReview.findUnique({ where: { caseId: id } }).catch(() => null),
      db.visaStudyGapReview.findUnique({ where: { caseId: id } }).catch(() => null),
      db.visaRefusalReview.findUnique({ where: { caseId: id } }).catch(() => null),
      (auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('visa_officer'))
        ? db.visaSensitiveReview.findUnique({ where: { caseId: id } }).catch(() => null)
        : null,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...visaCase,
        interviews,
        fundingReview,
        studyGapReview,
        refusalReview,
        sensitiveReview,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (!id) return NextResponse.json({ success: false, error: 'Case ID required' }, { status: 400 });

    const body = await req.json();
    const { currentStage, riskLevel, readinessScore, nextAction, isUrgent, visaOfficerId, visaOfficerName, counselorId } = body;

    const dataToUpdate: any = {};
    if (currentStage !== undefined) dataToUpdate.currentStage = currentStage;
    if (riskLevel !== undefined) dataToUpdate.riskLevel = riskLevel;
    if (readinessScore !== undefined) dataToUpdate.readinessScore = readinessScore;
    if (nextAction !== undefined) dataToUpdate.nextAction = nextAction;
    if (isUrgent !== undefined) dataToUpdate.isUrgent = isUrgent;
    if (visaOfficerId !== undefined) dataToUpdate.visaOfficerId = visaOfficerId;
    if (visaOfficerName !== undefined) dataToUpdate.visaOfficerName = visaOfficerName;
    if (counselorId !== undefined) dataToUpdate.counselorId = counselorId;

    const updated = await db.visaCase.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
  }
});
