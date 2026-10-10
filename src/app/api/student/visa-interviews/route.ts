import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/visa-interviews
 *
 * Returns the credibility / mock interview sessions recorded against the
 * caller's own student record. Scoped by session studentId.
 *
 * Officer-facing fields (officerId, escalation) are deliberately not returned;
 * the student sees the outcome and the feedback written for them.
 */
export const GET = withStudentAuth(async (_request, auth) => {
  try {
    const interviews = await db.visaInterview.findMany({
      where: { studentId: auth.studentId },
      orderBy: { scheduledAt: 'desc' },
      select: {
        id: true,
        interviewType: true,
        difficulty: true,
        language: true,
        status: true,
        scheduledAt: true,
        completedAt: true,
        overallScore: true,
        verdict: true,
        readiness: true,
        officerNotes: true,
        finalAssessment: true,
        strengths: true,
        weaknesses: true,
        improvements: true,
        documentsRequired: true,
      },
    });

    const questions = await db.visaInterviewAnswer.findMany({
      where: { interview: { studentId: auth.studentId } },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      success: true,
      interviews,
      answers: questions,
      total: interviews.length,
    });
  } catch (error) {
    console.error('Student Visa Interviews GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not load your interview records' },
      { status: 500 },
    );
  }
});
