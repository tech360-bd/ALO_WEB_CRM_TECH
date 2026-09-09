import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const caseId = context?.params?.caseId;
    const visaCase = await db.visaCase.findUnique({ where: { id: caseId } });
    if (!visaCase) return NextResponse.json({ success: false, error: 'Case not found' }, { status: 404 });

    const [checklistItems, docs, funding, interviews] = await Promise.all([
      db.visaChecklistItem.findMany({ where: { studentId: visaCase.studentId } }),
      db.studentDocument.findMany({ where: { studentId: visaCase.studentId } }),
      db.visaFundingReview.findUnique({ where: { caseId } }).catch(() => null),
      db.visaInterview.findMany({ where: { caseId } }),
    ]);

    const totalDocs = docs.length;
    const readyDocs = docs.filter(d => d.status === 'approved' || d.status === 'verified').length;
    const isInterviewPassed = interviews.some(i => (i.overallScore || 0) >= 70);

    let score = 50;
    if (totalDocs > 0) {
      score += Math.round((readyDocs / totalDocs) * 30);
    }
    if (isInterviewPassed) score += 20;
    if (funding?.fundingStatus === 'approved') score += 10;
    score = Math.min(100, Math.max(10, score));

    const report = await db.visaReadinessReport.create({
      data: {
        studentId: visaCase.studentId,
        visaCaseId: caseId,
        applicationId: visaCase.applicationId || '',
        overallScore: score,
        documentsReady: readyDocs,
        documentsTotal: totalDocs,
        interviewReady: isInterviewPassed,
        riskFactors: score < 60 ? '["Incomplete document set", "Mock interview required"]' : '[]',
        recommendation: score >= 80 ? 'Visa file is robust. Ready for submission.' : 'Complete pending checklist items before embassy submission.',
      },
    });

    await db.visaCase.update({
      where: { id: caseId },
      data: {
        readinessScore: score,
        riskLevel: score >= 80 ? 'low' : score >= 60 ? 'medium' : 'high',
      },
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Calculation failed' }, { status: 500 });
  }
});
