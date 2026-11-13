import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

const schema = z.object({
  question: z.string().trim().min(5).max(2000),
  answer: z.string().trim().min(1).max(5000),
  category: z.string().trim().max(80).optional(),
}).strict();

export async function POST(req: Request, context?: any) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;
    const sessionId = context?.params?.sessionId;
    if (typeof sessionId !== 'string' || !sessionId) return NextResponse.json({ success: false, error: 'Session ID required.' }, { status: 400 });
    const session = await db.aiInterviewSession.findFirst({ where: { id: sessionId, studentId: auth.studentId } });
    if (!session) return NextResponse.json({ success: false, error: 'Interview practice session not found.' }, { status: 404 });
    if (session.status !== 'in_progress') return NextResponse.json({ success: false, error: 'Interview practice session is not accepting answers.' }, { status: 409 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid interview response.', details: parsed.error.flatten() }, { status: 400 });

    const transcriptBase = (() => {
      try {
        const value = JSON.parse(session.transcript || '{}');
        return value && typeof value === 'object' ? value : {};
      } catch {
        return {};
      }
    })();
    const answerEntry = { question: parsed.data.question, answer: parsed.data.answer, category: parsed.data.category || 'general', recordedAt: new Date().toISOString() };
    const transcript = { ...transcriptBase, answers: [...(Array.isArray(transcriptBase.answers) ? transcriptBase.answers : []), answerEntry] };
    const flags = parsed.data.answer.trim().length < 40 ? ['short_response_for_practice'] : [];

    const saved = await db.$transaction(async (tx) => {
      const recorded = await tx.aiInterviewAnswer.create({
        data: { sessionId, question: parsed.data.question, answer: parsed.data.answer, transcript: parsed.data.answer, score: 0, feedback: 'Automated assessment is not enabled; ask an officer to review this practice response.', followUp: '' },
        select: { id: true, sessionId: true, question: true, answer: true, createdAt: true },
      });
      await tx.aiInterviewSession.update({ where: { id: sessionId }, data: { transcript: JSON.stringify(transcript) } });
      await tx.studentEvent.create({
        data: { studentId: auth.studentId, eventType: 'VISA_AI_INTERVIEW_ANSWER', payload: JSON.stringify({ sessionId, answerId: recorded.id, category: answerEntry.category, answerLength: parsed.data.answer.length, flags }) },
      });
      await tx.timelineEvent.create({
        data: { studentId: auth.studentId, stage: 'VISA_AI_INTERVIEW_ANSWER', title: 'Interview practice response saved.', description: 'Response saved privately for the student. No automated assessment was generated.', actor: auth.studentId },
      });
      return recorded;
    });

    return NextResponse.json({ success: true, data: saved, flags, assessmentStatus: 'human_review_required' }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Interview response could not be saved.' }, { status: 503 });
  }
}
