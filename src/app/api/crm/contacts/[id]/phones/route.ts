/**
 * Contact secondary phone numbers (spec §3 / §10 — "every number separately
 * searchable").
 *
 * WhatsAppContact keeps the *primary* number with unique constraints. This
 * collection manages the additional personal / business / WhatsApp / family
 * numbers a person may carry. It never replaces the primary number and never
 * merges identities: matching a secondary number resolves to the owning
 * contact and identity decisions stay with the match policy.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { contactScopeWhere, combineContactScopeAndSearch } from '@/lib/contacts/access-scope';
import { normalizePhone, normalizePhoneE164 } from '@/lib/phone-normalization';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

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

export const GET = withAuth(async (_req: Request, auth: AuthContext, context: Context) => {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ success: false, error: 'Contact id is required.' }, { status: 400 });
  try {
    const contact = await findScopedContact(id, auth);
    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found or outside your authorized scope.' }, { status: 404 });

    const rows = await db.contactPhone.findMany({
      where: { contactId: id },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
    // How many OTHER contacts legitimately share each number (family/business
    // lines exist). Reported, never auto-merged (spec §10).
    const numbers = rows.map((row) => row.normalizedPhone);
    const shared = numbers.length
      ? await db.contactPhone.groupBy({
          by: ['normalizedPhone'],
          where: { normalizedPhone: { in: numbers } },
          _count: { _all: true },
        }).catch(() => [])
      : [];
    const sharedMap = new Map(shared.map((row) => [row.normalizedPhone, row._count._all]));

    return NextResponse.json({
      success: true,
      phones: rows.map((row) => ({
        id: row.id,
        phone: row.phone,
        normalizedPhone: row.normalizedPhone,
        e164: normalizePhoneE164(row.phone),
        label: row.label,
        isPrimary: row.isPrimary,
        isWhatsApp: row.isWhatsApp,
        source: row.source,
        createdAt: row.createdAt,
        sharedWithOtherContacts: Math.max(0, (sharedMap.get(row.normalizedPhone) ?? 1) - 1),
      })),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Contact phones could not be loaded.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });

export const POST = withAuth(async (req: Request, auth: AuthContext, context: Context) => {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ success: false, error: 'Contact id is required.' }, { status: 400 });
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

  const rawPhone = typeof body.phone === 'string' ? body.phone.trim().slice(0, 32) : '';
  const normalizedPhone = normalizePhone(rawPhone);
  if (!normalizedPhone || normalizedPhone.length < 8 || normalizedPhone.length > 15) {
    return NextResponse.json({ success: false, error: 'A valid phone number is required.' }, { status: 400 });
  }
  const label = (typeof body.label === 'string' ? body.label.trim().toUpperCase() : 'ALTERNATIVE').slice(0, 32);
  if (!LABELS.has(label)) {
    return NextResponse.json({ success: false, error: `Label must be one of: ${[...LABELS].join(', ')}.` }, { status: 400 });
  }
  const isWhatsApp = body.isWhatsApp === true;
  const isPrimary = body.isPrimary === true;

  try {
    const contact = await findScopedContact(id, auth);
    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found or outside your authorized scope.' }, { status: 404 });

    if (normalizedPhone === (contact as { normalizedPhone?: string }).normalizedPhone) {
      return NextResponse.json(
        { success: false, error: 'This number is already the contact\'s primary number.' },
        { status: 409 },
      );
    }
    const duplicate = await db.contactPhone.findUnique({ where: { contactId_normalizedPhone: { contactId: id, normalizedPhone } } });
    if (duplicate) {
      return NextResponse.json({ success: false, error: 'This number is already recorded for this contact.' }, { status: 409 });
    }

    const created = await db.$transaction(async (tx) => {
      if (isPrimary) {
        await tx.contactPhone.updateMany({ where: { contactId: id, isPrimary: true }, data: { isPrimary: false } });
      }
      const row = await tx.contactPhone.create({
        data: {
          contactId: id,
          phone: rawPhone,
          normalizedPhone,
          label,
          isPrimary,
          isWhatsApp,
          source: 'MANUAL',
          createdBy: auth.userId,
        },
      });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'CONTACT_PHONE_ADDED',
          entityType: 'WhatsAppContact',
          entityId: id,
          metadata: JSON.stringify({ contactPhoneId: row.id, label, isPrimary, isWhatsApp, actor: auth.userId }),
          ipAddress: ipOf(req),
          userAgent: (req.headers.get('user-agent') || '').slice(0, 255),
        },
      });
      return row;
    });

    const sharedWithContacts = await db.contactPhone.count({ where: { normalizedPhone, NOT: { contactId: id } } }).catch(() => 0);

    return NextResponse.json({
      success: true,
      phone: {
        id: created.id,
        phone: created.phone,
        normalizedPhone: created.normalizedPhone,
        label: created.label,
        isPrimary: created.isPrimary,
        isWhatsApp: created.isWhatsApp,
      },
      sharedWithContacts,
      note: sharedWithContacts > 0
        ? 'This number is shared with other registry records. That is allowed for family/business lines; matched identities are never merged automatically.'
        : undefined,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'The phone number could not be added. Nothing was written.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.manage'] });
