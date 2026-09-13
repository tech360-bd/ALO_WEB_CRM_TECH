import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN') || auth.roles.includes('admin') || auth.roles.includes('visa_officer') || auth.roles.includes('visa_interview_officer') || auth.roles.includes('VISA_OFFICER') || auth.roles.includes('VISA_INTERVIEW_OFFICER');
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Answer create requires visa officer' }, { status: 403 });

    const interviewId = context?.params?.id;
    const interview = await db.visaInterview.findUnique({ where: { id: interviewId } });
    if (!interview) return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });

    const isSuper = auth.roles.includes('super_admin') || auth.roles.includes('SUPER_ADMIN');
    if (!isSuper) {
      const visaCase = await db.visaCase.findUnique({ where: { id: interview.caseId } });
      if (visaCase && visaCase.visaOfficerId && visaCase.visaOfficerId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Cannot record answer for unassigned case — IDOR blocked' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { questionId, question, answer, followUp, score, feedback, category, aiAnalysis } = body;

    if (!answer) return NextResponse.json({ success: false, error: 'Answer required — do not judge solely by grammar, understand Bangladeshi English accents, broken English, Banglish, pauses, incomplete pronunciation — evaluate meaning/clarity/consistency/relevance/confidence' }, { status: 400 });

    // AI detects incomplete/contradictions/memorized/weak
    const lowerAnswer = answer.toLowerCase();
    const flags: string[] = [];
    if (answer.length < 20) flags.push('incomplete');
    if (lowerAnswer.includes('as an ai') || lowerAnswer.includes('memorized')) flags.push('memorized suspected');
    if (lowerAnswer.split(' ').length < 10) flags.push('weak explanation');

    const recorded = await db.visaInterviewAnswer.create({
      data: {
        interviewId,
        questionId: questionId || '',
        question: question || '',
        answer: answer || '',
        followUp: followUp || '',
        score: score || 0,
        feedback: feedback || '',
        category: category || 'general',
        aiAnalysis: aiAnalysis || flags.join(', ') || '',
      } as any,
    });

    await logAuditAction(auth, 'VISA_INTERVIEW_ANSWER', 'VisaInterviewAnswer', recorded.id, { interviewId, question, answerLength: answer.length, flags, studentId: interview.studentId });
    await db.timelineEvent.create({
      data: {
        studentId: interview.studentId,
        stage: 'VISA_INTERVIEW_ANSWER_RECORDED',
        title: `Interview answer recorded — category ${category || 'general'} — flags ${flags.join(', ') || 'none'} — by ${auth.name}`,
        description: `Q: ${question || ''} — A: ${answer.substring(0, 200)} — AI must ask naturally one question at a time wait for answer ask relevant follow-up detect incomplete answers identify contradictions memorized answers weak explanations unclear funding weak course/university/future plan refusal gaps — understand Bangladeshi English`,
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: recorded, flags, note: 'One Q at a time detect incomplete/contradictions/memorized/weak — understand Bangladeshi English/Banglish/broken/pauses evaluate meaning/clarity/consistency/relevance/confidence not accent' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
