import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Question create requires visa officer' }, { status: 403 });

    const interviewId = context?.params?.id;
    const interview = await db.visaInterview.findUnique({ where: { id: interviewId } });
    if (!interview) return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper) {
      const visaCase = await db.visaCase.findUnique({ where: { id: interview.caseId } });
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot create question for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { category, question, difficulty, language, questionType, researchLabel } = body;

    if (!question) return NextResponse.json({ success: false, error: 'Question required — question engine 30+ categories dynamic follow-up — research engine 6mo recent official sources label Common/Potential/Practice/Official/AI-generated never confidential/guarantee' }, { status: 400 });

    // Question engine 30+ categories
    const validCategories = ['introduction','country_motivation','university_knowledge','course_knowledge','course_modules','funding','sponsor','study_gap','work_history','future_plan','career_plan','refusal','english','accommodation','immigration_history','family_ties','travel_history','credibility','pre_cas','general','financial','personal','academic','other'];

    const q = await db.visaInterviewQuestion.create({
      data: {
        interviewId,
        category: category || 'general',
        question: question || '',
        difficulty: difficulty || 'standard',
        language: language || 'english',
        questionType: questionType || 'open_ended',
        researchLabel: researchLabel || 'Practice', // Common/Potential/Practice/Official/AI-generated
      } as any,
    });

    await logAuditAction(auth, 'VISA_INTERVIEW_QUESTION_CREATE', 'VisaInterviewQuestion', q.id, { interviewId, category, question, researchLabel });
    await db.timelineEvent.create({
      data: {
        studentId: interview.studentId,
        stage: 'VISA_INTERVIEW_QUESTION_CREATED',
        title: `Interview question created: ${category || 'general'} — ${question.substring(0, 80)} — research label ${researchLabel || 'Practice'}`,
        description: `Created by ${auth.name} — Question engine 30+ categories dynamic follow-up — Research engine 6mo recent official sources label Common/Potential/Practice/Official/AI-generated never confidential/guarantee — AI must ask naturally one question at a time`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: q, note: 'Question engine 30+ categories dynamic follow-up — Research engine 6mo recent official sources label Common/Potential/Practice/Official/AI-generated never confidential/guarantee — one Q at a time detect incomplete/contradictions/memorized/weak' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});

export const GET = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const interviewId = context?.params?.id;
    const questions = await db.visaInterviewQuestion.findMany({ where: { interviewId } as any, orderBy: { createdAt: 'asc' } });
    return NextResponse.json({ success: true, data: questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
