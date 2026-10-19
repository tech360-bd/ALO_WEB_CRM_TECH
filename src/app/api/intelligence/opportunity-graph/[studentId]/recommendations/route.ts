import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { recommendFromGraph } from '@/lib/intelligence/opportunity-graph';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// GET /api/intelligence/opportunity-graph/[studentId]/recommendations
// Explainable recommendations derived only from real graph edges (s110, s16).
// ============================================================

type RouteContext = { params: Promise<{ studentId: string }> };

export const GET = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { studentId } = await context.params;
  const url = new URL(request.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get('limit') ?? 10), 1), 50);

  const gated = await isFeatureEnabled('OPPORTUNITY_GRAPH', { userId: auth.userId, roles: auth.roles });
  if (!gated) {
    return NextResponse.json({
      success: false,
      status: 'NOT_CONFIGURED',
      error: 'The Opportunity Graph is disabled. Enable the OPPORTUNITY_GRAPH feature flag.',
      recommendations: [],
    }, { status: 404 });
  }

  try {
    const recommendations = await recommendFromGraph(studentId, { limit });
    return NextResponse.json({
      success: true,
      recommendations,
      // Guardrail text travels with the payload so the UI cannot drop it.
      caveat:
        'Derived from this student\'s real CRM records. Scholarship entries marked NEEDS_REVIEW are not verified against the official source and must be confirmed before advising the student.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Recommendation failed' },
      { status: 404 },
    );
  }
}, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'] });
