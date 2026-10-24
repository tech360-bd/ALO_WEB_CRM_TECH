import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCanonicalCounselor, counselorStudentScope } from '@/lib/counselor/student-access';
import { canViewUccB2B } from '@/lib/ucc/document-access';
import { isFinalVerdict, reviewOutcome, FINAL_VERDICTS } from '@/lib/interview/preliminary-assessment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Human review of interview practice assessments (spec §41).
 *
 * GET  — the reviewer queue: preliminary assessments inside the caller's
 *        student scope, plus recent decisions with who made them.
 * POST — record the final decision. The AI verdict is read from the database,
 *        not from the request, so a caller cannot claim the machine said
 *        something it did not. Decisions are append-only: a correction adds a
 *        superseding row and requires a reason, and the assessment keeps a
 *        pointer to the decision that is currently in force.
 *
 * Reviews are the one place a practice assessment becomes "final", so the
 * rationale is mandatory and a student-facing message is required whenever the
 * human overrides the rubric (otherwise the student would be told nothing).
 */

const JSON_FIELDS = ['dimensions', 'strengths', 'improvements', 'evidence', 'limitations'] as const;

function parseList(value: string | null | undefined): unknown[] {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function shapeAssessment(row: {
  id: string;
  sessionId: string;
  studentId: string;
  engine: string;
  engineVersion: string;
  verdict: string;
  confidence: string;
  overallScore: number;
  dimensions: string;
  strengths: string;
  improvements: string;
  evidence: string;
  limitations: string;
  answerCount: number;
  averageWords: number;
  reviewStatus: string;
  finalVerdict: string | null;
  studentMessage: string;
  reviewedByName: string;
  reviewedAt: Date | null;
  generatedAt: Date;
}) {
  return {
    id: row.id,
    sessionId: row.sessionId,
    studentRecordId: row.studentId,
    engine: row.engine,
    engineVersion: row.engineVersion,
    preliminaryVerdict: row.verdict,
    confidence: row.confidence,
    overallScore: row.overallScore,
    answerCount: row.answerCount,
    averageWords: row.averageWords,
    reviewStatus: row.reviewStatus,
    finalVerdict: row.finalVerdict,
    studentMessage: row.studentMessage,
    reviewedByName: row.reviewedByName,
    reviewedAt: row.reviewedAt,
    generatedAt: row.generatedAt,
    overridden: Boolean(row.finalVerdict && row.finalVerdict !== row.verdict),
    dimensions: parseList(row.dimensions),
    strengths: parseList(row.strengths),
    improvements: parseList(row.improvements),
    evidence: parseList(row.evidence),
    limitations: parseList(row.limitations),
  };
}

export const GET = async (request: Request) => {
  const auth = await requireCanonicalCounselor(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const scope = counselorStudentScope(auth);

    const students = await db.student.findMany({
      where: scope,
      select: { id: true, studentId: true, name: true },
      take: 500,
    });

    if (students.length === 0) {
      return NextResponse.json(
        { counts: { pending: 0, reviewed: 0, overridden: 0 }, pending: [], recent: [] },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }

    let visible = students;
    if (!canViewUccB2B(auth)) {
      const confidential = await db.application.findMany({
        where: { studentId: { in: students.map((student) => student.id) }, isB2bConfidential: true },
        select: { studentId: true },
      });
      const hidden = new Set(confidential.map((row) => row.studentId));
      visible = students.filter((student) => !hidden.has(student.id));
    }

    if (visible.length === 0) {
      return NextResponse.json(
        { counts: { pending: 0, reviewed: 0, withDecision: 0 }, pending: [], recent: [] },
        { headers: { 'Cache-Control': 'private, no-store' } },
      );
    }

    const byId = new Map(visible.map((student) => [student.id, student]));
    const ids = visible.map((student) => student.id);

    const where = { studentId: { in: ids }, ...(status === 'pending' ? { reviewStatus: 'PENDING' } : status === 'reviewed' ? { reviewStatus: { not: 'PENDING' } } : {}) };

    const [rows, pendingCount, reviewedCount, overriddenCount] = await Promise.all([
      db.interviewAssessment.findMany({ where, orderBy: { generatedAt: 'desc' }, take: 100 }),
      db.interviewAssessment.count({ where: { studentId: { in: ids }, reviewStatus: 'PENDING' } }),
      db.interviewAssessment.count({ where: { studentId: { in: ids }, reviewStatus: { not: 'PENDING' } } }),
      db.interviewAssessment.count({ where: { studentId: { in: ids }, finalVerdict: { not: null } } }),
    ]);

    const shaped = rows.map((row) => ({
      ...shapeAssessment(row),
      student: byId.get(row.studentId)
        ? { studentId: byId.get(row.studentId)!.studentId, name: byId.get(row.studentId)!.name }
        : null,
    }));

    return NextResponse.json(
      {
        verdicts: FINAL_VERDICTS,
        counts: { pending: pendingCount, reviewed: reviewedCount, withDecision: overriddenCount },
        pending: shaped.filter((row) => row.reviewStatus === 'PENDING'),
        recent: shaped.filter((row) => row.reviewStatus !== 'PENDING').slice(0, 50),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'The interview review queue is temporarily unavailable.' }, { status: 503 });
  }
};

export const POST = async (request: Request) => {
  const auth = await requireCanonicalCounselor(request);
  if (auth instanceof NextResponse) return auth;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }

  const input = body as Record<string, unknown>;
  const assessmentId = typeof input.assessmentId === 'string' ? input.assessmentId.trim() : '';
  const finalVerdict = input.finalVerdict;
  const rationale = typeof input.rationale === 'string' ? input.rationale.trim() : '';
  const studentMessage = typeof input.studentMessage === 'string' ? input.studentMessage.trim() : '';
  const internalNotes = typeof input.internalNotes === 'string' ? input.internalNotes.trim() : '';
  const revise = input.revise === true;

  if (!assessmentId) return NextResponse.json({ error: 'assessmentId is required.' }, { status: 400 });
  if (!isFinalVerdict(finalVerdict)) {
    return NextResponse.json({ error: `finalVerdict must be one of ${FINAL_VERDICTS.join(', ')}.` }, { status: 400 });
  }
  if (rationale.length < 20 || rationale.length > 2000) {
    return NextResponse.json({ error: 'A rationale of 20–2000 characters is required for the audit trail.' }, { status: 400 });
  }
  if (studentMessage.length > 2000) {
    return NextResponse.json({ error: 'studentMessage is too long.' }, { status: 400 });
  }
  if (internalNotes.length > 4000) {
    return NextResponse.json({ error: 'internalNotes is too long.' }, { status: 400 });
  }

  try {
    const assessment = await db.interviewAssessment.findUnique({ where: { id: assessmentId } });
    if (!assessment) return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });

    const scope = counselorStudentScope(auth);
    const student = await db.student.findFirst({
      where: { AND: [{ id: assessment.studentId }, scope] },
      select: { id: true, studentId: true, name: true, counselorId: true },
    });
    if (!student) return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });

    if (!canViewUccB2B(auth)) {
      const confidential = await db.application.findFirst({
        where: { studentId: assessment.studentId, isB2bConfidential: true },
        select: { id: true },
      });
      if (confidential) return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase());
    if (assessment.reviewStatus !== 'PENDING' && !revise) {
      return NextResponse.json(
        { error: 'This assessment already has a final decision. Ask an administrator to revise it.', reviewStatus: assessment.reviewStatus, finalVerdict: assessment.finalVerdict },
        { status: 409 },
      );
    }
    if (assessment.reviewStatus !== 'PENDING' && revise && !isAdmin) {
      return NextResponse.json({ error: 'Only an administrator can revise a final decision.' }, { status: 403 });
    }

    if (studentMessage.length === 0 && finalVerdict !== assessment.verdict) {
      return NextResponse.json(
        { error: 'A student-facing message is required when you override the preliminary verdict.' },
        { status: 400 },
      );
    }

    const outcome = reviewOutcome(assessment.verdict, finalVerdict);
    const now = new Date();
    const reviewerName = (auth as { name?: string }).name || auth.userId;

    const previous = revise
      ? await db.interviewReviewDecision.findFirst({
          where: { assessmentId },
          orderBy: { decidedAt: 'desc' },
          select: { id: true },
        })
      : null;

    const [decision] = await db.$transaction([
      db.interviewReviewDecision.create({
        data: {
          assessmentId,
          sessionId: assessment.sessionId,
          studentId: assessment.studentId,
          aiVerdict: assessment.verdict,
          finalVerdict,
          overridden: outcome.overridden,
          direction: outcome.direction,
          rationale,
          studentMessage,
          internalNotes,
          reviewerId: auth.userId,
          reviewerName,
          reviewerRole: auth.userType,
          supersedesId: previous?.id ?? '',
        },
      }),
      db.interviewAssessment.update({
        where: { id: assessmentId },
        data: {
          reviewStatus: 'REVIEWED',
          finalVerdict,
          studentMessage,
          reviewedById: auth.userId,
          reviewedByName: reviewerName,
          reviewedAt: now,
        },
      }),
      db.studentEvent.create({
        data: {
          studentId: assessment.studentId,
          eventType: 'INTERVIEW_ASSESSMENT_REVIEWED',
          payload: JSON.stringify({
            assessmentId,
            sessionId: assessment.sessionId,
            aiVerdict: assessment.verdict,
            finalVerdict,
            overridden: outcome.overridden,
            direction: outcome.direction,
            revised: Boolean(previous),
          }),
        },
      }),
      db.timelineEvent.create({
        data: {
          studentId: assessment.studentId,
          stage: 'INTERVIEW_ASSESSMENT_REVIEWED',
          title: outcome.overridden ? 'Interview practice assessment reviewed and adjusted.' : 'Interview practice assessment reviewed.',
          description: studentMessage || 'A counselor has reviewed the practice assessment.',
          actor: auth.userId,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        decision: {
          id: decision.id,
          aiVerdict: decision.aiVerdict,
          finalVerdict: decision.finalVerdict,
          overridden: decision.overridden,
          direction: decision.direction,
          reviewerName: decision.reviewerName,
          decidedAt: decision.decidedAt,
        },
        student: { studentId: student.studentId, name: student.name },
        note: outcome.overridden
          ? 'The final verdict supersedes the preliminary rubric result and the student has been told why.'
          : 'The preliminary result was confirmed. The student has been notified.',
      },
      { status: 201, headers: { 'Cache-Control': 'no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'The review decision could not be saved.' }, { status: 503 });
  }
};
