import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { loadAuthorizedVisaInterview } from '@/lib/visa/interview-access';

const schema = z.object({
  overallScore: z.number().min(0).max(100),
  readiness: z.enum(['ready', 'needs_practice', 'needs_documents', 'high_risk', 'human_review_required']),
  officerNotes: z.string().trim().max(5000).optional(),
  finalAssessment: z.string().trim().max(5000).optional(),
  strengths: z.string().trim().max(3000).optional(),
  weaknesses: z.string().trim().max(3000).optional(),
  improvements: z.string().trim().max(3000).optional(),
  documentsRequired: z.string().trim().max(2000).optional(),
  secondInterview: z.boolean().optional(),
  escalation: z.boolean().optional(),
}).strict();

export const POST = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    if (typeof id !== 'string' || !id) return NextResponse.json({ success: false, error: 'Interview ID required.' }, { status: 400 });
    const access = await loadAuthorizedVisaInterview(auth, id, 'visa.interviews.finish');
    if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
    if (String(access.interview.status).toLowerCase() === 'completed') return NextResponse.json({ success: false, error: 'Interview is already completed; use an audited correction workflow.' }, { status: 409 });
    const parsed = schema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'A human officer score and internal readiness result are required.', details: parsed.error.flatten() }, { status: 400 });

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.visaInterview.update({
        where: { id },
        data: {
          overallScore: parsed.data.overallScore,
          readiness: parsed.data.readiness,
          verdict: parsed.data.readiness,
          officerNotes: parsed.data.officerNotes || '',
          finalAssessment: parsed.data.finalAssessment || '',
          strengths: parsed.data.strengths || '',
          weaknesses: parsed.data.weaknesses || '',
          improvements: parsed.data.improvements || '',
          documentsRequired: parsed.data.documentsRequired || '',
          secondInterview: parsed.data.secondInterview ?? false,
          escalation: parsed.data.escalation ?? false,
          status: 'completed',
          completedAt: new Date(),
        },
      });
      await tx.visaMockResult.upsert({
        where: { interviewId: id },
        create: { interviewId: id, caseId: access.visaCase.id, studentId: access.visaCase.studentId, country: access.visaCase.destinationCountry, difficulty: access.interview.difficulty, language: access.interview.language, score: parsed.data.overallScore, verdict: parsed.data.readiness, feedback: '' },
        update: { score: parsed.data.overallScore, verdict: parsed.data.readiness, feedback: '' },
      });
      await tx.portalAuditLog.create({
        data: { actorUserId: auth.actorUserId, action: 'VISA_INTERVIEW_FINISH', entityType: 'VisaInterview', entityId: id, metadata: JSON.stringify({ caseId: access.visaCase.id, studentId: access.visaCase.studentId, scoreRecorded: true, readiness: parsed.data.readiness }), ipAddress: '', userAgent: '' },
      });
      await tx.timelineEvent.create({
        data: { studentId: access.visaCase.studentId, stage: 'VISA_INTERVIEW_COMPLETED', title: 'Visa preparation interview completed.', description: 'A human officer recorded an internal preparation assessment. This is not an embassy interview or visa decision.', actor: auth.actorUserId },
      });
      return updated;
    });
    return NextResponse.json({ success: true, data: result, note: 'Human officer assessment saved as internal preparation feedback; not an automated visa decision or guarantee.' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[visa-interview-finish] failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Interview could not be completed; any audit failure rolled back.' }, { status: 503 });
  }
});
