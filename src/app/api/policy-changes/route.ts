import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { detectPolicyChange, listOpenPolicyChanges } from '@/lib/rules/rule-versioning';

// ============================================================
// GET  /api/policy-changes  — open alerts, most severe first (s107)
// POST /api/policy-changes  — record a detected change        (s64)
//
// Detection NEVER applies a change. It raises an alert with an explicit impact
// analysis; turning it into a live rule still requires a proposed version and a
// named human approver (s106, s116).
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const severity = url.searchParams.get('severity')?.trim() || undefined;
  const limit = Number(url.searchParams.get('limit') ?? 50);

  try {
    const alerts = await listOpenPolicyChanges({
      severity,
      limit: Number.isFinite(limit) ? limit : 50,
    });
    return NextResponse.json({ success: true, count: alerts.length, alerts });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not list policy changes' },
      { status: 500 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  const title = typeof body.title === 'string' ? body.title.trim() : '';
  if (!title) {
    return NextResponse.json(
      { success: false, error: 'title is required: describe the detected change' },
      { status: 400 },
    );
  }

  try {
    const alert = await detectPolicyChange(
      {
        title,
        description: typeof body.description === 'string' ? body.description : '',
        ruleKey: typeof body.ruleKey === 'string' ? body.ruleKey : undefined,
        countryId: typeof body.countryId === 'string' ? body.countryId : null,
        universityId: typeof body.universityId === 'string' ? body.universityId : null,
        ruleType: typeof body.ruleType === 'string' ? body.ruleType : 'POLICY',
        scope: typeof body.scope === 'string' ? body.scope : null,
        severity: typeof body.severity === 'string' ? body.severity : undefined,
        sourceType: typeof body.sourceType === 'string' ? body.sourceType : undefined,
        sourceUrl: typeof body.sourceUrl === 'string' ? body.sourceUrl : undefined,
        sourceName: typeof body.sourceName === 'string' ? body.sourceName : undefined,
        affectedWorkflows: stringArray(body.affectedWorkflows),
        affectedStudentIds: stringArray(body.affectedStudentIds),
        affectedApplicationIds: stringArray(body.affectedApplicationIds),
        affectedCountryIds: stringArray(body.affectedCountryIds),
        requiresApproval: typeof body.requiresApproval === 'boolean' ? body.requiresApproval : undefined,
      },
      { id: auth.actorUserId, email: auth.actorEmail },
    );

    await logAuditAction(auth, 'POLICY_CHANGE_DETECTED', 'PolicyChangeAlert', alert.id, {
      ruleKey: alert.ruleKey,
      severity: alert.severity,
      impactCount: alert.impactCount,
    });

    return NextResponse.json(
      {
        success: true,
        alert,
        // State plainly that nothing has been applied (s64, s116).
        applied: false,
        nextStep: alert.requiresApproval
          ? 'Triage into a proposed rule version, then obtain administrator approval before it takes effect.'
          : 'Triage into a proposed rule version.',
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not record policy change' },
      { status: 400 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => String(item)).filter(Boolean);
}
