/**
 * Single secondary phone number — PATCH (set primary / update label / WhatsApp
 * flag) and DELETE (archive by removal, always audited).
 *
 * Removal deletes the child row but not the shared audit history; the actor,
 * number and label are preserved in portalAuditLog before deletion.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { contactScopeWhere, combineContactScopeAndSearch } from '@/lib/contacts/access-scope';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string; phoneId: string }> };

const LABELS = new Set(['PERSONAL', 'BUSINESS', 'WHATSAPP', 'ALTERNATIVE', 'EMERGENCY', 'FAMILY']);

async function findScopedContact(id: string, auth: AuthContext) {
  const scope = await contactScopeWhere(auth);
  return db.whatsAppContact.findFirst({
    where: combineContactScopeAndSearch(scope, [{ id }]) as never,
  });
}

function ipOf(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 64) || '';
}

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context: Context) => {
  const { id, phoneId } = await context.params;
  if (!id || !phoneId) return NextResponse.json({ success: false, error: 'Contact id and phone id are required.' }, { status: 400 });
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  const setPrimary = body.isPrimary === true;
  if (typeof body.label === 'string') {
    const label = body.label.trim().toUpperCase().slice(0, 32);
    if (!LABELS.has(label)) {
      return NextResponse.json({ success: false, error: `Label must be one of: ${[...LABELS].join(', ')}.` }, { status: 400 });
    }
    data.label = label;
  }
  if (typeof body.isWhatsApp === 'boolean') data.isWhatsApp = body.isWhatsApp;
  if (!setPrimary && Object.keys(data).length === 0) {
    return NextResponse.json({ success: false, error: 'No permitted fields were supplied.' }, { status: 400 });
  }

  try {
    const contact = await findScopedContact(id, auth);
    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found or outside your authorized scope.' }, { status: 404 });
    const existing = await db.contactPhone.findFirst({ where: { id: phoneId, contactId: id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Phone number not found for this contact.' }, { status: 404 });

    const updated = await db.$transaction(async (tx) => {
      if (setPrimary) {
        await tx.contactPhone.updateMany({ where: { contactId: id, isPrimary: true }, data: { isPrimary: false } });
        data.isPrimary = true;
      }
      const row = await tx.contactPhone.update({ where: { id: phoneId }, data });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'CONTACT_PHONE_UPDATED',
          entityType: 'WhatsAppContact',
          entityId: id,
          metadata: JSON.stringify({ contactPhoneId: phoneId, fields: Object.keys(data), actor: auth.userId }),
          ipAddress: ipOf(req),
          userAgent: (req.headers.get('user-agent') || '').slice(0, 255),
        },
      });
      return row;
    });

    return NextResponse.json({ success: true, phone: updated });
  } catch {
    return NextResponse.json({ success: false, error: 'The phone number could not be updated.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.manage'] });

export const DELETE = withAuth(async (req: Request, auth: AuthContext, context: Context) => {
  const { id, phoneId } = await context.params;
  if (!id || !phoneId) return NextResponse.json({ success: false, error: 'Contact id and phone id are required.' }, { status: 400 });
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }
  try {
    const contact = await findScopedContact(id, auth);
    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found or outside your authorized scope.' }, { status: 404 });
    const existing = await db.contactPhone.findFirst({ where: { id: phoneId, contactId: id } });
    if (!existing) return NextResponse.json({ success: false, error: 'Phone number not found for this contact.' }, { status: 404 });

    await db.$transaction(async (tx) => {
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'CONTACT_PHONE_REMOVED',
          entityType: 'WhatsAppContact',
          entityId: id,
          metadata: JSON.stringify({
            contactPhoneId: phoneId,
            removedPhone: existing.phone,
            removedNormalizedPhone: existing.normalizedPhone,
            label: existing.label,
            actor: auth.userId,
          }),
          ipAddress: ipOf(req),
          userAgent: (req.headers.get('user-agent') || '').slice(0, 255),
        },
      });
      await tx.contactPhone.delete({ where: { id: phoneId } });
    });

    return NextResponse.json({ success: true, removed: phoneId });
  } catch {
    return NextResponse.json({ success: false, error: 'The phone number could not be removed. Nothing was written.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.manage'] });
