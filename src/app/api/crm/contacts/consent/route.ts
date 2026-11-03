/**
 * Contact Hub — purpose-specific consent ledger.
 *
 * Uses the SAME ConsentManagementService as every promotional send path. A
 * contact simply existing (or having sent a WhatsApp message) never creates
 * promotional consent here: an affirmative opt-in requires explicit wording,
 * source, method, policy version and an evidence reference.
 */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { contactScopeWhere, combineContactScopeAndSearch } from '@/lib/contacts/access-scope';
import { contactHubPermissionDenied } from '@/lib/contacts/hub-access';
import { CONSENT_PURPOSES, SUPPORTED_CHANNELS } from '@/lib/contacts/registry';
import { getContactConsent, recordConsent, withdrawConsent, applySuppression, isEligibleForMarketing } from '@/lib/communications/consent-management';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function scopedContact(id: string, auth: AuthContext) {
  const scope = await contactScopeWhere(auth);
  return db.whatsAppContact.findFirst({ where: combineContactScopeAndSearch(scope, [{ id }]) as never });
}

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = contactHubPermissionDenied(auth, 'contacts.consent.view', ['BRANCH_MANAGER', 'MARKETING_MANAGER']);
  if (denied) return denied;
  const contactId = new URL(req.url).searchParams.get('contactId')?.trim() || '';
  if (!contactId) return NextResponse.json({ success: false, error: 'contactId is required.' }, { status: 400 });
  try {
    const contact = await scopedContact(contactId, auth);
    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found or outside your authorized scope.' }, { status: 404 });
    const row = contact as { id: string; normalizedPhone?: string; email?: string; isOptedOut?: boolean; isBlocked?: boolean };
    const ledger = await db.consentRecord.findMany({
      where: { OR: [
        { contactId },
        ...(row.normalizedPhone ? [{ normalizedPhone: row.normalizedPhone }] : []),
        ...(row.email ? [{ email: row.email.toLowerCase() }] : []),
      ] } as never,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    const eligibility = await isEligibleForMarketing({
      contactId,
      normalizedPhone: row.normalizedPhone,
      channel: 'WHATSAPP',
      purpose: 'PROMOTIONAL_MARKETING',
    }).catch(() => ({ eligible: false, reason: 'missing_consent' as const }));
    return NextResponse.json({
      success: true,
      contactId,
      ledger,
      promotionalEligibility: eligibility,
      suppression: { optedOut: Boolean(row.isOptedOut), blocked: Boolean(row.isBlocked) },
      policy: 'Transactional and promotional consent are separate. Missing consent is never treated as consent.',
      integrationState: 'LIVE_DB',
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Consent ledger is temporarily unavailable.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = contactHubPermissionDenied(auth, 'contacts.consent.manage', ['BRANCH_MANAGER']);
  if (denied) return denied;
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: 'A JSON body is required.' }, { status: 400 });
  }
  const contactId = typeof body.contactId === 'string' ? body.contactId.trim() : '';
  const action = typeof body.action === 'string' ? body.action.trim().toUpperCase() : '';
  const channel = typeof body.channel === 'string' ? body.channel.trim().toUpperCase() : 'WHATSAPP';
  const purpose = typeof body.purpose === 'string' ? body.purpose.trim().toUpperCase() : 'PROMOTIONAL_MARKETING';
  if (!contactId || !['GRANT', 'WITHDRAW', 'SUPPRESS'].includes(action)) {
    return NextResponse.json({ success: false, error: 'contactId and a GRANT, WITHDRAW or SUPPRESS action are required.' }, { status: 400 });
  }
  if (!SUPPORTED_CHANNELS.includes(channel as never) || !CONSENT_PURPOSES.includes(purpose as never)) {
    return NextResponse.json({ success: false, error: 'Unsupported channel or purpose.' }, { status: 400 });
  }
  const wording = typeof body.wording === 'string' ? body.wording.trim().slice(0, 512) : '';
  const source = typeof body.source === 'string' && body.source.trim() ? body.source.trim().slice(0, 191) : 'CONTACT_HUB_MANUAL';
  const policyVersion = typeof body.policyVersion === 'string' && body.policyVersion.trim() ? body.policyVersion.trim().slice(0, 191) : 'alo-consent-v1';
  if (action === 'GRANT' && !wording) {
    return NextResponse.json({ success: false, error: 'An affirmative opt-in requires the exact wording shown to the contact.' }, { status: 400 });
  }

  try {
    const contact = await scopedContact(contactId, auth);
    if (!contact) return NextResponse.json({ success: false, error: 'Contact not found or outside your authorized scope.' }, { status: 404 });
    const row = contact as { normalizedPhone?: string; phone?: string; email?: string };
    const evidenceReference = `contact-hub:${contactId}:${Date.now()}`;
    const common = {
      contactId,
      normalizedPhone: row.normalizedPhone,
      phone: row.phone,
      email: row.email?.toLowerCase(),
      channel,
      purpose,
    };

    let result: unknown;
    if (action === 'GRANT') {
      result = await recordConsent({
        ...common,
        status: 'OPTED_IN',
        evidence: {
          source,
          method: 'AUTHORIZED_STAFF_RECORDED',
          policyVersion,
          evidenceReference,
          text: wording,
          recordedById: auth.actorUserId || auth.userId,
        },
      });
    } else if (action === 'WITHDRAW') {
      result = await withdrawConsent({
        ...common,
        source,
        method: 'AUTHORIZED_STAFF_RECORDED',
        policyVersion,
        evidenceReference,
        text: wording || 'Recipient requested no further messages.',
        reason: typeof body.reason === 'string' ? body.reason.slice(0, 191) : 'Recorded in Contact Hub',
        recordedById: auth.actorUserId || auth.userId,
      });
    } else {
      result = await applySuppression({
        phone: row.normalizedPhone || row.phone || '',
        channel,
        reason: typeof body.reason === 'string' ? body.reason.slice(0, 191) : 'Recorded in Contact Hub',
        evidenceReference,
      });
    }

    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: `CONTACT_CONSENT_${action}`,
        entityType: 'ConsentRecord',
        entityId: contactId,
        metadata: JSON.stringify({ channel, purpose, source, policyVersion, evidenceReference }),
      },
    }).catch(() => null);

    // The shared eligibility service is the authority, not this endpoint's
    // assumption. Report the post-change state to the UI.
    const eligibility = await isEligibleForMarketing({ ...common, channel, purpose }).catch(() => ({ eligible: false, reason: 'missing_consent' as const }));
    return NextResponse.json({ success: true, action, result, eligibility, suppressionPreserved: action !== 'GRANT' }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    return NextResponse.json({ success: false, error: message || 'Consent change could not be recorded.' }, { status: 400 });
  }
}, { requirePermissions: ['contacts.view'] });
