/**
 * CONTACT IDENTITY & DEDUPLICATION (spec §125/§126/§141/§142)
 * ===========================================================
 * The brief treats duplicate students as a serious failure:
 *
 *   §126 "A phone number must not create unlimited duplicate students."
 *        Before creating a contact: normalize → exact search → alternate phone
 *        fields → verified WhatsApp identity → email → existing lead → existing
 *        student → existing partner contact. If a likely duplicate exists, show
 *        POSSIBLE EXISTING CONTACT with [Open Existing] [Merge Request]
 *        [Create New - Authorized Role Only]. "Never silently merge two students."
 *
 * The repository already has a canonical normalizer
 * (`src/lib/phone-normalization.ts`) used by the webhook; this module builds the
 * *decision* layer on top of it rather than adding a seventh copy — the repo has
 * six normalizePhone implementations already, and the brief forbids duplicate
 * systems.
 *
 * Pure functions: callers pass in the candidate records they found, and get back
 * a decision they must act on. No database here.
 */

import { normalizePhone, normalizePhoneE164 } from '@/lib/phone-normalization';

export type ContactKind = 'student' | 'lead' | 'partner_contact' | 'unknown';

export interface ContactCandidate {
  kind: ContactKind;
  id: string;
  /** Human reference shown in the UI, e.g. student code or lead id. */
  reference?: string | null;
  name?: string | null;
  phone?: string | null;
  altPhone?: string | null;
  /** Verified WhatsApp identity, where the provider supplies it. */
  whatsappNumber?: string | null;
  email?: string | null;
  /** True when this record was matched through a non-primary field. */
  matchedOn?: MatchField;
}

export type MatchField =
  | 'phone'
  | 'alt_phone'
  | 'whatsapp_identity'
  | 'email'
  | 'lead_reference'
  | 'student_reference'
  | 'partner_reference';

export interface IdentityInput {
  phone?: string | null;
  altPhone?: string | null;
  whatsappNumber?: string | null;
  email?: string | null;
}

/**
 * Every stored representation that could be the same subscriber.
 *
 * Kept to digit-level variants of one canonical number — deliberately NOT fuzzy
 * matching. Guessing that two different numbers belong to one person is how the
 * "duplicate students" problem and its opposite (wrong merges) both happen.
 */
export function phoneVariants(phone: string | null | undefined): string[] {
  const canonical = normalizePhone(phone);
  if (!canonical) return [];
  const variants = new Set<string>([canonical, normalizePhoneE164(phone).replace('+', '')]);

  // Bangladesh: 8801XXXXXXXXX ↔ 01XXXXXXXXX (both are stored in live data).
  if (/^8801\d{9}$/.test(canonical)) variants.add(`0${canonical.slice(3)}`);
  if (/^01\d{9}$/.test(canonical)) variants.add(`880${canonical.slice(1)}`);

  // Last-10-digits form catches numbers stored without a country code.
  if (canonical.length > 10) variants.add(canonical.slice(-10));

  return [...variants].filter(Boolean);
}

export function normalizeEmail(email: string | null | undefined): string {
  return String(email || '').trim().toLowerCase();
}

/** Is this string plausibly a reachable phone number? */
export function isPlausiblePhone(phone: string | null | undefined): boolean {
  const canonical = normalizePhone(phone);
  // Shortest real numbers are ~8 digits; E.164 allows 15. Reject the junk that
  // arrives from webhooks (e.g. "0", "N/A", 20-digit ids).
  return canonical.length >= 8 && canonical.length <= 15;
}

export interface MatchResult {
  /** `exact` — the primary phone matched; `possible` — matched on a weaker field. */
  confidence: 'exact' | 'possible' | 'none';
  candidate: ContactCandidate | null;
  /** Every plausible match, best first, so the UI can offer "Open Existing". */
  candidates: ContactCandidate[];
  matchedOn: MatchField | null;
  /** What the operator must be shown (spec §126). */
  notice: string | null;
  actions: Array<'open_existing' | 'merge_request' | 'create_new'>;
  /** True when creating a new record requires an authorized role. */
  requiresAuthorizedRole: boolean;
}

const CREATE_NEW = 'create_new' as const;

function scoreOf(field: MatchField): number {
  switch (field) {
    case 'phone':
      return 100;
    case 'whatsapp_identity':
      return 90;
    case 'alt_phone':
      return 70;
    case 'email':
      return 60;
    default:
      return 40;
  }
}

/**
 * Decide whether an inbound identity is a known contact.
 *
 * `candidates` are the records the caller already looked up (exact number, alt
 * phone, WhatsApp identity, email, lead, student, partner contact). This function
 * ranks them and states the required operator actions — it never merges.
 */
export function resolveContactIdentity(input: IdentityInput, candidates: ContactCandidate[]): MatchResult {
  const phoneSet = new Set(phoneVariants(input.phone));
  const altSet = new Set(phoneVariants(input.altPhone));
  const waSet = new Set(phoneVariants(input.whatsappNumber));
  const email = normalizeEmail(input.email);

  const scored: Array<{ candidate: ContactCandidate; field: MatchField; score: number }> = [];

  for (const candidate of candidates) {
    const candidatePhone = normalizePhone(candidate.phone);
    const candidateAlt = normalizePhone(candidate.altPhone);
    const candidateWa = normalizePhone(candidate.whatsappNumber);
    const candidateEmail = normalizeEmail(candidate.email);

    // Prefer the strongest field this candidate matches on.
    if (phoneSet.size > 0 && candidatePhone && phoneSet.has(candidatePhone)) {
      scored.push({ candidate, field: 'phone', score: scoreOf('phone') });
      continue;
    }
    if (waSet.size > 0 && candidateWa && waSet.has(candidateWa)) {
      scored.push({ candidate, field: 'whatsapp_identity', score: scoreOf('whatsapp_identity') });
      continue;
    }
    if (altSet.size > 0 && candidateAlt && altSet.has(candidateAlt)) {
      scored.push({ candidate, field: 'alt_phone', score: scoreOf('alt_phone') });
      continue;
    }
    if (email && candidateEmail && candidateEmail === email) {
      scored.push({ candidate, field: 'email', score: scoreOf('email') });
      continue;
    }
    // A candidate reached through a reference field (e.g. a lead created minutes
    // ago) is a weaker signal than a phone match but stronger than nothing.
    if (candidate.matchedOn && candidate.matchedOn.endsWith('_reference')) {
      scored.push({ candidate, field: candidate.matchedOn, score: scoreOf(candidate.matchedOn) });
    }
  }

  if (scored.length === 0) {
    return {
      confidence: 'none',
      candidate: null,
      candidates: [],
      matchedOn: null,
      notice: null,
      actions: [CREATE_NEW],
      requiresAuthorizedRole: false,
    };
  }

  scored.sort((a, b) => b.score - a.score || String(a.candidate.id).localeCompare(String(b.candidate.id)));
  const best = scored[0];
  const isExact = best.field === 'phone' && (best.candidate.kind === 'student' || best.candidate.kind === 'lead');

  const kindLabel = best.candidate.kind === 'student' ? 'student record' : best.candidate.kind === 'lead' ? 'lead' : 'partner contact';
  const alternativeCount = scored.length - 1;

  return {
    confidence: isExact ? 'exact' : 'possible',
    candidate: best.candidate,
    candidates: scored.map((entry) => entry.candidate),
    matchedOn: best.field,
    notice: isExact
      ? `Matched an existing ${kindLabel}${alternativeCount > 0 ? ` (and ${alternativeCount} other possible record${alternativeCount > 1 ? 's' : ''})` : ''}. Open the record instead of creating a new one.`
      : `POSSIBLE EXISTING CONTACT — matched on ${best.field.replace(/_/g, ' ')} only, not the primary phone number. Confirm with the student before creating anything new.`,
    actions: alternativeCount > 0 || !isExact
      ? ['open_existing', 'merge_request', CREATE_NEW]
      : ['open_existing', CREATE_NEW],
    // §126: creating a new record over a possible duplicate is restricted.
    requiresAuthorizedRole: !isExact,
  };
}

/** Spec §125 step 3 outcome — what the CRM is allowed to auto-create. */
export function shouldAutoCreateLead(result: MatchResult): boolean {
  return result.confidence === 'none';
}

/** Spec §125: never auto-create a Student from a WhatsApp number alone. */
export function shouldAutoCreateStudent(): false {
  return false;
}

/**
 * Spec §141/§142 — how an inbound call should be handled.
 */
export type CallerResolution =
  | { kind: 'student'; studentId: string; openPanel: true; notice: string }
  | { kind: 'lead'; leadId: string; openPanel: true; notice: string }
  | { kind: 'partner_contact'; contactId: string; openPanel: true; notice: string }
  | { kind: 'unknown'; callerNumber: string; openPanel: false; actions: Array<'create_lead' | 'link_existing' | 'create_partner_contact' | 'mark_spam'>; notice: string };

export function resolveInboundCaller(callerNumber: string, result: MatchResult): CallerResolution {
  if (result.candidate) {
    const { candidate } = result;
    if (candidate.kind === 'student') {
      return { kind: 'student', studentId: candidate.id, openPanel: true, notice: `Caller is ${candidate.name || 'a student'} (${candidate.reference || candidate.id}).` };
    }
    if (candidate.kind === 'lead') {
      return { kind: 'lead', leadId: candidate.id, openPanel: true, notice: `Caller matches lead ${candidate.reference || candidate.id}.` };
    }
    return { kind: 'partner_contact', contactId: candidate.id, openPanel: true, notice: `Caller matches a partner contact (${candidate.name || candidate.id}).` };
  }

  return {
    kind: 'unknown',
    callerNumber: normalizePhoneE164(callerNumber),
    openPanel: false,
    actions: ['create_lead', 'link_existing', 'create_partner_contact', 'mark_spam'],
    notice: 'UNKNOWN INCOMING CONTACT — do not assign as a student without identity verification.',
  };
}
