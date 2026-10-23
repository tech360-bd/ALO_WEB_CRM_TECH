import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { loadAuthorizedVisaInterview } from '@/lib/visa/interview-access';

const schema = z.object({
  questionId: z.string().trim().max(191).optional(),
  question: z.string().trim().max(2000).optional(),
  answer: z.string().trim().min(1).max(5000),
  category: z.string().trim().max(80).optional(),
}).strict();

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const interviewId = context?.params?.id;
    if (typeof interviewId !== 'string' || !interviewId) return NextResponse.json({ success: false, error: 'Interview ID required.' }, { status: 400 });
    const access = await loadAuthorizedVisaInterview(auth, interviewId, 'visa.interviews.update');
    if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    if (String(access.interview.status).toLowerCase() === 'completed') return NextResponse.json({ success: false, error: 'Completed interviews are read-only.' }, { status: 409 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid interview answer.', details: parsed.error.flatten() }, { status: 400 });

    let questionText = parsed.data.question || '';
    let category = parsed.data.category || 'general';
    if (parsed.data.questionId) {
      const question = await db.visaInterviewQuestion.findFirst({ where: { id: parsed.data.questionId, interviewId } });
      if (!question) return NextResponse.json({ success: false, error: 'Question does not belong to this interview.' }, { status: 400 });
      questionText = question.question;
      category = question.category;
    }
    if (!questionText) return NextResponse.json({ success: false, error: 'Provide a saved question ID or an officer-authored custom question.' }, { status: 400 });

    const flags = parsed.data.answer.length < 40 ? ['short_response_for_officer_review'] : [];
    const recorded = await db.$transaction(async (tx) => {
      const result = await tx.visaInterviewAnswer.create({
        data: { interviewId, questionId: parsed.data.questionId || '', question: questionText, answer: parsed.data.answer, category, score: 0, feedback: 'Pending human officer review.', aiAnalysis: JSON.stringify({ automatedAssessment: false, flags }) },
      });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_INTERVIEW_ANSWER', entityType: 'VisaInterviewAnswer', entityId: result.id, metadata: JSON.stringify({ interviewId, caseId: access.visaCase.id, studentId: access.visaCase.studentId, answerLength: parsed.data.answer.length, flags }), ipAddress: '', userAgent: '' },
      });
      await tx.timelineEvent.create({
        data: { studentId: access.visaCase.studentId, stage: 'VISA_INTERVIEW_ANSWER_RECORDED', title: 'Visa preparation interview response recorded.', description: 'Response saved for human officer review. Automated readiness or visa decision was not produced.', actor: auth.actorUserId },
      });
      return result;
    });
    return NextResponse.json({ success: true, data: recorded, flags, assessmentStatus: 'human_review_required' }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Interview response could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});
