import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import {
  FEATURE_FLAG_DEFAULTS,
  ensureDefaultFlags,
  evaluateFlags,
  listFlags,
} from '@/lib/feature-flags';

// ============================================================
// GET  /api/feature-flags — list flags (admin) or evaluate them (any authed user)
// POST /api/feature-flags — bootstrap the canonical flag catalogue (idempotent)
// ============================================================

const ADMIN_TYPES = ['SUPER_ADMIN', 'ADMIN'];

export const GET = withAuth(async (request: Request, auth) => {
  const url = new URL(request.url);
  const moduleFilter = url.searchParams.get('module') || undefined;

  // Any authenticated caller may evaluate flags for THEMSELVES — that is how a
  // portal decides what to render. Only administrators may read the full table.
  const evaluateOnly = url.searchParams.get('evaluate') === 'true';
  const keysParam = url.searchParams.get('keys');

  if (evaluateOnly || !ADMIN_TYPES.includes(auth.userType)) {
    const keys = keysParam
      ? keysParam.split(',').map((key) => key.trim()).filter(Boolean)
      : FEATURE_FLAG_DEFAULTS.map((flag) => flag.key);
    const evaluations = await evaluateFlags(keys, {
      userId: auth.userId,
      roles: auth.roles,
    });
    return NextResponse.json({
      success: true,
      evaluations,
      enabled: Object.fromEntries(
        Object.entries(evaluations).map(([key, value]) => [key, value.enabled]),
      ),
    });
  }

  const flags = await listFlags(moduleFilter);
  return NextResponse.json({
    success: true,
    flags: flags.map((flag) => ({
      ...flag,
      // Secrets/allowlists are configuration, not credentials — safe to return
      // to an administrator, but the audit trail is always available.
    })),
    catalogue: FEATURE_FLAG_DEFAULTS,
    count: flags.length,
  });
}, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'STUDENT', 'PARTNER', 'CEO', 'COUNSELOR'] });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (body?.action === 'bootstrap') {
    const result = await ensureDefaultFlags();
    await logAuditAction(auth, 'FEATURE_FLAG_BOOTSTRAP', 'FeatureFlag', '', {
      created: result.created.length,
      skipped: result.skipped.length,
    });
    return NextResponse.json({ success: true, ...result });
  }
  return NextResponse.json(
    { success: false, error: 'Unsupported action. Use { action: "bootstrap" }.' },
    { status: 400 },
  );
}, { requireUserTypes: ADMIN_TYPES });
