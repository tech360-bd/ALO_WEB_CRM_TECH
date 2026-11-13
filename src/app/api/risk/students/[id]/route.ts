import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { assessStudentSuccess, SUCCESS_SCORE_DISCLAIMER } from '@/lib/risk/student-success-score';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// GET  /api/risk/students/[id] — student success score (spec s112)
// POST /api/risk/students/[id] — recompute and persist
//
// A student may read their OWN score. The disclaimer is always returned so no
// client can present the score as an admission or visa prediction (s15/s93).
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];
type RouteContext = { params: Promise<{ id: string }> };

async function authorizedForStudent(auth: { userType: string; userId: string }, studentId: string) {
  if (STAFF_TYPES.includes(auth.userType)) return true;
  if (auth.userType !== 'STUDENT') return false;
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });
  return Boolean(student?.userId) && student?.userId === auth.userId;
}

export const GET = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const url = new URL(request.url);
  const recompute = url.searchParams.get('recompute') === 'true';

  if (!(await authorizedForStudent(auth, id))) {
    return NextResponse.json({ success: false, error: 'Insufficient access level.' }, { status: 403 });
  }

  const gated = await isFeatureEnabled('STUDENT_SUCCESS_SCORE', { userId: auth.userId, roles: auth.roles });

  if (recompute) {
    if (!gated) {
      return NextResponse.json({
        success: false,
        status: 'NOT_CONFIGURED',
        error: 'Student success scoring is disabled. Enable the STUDENT_SUCCESS_SCORE feature flag.',
      }, { status: 404 });
    }
    try {
      const result = await assessStudentSuccess(id);
      return NextResponse.json({ success: true, assessment: result, disclaimer: SUCCESS_SCORE_DISCLAIMER });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Assessment failed' },
        { status: 404 },
      );
    }
  }

  const latest = await db.studentSuccessAssessment.findFirst({
    where: { studentId: id },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) {
    return NextResponse.json({ success: true, assessment: null, evaluated: false, disclaimer: SUCCESS_SCORE_DISCLAIMER });
  }
  return NextResponse.json({
    success: true,
    evaluated: true,
    disclaimer: latest.disclaimer || SUCCESS_SCORE_DISCLAIMER,
    assessment: {
      studentId: latest.studentId,
      score: latest.score,
      band: latest.band,
      components: safeParse(latest.components),
      nextActions: safeParse(latest.nextActions),
      evaluatedBy: latest.evaluatedBy,
      evaluatedAt: latest.createdAt.toISOString(),
    },
  });
}, { requireUserTypes: [...STAFF_TYPES, 'STUDENT'] });

export const POST = withAuth(async (_request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  if (!STAFF_TYPES.includes(auth.userType)) {
    return NextResponse.json({ success: false, error: 'Insufficient access level.' }, { status: 403 });
  }
  try {
    const result = await assessStudentSuccess(id);
    return NextResponse.json({ success: true, assessment: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Assessment failed' },
      { status: 404 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });

function safeParse(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
