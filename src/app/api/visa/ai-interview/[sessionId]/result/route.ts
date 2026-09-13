import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';

export async function GET(req: Request, context?: any) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;

    const sessionId = context?.params?.sessionId;
    const session = await db.aiInterviewSession.findUnique({ where: { id: sessionId } });
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });

    if (session.studentId !== auth.studentId) {
      return NextResponse.json({ success: false, error: 'Cross-student blocked — IDOR blocked' }, { status: 403 });
    }

    const result = await db.aiInterviewResult.findUnique({ where: { sessionId } });
    const answers = await db.aiInterviewAnswer.findMany({ where: { sessionId }, orderBy: { createdAt: 'asc' } }).catch(() => []);

    if (!result) {
      return NextResponse.json({ success: false, error: 'Result not found — AI provides preliminary analysis only, human officer remains responsible for final internal assessment — AI cannot automatically make final visa/admission decision — must show uncertainty/cite source/flag manual verification/recommend human review' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      result,
      answers,
      session,
      note: 'Scorecard 12 scores AI preliminary only human final — AI safety never guarantee approval/success/pretend embassy/confidential/invent requirements/refusal/university/policy/speculation as fact/automatically final decision must show uncertainty/cite source/flag manual verification/recommend human review — Interview prep doc branded question/answer framework/student answer/AI suggestion no memorized false truthful consistent — Financial/future plan framework real info no fabrication salary/balance/income/employment/job/assets/travel/academic',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
}
