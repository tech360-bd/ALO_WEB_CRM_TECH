import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { recordConsent, type MarketingConsentStatus } from '@/lib/communications/consent-management';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
const CHANNELS = new Set(['WHATSAPP', 'SMS', 'EMAIL', 'CALL', 'PHONE', 'FACEBOOK', 'INSTAGRAM', 'MESSENGER']);
const STATUSES = new Set<MarketingConsentStatus>(['OPTED_IN', 'OPTED_OUT', 'PENDING', 'UNKNOWN']);
const PURPOSES = new Set(['TRANSACTIONAL', 'SERVICE_UPDATES', 'PROMOTIONAL_MARKETING', 'UNKNOWN']);
function isAdministrator(auth: { userType: string; roles: string[] }) {
  return [auth.userType, ...auth.roles].some((role) => ADMIN_ROLES.has(role.toUpperCase()));
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });
  try {
    const records = await db.consentRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
      select: { id: true, studentId: true, leadId: true, contactId: true, normalizedPhone: true, channel: true, purpose: true, consentStatus: true, preferredLanguage: true, consentDate: true, optOutDate: true, consentSource: true, consentMethod: true, evidenceReference: true, recordedById: true, createdAt: true },
    });
    return NextResponse.json({
      records,
      stats: {
        total: records.length,
        optedIn: records.filter((record) => record.consentStatus === 'OPTED_IN').length,
        optedOut: records.filter((record) => record.consentStatus === 'OPTED_OUT').length,
        unknown: records.filter((record) => record.consentStatus === 'UNKNOWN' || record.consentStatus === 'PENDING').length,
      },
      verification: 'Historical or manually recorded evidence is not independently verified by a provider.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Consent records are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

/** Append one purpose/channel-specific evidence event; never overwrites prior STOP history. */
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'Invalid consent record.' }, { status: 400 });

  const inputStudent = typeof body.studentId === 'string' ? body.studentId.trim() : '';
  const inputLead = typeof body.leadId === 'string' ? body.leadId.trim() : '';
  const inputContact = typeof body.contactId === 'string' ? body.contactId.trim() : '';
  const identityCount = [inputStudent, inputLead, inputContact].filter(Boolean).length;
  const channel = typeof body.channel === 'string' ? body.channel.trim().toUpperCase() : '';
  const purpose = typeof body.purpose === 'string' ? body.purpose.trim().toUpperCase() : '';
  const statusValue = typeof body.consentStatus === 'string' ? body.consentStatus.trim().toUpperCase() : '';
  const evidenceReference = typeof body.evidenceReference === 'string' ? body.evidenceReference.trim() : '';
  const consentText = typeof body.consentText === 'string' ? body.consentText.trim() : '';
  const source = typeof body.source === 'string' ? body.source.trim() : '';
  const method = typeof body.method === 'string' ? body.method.trim() : '';
  const reason = typeof body.reason === 'string' ? body.reason.trim() : '';
  const policyVersion = typeof body.policyVersion === 'string' ? body.policyVersion.trim() : 'alo-consent-v1';
  if (identityCount !== 1) return NextResponse.json({ success: false, error: 'Provide exactly one existing student, lead, or WhatsApp contact identity.' }, { status: 400 });
  if (!CHANNELS.has(channel) || !STATUSES.has(statusValue as MarketingConsentStatus) || !PURPOSES.has(purpose)) return NextResponse.json({ success: false, error: 'Unsupported channel, purpose, or consent status.' }, { status: 400 });
  const status = statusValue as MarketingConsentStatus;
  if (evidenceReference.length < 4 || evidenceReference.length > 250 || !source || source.length > 191 || !method || method.length > 191 || !policyVersion || policyVersion.length > 191) {
    return NextResponse.json({ success: false, error: 'Evidence reference, source, method, and policy version are required.' }, { status: 400 });
  }
  if (status === 'OPTED_IN' && !consentText) return NextResponse.json({ success: false, error: 'Exact affirmative consent wording or command evidence is required for opt-in.' }, { status: 400 });
  if (status === 'OPTED_OUT' && !reason && !consentText) return NextResponse.json({ success: false, error: 'Withdrawal reason or recipient request evidence is required.' }, { status: 400 });

  try {
    let studentId: string | undefined;
    let leadId: string | undefined;
    let contactId: string | undefined;
    let phone = '';
    if (inputStudent) {
      const student = await db.student.findFirst({ where: { OR: [{ id: inputStudent }, { studentId: inputStudent }] }, select: { id: true, phone: true } });
      if (!student) return NextResponse.json({ success: false, error: 'The referenced CRM student was not found.' }, { status: 404 });
      studentId = student.id;
      phone = student.phone;
    } else if (inputLead) {
      const lead = await db.lead.findFirst({ where: { OR: [{ id: inputLead }, { leadId: inputLead }] }, select: { id: true, phone: true } });
      if (!lead) return NextResponse.json({ success: false, error: 'The referenced CRM lead was not found.' }, { status: 404 });
      leadId = lead.id;
      phone = lead.phone || '';
    } else {
      const contact = await db.whatsAppContact.findUnique({ where: { id: inputContact }, select: { id: true, phone: true, normalizedPhone: true } });
      if (!contact) return NextResponse.json({ success: false, error: 'The referenced WhatsApp contact was not found.' }, { status: 404 });
      contactId = contact.id;
      phone = contact.phone || contact.normalizedPhone;
    }

    const record = await recordConsent({
      studentId,
      leadId,
      contactId,
      phone: phone || undefined,
      channel,
      purpose,
      status,
      evidence: {
        source,
        method,
        policyVersion,
        evidenceReference,
        text: consentText || undefined,
        withdrawalReason: reason || undefined,
        recordedById: auth.userId,
      },
    });
    await logAuditAction(auth, 'CONSENT_EVIDENCE_APPENDED', 'ConsentRecord', record.id, {
      consentStatus: status,
      channel,
      purpose,
      source,
      evidenceReference,
      externalEvidenceVerified: false,
    });
    return NextResponse.json({
      record: { id: record.id, studentId: record.studentId, leadId: record.leadId, contactId: record.contactId, normalizedPhone: record.normalizedPhone, channel: record.channel, purpose: record.purpose, consentStatus: record.consentStatus, consentDate: record.consentDate, optOutDate: record.optOutDate, createdAt: record.createdAt },
      message: `A new ${status} event for ${channel}/${purpose} was appended. Earlier events remain in the ledger.`,
      verification: 'NOT VERIFIED — evidence is an authenticated administrator assertion unless independently confirmed at the source.',
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Consent record could not be saved.';
    return NextResponse.json({ success: false, error: message }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
