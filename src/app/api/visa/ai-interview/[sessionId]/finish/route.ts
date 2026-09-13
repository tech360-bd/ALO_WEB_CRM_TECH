import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function POST(req: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const { sessionId } = await context.params;
    const body = await req.json();
    const session = await db.aiInterviewSession.findFirst({ where: { id: sessionId, studentId: auth.studentId } });
    if (!session) return NextResponse.json({ success: false, error: 'Interview session not found' }, { status: 404 });

    const answers = await db.aiInterviewAnswer.findMany({ where: { sessionId }, select: { score: true } });
    if (answers.length === 0) return NextResponse.json({ success: false, error: 'At least one evaluated answer is required' }, { status: 400 });
    const overallReadiness = Math.round(answers.reduce((sum, answer) => sum + answer.score, 0) / answers.length);
    const verdict = overallReadiness >= 80 ? 'ready' : overallReadiness >= 60 ? 'needs_practice' : 'high_risk';
    const finalFeedback = String(body.finalFeedback || `Practice score based on ${answers.length} evaluated answer${answers.length === 1 ? '' : 's'}.`);

    const result = await db.aiInterviewResult.upsert({
      where: { sessionId },
      create: {
        sessionId,
        communicationClarity: overallReadiness,
        confidence: overallReadiness,
        courseKnowledge: overallReadiness,
        universityKnowledge: overallReadiness,
        countryKnowledge: overallReadiness,
        financialExplanation: overallReadiness,
        sponsorExplanation: overallReadiness,
        studyGapExplanation: overallReadiness,
        futurePlanClarity: overallReadiness,
        visaRisk: 100 - overallReadiness,
        overallReadiness,
        verdict,
        finalFeedback,
      },
      update: { overallReadiness, verdict, finalFeedback, visaRisk: 100 - overallReadiness },
    });

    await db.aiInterviewSession.update({ where: { id: sessionId }, data: { status: 'completed', readinessScore: overallReadiness, riskLevel: verdict === 'high_risk' ? 'high' : verdict === 'needs_practice' ? 'medium' : 'low', completedAt: new Date() } });
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[visa.ai-interview.finish]', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to finish interview' }, { status: 500 });
  }
}
