import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { proposeRuleVersion, ruleHistory } from '@/lib/rules/rule-versioning';

// ============================================================
// GET  /api/rules/versions?ruleKey=…  — full preserved history of one rule
// POST /api/rules/versions            — propose a NEW version (append-only)
//
// Spec s106: regulatory rules are versioned, never overwritten. Proposing a
// change cannot alter what is in force today; only an explicit approval can
// (POST /api/rules/versions/[id]/approve), and that requires a named human.
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];
const APPROVER_TYPES = ['SUPER_ADMIN', 'ADMIN'];

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const ruleKey = url.searchParams.get('ruleKey')?.trim();
  if (!ruleKey) {
    return NextResponse.json(
      { success: false, error: 'ruleKey is required. History is read one rule chain at a time.' },
      { status: 400 },
    );
  }
  try {
    const history = await ruleHistory(ruleKey);
    return NextResponse.json({ success: true, ruleKey, history, count: history.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not read rule history' },
      { status: 500 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  // Only administrators may propose a regulatory change. A counselor can read
  // the rules they must apply, but cannot author new ones.
  if (!APPROVER_TYPES.includes(auth.userType)) {
    return NextResponse.json(
      { success: false, error: 'Only an administrator may propose a regulatory rule change.' },
      { status: 403 },
    );
  }

  try {
    const result = await proposeRuleVersion(
      {
        ruleKey: typeof body.ruleKey === 'string' ? body.ruleKey : undefined,
        countryId: typeof body.countryId === 'string' ? body.countryId : null,
        universityId: typeof body.universityId === 'string' ? body.universityId : null,
        ruleType: String(body.ruleType ?? 'OTHER'),
        scope: typeof body.scope === 'string' ? body.scope : null,
        payload: body.payload && typeof body.payload === 'object' ? body.payload : {},
        summary: typeof body.summary === 'string' ? body.summary : '',
        changeReason: typeof body.changeReason === 'string' ? body.changeReason : '',
        effectiveFrom: parseDate(body.effectiveFrom),
        effectiveUntil: parseDate(body.effectiveUntil, true),
        sourceType: typeof body.sourceType === 'string' ? body.sourceType : undefined,
        sourceUrl: typeof body.sourceUrl === 'string' ? body.sourceUrl : undefined,
        sourceName: typeof body.sourceName === 'string' ? body.sourceName : undefined,
        verificationStatus: typeof body.verificationStatus === 'string' ? body.verificationStatus : undefined,
        policyChangeAlertId: typeof body.policyChangeAlertId === 'string' ? body.policyChangeAlertId : undefined,
        submitForApproval: body.submitForApproval === true,
      },
      { id: auth.actorUserId, email: auth.actorEmail },
    );

    await logAuditAction(auth, 'RULE_VERSION_PROPOSED', 'RegulatoryRuleVersion', result.id, {
      ruleKey: result.ruleKey,
      versionNumber: result.versionNumber,
      status: result.status,
    });

    return NextResponse.json({ success: true, ...result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not propose rule version';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}, { requireUserTypes: STAFF_TYPES });

/** Parse a date input, optionally allowing null. Throws on an invalid value. */
function parseDate(value: unknown, optional = false): Date {
  if (value === null || value === undefined || value === '') {
    if (optional) return null as unknown as Date;
    throw new Error('EFFECTIVE_FROM_REQUIRED: supply an ISO date');
  }
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`INVALID_DATE: ${String(value)}`);
  }
  return parsed;
}
