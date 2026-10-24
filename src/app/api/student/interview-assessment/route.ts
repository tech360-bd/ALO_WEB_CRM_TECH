import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';
import { preliminaryStudentLabel } from '@/lib/interview/preliminary-assessment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The student's own interview assessments (spec §41).
 *
 * Two states are kept strictly apart:
 *   - PENDING  → the preliminary rubric result, prefixed "Preliminary" and
 *                accompanied by the reviewer-pending notice.
 *   - REVIEWED → the counselor's verdict, who made it and what they told the
 *                student. The preliminary score is still shown so the student
 *                can see when a human changed it, but the final verdict leads.
 *
 * Internal notes, reviewer IDs and the rationale for internal use are never
 * returned; only the message written for the student.
 */
export const GET = withStudentAuth(async (_request, auth) => {
  try {
    const rows = await db.interviewAssessment.findMany({
      where: { studentId: auth.studentId },
      orderBy: { generatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        sessionId: true,
        verdict: true,
        confidence: true,
        overallScore: true,
        dimensions: true,
        strengths: true,
        improvements: true,
        limitations: true,
        answerCount: true,
        averageWords: true,
        reviewStatus: true,
        finalVerdict: true,
        studentMessage: true,
        reviewedByName: true,
        reviewedAt: true,
        generatedAt: true,
      },
    });

    const parse = (value: string) => {
      try {
        const parsed = JSON.parse(value || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    return NextResponse.json(
      {
        assessments: rows.map((row) => {
          const reviewed = row.reviewStatus !== 'PENDING';
          return {
            id: row.id,
            sessionId: row.sessionId,
            status: reviewed ? 'REVIEWED' : 'PENDING',
            preliminary: {
              verdict: row.verdict,
              label: preliminaryStudentLabel(row.verdict),
              score: row.overallScore,
              confidence: row.confidence,
              strengths: parse(row.strengths),
              improvements: parse(row.improvements),
              dimensions: parse(row.dimensions),
              limitations: parse(row.limitations),
              generatedAt: row.generatedAt,
            },
            final: reviewed
              ? {
                  verdict: row.finalVerdict,
                  counselor: row.reviewedByName,
                  reviewedAt: row.reviewedAt,
                  message: row.studentMessage,
                  changedFromPreliminary: Boolean(row.finalVerdict && row.finalVerdict !== row.verdict),
                }
              : null,
            answerCount: row.answerCount,
            averageWords: row.averageWords,
          };
        }),
        pendingReview: rows.some((row) => row.reviewStatus === 'PENDING'),
        note: rows.some((row) => row.reviewStatus === 'PENDING')
          ? 'A preliminary result is waiting for counselor review. It is not final and may change.'
          : 'Reviewed results come from a named counselor. Practice feedback is not a visa decision or a guarantee.',
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Your interview assessments are temporarily unavailable.' }, { status: 503 });
  }
});
