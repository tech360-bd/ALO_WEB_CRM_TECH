import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { computeStudentGraph, recommendFromGraph } from '@/lib/intelligence/opportunity-graph';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// GET /api/intelligence/opportunity-graph/[studentId] (spec s110)
// ?recommend=true also returns explainable, evidence-backed recommendations.
//
// Students may read their own graph. Partners may only read graphs for
// students they actually referred — never another tenant's.
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];
type RouteContext = { params: Promise<{ studentId: string }> };

export const GET = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { studentId } = await context.params;
  const url = new URL(request.url);
  const wantRecommendations = url.searchParams.get('recommend') === 'true';
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 200), 1), 1000);

  const gated = await isFeatureEnabled('OPPORTUNITY_GRAPH', { userId: auth.userId, roles: auth.roles });
  if (!gated) {
    return NextResponse.json({
      success: false,
      status: 'NOT_CONFIGURED',
      error: 'The Opportunity Graph is disabled. Enable the OPPORTUNITY_GRAPH feature flag.',
    }, { status: 404 });
  }

  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, userId: true },
  });
  if (!student) {
    return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
  }

  // Authorization: staff see any student; a student sees only themselves; a
  // partner sees only students tied to their own tenant.
  if (!STAFF_TYPES.includes(auth.userType)) {
    if (auth.userType === 'STUDENT') {
      if (student.userId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Insufficient access level.' }, { status: 403 });
      }
    } else if (auth.userType === 'PARTNER') {
      if (!auth.partnerId) {
        return NextResponse.json({ success: false, error: 'Partner identity required' }, { status: 403 });
      }
      const linked = await db.application.count({ where: { studentId, partnerId: auth.partnerId } });
      if (linked === 0) {
        return NextResponse.json({ success: false, error: 'TENANT_MISMATCH' }, { status: 403 });
      }
    } else {
      return NextResponse.json({ success: false, error: 'Insufficient access level.' }, { status: 403 });
    }
  }

  try {
    const graph = await computeStudentGraph(studentId, { limit });
    const recommendations = wantRecommendations ? await recommendFromGraph(studentId, { limit: 10 }) : [];
    return NextResponse.json({ success: true, graph, recommendations });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Graph computation failed' },
      { status: 500 },
    );
  }
}, { requireUserTypes: [...STAFF_TYPES, 'STUDENT', 'PARTNER'] });
