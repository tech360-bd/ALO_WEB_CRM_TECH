import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { resolvePolicyChange } from '@/lib/rules/rule-versioning';

// ============================================================
// POST /api/policy-changes/[id]/resolve  (spec s64, s116)
//
// Closes an alert once its proposed rule version has actually been approved.
// Restricted to administrators: marking a regulatory change resolved is the
// assertion that ALO has acted on it, so it belongs to the same role that
// approves the underlying rule version.
// ============================================================

const APPROVER_TYPES = ['SUPER_ADMIN', 'ADMIN'];
type RouteContext = { params: Promise<{ id: string }> };

export const POST = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;

  if (!APPROVER_TYPES.includes(auth.userType)) {
    return NextResponse.json(
      { success: false, error: 'Only an administrator may resolve a regulatory change alert.' },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const proposedRuleVersionId = url.searchParams.get('versionId')?.trim();

  try {
    const result = await resolvePolicyChange(id, { id: auth.actorUserId, email: auth.actorEmail });

    await logAuditAction(auth, 'POLICY_CHANGE_RESOLVED', 'PolicyChangeAlert', id, {
      proposedRuleVersionId: proposedRuleVersionId || result.proposedRuleVersionId,
    });

    return NextResponse.json({ success: true, action: result.action, alert: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not resolve policy change';
    const notFound = /NOT_FOUND/.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: notFound ? 404 : message.startsWith('ACTOR_REQUIRED') ? 403 : 400 },
    );
  }
}, { requireUserTypes: APPROVER_TYPES });
