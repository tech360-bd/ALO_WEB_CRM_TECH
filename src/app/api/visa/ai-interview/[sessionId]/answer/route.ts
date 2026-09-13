import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiChat } from '@/lib/ai';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function POST(req: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const { sessionId } = await context.params;
    const body = await req.json();
    const question = String(body.question || '').trim();
    const answer = String(body.answer || '').trim();
    if (!question || !answer) return NextResponse.json({ success: false, error: 'question and answer are required' }, { status: 400 });

    const session = await db.aiInterviewSession.findFirst({ where: { id: sessionId, studentId: auth.studentId } });
    if (!session) return NextResponse.json({ success: false, error: 'Interview session not found' }, { status: 404 });
    if (session.status !== 'in_progress') return NextResponse.json({ success: false, error: 'Interview session is no longer active' }, { status: 409 });

    const raw = await aiChat([
      {
        role: 'system',
        content: 'You evaluate student visa interview practice answers. Return only valid JSON with score (0-100 integer), strengths (short string), improvements (short string), and verdict (one of strong, adequate, needs_work). Do not infer facts not present in the answer. Evaluate relevance, specificity, credibility, and clarity; do not penalize a non-native accent.',
      },
      {
        role: 'user',
        content: JSON.stringify({ question, answer }),
      },
    ]);

    let evaluation: { score: number; strengths: string; improvements: string; verdict: string };
    try {
      const parsed = JSON.parse(raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')) as Partial<typeof evaluation>;
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.score))));
      if (!Number.isFinite(score) || !parsed.strengths || !parsed.improvements) throw new Error('Invalid AI evaluation');
      evaluation = { score, strengths: String(parsed.strengths), improvements: String(parsed.improvements), verdict: String(parsed.verdict || 'adequate') };
    } catch {
      return NextResponse.json({ success: false, error: 'AI evaluation returned an invalid response; please retry.' }, { status: 502 });
    }

    const recorded = await db.aiInterviewAnswer.create({
      data: { sessionId, question, answer, followUp: '', score: evaluation.score, feedback: JSON.stringify(evaluation) },
    });
    return NextResponse.json({ success: true, data: recorded, evaluation });
  } catch (error) {
    console.error('[visa.ai-interview.answer]', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to evaluate answer' }, { status: 500 });
  }
}
