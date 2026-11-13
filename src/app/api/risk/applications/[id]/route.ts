import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { assessApplicationRisk } from '@/lib/risk/application-risk-score';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// GET  /api/risk/applications/[id] — latest stored assessment (or compute)
// POST /api/risk/applications/[id] — recompute and persist
// Spec s111. Staff-only: risk factors expose internal workflow state, so
// students and partners must not read them.
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];
type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const url = new URL(request.url);
  const recompute = url.searchParams.get('recompute') === 'true';

  const gated = await isFeatureEnabled('APPLICATION_RISK_SCORE', { userId: auth.userId, roles: auth.roles });
  if (!gated) {
    return NextResponse.json({
      success: false,
      status: 'NOT_CONFIGURED',
      error: 'Application risk scoring is disabled. Enable the APPLICATION_RISK_SCORE feature flag.',
    }, { status: 404 });
  }

  if (recompute) {
    try {
      const result = await assessApplicationRisk(id, { evaluatedById: auth.actorUserId });
      return NextResponse.json({ success: true, assessment: result, recomputed: true });
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Assessment failed' },
        { status: 404 },
      );
    }
  }

  const latest = await db.applicationRiskAssessment.findFirst({
    where: { applicationId: id },
    orderBy: { createdAt: 'desc' },
  });
  if (!latest) {
    return NextResponse.json({ success: true, assessment: null, evaluated: false });
  }
  return NextResponse.json({
    success: true,
    evaluated: true,
    assessment: {
      applicationId: latest.applicationId,
      riskLevel: latest.riskLevel,
      score: latest.score,
      factors: safeParse(latest.factors),
      missingItems: safeParse(latest.missingItems),
      evaluatedBy: latest.evaluatedBy,
      evaluatedAt: latest.createdAt.toISOString(),
      metadata: safeParseObject(latest.metadata),
    },
  });
}, { requireUserTypes: STAFF_TYPES });

export const POST = withAuth(async (_request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  try {
    const result = await assessApplicationRisk(id, { evaluatedById: auth.actorUserId });
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

function safeParseObject(raw: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(raw || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
