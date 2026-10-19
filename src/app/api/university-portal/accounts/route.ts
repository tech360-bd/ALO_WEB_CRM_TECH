import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import {
  DEFAULT_ROLE_PERMISSIONS,
  UNIVERSITY_PORTAL_PERMISSIONS,
  UNIVERSITY_PORTAL_ROLES,
  createUniversityPortalAccount,
  listUniversityAccounts,
} from '@/lib/university-portal';

// ============================================================
// GET  /api/university-portal/accounts?universityId=… — ALO admin only
// POST /api/university-portal/accounts                — ALO admin only
//
// Institution accounts are provisioned BY ALO. A representative can never
// create or list accounts, which is what keeps the tenant boundary intact.
// ============================================================

const ADMIN_TYPES = ['SUPER_ADMIN', 'ADMIN'];

export const GET = withAuth(async (request: Request, _auth) => {
  const url = new URL(request.url);
  const universityId = url.searchParams.get('universityId') || '';
  if (!universityId) {
    return NextResponse.json({ success: false, error: 'universityId is required' }, { status: 400 });
  }
  const accounts = await listUniversityAccounts(universityId);
  return NextResponse.json({
    success: true,
    accounts,
    count: accounts.length,
    roles: UNIVERSITY_PORTAL_ROLES,
    permissions: UNIVERSITY_PORTAL_PERMISSIONS,
    defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS,
  });
}, { requireUserTypes: ADMIN_TYPES });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  try {
    const account = await createUniversityPortalAccount({
      universityId: String(body.universityId || ''),
      fullName: String(body.fullName || ''),
      email: String(body.email || ''),
      jobTitle: body.jobTitle,
      role: body.role,
      permissions: Array.isArray(body.permissions) ? body.permissions : undefined,
      invitedBy: auth.actorUserId,
      status: typeof body.status === 'string' ? body.status : 'INVITED',
    });

    await logAuditAction(auth, 'UNIVERSITY_PORTAL_ACCOUNT_CREATED', 'UniversityPortalAccount', account.id, {
      universityId: account.universityId,
      email: account.email,
      role: account.role,
    });

    return NextResponse.json({ success: true, account }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Account creation failed';
    const notFound = /not found/i.test(message);
    return NextResponse.json({ success: false, error: message }, { status: notFound ? 404 : 400 });
  }
}, { requireUserTypes: ADMIN_TYPES });

// Sanity reference for the admin UI: only institutions in the canonical
// catalogue can host a portal tenant.
export const dynamic = 'force-dynamic';
