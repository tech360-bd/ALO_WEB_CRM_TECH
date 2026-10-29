/**
 * Identity matching policy for inbound contacts (website, WhatsApp, email, social, phone, partner referral).
 *
 * Rules, applied in order. The first tier that produces any match decides:
 *   1. Exact canonical Student ID supplied by the person.
 *   2. Verified email address (matches only a candidate whose email is verified).
 *   3. Verified phone number (matches only a candidate whose phone is verified).
 *   4. Linked channel identity (e.g. a WhatsApp number already bound to a student by a verified flow).
 *
 * Within a tier, more than one candidate is AMBIGUOUS and must go to authorized review.
 * Names are never used for matching. Unverified contact details never match.
 *
 * Pure function: no database access. Callers load candidates and act on the result.
 */

export interface MatchCandidate {
  studentId: string;
  email?: string | null;
  emailVerified?: boolean;
  phone?: string | null;
  phoneVerified?: boolean;
  channelIdentities?: string[];
}

export interface InboundIdentity {
  studentId?: string | null;
  email?: string | null;
  phone?: string | null;
  channelIdentity?: string | null;
}

export type MatchResult =
  | { kind: 'exact_student_id'; studentId: string }
  | { kind: 'verified_email'; studentId: string }
  | { kind: 'verified_phone'; studentId: string }
  | { kind: 'linked_channel'; studentId: string }
  | { kind: 'ambiguous'; tier: 'verified_email' | 'verified_phone' | 'linked_channel' | 'exact_student_id'; studentIds: string[] }
  | { kind: 'none' };

// Student identifiers have shipped in three tail widths over time:
//   AE-YYYY####   4 digits — current allocator output (`formatIdentifier` pads AE to 4)
//   AE-YYYYNNNNN  5 digits — the 2026-10-24 target format, still present in data
//   AE-YYYY###### 6 digits — earliest legacy form
// Only the 5-digit form was accepted here, so `exact_student_id` could never match an
// ID produced by the live allocator. All three are accepted; legacy IDs are never rewritten.
const STUDENT_ID_PATTERN = /^AE-\d{4}\d{4,6}$/;

export function normalizeEmail(raw: string | null | undefined): string | null {
  const value = String(raw || '').trim().toLowerCase();
  if (!value || value.length > 254) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

/** Digits only with Bangladesh local numbers normalised to country code 880. Returns null if not plausible. */
export function normalizePhoneDigits(raw: string | null | undefined): string | null {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('01')) digits = `880${digits.slice(1)}`;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

function normalizeStudentId(raw: string | null | undefined): string | null {
  const value = String(raw || '').trim().toUpperCase();
  return STUDENT_ID_PATTERN.test(value) ? value : null;
}

function decide(
  tier: 'verified_email' | 'verified_phone' | 'linked_channel',
  matches: string[],
): MatchResult | null {
  const unique = [...new Set(matches)];
  if (unique.length === 0) return null;
  if (unique.length > 1) return { kind: 'ambiguous', tier, studentIds: unique };
  return { kind: tier, studentId: unique[0] };
}

export function matchInboundIdentity(inbound: InboundIdentity, candidates: MatchCandidate[]): MatchResult {
  const exactId = normalizeStudentId(inbound.studentId);
  if (exactId) {
    const hits = candidates.filter((c) => c.studentId === exactId).map((c) => c.studentId);
    if (hits.length === 1) return { kind: 'exact_student_id', studentId: hits[0] };
    if (hits.length > 1) return { kind: 'ambiguous', tier: 'exact_student_id', studentIds: [...new Set(hits)] };
    // A supplied ID that matches nothing stops here. Falling through to email/phone could attach
    // this contact to a different student; the caller should ask again or queue a review.
    return { kind: 'none' };
  }

  const email = normalizeEmail(inbound.email);
  if (email) {
    const hit = decide(
      'verified_email',
      candidates.filter((c) => c.emailVerified && normalizeEmail(c.email) === email).map((c) => c.studentId),
    );
    if (hit) return hit;
  }

  const phone = normalizePhoneDigits(inbound.phone);
  if (phone) {
    const hit = decide(
      'verified_phone',
      candidates.filter((c) => c.phoneVerified && normalizePhoneDigits(c.phone) === phone).map((c) => c.studentId),
    );
    if (hit) return hit;
  }

  const channel = String(inbound.channelIdentity || '').trim();
  if (channel) {
    const hit = decide(
      'linked_channel',
      candidates.filter((c) => (c.channelIdentities || []).includes(channel)).map((c) => c.studentId),
    );
    if (hit) return hit;
  }

  return { kind: 'none' };
}
