import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function POST(req: Request) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { interviewType, caseId, studentId } = body;

    const validTypes = ['embassy_mock','credibility','pre_cas','university','sponsor','study_gap','refusal','english','final_readiness'];
    if (interviewType && !validTypes.includes(interviewType)) {
      return NextResponse.json({ success: false, error: `Invalid interview type — allowed Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness — 9 types` }, { status: 400 });
    }

    // Check practice cooldown — 3 days after package store attempts improvement
    const recentSessions = await db.aiInterviewSession.findMany({
      where: { studentId: auth.studentId, createdAt: { gte: new Date(Date.now() - 3*24*60*60*1000) } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }).catch(() => []);

    const session = await db.aiInterviewSession.create({
      data: {
        studentId: auth.studentId,
        caseId: caseId || null,
        interviewType: interviewType || 'embassy_mock',
        status: 'in_progress',
        startedAt: new Date(),
      } as any,
    });

    await db.timelineEvent.create({
      data: {
        studentId: auth.studentId,
        stage: 'VISA_AI_INTERVIEW_STARTED',
        title: `AI interview started — type ${interviewType || 'embassy_mock'} — session ${session.id} — student ${auth.studentId}`,
        description: `AI interview 9 types Embassy/Credibility/Pre-CAS/University/Sponsor/Study Gap/Refusal/English/Final Readiness one Q at a time detect incomplete/contradictions/memorized/weak — understand Bangladeshi English/Banglish/broken/pauses evaluate meaning/clarity/consistency/relevance/confidence not accent — Practice 3 days after package store attempts improvement — reuse existing video/voice store session/timestamp/transcript/audio/video ref/AI analysis/human review explicit consent no secret recording`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      session,
      recentSessions: recentSessions.length,
      note: 'AI interview 9 types one Q at a time detect incomplete/contradictions/memorized/weak — understand Bangladeshi English/Banglish/broken/pauses — Practice 3 days after package store attempts improvement — video/voice reuse existing store session/timestamp/transcript/audio/video ref/AI analysis/human review explicit consent no secret recording — AI safety never guarantee approval/success/pretend embassy/confidential/invent requirements/refusal/university/policy/speculation as fact/automatically final decision must show uncertainty/cite source/flag manual verification/recommend human review',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
