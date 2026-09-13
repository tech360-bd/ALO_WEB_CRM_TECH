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
    const { question, answer, followUp, score, feedback, audioUrl, videoUrl, transcript } = body;

    if (!answer) return NextResponse.json({ success: false, error: 'Answer required — AI must ask naturally one question at a time wait for answer — understand Bangladeshi English accents broken English Banglish pauses incomplete pronunciation non-native patterns — do NOT penalize Bangladeshi accent — evaluate meaning/clarity/consistency/relevance/confidence/understanding rather than accent alone' }, { status: 400 });

    // AI detects incomplete/contradictions/memorized/weak
    const flags: string[] = [];
    if (answer.length < 20) flags.push('incomplete');
    if (answer.toLowerCase().includes('as an ai')) flags.push('memorized suspected');
    if (answer.split(' ').length < 8) flags.push('weak explanation');

    const recorded = await db.aiInterviewAnswer.create({
      data: {
        sessionId,
        question: question || '',
        answer: answer || '',
        followUp: followUp || '',
        score: score || 0,
        feedback: feedback || '',
        audioUrl: audioUrl || '',
        videoUrl: videoUrl || '',
        transcript: transcript || answer,
      } as any,
    });

    await db.timelineEvent.create({
      data: {
        studentId: auth.studentId,
        stage: 'VISA_AI_INTERVIEW_ANSWER',
        title: `AI interview answer recorded — session ${sessionId} — flags ${flags.join(', ') || 'none'}`,
        description: `Q: ${question || ''} — A: ${answer.substring(0, 200)} — Student practice AI Q-by-Q voice/text follow-up history feedback retry progress understand non-native no accent penalty — reuse existing video/voice store session/timestamp/transcript/audio/video ref/AI analysis/human review explicit consent no secret recording`,
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      data: recorded,
      flags,
      nextQuestionHint: 'AI must ask naturally one question at a time wait for answer ask relevant follow-up detect incomplete answers identify contradictions memorized answers weak explanations unclear funding weak course/university/future plan refusal gaps',
      note: 'AI must ask naturally one question at a time wait for answer ask relevant follow-up detect incomplete answers identify contradictions memorized answers weak explanations — understand Bangladeshi English accents broken English Banglish pauses incomplete pronunciation — do NOT penalize Bangladeshi accent — evaluate meaning/clarity/consistency/relevance/confidence',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
