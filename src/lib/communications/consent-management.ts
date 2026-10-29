import { db } from '@/lib/db';
import { normalizePhone, phoneVariants } from '@/lib/phone-normalization';

export type MarketingConsentStatus = 'OPTED_IN' | 'OPTED_OUT' | 'PENDING' | 'UNKNOWN';
export type ConsentTarget = {
  contactId?: string;
  phone?: string;
  normalizedPhone?: string;
  email?: string;
  studentId?: string;
  leadId?: string;
  partnerId?: string;
};

export type ConsentEvidence = {
  source: string;
  method: string;
  policyVersion: string;
  evidenceReference: string;
  text?: string;
  recordedById?: string;
  withdrawalReason?: string;
};

export type ConsentLookup = ConsentTarget & {
  channel: string;
  purpose: string;
};

function canonicalChannel(channel: string): string {
  return channel.trim().toUpperCase();
}

function canonicalPurpose(purpose: string): string {
  return purpose.trim().toUpperCase();
}

function normalizedTargetPhone(target: ConsentTarget): string {
  return normalizePhone(target.normalizedPhone || target.phone || '');
}

function consentIdentityWhere(target: ConsentTarget) {
  const normalizedPhone = normalizedTargetPhone(target);
  const or: Array<Record<string, string>> = [];
  if (target.contactId?.trim()) or.push({ contactId: target.contactId.trim() });
  if (normalizedPhone) or.push({ normalizedPhone });
  if (target.studentId?.trim()) or.push({ studentId: target.studentId.trim() });
  if (target.leadId?.trim()) or.push({ leadId: target.leadId.trim() });
  if (target.partnerId?.trim()) or.push({ partnerId: target.partnerId.trim() });
  if (target.email?.trim()) or.push({ email: target.email.trim().toLowerCase() });
  return or.length ? { OR: or } : null;
}

export async function getContactConsent(contactId: string, channel: string, purpose: string) {
  const identity = consentIdentityWhere({ contactId });
  if (!identity) return null;
  return db.consentRecord.findFirst({
    where: {
      ...identity,
      channel: canonicalChannel(channel),
      purpose: canonicalPurpose(purpose),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

export async function getConsentForTarget(target: ConsentTarget, channel: string, purpose: string) {
  const normalizedPhone = normalizedTargetPhone(target);
  const normalizedEmail = target.email?.trim().toLowerCase() || '';
  // When the send has a concrete destination, consent is bound to that exact
  // normalized endpoint. A stale student/lead ID can never authorize a new phone.
  const canonical = canonicalChannel(channel);
  const identity = canonical === 'EMAIL' && normalizedEmail
    ? { email: normalizedEmail }
    : normalizedPhone
      ? { normalizedPhone }
      : normalizedEmail
        ? { email: normalizedEmail }
        : consentIdentityWhere(target);
  if (!identity) return null;
  return db.consentRecord.findFirst({
    where: {
      ...identity,
      channel: canonicalChannel(channel),
      purpose: canonicalPurpose(purpose),
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
}

export async function auditConsentChange(input: {
  recordId: string;
  channel: string;
  purpose: string;
  status: MarketingConsentStatus;
  source: string;
  actorId?: string;
}) {
  await db.auditLog.create({
    data: {
      userId: input.actorId && input.actorId !== 'system' ? input.actorId : null,
      action: input.status === 'OPTED_OUT' ? 'CONTACT_CONSENT_WITHDRAWN' : 'CONTACT_CONSENT_RECORDED',
      resource: 'ConsentRecord',
      resourceId: input.recordId,
      actorRole: input.actorId && input.actorId !== 'system' ? 'authenticated_actor' : 'system',
      details: JSON.stringify({
        channel: canonicalChannel(input.channel),
        purpose: canonicalPurpose(input.purpose),
        status: input.status,
        source: input.source.slice(0, 100),
      }),
    },
  });
}

async function updateCurrentChannelState(input: {
  normalizedPhone: string;
  phone: string;
  status: MarketingConsentStatus;
  text?: string;
  reason?: string;
}) {
  if (!input.normalizedPhone) return;
  const consentId = `consent-${input.normalizedPhone}`;
  const optedOut = input.status === 'OPTED_OUT';
  const now = new Date();
  const variants = [...new Set([...phoneVariants(input.normalizedPhone), input.phone].filter(Boolean))];

  await db.communicationConsent.upsert({
    where: { id: consentId },
    update: {
      consentGiven: input.status === 'OPTED_IN',
      consentGivenAt: input.status === 'OPTED_IN' ? now : undefined,
      consentText: input.text?.slice(0, 512) || '',
      optedOutAt: optedOut ? now : input.status === 'OPTED_IN' ? null : undefined,
      optOutReason: optedOut ? (input.reason || 'Recipient withdrew WhatsApp marketing consent').slice(0, 191) : input.status === 'OPTED_IN' ? '' : undefined,
    },
    create: {
      id: consentId,
      contactId: input.normalizedPhone,
      contactType: 'contact',
      channel: 'whatsapp',
      consentGiven: input.status === 'OPTED_IN',
      consentGivenAt: input.status === 'OPTED_IN' ? now : null,
      consentText: input.text?.slice(0, 512) || '',
      optedOutAt: optedOut ? now : null,
      optOutReason: optedOut ? (input.reason || 'Recipient withdrew WhatsApp marketing consent').slice(0, 191) : '',
    },
  });

  if (optedOut) {
    await db.whatsAppContact.upsert({
      where: { normalizedPhone: input.normalizedPhone },
      update: { isOptedOut: true, optedOutAt: now, optOutReason: (input.reason || 'Marketing consent withdrawn').slice(0, 191) },
      create: {
        phone: input.phone || input.normalizedPhone,
        normalizedPhone: input.normalizedPhone,
        displayName: 'WhatsApp contact',
        source: 'WHATSAPP',
        isOptedOut: true,
        optedOutAt: now,
        optOutReason: (input.reason || 'Marketing consent withdrawn').slice(0, 191),
      },
    });
    await db.whatsAppFollowUpSchedule.updateMany({
      where: { contactPhone: { in: variants }, status: { in: ['scheduled', 'pending', 'retrying'] } },
      data: { status: 'cancelled', isOptedOut: true, isPaused: false, pauseReason: 'Promotional consent withdrawn' },
    }).catch(() => {});
    await db.whatsAppRetryQueue.updateMany({
      where: {
        recipientPhone: { in: variants },
        purpose: 'promotional_marketing',
        status: { in: ['pending', 'retrying'] },
      },
      data: { status: 'cancelled', lastError: 'Cancelled after consent withdrawal', nextRetryAt: null },
    }).catch(() => {});
  } else if (input.status === 'OPTED_IN') {
    // The new append-only grant event is preserved in ConsentRecord. Clearing
    // the materialized flag is allowed only after an explicit renewed grant.
    await db.whatsAppContact.updateMany({
      where: { normalizedPhone: input.normalizedPhone },
      data: { isOptedOut: false, optedOutAt: null, optOutReason: '' },
    });
  }
}

export async function recordConsent(input: ConsentLookup & {
  status: MarketingConsentStatus;
  evidence: ConsentEvidence;
}) {
  const channel = canonicalChannel(input.channel);
  const purpose = canonicalPurpose(input.purpose);
  const phone = input.phone || input.normalizedPhone || '';
  const normalizedPhone = normalizedTargetPhone(input);
  const evidence = input.evidence;

  if (!channel || !purpose || !evidence.source?.trim() || !evidence.method?.trim() || !evidence.policyVersion?.trim() || !evidence.evidenceReference?.trim()) {
    throw new Error('Consent channel, purpose, source, method, policy version and evidence reference are required.');
  }
  if (input.status === 'OPTED_IN' && !evidence.text?.trim()) {
    throw new Error('The exact consent wording or command evidence is required for an affirmative opt-in.');
  }
  if (!input.contactId && !normalizedPhone && !input.studentId && !input.leadId && !input.partnerId && !input.email) {
    throw new Error('An existing contact identity is required.');
  }

  const now = new Date();
  const record = await db.consentRecord.create({
    data: {
      contactId: input.contactId || null,
      normalizedPhone: normalizedPhone || null,
      email: input.email?.trim().toLowerCase() || null,
      studentId: input.studentId || null,
      leadId: input.leadId || null,
      partnerId: input.partnerId || null,
      channel,
      purpose,
      consentStatus: input.status,
      consentDate: input.status === 'OPTED_IN' ? now : null,
      optOutDate: input.status === 'OPTED_OUT' ? now : null,
      consentSource: evidence.source.slice(0, 191),
      consentMethod: evidence.method.slice(0, 191),
      consentText: evidence.text?.trim().slice(0, 512) || '',
      policyVersion: evidence.policyVersion.slice(0, 191),
      evidenceReference: evidence.evidenceReference.slice(0, 191),
      recordedById: evidence.recordedById || 'system',
      withdrawalReason: input.status === 'OPTED_OUT' ? (evidence.withdrawalReason || evidence.text || 'Recipient request').slice(0, 191) : '',
    },
  });

  await auditConsentChange({
    recordId: record.id,
    channel,
    purpose,
    status: input.status,
    source: evidence.source,
    actorId: evidence.recordedById,
  });

  if (channel === 'WHATSAPP' && purpose === 'PROMOTIONAL_MARKETING') {
    await updateCurrentChannelState({
      normalizedPhone,
      phone,
      status: input.status,
      text: evidence.text,
      reason: evidence.withdrawalReason || evidence.text,
    });
  }
  return record;
}

export async function withdrawConsent(input: ConsentLookup & {
  source: string;
  method: string;
  evidenceReference: string;
  policyVersion?: string;
  text?: string;
  reason?: string;
  recordedById?: string;
}) {
  return recordConsent({
    ...input,
    status: 'OPTED_OUT',
    evidence: {
      source: input.source,
      method: input.method,
      policyVersion: input.policyVersion || 'alo-consent-v1',
      evidenceReference: input.evidenceReference,
      text: input.text || 'Recipient requested no promotional messages.',
      withdrawalReason: input.reason,
      recordedById: input.recordedById,
    },
  });
}

export async function applySuppression(input: {
  phone: string;
  channel: string;
  reason: string;
  evidenceReference: string;
}) {
  if (canonicalChannel(input.channel) !== 'WHATSAPP') {
    throw new Error('This suppression operation currently supports WhatsApp only.');
  }
  return withdrawConsent({
    phone: input.phone,
    channel: 'WHATSAPP',
    purpose: 'PROMOTIONAL_MARKETING',
    source: 'SUPPRESSION',
    method: 'ADMIN_OR_SYSTEM_SUPPRESSION',
    policyVersion: 'alo-consent-v1',
    evidenceReference: input.evidenceReference,
    text: input.reason,
    reason: input.reason,
  });
}

export async function isEligibleForMarketing(input: ConsentLookup): Promise<{
  eligible: boolean;
  reason: 'eligible' | 'missing_consent' | 'withdrawn' | 'blocked' | 'invalid_identity' | 'unsupported_channel';
  consentRecordId?: string;
}> {
  const channel = canonicalChannel(input.channel);
  const purpose = canonicalPurpose(input.purpose);
  const phone = normalizedTargetPhone(input);
  const identity = consentIdentityWhere(input);
  if (!identity && !input.email) return { eligible: false, reason: 'invalid_identity' };
  if (!['WHATSAPP', 'EMAIL', 'SMS', 'CALL', 'MESSENGER', 'FACEBOOK', 'INSTAGRAM'].includes(channel)) {
    return { eligible: false, reason: 'unsupported_channel' };
  }

  const consent = await getConsentForTarget({ ...input, normalizedPhone: phone || undefined }, channel, purpose);
  if (!consent) return { eligible: false, reason: 'missing_consent' };
  if (consent.consentStatus !== 'OPTED_IN' || consent.optOutDate) return { eligible: false, reason: 'withdrawn' };
  if (!consent.consentDate || !consent.consentSource || !consent.consentMethod || !consent.policyVersion || !consent.evidenceReference) {
    return { eligible: false, reason: 'missing_consent' };
  }

  if (channel === 'WHATSAPP') {
    if (!phone) return { eligible: false, reason: 'invalid_identity' };
    const [contact, currentState] = await Promise.all([
      db.whatsAppContact.findUnique({ where: { normalizedPhone: phone }, select: { isBlocked: true, isOptedOut: true } }),
      db.communicationConsent.findUnique({ where: { id: `consent-${phone}` }, select: { consentGiven: true, optedOutAt: true } }),
    ]);
    if (contact?.isBlocked) return { eligible: false, reason: 'blocked' };
    if (!currentState) return { eligible: false, reason: 'missing_consent' };
    if (contact?.isOptedOut || currentState.optedOutAt || !currentState.consentGiven) {
      return { eligible: false, reason: 'withdrawn' };
    }
  } else if (channel === 'EMAIL' && input.email) {
    const suppression = await db.emailSuppression.findUnique({ where: { email: input.email.trim().toLowerCase() }, select: { id: true } }).catch(() => null);
    if (suppression) return { eligible: false, reason: 'blocked' };
  }

  return { eligible: true, reason: 'eligible', consentRecordId: consent.id };
}
