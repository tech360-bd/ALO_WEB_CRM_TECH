import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { staffGuardDenied, STAFF_POLICIES } from '@/lib/api/staff-endpoint-guard';

/**
 * Official email queue. Queuing an email is a consequential action: the actor is
 * taken from the authenticated session and every queue event is audited.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function guard(auth: AuthContext, write: boolean, request: Request) {
  return staffGuardDenied(auth, STAFF_POLICIES.officialEmails, { write, request });
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = guard(auth, false, req);
  if (denied) return denied;
  const status = new URL(req.url).searchParams.get('status');
  const where = status ? { status: status.slice(0, 32) } : {};
  try {
    const emails = await db.officialEmail.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50 });
    return NextResponse.json({ emails }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Official email queue could not be loaded.' }, { status: 503 });
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
  const recipient = str('recipient', 320);
  const subject = str('subject', 512);
  if (!recipient || !subject) {
    return NextResponse.json({ error: 'recipient and subject required' }, { status: 400 });
  }
  try {
    const email = await db.officialEmail.create({
      data: {
        emailType: str('emailType', 64) || 'PROMOTIONAL',
        recipient,
        recipientName: str('recipientName', 256) || null,
        subject,
        body: str('body', 8000),
        relatedCrmId: str('relatedCrmId', 128) || null,
        relatedCrmType: str('relatedCrmType', 64) || null,
        status: 'QUEUED',
        createdById: auth.userId,
      },
    });
    await db.auditLog.create({
      data: {
        userId: auth.userId,
        action: 'OFFICIAL_EMAIL_QUEUED',
        resource: 'OfficialEmail',
        resourceId: email.id,
        actorRole: auth.roles.join(','),
        details: JSON.stringify({ recipientDomain: recipient.split('@').pop() || '', subject: subject.slice(0, 80) }),
      },
    }).catch(() => null);
    return NextResponse.json({ email, message: 'Email queued. Will use official ALO Education branding when sent.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Email could not be queued.' }, { status: 503 });
  }
});
