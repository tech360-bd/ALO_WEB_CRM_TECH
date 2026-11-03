import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { staffGuardDenied, STAFF_POLICIES } from '@/lib/api/staff-endpoint-guard';

/** University agreements: backend RBAC, actor-bound approvals, audit trail. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AGREEMENT_STATUSES = new Set(['PENDING', 'REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'ACTIVE', 'EXPIRED', 'REJECTED']);

function guard(auth: AuthContext, write: boolean, request: Request) {
  return staffGuardDenied(auth, STAFF_POLICIES.universityAgreements, { write, request });
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, false, req);
  if (denied) return denied;
  const status = new URL(req.url).searchParams.get('status');
  const where = status ? { status: status.slice(0, 32) } : {};
  try {
    const agreements = await db.universityAgreement.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json({ agreements }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'University agreements could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, true, req);
  if (denied) return denied;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  const str = (key: string, max = 512) => (typeof body[key] === 'string' ? String(body[key]).trim().slice(0, max) : '');
  if (!str('universitySlug') || !str('universityName')) {
    return NextResponse.json({ error: 'universitySlug and universityName required' }, { status: 400 });
  }
  try {
    const agreement = await db.universityAgreement.create({
      data: {
        agreementCode: `ALO-AGR-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        universitySlug: str('universitySlug', 191),
        universityName: str('universityName', 256),
        countrySlug: str('countrySlug', 128) || null,
        partnershipType: str('partnershipType', 128) || null,
        commissionTerms: typeof body.commissionTerms === 'string' ? body.commissionTerms.slice(0, 4000) : null,
        contactName: str('contactName', 256) || null,
        contactEmail: str('contactEmail', 320) || null,
        contactPhone: str('contactPhone', 64) || null,
        officialWebsite: str('officialWebsite', 512) || null,
        notes: typeof body.notes === 'string' ? body.notes.slice(0, 4000) : null,
        requestedById: auth.userId,
        status: 'REQUESTED',
      },
    });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UNIVERSITY_AGREEMENT_REQUESTED',
        resource: 'UniversityAgreement',
        resourceId: agreement.id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ universitySlug: agreement.universitySlug }),
      },
    }).catch(() => null);
    return NextResponse.json({ agreement }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Agreement could not be created.' }, { status: 503 });
  }
});

export const PATCH = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, true, req);
  if (denied) return denied;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : '';
  if (!id || !AGREEMENT_STATUSES.has(status)) {
    return NextResponse.json({ error: 'A valid id and status are required.' }, { status: 400 });
  }
  try {
    // approvedById used to come from the request body; bind it to the actor.
    const updates: Record<string, unknown> = { status };
    if (status === 'APPROVED' || status === 'ACTIVE') {
      updates.approvedById = auth.userId;
      updates.approvedAt = new Date();
    }
    const agreement = await db.universityAgreement.update({ where: { id }, data: updates });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'UNIVERSITY_AGREEMENT_STATUS_CHANGED',
        resource: 'UniversityAgreement',
        resourceId: id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ status }),
      },
    }).catch(() => null);
    return NextResponse.json({ agreement });
  } catch {
    return NextResponse.json({ error: 'Agreement could not be updated.' }, { status: 503 });
  }
});
