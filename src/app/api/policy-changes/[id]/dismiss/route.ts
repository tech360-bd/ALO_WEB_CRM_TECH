import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { dismissPolicyChange } from '@/lib/rules/rule-versioning';

// ============================================================
// POST /api/policy-changes/[id]/dismiss  (spec s64, s65)
//
// Records that a detected change was reviewed and is NOT a real change. The
// reason is mandatory: dismissing a regulatory alert silently would be exactly
// the kind of unaccountable action the audit trail exists to prevent.
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];
type RouteContext = { params: Promise<{ id: string }> };

export const POST = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === 'string' ? body.reason : '';
  if (reason.trim().length < 3) {
    return NextResponse.json(
      { success: false, error: 'A reason is required to dismiss a policy change alert.' },
      { status: 400 },
    );
  }

  try {
    const result = await dismissPolicyChange(id, { id: auth.actorUserId, email: auth.actorEmail }, reason);
    await logAuditAction(auth, 'POLICY_CHANGE_DISMISSED', 'PolicyChangeAlert', id, { reason });
    return NextResponse.json({ success: true, action: result.action, alert: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not dismiss policy change';
    const notFound = /NOT_FOUND/.test(message);
    const refused = /^CANNOT_DISMISS/.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: notFound ? 404 : refused ? 409 : message.startsWith('ACTOR_REQUIRED') ? 403 : 400 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });
