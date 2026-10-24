import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateStudentRequest } from '@/lib/student-auth';
import { canPractise, configuredWindowHours, describePracticeWindow } from '@/lib/interview/practice-window';

const schema = z.object({
  interviewType: z.enum(['embassy_mock', 'credibility', 'pre_cas', 'university', 'sponsor', 'study_gap', 'refusal', 'english', 'final_readiness']).default('embassy_mock'),
  caseId: z.string().trim().max(191).optional(),
  language: z.enum(['english', 'bangla', 'banglish']).default('english'),
  difficulty: z.enum(['basic', 'standard', 'strict', 'high_risk_review']).default('standard'),
}).strict();

export async function POST(req: Request) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid interview practice request.', details: parsed.error.flatten() }, { status: 400 });

    if (parsed.data.caseId) {
      const visaCase = await db.visaCase.findFirst({ where: { id: parsed.data.caseId, studentId: auth.studentId }, select: { id: true } });
      if (!visaCase) return NextResponse.json({ success: false, error: 'Visa case not found for this student.' }, { status: 404 });
    }
    // Practice window (spec §38). Enforcement only applies when a window has
    // been opened for this student, so existing flows keep working; once it has
    // lapsed, new sessions stop until a counselor extends it. Recorded practice
    // is never deleted.
    const practiceWindow = await db.interviewPracticeWindow.findUnique({
      where: { studentId_applicationId: { studentId: auth.studentId, applicationId: '' } },
      select: { startsAt: true, expiresAt: true, extendedUntil: true, closedAt: true },
    });
    if (practiceWindow) {
      const windowState = describePracticeWindow(practiceWindow, new Date(), configuredWindowHours());
      if (!canPractise(windowState)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Your interview practice window has ended. Ask your counselor for an extension — your practice history is kept.',
            window: windowState,
            canPractise: false,
          },
          { status: 403, headers: { 'Cache-Control': 'no-store' } },
        );
      }
    }

    const recentSessions = await db.aiInterviewSession.count({
      where: { studentId: auth.studentId, createdAt: { gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } },
    });

    const session = await db.$transaction(async (tx) => {
      const created = await tx.aiInterviewSession.create({
        data: {
          studentId: auth.studentId,
          caseId: parsed.data.caseId || '',
          interviewType: parsed.data.interviewType,
          status: 'in_progress',
          riskLevel: 'human_review_required',
          transcript: JSON.stringify({ language: parsed.data.language, difficulty: parsed.data.difficulty, answers: [] }),
        },
        select: { id: true, interviewType: true, status: true, startedAt: true, createdAt: true },
      });
      await tx.studentEvent.create({
        data: { studentId: auth.studentId, eventType: 'VISA_AI_INTERVIEW_STARTED', payload: JSON.stringify({ sessionId: created.id, caseId: parsed.data.caseId || null, interviewType: parsed.data.interviewType }) },
      });
      await tx.timelineEvent.create({
        data: { studentId: auth.studentId, stage: 'VISA_AI_INTERVIEW_STARTED', title: 'Visa interview practice started.', description: 'Practice session only. No embassy representation, visa decision, or automated readiness score is provided.', actor: auth.studentId },
      });
      return created;
    });

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      session,
      recentSessions,
      assessmentStatus: 'human_review_required',
      note: 'A saved practice session is available. Automated AI assessment is not enabled; do not treat practice as an embassy interview, official guidance, eligibility result, or visa guarantee.',
    }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Interview practice session could not be started.' }, { status: 503 });
  }
}
