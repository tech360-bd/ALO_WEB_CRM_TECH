import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { rejectRuleVersion } from '@/lib/rules/rule-versioning';

// ============================================================
// POST /api/rules/versions/[id]/reject  (spec s106, s65)
//
// Rejecting a proposed rule version. A reason is mandatory because the
// rejection is itself an audit record explaining why ALO did NOT act on a
// regulatory change.
// ============================================================

const APPROVER_TYPES = ['SUPER_ADMIN', 'ADMIN'];
type RouteContext = { params: Promise<{ id: string }> };

export const POST = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;

  if (!APPROVER_TYPES.includes(auth.userType)) {
    return NextResponse.json(
      { success: false, error: 'Only an administrator may reject a regulatory rule change.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  const reason = typeof body?.reason === 'string' ? body.reason : '';
  if (reason.trim().length < 3) {
    return NextResponse.json(
      { success: false, error: 'A reason is required to reject a rule version.' },
      { status: 400 },
    );
  }

  try {
    const result = await rejectRuleVersion(id, { id: auth.actorUserId, email: auth.actorEmail }, reason);
    await logAuditAction(auth, 'RULE_VERSION_REJECTED', 'RegulatoryRuleVersion', id, { reason });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not reject rule version';
    const notFound = /NOT_FOUND/.test(message);
    const refused = /^CANNOT_REJECT|^ACTOR_REQUIRED|^REJECTION_REASON/.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: notFound ? 404 : refused ? 409 : 400 },
    );
  }
}, { requireUserTypes: APPROVER_TYPES });
