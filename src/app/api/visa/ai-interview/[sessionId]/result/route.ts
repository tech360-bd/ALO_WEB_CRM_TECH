import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function GET(_req: Request, context?: any) {
  try {
    const auth = await authenticateStudentRequest(_req);
    if (auth instanceof NextResponse) return auth;
    const sessionId = context?.params?.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) return NextResponse.json({ success: false, error: 'Session ID required.' }, { status: 400 });
    const session = await db.aiInterviewSession.findFirst({
      where: { id: sessionId, studentId: auth.studentId },
      select: { id: true, interviewType: true, status: true, startedAt: true, completedAt: true },
    });
    if (!session) return NextResponse.json({ success: false, error: 'Interview practice session not found.' }, { status: 404 });
    const [result, answers] = await Promise.all([
      db.aiInterviewResult.findUnique({ where: { sessionId }, select: { sessionId: true, finalFeedback: true, createdAt: true } }),
      db.aiInterviewAnswer.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' }, select: { id: true, question: true, answer: true, createdAt: true } }),
    ]);
    await db.studentEvent.create({
      data: { studentId: auth.studentId, eventType: 'VISA_AI_INTERVIEW_RESULT_VIEW', payload: JSON.stringify({ sessionId, answerCount: answers.length }) },
    });
    return NextResponse.json({
      success: true,
      result: result ? { finalFeedback: result.finalFeedback, createdAt: result.createdAt, automatedScoreAvailable: false } : null,
      answers,
      session,
      assessmentStatus: session.status === 'completed' ? 'pending_officer_review' : 'in_progress',
      note: 'Only this student’s practice transcript and student-safe message are returned. No internal risk score, officer note, or visa decision is exposed.',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Interview practice result could not be audited or loaded.' }, { status: 503 });
  }
}
