import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { loadAuthorizedVisaInterview } from '@/lib/visa/interview-access';

const categories = ['introduction', 'country_motivation', 'university_knowledge', 'course_knowledge', 'course_modules', 'funding', 'sponsor', 'study_gap', 'work_history', 'future_plan', 'career_plan', 'refusal', 'english', 'accommodation', 'immigration_history', 'family_ties', 'travel_history', 'credibility', 'pre_cas', 'general', 'financial', 'personal', 'academic', 'other'] as const;
const schema = z.object({
  category: z.enum(categories).default('general'),
  question: z.string().trim().min(5).max(2000),
  difficulty: z.enum(['basic', 'standard', 'strict', 'high_risk_review']).default('standard'),
  language: z.enum(['english', 'bangla', 'banglish']).default('english'),
  questionType: z.enum(['open_ended', 'follow_up', 'custom']).default('open_ended'),
  followUps: z.array(z.string().trim().min(1).max(1000)).max(5).default([]),
}).strict();

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const interviewId = context?.params?.id;
    if (typeof interviewId !== 'string' || !interviewId) return NextResponse.json({ success: false, error: 'Interview ID required.' }, { status: 400 });
    const access = await loadAuthorizedVisaInterview(auth, interviewId, 'visa.interviews.update');
    if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid interview question.', details: parsed.error.flatten() }, { status: 400 });

    const question = await db.$transaction(async (tx) => {
      const created = await tx.visaInterviewQuestion.create({
        data: {
          interviewId,
          caseId: access.visaCase.id,
          category: parsed.data.category,
          question: parsed.data.question,
          difficulty: parsed.data.difficulty,
          language: parsed.data.language,
          questionType: parsed.data.questionType,
          followUps: JSON.stringify(parsed.data.followUps),
          researchLabel: 'Practice',
        },
      });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_INTERVIEW_QUESTION_CREATE', entityType: 'VisaInterviewQuestion', entityId: created.id, metadata: JSON.stringify({ interviewId, caseId: access.visaCase.id, category: created.category, questionLength: created.question.length }), ipAddress: '', userAgent: '' },
      });
      return created;
    });
    return NextResponse.json({ success: true, data: question }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Interview question could not be saved; any audit failure rolled back.' }, { status: 503 });
  }
});

export const GET = withAuth(async (_req: Request, auth: AuthContext, context?: any) => {
  try {
    const interviewId = context?.params?.id;
    if (typeof interviewId !== 'string' || !interviewId) return NextResponse.json({ success: false, error: 'Interview ID required.' }, { status: 400 });
    const access = await loadAuthorizedVisaInterview(auth, interviewId, 'visa.interviews.view');
    if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    const questions = await db.visaInterviewQuestion.findMany({ where: { interviewId }, orderBy: { createdAt: 'asc' } });
    await db.portalAuditLog.create({
      data: { actorUserId: auth.actorUserId, action: 'VISA_INTERVIEW_QUESTIONS_VIEW', entityType: 'VisaInterview', entityId: interviewId, metadata: JSON.stringify({ caseId: access.visaCase.id, count: questions.length }), ipAddress: '', userAgent: '' },
    });
    return NextResponse.json({ success: true, data: questions }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Interview questions could not be audited or loaded.' }, { status: 503 });
  }
});
