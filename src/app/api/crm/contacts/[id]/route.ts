/**
 * Company Contact Hub — single contact profile and scoped update.
 *
 * The profile aggregates data that already exists in the CRM (registry row,
 * linked student/lead, consent ledger, WhatsApp archive, tasks and audit log).
 * It never writes to a second contact table.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { contactScopeWhere, combineContactScopeAndSearch } from '@/lib/contacts/access-scope';
import { toRegistryContact } from '@/lib/contacts/registry';
import { phoneVariants } from '@/lib/communications/contact-identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Context = { params: Promise<{ id: string }> };

async function findScopedContact(id: string, auth: AuthContext) {
  const scope = await contactScopeWhere(auth);
  return db.whatsAppContact.findFirst({
    where: combineContactScopeAndSearch(scope, [{ id }]) as never,
  });
}

export const GET = withAuth(async (req: Request, auth: AuthContext, context: Context) => {
  const { id } = await context.params;
  if (!id) return NextResponse.json({ success: false, error: 'Contact id is required.' }, { status: 400 });
  try {
    const row = await findScopedContact(id, auth);
    if (!row) return NextResponse.json({ success: false, error: 'Contact not found or outside your authorized scope.' }, { status: 404 });
    const contact = toRegistryContact(row as never);
    const variants = phoneVariants(contact.normalizedPhone);
    const identityOr = [
      { contactId: id },
      ...(contact.normalizedPhone ? [{ normalizedPhone: contact.normalizedPhone }] : []),
      ...(contact.studentId ? [{ studentId: contact.studentId }] : []),
      ...(contact.leadId ? [{ leadId: contact.leadId }] : []),
    ];

    const [consent, messages, tasks, student, lead, audit] = await Promise.all([
      db.consentRecord.findMany({ where: { OR: identityOr } as never, orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []),
      db.whatsAppMessageArchive.findMany({
        where: { OR: [
          { senderPhone: { in: variants } },
          { receiverPhone: { in: variants } },
          ...(contact.studentId ? [{ studentId: contact.studentId }] : []),
          ...(contact.leadId ? [{ leadId: contact.leadId }] : []),
        ], isDeleted: false, isHidden: false } as never,
        orderBy: { timestamp: 'desc' },
        take: 50,
        select: {
          id: true, whatsappMessageId: true, conversationId: true, direction: true,
          messageType: true, messageBody: true, deliveryStatus: true, timestamp: true,
          aiGenerated: true, employeeSenderId: true,
        },
      }).catch(() => []),
      db.counselorTask.findMany({
        where: { OR: [
          ...(contact.studentId ? [{ studentId: contact.studentId }] : []),
          ...(contact.leadId ? [{ leadId: contact.leadId }] : []),
        ] } as never,
        orderBy: { createdAt: 'desc' },
        take: 50,
      }).catch(() => []),
      contact.studentId ? db.student.findFirst({ where: { OR: [{ id: contact.studentId }, { studentId: contact.studentId }] }, select: { id: true, studentId: true, name: true, journeyStage: true } }).catch(() => null) : Promise.resolve(null),
      contact.leadId ? db.lead.findFirst({ where: { OR: [{ id: contact.leadId }, { leadId: contact.leadId }] }, select: { id: true, leadId: true, fullName: true, status: true } }).catch(() => null) : Promise.resolve(null),
      db.portalAuditLog.findMany({ where: { entityType: 'WhatsAppContact', entityId: id }, orderBy: { createdAt: 'desc' }, take: 50 }).catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      contact,
      linkedRecords: { student, lead },
      // Consent evidence is returned only to callers with contacts.view; the
      // dedicated consent endpoint applies the stricter consent-view gate.
      consentSummary: (consent as Array<{ channel: string; purpose: string; consentStatus: string; createdAt: Date }>).map((row) => ({
        channel: row.channel, purpose: row.purpose, status: row.consentStatus, at: row.createdAt,
      })),
      communicationHistory: messages,
      tasks,
      audit,
      dataSource: 'existing CRM tables',
      integrationState: 'LIVE_DB',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Contact profile is temporarily unavailable.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context: Context) => {
  const { id } = await context.params;
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: 'A JSON body is required.' }, { status: 400 });
  }
  // Identity, consent and suppression state are never editable from this
  // endpoint. Consent must go through the append-only consent service.
  const forbidden = ['phone', 'normalizedPhone', 'studentId', 'leadId', 'partnerId', 'isOptedOut', 'isBlocked', 'optedOutAt', 'whatsappVerified', 'emailVerified'];
  if (forbidden.some((key) => key in body)) {
    return NextResponse.json({
      success: false,
      error: 'Identity links and consent/suppression state cannot be changed here. Use the consent workflow or an identity review.',
    }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  const str = (key: string, max: number) => {
    if (typeof body[key] !== 'string') return;
    data[key] = String(body[key]).trim().slice(0, max);
  };
  str('displayName', 256);
  str('email', 320);
  if (typeof data.email === 'string') data.normalizedEmail = String(data.email).toLowerCase();
  str('branch', 128);
  str('assignedCounselorId', 128);
  if (Array.isArray(body.tags)) data.tags = JSON.stringify(body.tags.slice(0, 50).map((tag) => String(tag).slice(0, 64)));
  if (!Object.keys(data).length) {
    return NextResponse.json({ success: false, error: 'No permitted fields were supplied.' }, { status: 400 });
  }

  try {
    const existing = await findScopedContact(id, auth);
    if (!existing) return NextResponse.json({ success: false, error: 'Contact not found or outside your authorized scope.' }, { status: 404 });
    const updated = await db.$transaction(async (tx) => {
      const row = await tx.whatsAppContact.update({ where: { id }, data: data as never });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'CONTACT_REGISTRY_UPDATED',
          entityType: 'WhatsAppContact',
          entityId: id,
          metadata: JSON.stringify({ fields: Object.keys(data), before: { displayName: (existing as { displayName?: string }).displayName || '' } }),
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 64) || '',
          userAgent: req.headers.get('user-agent')?.slice(0, 255) || '',
        },
      });
      return row;
    });
    return NextResponse.json({ success: true, contact: toRegistryContact(updated as never) });
  } catch {
    return NextResponse.json({ success: false, error: 'Contact could not be updated.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.manage'] });
