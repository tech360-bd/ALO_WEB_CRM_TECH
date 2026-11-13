import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { recordRuleVerification } from '@/lib/rules/rule-versioning';

// ============================================================
// POST /api/rules/versions/[id]/verify  (spec s105, s43)
//
// Records that a named person checked a rule against its source. Verification
// is separate from approval: verifying says "this is what the source states",
// approving says "ALO will act on it".
//
// A version cannot be marked VERIFIED without a source to verify against — the
// lib downgrades it to NEEDS_REVIEW and reports that it did so, rather than
// manufacturing authority for an unsourced claim (s93, s105).
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
    const result = await recordRuleVerification(id, { id: auth.actorUserId, email: auth.actorEmail }, {
      sourceUrl: typeof body.sourceUrl === 'string' ? body.sourceUrl : undefined,
      sourceName: typeof body.sourceName === 'string' ? body.sourceName : undefined,
      sourceType: typeof body.sourceType === 'string' ? body.sourceType : undefined,
      verificationStatus: typeof body.verificationStatus === 'string' ? body.verificationStatus : undefined,
    });

    await logAuditAction(auth, 'RULE_VERSION_VERIFIED', 'RegulatoryRuleVersion', id, {
      verificationStatus: result.verificationStatus,
      downgraded: result.downgraded,
    });

    return NextResponse.json({
      success: true,
      action: result.action,
      verificationStatus: result.verificationStatus,
      downgraded: result.downgraded,
      // Say so explicitly instead of silently recording a weaker status.
      warning: result.downgraded
        ? 'Requested VERIFIED but no source URL or name was supplied, so the status was recorded as NEEDS_REVIEW.'
        : undefined,
      version: result.version,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not record verification';
    const notFound = /NOT_FOUND/.test(message);
    return NextResponse.json(
      { success: false, error: message },
      { status: notFound ? 404 : message.startsWith('ACTOR_REQUIRED') ? 403 : 400 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });
