/**
 * Partner package configuration.
 *
 * Previously this handler accepted an arbitrary request body straight into
 * `db.partnerPackage.create({ data: body })`, which allowed a caller to set
 * any column (including `id`) and let a PARTNER session reprice or disable
 * B2B packages. It now uses the shared staff guard: session-bound actor,
 * backend RBAC, same-origin write check, an explicit field whitelist and an
 * audit event for every mutation.
 */
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import type { AuthContext } from '@/lib/auth-middleware';
import { STAFF_POLICIES, staffGuardDenied } from '@/lib/api/staff-endpoint-guard';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

const POLICY = STAFF_POLICIES.partnerPackages;
const NO_STORE = { 'Cache-Control': 'private, no-store' };
const WRITABLE = [
  'name', 'slug', 'description', 'price', 'billingCycle', 'isActive', 'sortOrder',
  'maxUsers', 'maxImages', 'maxVideos', 'videoMaxLength', 'maxLeads', 'features',
] as const;

function safeError(error: unknown) {
  console.error('[partner-packages] request failed', error instanceof Error ? error.message : 'unknown error');
  return NextResponse.json({ success: false, error: 'Partner package request could not be completed.' }, { status: 503, headers: NO_STORE });
}

function project(body: Record<string, unknown>) {
  const data: Record<string, unknown> = {};
  for (const field of WRITABLE) if (body[field] !== undefined) data[field] = body[field];
  return data;
}

export const GET = withAuth(async (_request: Request, auth: AuthContext) => {
  const denied = staffGuardDenied(auth, POLICY, { write: false });
  if (denied) return denied;
  try {
    const packages = await db.partnerPackage.findMany({ orderBy: { name: 'asc' } });
    return NextResponse.json({ packages }, { headers: NO_STORE });
  } catch (error) {
    return safeError(error);
  }
});

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  const denied = staffGuardDenied(auth, POLICY, { write: true, request });
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const data = project(body);
    if (typeof data.name !== 'string' || !data.name.trim()) {
      return NextResponse.json({ success: false, error: 'name is required.' }, { status: 400, headers: NO_STORE });
    }
    if (typeof data.slug !== 'string' || !data.slug.trim()) {
      return NextResponse.json({ success: false, error: 'slug is required.' }, { status: 400, headers: NO_STORE });
    }
    const pkg = await db.partnerPackage.create({ data: data as never });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'PARTNER_PACKAGE_CREATED',
        entityType: 'PartnerPackage',
        entityId: pkg.id,
        metadata: JSON.stringify({ fields: Object.keys(data), actorRole: auth.roles.join(',') }),
      },
    });
    return NextResponse.json({ package: pkg }, { status: 201, headers: NO_STORE });
  } catch (error) {
    return safeError(error);
  }
});

export const PATCH = withAuth(async (request: Request, auth: AuthContext) => {
  const denied = staffGuardDenied(auth, POLICY, { write: true, request });
  if (denied) return denied;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id.trim() : '';
    const data = project(body);
    if (!id) return NextResponse.json({ success: false, error: 'id is required.' }, { status: 400, headers: NO_STORE });
    if (Object.keys(data).length === 0) return NextResponse.json({ success: false, error: 'No permitted fields to update.' }, { status: 400, headers: NO_STORE });
    const pkg = await db.partnerPackage.update({ where: { id }, data: data as never });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'PARTNER_PACKAGE_UPDATED',
        entityType: 'PartnerPackage',
        entityId: id,
        metadata: JSON.stringify({ fields: Object.keys(data), actorRole: auth.roles.join(',') }),
      },
    });
    return NextResponse.json({ package: pkg }, { headers: NO_STORE });
  } catch (error) {
    return safeError(error);
  }
});
