import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { triagePolicyChange } from '@/lib/rules/rule-versioning';

// ============================================================
// POST /api/policy-changes/[id]/triage  (spec s64)
//
// Links a detected change to a proposed rule version and/or a review task.
// Triaging does NOT activate anything — the proposed version still has to be
// approved by a named administrator (s106, s116).
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];
type RouteContext = { params: Promise<{ id: string }> };

export const POST = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  try {
    const result = await triagePolicyChange(id, { id: auth.actorUserId, email: auth.actorEmail }, {
      proposedRuleVersionId: typeof body.proposedRuleVersionId === 'string' ? body.proposedRuleVersionId : undefined,
      reviewTaskId: typeof body.reviewTaskId === 'string' ? body.reviewTaskId : undefined,
      severity: typeof body.severity === 'string' ? body.severity : undefined,
    });

    await logAuditAction(auth, `POLICY_CHANGE_${result.action}`, 'PolicyChangeAlert', id, {
      ruleKey: result.ruleKey,
      proposedRuleVersionId: result.proposedRuleVersionId,
      reviewTaskId: result.reviewTaskId,
    });

    return NextResponse.json({
      success: true,
      action: result.action,
      alert: result,
      applied: false,
      nextStep:
        result.requiresApproval && result.action === 'PROPOSED'
          ? 'Proposed. An administrator must approve the rule version before it takes effect.'
          : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not triage policy change';
    const notFound = /NOT_FOUND/.test(message);
    const refused = /^CANNOT_TRIAGE|^ACTOR_REQUIRED/.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: notFound ? 404 : refused ? (message.startsWith('ACTOR_REQUIRED') ? 403 : 409) : 400 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });
