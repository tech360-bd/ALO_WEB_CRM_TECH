import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { approveRuleVersion } from '@/lib/rules/rule-versioning';

// ============================================================
// POST /api/rules/versions/[id]/approve  (spec s106, s116)
//
// The ONLY way a regulatory rule version becomes live. Restricted to
// administrators and always attributed: a rule change affecting visa or
// financial requirements must have a named human approver (s116), so an
// anonymous or system actor is refused rather than defaulted.
// ============================================================

const APPROVER_TYPES = ['SUPER_ADMIN', 'ADMIN'];
type RouteContext = { params: Promise<{ id: string }> };

export const POST = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;

  if (!APPROVER_TYPES.includes(auth.userType)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Regulatory rule changes require administrator approval (human-in-the-loop).',
      },
      { status: 403 },
    );
  }

  try {
    const result = await approveRuleVersion(id, { id: auth.actorUserId, email: auth.actorEmail });

    await logAuditAction(auth, `RULE_VERSION_${result.action}`, 'RegulatoryRuleVersion', id, {
      superseded: result.superseded,
    });

    return NextResponse.json({
      success: true,
      ...result,
      // The superseded version is retained, never deleted (s106).
      note:
        result.superseded
          ? 'The previous version is retained as SUPERSEDED history.'
          : 'No previous version was in force.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not approve rule version';
    const notFound = /NOT_FOUND/.test(message);
    const refused = /^CANNOT_APPROVE|^ACTOR_REQUIRED/.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: notFound ? 404 : refused ? 409 : 400 },
    );
  }
}, { requireUserTypes: APPROVER_TYPES });
