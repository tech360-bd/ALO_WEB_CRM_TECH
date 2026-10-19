import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  listInstitutionApplications,
  markUniversityPortalLogin,
  resolveUniversityPortalContextByEmail,
} from '@/lib/university-portal';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// GET /api/university-portal/applications (spec s39, s69)
//
// Tenant isolation: the universityId is taken from the STORED account row of
// the authenticated representative. A representative can only ever list
// applications addressed to their own institution, and the response is built
// from an explicit field allowlist — internal notes, counselor identity,
// partner ids and commission data are never selected.
// ============================================================

export const GET = withAuth(async (request: Request, auth) => {
  const gated = await isFeatureEnabled('UNIVERSITY_PORTAL', { userId: auth.userId, roles: auth.roles });
  if (!gated) {
    return NextResponse.json({
      success: false,
      status: 'NOT_CONFIGURED',
      error: 'The university portal is disabled. Enable the UNIVERSITY_PORTAL feature flag.',
    }, { status: 404 });
  }

  const context = await resolveUniversityPortalContextByEmail(auth.email);
  if (!context) {
    return NextResponse.json(
      { success: false, error: 'No active university portal account is linked to this login.' },
      { status: 403 },
    );
  }
  await markUniversityPortalLogin(context.accountId);

  const url = new URL(request.url);
  try {
    const result = await listInstitutionApplications(context, {
      limit: Number(url.searchParams.get('limit') ?? 50),
      offset: Number(url.searchParams.get('offset') ?? 0),
      stage: url.searchParams.get('stage') || undefined,
      search: url.searchParams.get('search') || undefined,
    });
    return NextResponse.json({
      success: true,
      universityId: context.universityId,
      role: context.role,
      permissions: context.permissions,
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Query failed';
    const denied = message.startsWith('PERMISSION_DENIED') || message === 'TENANT_MISMATCH';
    return NextResponse.json({ success: false, error: message }, { status: denied ? 403 : 500 });
  }
}, { requireUserTypes: ['UNIVERSITY', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] });
