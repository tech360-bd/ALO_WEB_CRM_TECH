import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

const schema = z.object({}).strict();
const safeStudentFeedback = 'Your practice transcript has been saved. Automated scoring is not enabled, so no readiness result has been calculated. A visa officer must review the practice before providing feedback. This practice session is not a visa decision or guarantee.';

export async function POST(req: Request, context?: any) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;
    const sessionId = context?.params?.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) return NextResponse.json({ success: false, error: 'Session ID required.' }, { status: 400 });
    const session = await db.aiInterviewSession.findFirst({ where: { id: sessionId, studentId: auth.studentId } });
    if (!session) return NextResponse.json({ success: false, error: 'Interview practice session not found.' }, { status: 404 });
    if (session.status !== 'in_progress') return NextResponse.json({ success: false, error: 'Interview practice session has already been completed.' }, { status: 409 });
    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Scores and readiness labels cannot be submitted by a student.' }, { status: 400 });
    const answerCount = await db.aiInterviewAnswer.count({ where: { sessionId } });
    if (answerCount === 0) return NextResponse.json({ success: false, error: 'Record at least one practice response before finishing.' }, { status: 400 });

    await db.$transaction(async (tx) => {
      await tx.aiInterviewResult.upsert({
        where: { sessionId },
        create: {
          sessionId,
          communicationClarity: 0,
          confidence: 0,
          courseKnowledge: 0,
          universityKnowledge: 0,
          countryKnowledge: 0,
          financialExplanation: 0,
          sponsorExplanation: 0,
          studyGapExplanation: 0,
          futurePlanClarity: 0,
          refusalExplanation: 0,
          documentReadiness: 0,
          visaRisk: 0,
          overallReadiness: 0,
          verdict: 'human_review_required',
          finalFeedback: safeStudentFeedback,
        },
        update: { overallReadiness: 0, verdict: 'human_review_required', finalFeedback: safeStudentFeedback },
      });
      await tx.aiInterviewSession.update({ where: { id: sessionId }, data: { status: 'completed', readinessScore: 0, riskLevel: 'human_review_required', completedAt: new Date() } });
      await tx.studentEvent.create({ data: { studentId: auth.studentId, eventType: 'VISA_AI_INTERVIEW_COMPLETED', payload: JSON.stringify({ sessionId, answerCount, automatedAssessment: false }) } });
      await tx.timelineEvent.create({
        data: { studentId: auth.studentId, stage: 'VISA_AI_INTERVIEW_COMPLETED', title: 'Interview practice session completed.', description: 'Practice transcript was saved; automated scoring is not enabled and officer review is pending.', actor: auth.studentId },
      });
    });

    return NextResponse.json({ success: true, sessionId, status: 'completed', assessmentStatus: 'pending_officer_review', feedback: safeStudentFeedback }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Interview practice could not be completed.' }, { status: 503 });
  }
}
