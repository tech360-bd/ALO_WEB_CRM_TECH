import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';
import {
  buildPreliminaryAssessment,
  preliminaryStudentLabel,
} from '@/lib/interview/preliminary-assessment';

/**
 * Complete a practice session and produce the preliminary assessment (spec §41).
 *
 * The assessment is a deterministic rubric over the recorded answers — no model
 * is called, so nothing about the student can be invented. It is persisted as
 * PENDING and the student is told, in as many words, that a named reviewer makes
 * the final decision and may override it in full.
 *
 * A student cannot submit scores or a verdict: the body must be empty, and the
 * values written below are produced server-side from the transcript only.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request, context?: { params: Promise<{ sessionId: string }> | { sessionId: string } }) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const params = context?.params ? await context.params : undefined;
    const sessionId = params?.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) {
      return NextResponse.json({ success: false, error: 'Session ID required.' }, { status: 400 });
    }

    const session = await db.aiInterviewSession.findFirst({
      where: { id: sessionId, studentId: auth.studentId },
      select: { id: true, status: true, interviewType: true, transcript: true },
    });
    if (!session) return NextResponse.json({ success: false, error: 'Interview practice session not found.' }, { status: 404 });
    if (session.status !== 'in_progress') {
      return NextResponse.json({ success: false, error: 'Interview practice session has already been completed.' }, { status: 409 });
    }

    let body: unknown = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    if (body !== null && typeof body === 'object' && Object.keys(body as Record<string, unknown>).length > 0) {
      return NextResponse.json(
        { success: false, error: 'Scores and readiness labels cannot be submitted by a student.' },
        { status: 400 },
      );
    }

    const answers = await db.aiInterviewAnswer.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: { question: true, answer: true, transcript: true },
    });
    if (answers.length === 0) {
      return NextResponse.json({ success: false, error: 'Record at least one practice response before finishing.' }, { status: 400 });
    }

    // Attempted-target terms give the rubric something concrete to look for.
    const applications = await db.application.findMany({
      where: { studentId: auth.studentId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      select: { universityName: true, courseName: true },
    });
    const expectedTerms = applications
      .flatMap((application) => [application.universityName, application.courseName])
      .filter((term): term is string => typeof term === 'string' && term.trim().length > 2)
      .slice(0, 8);

    // Question categories live in the session transcript, written when each
    // answer was recorded. They are read positionally so an older transcript
    // without categories simply scores as GENERAL instead of failing.
    const transcriptCategories: string[] = (() => {
      try {
        const parsed = JSON.parse(session.transcript || '{}') as { answers?: Array<{ category?: string }> };
        return Array.isArray(parsed?.answers)
          ? parsed.answers.map((entry) => (typeof entry?.category === 'string' ? entry.category : ''))
          : [];
      } catch {
        return [];
      }
    })();

    const answersForRubric = answers.map((answer, index) => ({
      question: answer.question,
      answer: answer.answer,
      category: transcriptCategories[index] ?? '',
    }));

    const assessment = buildPreliminaryAssessment(answersForRubric, { expectedTerms });
    const studentLabel = preliminaryStudentLabel(assessment.verdict);
    const studentFeedback = [
      studentLabel + '.',
      assessment.strengths[0] ?? 'Your transcript has been recorded.',
      assessment.improvements[0] ? `Next: ${assessment.improvements[0]}` : '',
      'A counselor reviews this before it is treated as a result, and may change it.',
    ].filter(Boolean).join(' ');

    let assessmentId = '';
    await db.$transaction(async (tx) => {
      const savedAssessment = await tx.interviewAssessment.upsert({
        where: { sessionId },
        create: {
          sessionId,
          studentId: auth.studentId,
          engine: assessment.engine,
          engineVersion: assessment.engineVersion,
          verdict: assessment.verdict,
          confidence: assessment.confidence,
          overallScore: assessment.overallScore,
          dimensions: JSON.stringify(assessment.dimensions),
          strengths: JSON.stringify(assessment.strengths),
          improvements: JSON.stringify(assessment.improvements),
          evidence: JSON.stringify(assessment.evidence),
          limitations: JSON.stringify(assessment.limitations),
          answerCount: assessment.answerCount,
          averageWords: assessment.averageWords,
          reviewStatus: 'PENDING',
          generatedAt: new Date(assessment.generatedAt),
        },
        update: {
          verdict: assessment.verdict,
          confidence: assessment.confidence,
          overallScore: assessment.overallScore,
          dimensions: JSON.stringify(assessment.dimensions),
          strengths: JSON.stringify(assessment.strengths),
          improvements: JSON.stringify(assessment.improvements),
          evidence: JSON.stringify(assessment.evidence),
          limitations: JSON.stringify(assessment.limitations),
          answerCount: assessment.answerCount,
          averageWords: assessment.averageWords,
          reviewStatus: 'PENDING',
          generatedAt: new Date(assessment.generatedAt),
        },
        select: { id: true },
      });
      assessmentId = savedAssessment.id;

      // The legacy result row keeps the officer-facing numeric shape, but its
      // verdict can never be mistaken for a human decision.
      await tx.aiInterviewResult.upsert({
        where: { sessionId },
        create: {
          sessionId,
          overallReadiness: assessment.overallScore,
          communicationClarity: assessment.dimensions.find((dimension) => dimension.key === 'structure')?.score ?? 0,
          courseKnowledge: assessment.dimensions.find((dimension) => dimension.key === 'COURSE')?.score ?? 0,
          universityKnowledge: assessment.dimensions.find((dimension) => dimension.key === 'UNIVERSITY')?.score ?? 0,
          financialExplanation: assessment.dimensions.find((dimension) => dimension.key === 'FINANCIAL')?.score ?? 0,
          futurePlanClarity: assessment.dimensions.find((dimension) => dimension.key === 'FUTURE_PLAN')?.score ?? 0,
          verdict: 'pending_human_review',
          finalFeedback: studentFeedback,
        },
        update: {
          overallReadiness: assessment.overallScore,
          communicationClarity: assessment.dimensions.find((dimension) => dimension.key === 'structure')?.score ?? 0,
          courseKnowledge: assessment.dimensions.find((dimension) => dimension.key === 'COURSE')?.score ?? 0,
          universityKnowledge: assessment.dimensions.find((dimension) => dimension.key === 'UNIVERSITY')?.score ?? 0,
          financialExplanation: assessment.dimensions.find((dimension) => dimension.key === 'FINANCIAL')?.score ?? 0,
          futurePlanClarity: assessment.dimensions.find((dimension) => dimension.key === 'FUTURE_PLAN')?.score ?? 0,
          verdict: 'pending_human_review',
          finalFeedback: studentFeedback,
        },
      });

      await tx.aiInterviewSession.update({
        where: { id: sessionId },
        data: {
          status: 'completed',
          readinessScore: assessment.overallScore,
          riskLevel: 'human_review_required',
          completedAt: new Date(),
        },
      });

      await tx.studentEvent.create({
        data: {
          studentId: auth.studentId,
          eventType: 'VISA_AI_INTERVIEW_COMPLETED',
          payload: JSON.stringify({
            sessionId,
            answerCount: answers.length,
            assessmentId,
            engine: assessment.engine,
            verdict: assessment.verdict,
            humanReviewRequired: true,
          }),
        },
      });
      await tx.timelineEvent.create({
        data: {
          studentId: auth.studentId,
          stage: 'VISA_AI_INTERVIEW_COMPLETED',
          title: 'Interview practice session completed.',
          description: 'A preliminary practice assessment was produced and sent for counselor review. It is not a visa decision.',
          actor: auth.studentId,
        },
      });
    });

    return NextResponse.json(
      {
        success: true,
        sessionId,
        status: 'completed',
        assessmentId,
        assessmentStatus: 'pending_human_review',
        preliminary: {
          verdict: assessment.verdict,
          label: studentLabel,
          confidence: assessment.confidence,
          overallScore: assessment.overallScore,
          strengths: assessment.strengths,
          improvements: assessment.improvements,
          dimensions: assessment.dimensions,
          humanReviewRequired: true,
          limitations: assessment.limitations,
        },
        feedback: studentFeedback,
        note: 'This is a preliminary practice assessment produced by a fixed rubric. A counselor reviews it and may override it in full. It is not an embassy interview, a visa decision, or a guarantee.',
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ success: false, error: 'Interview practice could not be completed.' }, { status: 503 });
  }
}
