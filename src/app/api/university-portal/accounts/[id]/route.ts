import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import {
  UNIVERSITY_PORTAL_PERMISSIONS,
  accountActivity,
  normalizePermissions,
  setUniversityAccountStatus,
} from '@/lib/university-portal';
import { db } from '@/lib/db';

// ============================================================
// GET   /api/university-portal/accounts/[id] — account + activity log
// PATCH /api/university-portal/accounts/[id] — status / permissions (ALO admin)
// ============================================================

const ADMIN_TYPES = ['SUPER_ADMIN', 'ADMIN'];
type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAuth(async (request: Request, _auth, context: RouteContext) => {
  const { id } = await context.params;
  const account = await db.universityPortalAccount.findUnique({ where: { id } });
  if (!account) {
    return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
  }
  const url = new URL(request.url);
  const activity = await accountActivity(id, Number(url.searchParams.get('limit') ?? 100));
  return NextResponse.json({ success: true, account, activity });
}, { requireUserTypes: ADMIN_TYPES });

export const PATCH = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  const existing = await db.universityPortalAccount.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
  }

  const changes: string[] = [];
  const data: Record<string, unknown> = {};

  if (typeof body.status === 'string' && body.status.trim()) {
    try {
      await setUniversityAccountStatus(id, body.status, auth.actorUserId);
      changes.push(`status:${body.status.toUpperCase()}`);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error instanceof Error ? error.message : 'Status update failed' },
        { status: 400 },
      );
    }
  }

  if (Array.isArray(body.permissions)) {
    const permissions = normalizePermissions(body.permissions);
    data.permissions = JSON.stringify(permissions);
    changes.push('permissions');
  }
  if (typeof body.jobTitle === 'string') {
    data.jobTitle = body.jobTitle.slice(0, 190);
    changes.push('jobTitle');
  }
  if (typeof body.fullName === 'string' && body.fullName.trim()) {
    data.fullName = body.fullName.trim().slice(0, 190);
    changes.push('fullName');
  }

  if (Object.keys(data).length > 0) {
    await db.universityPortalAccount.update({ where: { id }, data });
  }

  if (changes.length > 0) {
    await logAuditAction(auth, 'UNIVERSITY_PORTAL_ACCOUNT_UPDATED', 'UniversityPortalAccount', id, {
      changes,
      universityId: existing.universityId,
    });
  }

  const updated = await db.universityPortalAccount.findUnique({ where: { id } });
  return NextResponse.json({
    success: true,
    changed: changes,
    account: updated,
    availablePermissions: UNIVERSITY_PORTAL_PERMISSIONS,
  });
}, { requireUserTypes: ADMIN_TYPES });
