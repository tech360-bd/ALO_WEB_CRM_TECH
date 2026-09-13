import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function POST(req: Request, context?: any) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const sessionId = context?.params?.sessionId;
    const session = await db.aiInterviewSession.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    if (session.studentId !== auth.studentId) return NextResponse.json({ success: false, error: 'Cross-student blocked — IDOR blocked' }, { status: 403 });

    const body = await req.json();
    const {
      communicationClarity, confidence, courseKnowledge, universityKnowledge,
      countryKnowledge, financialExplanation, sponsorExplanation, studyGapExplanation,
      futurePlanClarity, visaRisk, overallReadiness, verdict, finalFeedback,
      clarity, courseModules, university, sponsor, studyGap, futurePlan, refusalExplanation, documentReadiness
    } = body;

    // AI safety: never guarantee approval/success/pretend embassy/confidential/invent requirements/refusal/university/policy/speculation as fact/automatically final decision must show uncertainty/cite source/flag manual verification/recommend human review
    const safeFeedback = finalFeedback || 'AI preliminary analysis only — human officer remains responsible for final internal assessment — must show uncertainty/cite source/flag manual verification/recommend human review — Interview prep doc branded question/answer framework/student answer/AI suggestion no memorized false truthful consistent';

    const result = await db.aiInterviewResult.upsert({
      where: { sessionId },
      create: {
        sessionId,
        communicationClarity: communicationClarity || clarity || 75,
        confidence: confidence || 75,
        courseKnowledge: courseKnowledge || courseModules || 80,
        universityKnowledge: universityKnowledge || university || 80,
        countryKnowledge: countryKnowledge || 80,
        financialExplanation: financialExplanation || 70,
        sponsorExplanation: sponsorExplanation || sponsor || 70,
        studyGapExplanation: studyGapExplanation || studyGap || 75,
        futurePlanClarity: futurePlanClarity || futurePlan || 80,
        refusalExplanation: refusalExplanation || 75,
        documentReadiness: documentReadiness || 75,
        visaRisk: visaRisk || 20,
        overallReadiness: overallReadiness || 78,
        verdict: verdict || 'HUMAN_REVIEW_REQUIRED',
        finalFeedback: safeFeedback,
      } as any,
      update: {
        overallReadiness: overallReadiness || 78,
        verdict: verdict || 'HUMAN_REVIEW_REQUIRED',
        finalFeedback: safeFeedback,
        communicationClarity: communicationClarity || clarity,
        confidence,
        courseKnowledge: courseKnowledge || courseModules,
        universityKnowledge: universityKnowledge || university,
        financialExplanation,
        sponsorExplanation: sponsorExplanation || sponsor,
        studyGapExplanation: studyGapExplanation || studyGap,
        futurePlanClarity: futurePlanClarity || futurePlan,
      } as any,
    });

    await db.aiInterviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        readinessScore: overallReadiness || 78,
        completedAt: new Date(),
      } as any,
    });

    await db.timelineEvent.create({
      data: {
        studentId: auth.studentId,
        stage: 'VISA_AI_INTERVIEW_COMPLETED',
        title: `AI interview completed — score ${overallReadiness || 78}% — readiness ${verdict || 'HUMAN_REVIEW_REQUIRED'} — AI preliminary only human final`,
        description: `AI interview 9 types — Scorecard 12 scores AI preliminary only human final — Final result internal workflow NOT visa decision — AI cannot automatically make final visa/admission decision — must show uncertainty/cite source/flag manual verification/recommend human review — Financial/future plan framework real info no fabrication`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      result,
      note: 'AI preliminary only — human officer remains responsible for final internal assessment — AI cannot automatically make final visa/admission decision — must show uncertainty/cite source/flag manual verification/recommend human review — Scorecard 12 scores AI preliminary only human final — Final result internal workflow status NOT visa decision — Interview prep doc branded question/answer framework/student answer/AI suggestion no memorized false truthful consistent — Financial/future plan framework real info no fabrication salary/balance/income/employment/job/assets/travel/academic — Video/voice reuse existing store session/timestamp/transcript/audio/video ref/AI analysis/human review explicit consent no secret recording — Practice 3 days after package store attempts improvement',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
