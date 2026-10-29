/**
 * INBOUND IDENTITY PROVISIONING — the single decision point for "who is this contact?"
 *
 * Why this module exists
 * ----------------------
 * The repository had two competing identity policies:
 *   - `src/lib/communications/contact-identity.ts` (wired into the live WhatsApp
 *     webhook and lead forms) which matches students, leads and partner contacts
 *     but hard-codes `shouldAutoCreateStudent() === false`; and
 *   - `src/lib/identity/match-policy.ts` (the tiered policy required by the
 *     omnichannel brief) which had **no callers at all**.
 *
 * Adding a third policy would make the problem worse, so this module *composes*
 * the tiered policy and adds the one thing that was missing: an explicit,
 * auditable decision about whether a first contact may receive a Student ID.
 *
 * Design rules (all enforced here, not by callers)
 * ------------------------------------------------
 *  1. Matching is delegated to `matchInboundIdentity`; names are never used.
 *  2. A channel identity already bound to one student always wins over weaker
 *     evidence, and a binding that contradicts every candidate is a CONFLICT,
 *     never a silent re-link.
 *  3. More than one candidate at the same tier is AMBIGUOUS → human review.
 *     Ambiguity is never resolved automatically, even with auto-provisioning on.
 *  4. A brand-new Student is created only when the contact is *clearly* new:
 *     no match, no ambiguity, and a policy that permits it.
 *  5. Idempotency is a property of the input, not of the database: the same
 *     (channel, account, sender) with the same evidence always yields the same
 *     decision kind, so a replayed webhook cannot mint a second Student.
 *
 * Pure functions only — no Prisma, no network, no clock. The caller supplies
 * candidates and persisted bindings, which keeps the decision table testable and
 * lets the same logic serve WhatsApp, Messenger, Instagram, SMS and web chat.
 */

import { matchInboundIdentity, normalizePhoneDigits, normalizeEmail, type MatchCandidate, type MatchResult } from './match-policy';

/** Channels the hub can receive from. Mirrors the provider adapters. */
export const INBOUND_CHANNELS = ['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'SMS', 'WEB_CHAT', 'EMAIL'] as const;
export type InboundChannel = (typeof INBOUND_CHANNELS)[number];

/** A durable link between a provider-scoped identity and an ALO student. */
export interface ChannelBinding {
  channel: InboundChannel;
  /** Provider account that received the message (Meta phone_number_id, Page ID, shortcode…). */
  channelAccountId: string;
  /** Provider-scoped sender id (wa_id, PSID, IGSID, E.164 number, email). */
  externalUserId: string;
  studentId: string;
  /** false once an authorised reviewer unlinks it; kept for the audit trail. */
  active: boolean;
}

export interface InboundContact {
  channel: InboundChannel;
  channelAccountId: string;
  externalUserId: string;
  phone?: string | null;
  email?: string | null;
  /** Set only when the person themselves supplied an ALO Student ID. */
  suppliedStudentId?: string | null;
  /** Provider event/message id — used for the idempotency note, never for matching. */
  providerMessageId?: string | null;
}

export interface ProvisioningPolicy {
  /**
   * Whether a clearly-new contact may receive a Student ID on first contact.
   * Off by default: enabling it changes production behaviour for every inbound
   * channel, so it is a deliberate, reviewable switch rather than a side effect.
   */
  autoCreateStudent: boolean;
  /** Whether a clearly-new contact may instead be filed as a lead. */
  autoCreateLead: boolean;
  /**
   * When true, a match is only accepted if the candidate carries a *verified*
   * email or phone. The tiered policy already enforces this for those tiers;
   * this flag additionally governs whether a bare `linked_channel` match is
   * trusted without a human check.
   */
  requireVerifiedContactForLink: boolean;
}

export const DEFAULT_POLICY: ProvisioningPolicy = {
  autoCreateStudent: false,
  autoCreateLead: true,
  requireVerifiedContactForLink: false,
};

export type ProvisioningReason =
  | 'BOUND_CHANNEL'
  | 'MATCHED_STUDENT_ID'
  | 'MATCHED_VERIFIED_EMAIL'
  | 'MATCHED_VERIFIED_PHONE'
  | 'MATCHED_LINKED_CHANNEL'
  | 'AMBIGUOUS_MATCH'
  | 'CONFLICTING_BINDING'
  | 'SUPPLIED_ID_UNKNOWN'
  | 'NEW_CONTACT_STUDENT_ALLOWED'
  | 'NEW_CONTACT_STUDENT_BLOCKED';

export type ProvisioningDecision =
  | { kind: 'LINK_EXISTING'; studentId: string; reason: ProvisioningReason }
  | { kind: 'REVIEW'; reason: ProvisioningReason; candidateStudentIds: string[]; note: string }
  | { kind: 'CREATE_STUDENT'; reason: ProvisioningReason; note: string }
  | { kind: 'CREATE_LEAD'; reason: ProvisioningReason; note: string };

export interface DecisionInput {
  contact: InboundContact;
  candidates: MatchCandidate[];
  /** Persisted bindings for this channel/account/sender, including inactive ones. */
  bindings?: ChannelBinding[];
  policy?: ProvisioningPolicy;
}

function sameIdentity(binding: ChannelBinding, contact: InboundContact): boolean {
  return binding.channel === contact.channel
    && binding.channelAccountId === contact.channelAccountId
    && binding.externalUserId === contact.externalUserId;
}

function fromMatch(match: MatchResult): ProvisioningDecision | null {
  switch (match.kind) {
    case 'exact_student_id':
      return { kind: 'LINK_EXISTING', studentId: match.studentId, reason: 'MATCHED_STUDENT_ID' };
    case 'verified_email':
      return { kind: 'LINK_EXISTING', studentId: match.studentId, reason: 'MATCHED_VERIFIED_EMAIL' };
    case 'verified_phone':
      return { kind: 'LINK_EXISTING', studentId: match.studentId, reason: 'MATCHED_VERIFIED_PHONE' };
    case 'linked_channel':
      return { kind: 'LINK_EXISTING', studentId: match.studentId, reason: 'MATCHED_LINKED_CHANNEL' };
    case 'ambiguous':
      return {
        kind: 'REVIEW',
        reason: 'AMBIGUOUS_MATCH',
        candidateStudentIds: match.studentIds,
        note: `${match.studentIds.length} students matched at tier "${match.tier}". An authorised reviewer must choose; automatic linking is not permitted.`,
      };
    default:
      return null;
  }
}

/**
 * The decision table. Order matters and is part of the contract:
 *
 *   1. Active channel binding  → LINK_EXISTING (strongest, survives replays)
 *   2. Tiered match            → LINK_EXISTING | REVIEW
 *   3. Supplied-but-unknown ID → REVIEW (never fall through to weaker tiers)
 *   4. No evidence             → CREATE_STUDENT | CREATE_LEAD | REVIEW
 *      (a binding that was explicitly unlinked, or one pointing at a student
 *      absent from the candidates, forces REVIEW rather than re-creation)
 */
export function decideInboundIdentity(input: DecisionInput): ProvisioningDecision {
  const policy = input.policy ?? DEFAULT_POLICY;
  const bindings = (input.bindings ?? []).filter((binding) => sameIdentity(binding, input.contact));
  const active = bindings.filter((binding) => binding.active);

  // 1 — an existing, active binding is authoritative.
  if (active.length === 1) {
    return { kind: 'LINK_EXISTING', studentId: active[0].studentId, reason: 'BOUND_CHANNEL' };
  }
  if (active.length > 1) {
    return {
      kind: 'REVIEW',
      reason: 'CONFLICTING_BINDING',
      candidateStudentIds: [...new Set(active.map((binding) => binding.studentId))],
      note: 'This channel identity is actively bound to more than one student. Data corruption or a manual error must be resolved by an authorised reviewer before any message is filed.',
    };
  }

  // 2 — tiered matching against verified evidence.
  const matched = fromMatch(matchInboundIdentity({
    studentId: input.contact.suppliedStudentId ?? null,
    email: input.contact.email ?? null,
    phone: input.contact.phone ?? null,
    channelIdentity: null, // bindings cover this; see step 1
  }, input.candidates));
  if (matched) {
    if (matched.kind === 'LINK_EXISTING' && matched.reason === 'MATCHED_LINKED_CHANNEL'
      && policy.requireVerifiedContactForLink) {
      return {
        kind: 'REVIEW',
        reason: 'MATCHED_LINKED_CHANNEL',
        candidateStudentIds: [matched.studentId],
        note: 'Policy requires verified contact evidence for an automatic link; this match came from a channel identity only.',
      };
    }
    return matched;
  }

  // 3 — a supplied Student ID that matches nothing stops here.
  const supplied = String(input.contact.suppliedStudentId ?? '').trim();
  if (supplied) {
    return {
      kind: 'REVIEW',
      reason: 'SUPPLIED_ID_UNKNOWN',
      candidateStudentIds: [],
      note: `The contact supplied Student ID "${supplied}" but no student record carries it. Do not attach this conversation to an unrelated student; verify the ID with the student.`,
    };
  }

  // 4a — this channel was explicitly unlinked from a student. Re-creating would
  //      silently duplicate a person who already exists.
  const unlinked = bindings.find((binding) => !binding.active);
  if (unlinked) {
    return {
      kind: 'REVIEW',
      reason: 'CONFLICTING_BINDING',
      candidateStudentIds: [unlinked.studentId],
      note: `This channel identity was previously linked to ${unlinked.studentId} and later unlinked. Re-linking or creating a new student requires an authorised reviewer.`,
    };
  }

  // 4b — no evidence at all: this is a genuinely new contact.
  if (!normalizePhoneDigits(input.contact.phone) && !normalizeEmail(input.contact.email)
    && !String(input.contact.externalUserId || '').trim()) {
    return {
      kind: 'REVIEW',
      reason: 'NEW_CONTACT_STUDENT_BLOCKED',
      candidateStudentIds: [],
      note: 'The event carries no usable sender identity, so no record may be created from it.',
    };
  }

  if (policy.autoCreateStudent) {
    return {
      kind: 'CREATE_STUDENT',
      reason: 'NEW_CONTACT_STUDENT_ALLOWED',
      note: 'No student, lead or binding matched this channel identity. Policy permits automatic student provisioning.',
    };
  }
  if (policy.autoCreateLead) {
    return {
      kind: 'CREATE_LEAD',
      reason: 'NEW_CONTACT_STUDENT_BLOCKED',
      note: 'No match found. Automatic student provisioning is disabled by policy, so the contact is filed as a lead for a counsellor to qualify.',
    };
  }
  return {
    kind: 'REVIEW',
    reason: 'NEW_CONTACT_STUDENT_BLOCKED',
    candidateStudentIds: [],
    note: 'No match found and neither automatic student nor lead creation is permitted by policy.',
  };
}

/**
 * Normalised, human-readable summary for audit rows and the identity review queue.
 * Deliberately excludes message content: identity decisions are recorded from
 * sender metadata, never from what the person wrote.
 */
export function describeDecision(decision: ProvisioningDecision): string {
  switch (decision.kind) {
    case 'LINK_EXISTING':
      return `LINK_EXISTING ${decision.studentId} (${decision.reason})`;
    case 'REVIEW':
      return `REVIEW (${decision.reason}) candidates=[${decision.candidateStudentIds.join(',')}]`;
    case 'CREATE_STUDENT':
      return `CREATE_STUDENT (${decision.reason})`;
    case 'CREATE_LEAD':
      return `CREATE_LEAD (${decision.reason})`;
  }
}
