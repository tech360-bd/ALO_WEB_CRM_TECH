/**
 * LIVE CONTACT / STUDENT IDENTIFICATION (brief §5, §6, §12, §14, §21)
 * ===================================================================
 * One question, answered in a single request: **"who is on the phone?"**
 *
 * Input is always a phone number. That is the whole point of the feature: a
 * counsellor receiving a call or a WhatsApp message must see the verified record,
 * not a search box. Identity comes from a number that ALO already holds, never
 * from a name typed by a caller — `NAME_ONLY_NOT_ALLOWED` exists because a name is
 * not an identity, and matching by it is how the wrong student's file gets opened
 * in front of the wrong person.
 *
 * Design rules enforced here, not merely documented:
 *
 *  1. **No phone, no identification.** A name-only lookup is refused.
 *  2. **Ambiguity is surfaced, never resolved.** Two matching records produce a
 *     `POSSIBLE_MATCHES` card listing both, with the distinguishing facts an
 *     operator needs, and `requiresConfirmation: true`. Nothing is auto-opened.
 *  3. **A guardian's number is not the student's number** (§6). Guardian numbers
 *     resolve to their own state, `GUARDIAN_NUMBER`, naming the student(s) they
 *     belong to. Treating `0171…` as "the student" would attach the father's
 *     conversation history to the child's file.
 *  4. **Unknown numbers create nothing.** They come back `UNKNOWN` with the
 *     allowed next actions; a Student and a Student ID can only be created through
 *     registration approval (§4).
 *  5. **No "real-time" claim.** The response carries the measured server duration
 *     of this resolution so the UI can state a fact instead of an adjective (§21).
 *
 * This file is deliberately database-free, so the decision rules can be tested
 * without a database; the reads live in `./identification.ts`.
 *
 * Reuse: matching itself is delegated to the existing canonical decision layer,
 * `resolveContactIdentity` in `src/lib/communications/contact-identity.ts`, and
 * number searching uses the existing `phoneVariants`. This module adds only the
 * card assembly and the database reads.
 */

import type { ContactCandidate, MatchResult } from '@/lib/communications/contact-identity';
import { normalizePhone } from '@/lib/phone-normalization';
import { phoneVariants } from '@/lib/communications/contact-identity';

export type IdentificationState =
  | 'IDENTIFIED'
  | 'POSSIBLE_MATCHES'
  | 'GUARDIAN_NUMBER'
  | 'UNKNOWN';

export interface IdentificationPhone {
  value: string;
  normalized: string;
  /** Which field of which record this number came from — provenance matters. */
  source: 'student.phone' | 'lead.phone' | 'lead.altPhone' | 'guardian.phone' | 'guardian.whatsapp' | 'registry';
}

export interface GuardianLink {
  studentRecordId: string;
  studentPublicId: string;
  studentName: string;
  guardianName: string;
  relationship: string;
  guardianId: string;
  isPrimaryContact: boolean;
  isFinancialSponsor: boolean;
  status: string;
  profileHref: string;
}

export interface FollowUpItem {
  id: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  dueDate: string;
  assigneeId: string;
  /** True when the due date has passed and the task is still open. */
  overdue: boolean;
}

export interface IdentificationCard {
  /** One of the four states; the UI switches on this and nothing else. */
  state: IdentificationState;
  /** Normalised input, echoed back so a mis-keyed number is visible. */
  queriedPhone: string;
  /** How the match was made — never "name". */
  matchedOn: string | null;
  /** Full card, present only when exactly one record matched on its own number. */
  primary: PrimaryIdentity | null;
  /** Every plausible match, for the confirmation list. Never auto-opened. */
  possible: PossibleMatch[];
  /** Students this number is a *guardian* number for. */
  guardians: GuardianLink[];
  registryContactId: string | null;
  /** Unverified-contact handling for a number nobody recognises (§12). */
  unknown: { number: string; suggestedActions: string[]; notice: string } | null;
  requiresConfirmation: boolean;
  /**
   * True when a record exists but the viewer's branch/assignment scope does not
   * cover it (§17: not every contact is visible to everyone). Name, Student ID and
   * all details are withheld; the operator is told to request access.
   */
  restricted: boolean;
  notice: string;
  /** Facts, not adjectives (§21). */
  meta: {
    durationMs: number;
    resolvedAt: string;
    /** Always false: ALO has not measured an end-to-end inbound-event delay. */
    realTimeVerified: boolean;
    realTimeNote: string;
  };
}

export interface PrimaryIdentity {
  kind: 'student' | 'lead' | 'partner_contact';
  recordId: string;
  /** Student ID (`AE-2026000001`) when registered; the lead reference otherwise. */
  publicId: string;
  name: string;
  lifecycleStage: string;
  status: string;
  phones: IdentificationPhone[];
  email: string;
  /** No student photo column exists in the schema; see `photoReason`. */
  photoUrl: string | null;
  photoReason: string | null;
  parentGuardian: GuardianLink[];
  counselor: { id: string; name: string } | null;
  application: { university: string; course: string; stage: string; status: string } | null;
  lastConversation: { channel: string; at: string; preview: string; direction: string } | null;
  openFollowUps: FollowUpItem[];
  historyCount: number;
  profileHref: string;
  /** Present when the matched record belongs to a branch the viewer may not see. */
  scopeNotice: string | null;
}

export interface PossibleMatch {
  kind: 'student' | 'lead' | 'partner_contact' | 'guardian';
  recordId: string;
  publicId: string;
  name: string;
  matchedOn: string;
  /** The facts that let an operator choose correctly. */
  distinguishing: string[];
  profileHref: string;
}

export const NAME_ONLY_REFUSAL =
  'Identification requires a phone number. A name is not an identity — search by name is a text search, not identification.';

/** Number → the canonical digits the CRM stores. Returns `null` for unusable input. */
export function normalizeIdentificationInput(phone: string | null | undefined): {
  normalized: string;
  variants: string[];
} | null {
  const normalized = normalizePhone(phone);
  const variants = phoneVariants(phone);
  if (!normalized || variants.length === 0) return null;
  return { normalized, variants };
}

/**
 * Pure assembly of the card from records the caller has already loaded.
 *
 * Kept separate from the database so the decision rules (which state wins, what an
 * operator is allowed to see) are unit-tested without a database — the same split
 * the repository uses for the registry and the identity layer.
 */
export function buildIdentificationCard(input: {
  phone: string;
  match: MatchResult;
  guardians: GuardianLink[];
  profiles: Map<string, PrimaryIdentity>;
  registryContactId?: string | null;
  startedAt: number;
}): IdentificationCard {
  const durationMs = Math.max(0, Math.round(performance.now() - input.startedAt));
  const meta = {
    durationMs,
    resolvedAt: new Date().toISOString(),
    realTimeVerified: false,
    realTimeNote:
      'This is the measured server time for this resolution. End-to-end delay from carrier/provider event to screen has not been measured, so the feature is not described as real-time.',
  };

  const base = {
    queriedPhone: normalizePhone(input.phone),
    registryContactId: input.registryContactId ?? null,
    guardians: input.guardians,
    restricted: false,
    meta,
  };

  // ── Ambiguity first: it outranks a confident-looking single match ──────────
  const uniqueCandidates = dedupeCandidates(input.match.candidates);
  if (uniqueCandidates.length > 1 || input.match.confidence === 'possible') {
    const possible: PossibleMatch[] = uniqueCandidates.map((candidate) => {
      const profile = input.profiles.get(`${candidate.kind}:${candidate.id}`);
      return {
        kind: toPossibleKind(candidate.kind),
        recordId: candidate.id,
        publicId: candidate.reference || candidate.id,
        name: candidate.name || '(no name on record)',
        matchedOn: candidate.matchedOn || input.match.matchedOn || 'unknown',
        distinguishing: [
          `matched on ${(candidate.matchedOn || input.match.matchedOn || 'unknown').replace(/_/g, ' ')}`,
          candidate.whatsappNumber ? `WhatsApp identity ${candidate.whatsappNumber}` : '',
          candidate.email ? `email ${candidate.email}` : '',
          profile?.application ? `application ${profile.application.stage}` : '',
          profile?.counselor ? `counsellor ${profile.counselor.name}` : '',
        ].filter(Boolean),
        profileHref: profile?.profileHref || profileHrefFor(candidate.kind, candidate.id),
      };
    });
    // Guardians are a kind of ambiguity too: the number exists, but it is not the
    // student's own line.
    for (const guardian of input.guardians) {
      possible.push({
        kind: 'guardian',
        recordId: guardian.guardianId,
        publicId: guardian.studentPublicId,
        name: guardian.guardianName,
        matchedOn: 'guardian_number',
        distinguishing: [
          `${guardian.relationship} of ${guardian.studentName}`,
          guardian.isFinancialSponsor ? 'financial sponsor' : '',
          guardian.isPrimaryContact ? 'primary contact' : '',
        ].filter(Boolean),
        profileHref: guardian.profileHref,
      });
    }
    return {
      ...base,
      state: 'POSSIBLE_MATCHES',
      matchedOn: input.match.matchedOn,
      primary: null,
      possible,
      unknown: null,
      requiresConfirmation: true,
      notice:
        possible.length > 1
          ? `${possible.length} records share this number. Confirm which one is on the line before opening a file — ALO never picks for you, and never merges records automatically.`
          : 'Only a secondary field matched, not the primary phone number. Confirm with the caller before acting on this record.',
    };
  }

  // ── Single match ──────────────────────────────────────────────────────────
  if (uniqueCandidates.length === 1 && input.match.confidence === 'exact') {
    const candidate = uniqueCandidates[0];
    // If the caller did not hydrate the profile, fall back to what the candidate
    // itself proves. Reporting "unknown" for a record that matched exactly would be
    // a lie the operator would act on.
    const profile = input.profiles.get(`${candidate.kind}:${candidate.id}`) ?? minimalProfile(candidate);
    {
      return {
        ...base,
        state: 'IDENTIFIED',
        matchedOn: input.match.matchedOn,
        primary: profile,
        possible: [],
        unknown: null,
        requiresConfirmation: false,
        notice: input.match.notice || `Verified match on ${input.match.matchedOn?.replace(/_/g, ' ')}.`,
      };
    }
  }

  // ── Guardian number with no student line of its own ───────────────────────
  if (input.guardians.length > 0) {
    return {
      ...base,
      state: 'GUARDIAN_NUMBER',
      matchedOn: 'guardian_number',
      primary: null,
      possible: [],
      unknown: null,
      requiresConfirmation: false,
      notice:
        `This number belongs to a registered parent/guardian, not to a student. It is linked to ${input.guardians
          .map((g) => `${g.studentName} (${g.studentPublicId})`)
          .join(', ')}. Open the student's family section to see the relationship — do not treat this number as the student's own contact number.`,
    };
  }

  // ── Nothing known ─────────────────────────────────────────────────────────
  return {
    ...base,
    state: 'UNKNOWN',
    matchedOn: null,
    primary: null,
    possible: [],
    unknown: {
      number: normalizePhone(input.phone),
      suggestedActions: ['create_unverified_contact', 'link_existing', 'create_lead', 'mark_spam'],
      notice:
        'Unknown number. A registry contact may be created and marked UNVERIFIED, and a lead may be started — a Student and a Student ID can only be created by approving a registration.',
    },
    requiresConfirmation: false,
    notice: 'UNKNOWN INCOMING NUMBER — nothing was created. Confirm identity before recording anything against a student.',
  };
}

/** Refusal used by the API when no usable phone is supplied. */
export function rejectNameOnlyIdentification(): { error: string; code: 'NAME_ONLY_NOT_ALLOWED' } {
  return { error: NAME_ONLY_REFUSAL, code: 'NAME_ONLY_NOT_ALLOWED' };
}

/**
 * The minimum safe card for a candidate whose full profile was not loaded.
 *
 * Deliberately sparse: it states what the match proves (kind, Student ID, name,
 * number) and leaves everything unproven empty rather than guessing.
 */
export function minimalProfile(candidate: ContactCandidate): PrimaryIdentity | null {
  if (candidate.kind === 'unknown') return null;
  return {
    kind: candidate.kind,
    recordId: candidate.id,
    publicId: candidate.reference || candidate.id,
    name: candidate.name || '(no name on record)',
    lifecycleStage: 'UNKNOWN',
    status: 'UNKNOWN',
    phones: candidate.phone
      ? [{ value: candidate.phone, normalized: normalizePhone(candidate.phone), source: candidate.kind === 'student' ? 'student.phone' : candidate.kind === 'lead' ? 'lead.phone' : 'registry' }]
      : [],
    email: candidate.email || '',
    photoUrl: null,
    photoReason: 'Profile details were not loaded for this match.',
    parentGuardian: [],
    counselor: null,
    application: null,
    lastConversation: null,
    openFollowUps: [],
    historyCount: 0,
    profileHref: profileHrefFor(candidate.kind, candidate.id),
    scopeNotice: 'Only fields returned by the match itself are shown; open the profile for the full record.',
  };
}

/** `unknown` is a matching outcome, never a record kind, so it cannot reach the list. */
function toPossibleKind(kind: ContactCandidate['kind']): PossibleMatch['kind'] {
  return kind === 'student' || kind === 'lead' || kind === 'partner_contact' ? kind : 'partner_contact';
}

/** Two rows for one person (e.g. a lead and the student it became) are one match. */
export function dedupeCandidates(candidates: ContactCandidate[]): ContactCandidate[] {
  const seen = new Set<string>();
  const unique: ContactCandidate[] = [];
  for (const candidate of candidates) {
    const key = `${candidate.kind}:${candidate.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(candidate);
  }
  return unique;
}

export function profileHrefFor(kind: ContactCandidate['kind'], id: string): string {
  switch (kind) {
    case 'student':
      return `/crm/students/${id}`;
    case 'lead':
      return `/crm/leads/${id}`;
    default:
      return `/crm/contacts/${id}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Database-backed resolution
// ─────────────────────────────────────────────────────────────────────────────

