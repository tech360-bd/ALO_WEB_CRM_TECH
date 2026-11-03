import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { staffGuardDenied, STAFF_POLICIES } from '@/lib/api/staff-endpoint-guard';

/** Partner/university B2B contact directory — staff-only, audited writes. */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function guard(auth: AuthContext, write: boolean, request: Request) {
  return staffGuardDenied(auth, STAFF_POLICIES.b2bContacts, { write, request });
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, false, req);
  if (denied) return denied;
  const type = new URL(req.url).searchParams.get('type');
  const where = type ? { type: type.slice(0, 64) } : {};
  try {
    const contacts = await db.b2BContact.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 });
    return NextResponse.json({ contacts }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'B2B contacts could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, true, req);
  if (denied) return denied;
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'A JSON body is required.' }, { status: 400 });
  }
  const str = (key: string, max = 256) => (typeof body[key] === 'string' ? String(body[key]).trim().slice(0, max) : '');
  const name = str('name');
  const organization = str('organization');
  if (!name || !organization) {
    return NextResponse.json({ error: 'name and organization required' }, { status: 400 });
  }
  try {
    const contact = await db.b2BContact.create({
      data: {
        name,
        organization,
        type: str('type', 64) || 'UNIVERSITY',
        email: str('email', 320) || null,
        phone: str('phone', 64) || null,
        countrySlug: str('countrySlug', 128) || null,
        position: str('position', 128) || null,
        notes: typeof body.notes === 'string' ? body.notes.slice(0, 4000) : null,
      },
    });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'B2B_CONTACT_CREATED',
        resource: 'B2BContact',
        resourceId: contact.id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ organization, type: contact.type }),
      },
    }).catch(() => null);
    return NextResponse.json({ contact }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'B2B contact could not be created.' }, { status: 503 });
  }
});
