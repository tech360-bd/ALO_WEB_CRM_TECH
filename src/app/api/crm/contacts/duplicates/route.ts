/** Contact Hub — duplicate review queue. Never merges records automatically. */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { contactScopeWhere } from '@/lib/contacts/access-scope';
import { contactHubPermissionDenied } from '@/lib/contacts/hub-access';
import { buildDuplicateReviewGroups, toRegistryContact } from '@/lib/contacts/registry';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (_req: Request, auth: AuthContext) => {
  try {
    const scope = await contactScopeWhere(auth);
    const rows = await db.whatsAppContact.findMany({ where: scope as never, take: 500, orderBy: { createdAt: 'desc' } });
    const contacts = rows.map((row) => toRegistryContact(row as never));
    const groups = buildDuplicateReviewGroups(contacts);
    // Only review items whose phone belongs to the caller's visible scope are
    // returned; this prevents branch-to-branch data leakage.
    const visiblePhones = new Set(contacts.flatMap((contact) => [contact.normalizedPhone, contact.phone].filter(Boolean)));
    const pending = await db.contactMatchReview.findMany({ where: { status: 'PENDING' }, orderBy: { createdAt: 'desc' }, take: 100 })
      .then((items) => items.filter((item) => visiblePhones.has(item.normalizedPhone) || visiblePhones.has(item.incomingPhone)))
      .catch(() => []);
    return NextResponse.json({
      success: true,
      groups,
      pendingReviews: pending,
      policy: 'REVIEW_REQUIRED — no record is merged automatically; a shared family phone or email is not proof of identity.',
      dataSource: 'WhatsAppContact + ContactMatchReview',
      integrationState: 'LIVE_DB',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Duplicate review is temporarily unavailable.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = contactHubPermissionDenied(auth, 'contacts.merge_review', ['BRANCH_MANAGER']);
  if (denied) return denied;
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  const contactIds = Array.isArray(body?.contactIds) ? body.contactIds.map(String).filter(Boolean).slice(0, 10) : [];
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';
  if (contactIds.length < 2 || !reason) {
    return NextResponse.json({ success: false, error: 'At least two contact ids and a review reason are required.' }, { status: 400 });
  }
  try {
    const scope = await contactScopeWhere(auth);
    const rows = await db.whatsAppContact.findMany({ where: { ...scope, id: { in: contactIds } } as never, take: 10 });
    if (rows.length < 2) {
      return NextResponse.json({ success: false, error: 'The requested contacts are outside your authorized scope or do not exist.' }, { status: 404 });
    }
    const first = rows[0] as { phone?: string; normalizedPhone?: string; displayName?: string; email?: string };
    const review = await db.contactMatchReview.create({
      data: {
        incomingPhone: first.phone || '',
        normalizedPhone: first.normalizedPhone || '',
        incomingName: first.displayName || '',
        incomingEmail: first.email || '',
        matchConfidence: 0,
        matchReason: reason,
        status: 'PENDING',
      },
    });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'CONTACT_IDENTITY_REVIEW_REQUESTED',
        entityType: 'ContactMatchReview',
        entityId: review.id,
        metadata: JSON.stringify({ contactIds, reason }),
      },
    }).catch(() => null);
    return NextResponse.json({ success: true, review, merged: false, message: 'Review item created. No contacts were merged.' }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Review item could not be created.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });
