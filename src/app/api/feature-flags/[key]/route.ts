import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { evaluateFlag, flagAuditTrail, updateFlag } from '@/lib/feature-flags';

// ============================================================
// GET   /api/feature-flags/[key] — evaluate for the caller + audit trail (admin)
// PATCH /api/feature-flags/[key] — mutate a flag (admin only, fully audited)
// ============================================================

const ADMIN_TYPES = ['SUPER_ADMIN', 'ADMIN'];

type RouteContext = { params: Promise<{ key: string }> };

export const GET = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { key } = await context.params;
  const evaluation = await evaluateFlag(key, { userId: auth.userId, roles: auth.roles });

  if (!ADMIN_TYPES.includes(auth.userType)) {
    return NextResponse.json({ success: true, evaluation });
  }

  const audit = await flagAuditTrail(key, 100);
  return NextResponse.json({ success: true, evaluation, audit });
}, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'STUDENT', 'PARTNER', 'CEO', 'COUNSELOR'] });

export const PATCH = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { key } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  try {
    const result = await updateFlag(
      key,
      {
        enabled: typeof body.enabled === 'boolean' ? body.enabled : undefined,
        rolloutPercent: typeof body.rolloutPercent === 'number' ? body.rolloutPercent : undefined,
        allowRoles: Array.isArray(body.allowRoles) ? body.allowRoles : undefined,
        allowUserIds: Array.isArray(body.allowUserIds) ? body.allowUserIds : undefined,
        denyUserIds: Array.isArray(body.denyUserIds) ? body.denyUserIds : undefined,
        environment: typeof body.environment === 'string' ? body.environment : undefined,
        config: body.config && typeof body.config === 'object' ? body.config : undefined,
        description: typeof body.description === 'string' ? body.description : undefined,
        module: typeof body.module === 'string' ? body.module : undefined,
        status: typeof body.status === 'string' ? body.status : undefined,
        reason: typeof body.reason === 'string' ? body.reason : undefined,
      },
      { id: auth.actorUserId, email: auth.actorEmail },
    );

    await logAuditAction(auth, `FEATURE_FLAG_${result.action}`, 'FeatureFlag', key, {
      before: null,
      after: result.flag,
    });

    return NextResponse.json({ success: true, action: result.action, flag: result.flag });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Flag update failed';
    const notFound = /not found/i.test(message);
    return NextResponse.json({ success: false, error: message }, { status: notFound ? 404 : 400 });
  }
}, { requireUserTypes: ADMIN_TYPES });
