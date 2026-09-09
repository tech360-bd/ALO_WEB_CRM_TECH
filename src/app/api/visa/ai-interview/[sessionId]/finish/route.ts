import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function POST(req: Request, context?: any) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const sessionId = context?.params?.sessionId;
    const body = await req.json();
    const {
      communicationClarity, confidence, courseKnowledge, universityKnowledge,
      countryKnowledge, financialExplanation, sponsorExplanation, studyGapExplanation,
      futurePlanClarity, visaRisk, overallReadiness, verdict, finalFeedback
    } = body;

    const result = await db.aiInterviewResult.upsert({
      where: { sessionId },
      create: {
        sessionId,
        communicationClarity: communicationClarity || 75,
        confidence: confidence || 75,
        courseKnowledge: courseKnowledge || 80,
        universityKnowledge: universityKnowledge || 80,
        countryKnowledge: countryKnowledge || 80,
        financialExplanation: financialExplanation || 70,
        sponsorExplanation: sponsorExplanation || 70,
        studyGapExplanation: studyGapExplanation || 75,
        futurePlanClarity: futurePlanClarity || 80,
        visaRisk: visaRisk || 20,
        overallReadiness: overallReadiness || 78,
        verdict: verdict || 'ready',
        finalFeedback: finalFeedback || 'Strong overall articulation.',
      },
      update: {
        overallReadiness: overallReadiness || 78,
        verdict: verdict || 'ready',
        finalFeedback: finalFeedback || 'Strong overall articulation.',
      },
    });

    await db.aiInterviewSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        readinessScore: overallReadiness || 78,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
