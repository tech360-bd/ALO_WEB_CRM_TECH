/**
 * Guards for the *Page content records (CountryPage, UniversityPage,
 * CoursePage, ExamPage) that are still edited through legacy admin APIs.
 *
 * Rules enforced here (Phase 1 catalogue remediation, 2026-10-12):
 *  - Approval, rejection, publication and ordinary edits never mark a record
 *    VERIFIED. Verification is a separate, explicit, evidence-backed action.
 *  - Request bodies are reduced to an explicit allow-list of content fields;
 *    control fields (verificationStatus, lastVerifiedAt, approvalStatus, id,
 *    relations, timestamps) can never be mass-assigned from a request body.
 *  - Editing a factual field of a VERIFIED record downgrades it to
 *    NEEDS_REVIEW (and a PUBLISHED record to PENDING_REVIEW) instead of
 *    silently keeping, or refreshing, its verified state.
 *
 * NOTE: the Prisma schema defaults for CoursePage are
 * verificationStatus="VERIFIED" / approvalStatus="PUBLISHED". Schema changes
 * were not authorised in Phase 1, so every create path must set both values
 * explicitly. See AUDIT/catalogue-phase1-2026-10-12/.
 */
import { isSyntheticHost } from './catalogue-import-service';

export const UNVERIFIED = 'UNVERIFIED';
export const NEEDS_REVIEW = 'NEEDS_REVIEW';

/** Approval states an editor may request directly (publishing is separate). */
export const EDITOR_APPROVAL_STATES = ['DRAFT', 'PENDING_REVIEW'] as const;

/** Verification states an editor may set: only downgrades, never VERIFIED. */
export const EDITOR_VERIFICATION_DOWNGRADES = [UNVERIFIED, NEEDS_REVIEW, 'STALE'] as const;

/**
 * An acceptable evidence URL: absolute https, parseable, no embedded
 * credentials and not a reserved/synthetic host. This proves only that a
 * source is recorded, not that the content matches it.
 */
export function isAcceptableSourceUrl(raw: unknown): raw is string {
  if (typeof raw !== 'string' || raw.length > 2048) return false;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;
  if (url.username || url.password) return false;
  if (!url.hostname.includes('.')) return false;
  return !isSyntheticHost(url.toString());
}

type FieldKind = 'string' | 'nullableString' | 'jsonList' | 'slug' | 'url';

/** Editable CoursePage content fields and how each is validated. */
export const COURSE_PAGE_FIELDS: Record<string, FieldKind> = {
  name: 'string',
  slug: 'slug',
  universitySlug: 'slug',
  countrySlug: 'slug',
  city: 'string',
  level: 'string',
  subject: 'string',
  duration: 'string',
  intake: 'string',
  tuition: 'string',
  scholarship: 'nullableString',
  englishRequirement: 'string',
  academicRequirement: 'string',
  overview: 'string',
  modules: 'jsonList',
  careerOutcomes: 'jsonList',
  documents: 'jsonList',
  faqs: 'jsonList',
  deadline: 'nullableString',
  sourceUrl: 'url',
};

/** Fields whose change alters a factual claim (everything except presentation-only identity). */
export const COURSE_PAGE_FACT_FIELDS = new Set([
  'universitySlug', 'countrySlug', 'city', 'level', 'subject', 'duration', 'intake', 'tuition',
  'scholarship', 'englishRequirement', 'academicRequirement', 'overview', 'modules',
  'careerOutcomes', 'documents', 'faqs', 'deadline', 'sourceUrl', 'name',
]);

/** Control fields that must never be accepted from a request body. */
export const COURSE_PAGE_CONTROL_FIELDS = new Set([
  'verificationStatus', 'lastVerifiedAt', 'approvalStatus', 'id', 'createdAt', 'updatedAt',
  'university', 'universityId',
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_TEXT = 20000;

export type SanitizeResult =
  | { ok: true; data: Record<string, string | null> }
  | { ok: false; error: string };

/**
 * Reduce a request body to allow-listed CoursePage content fields.
 * Unknown keys are ignored except control fields, which are handled by the
 * caller (they are validated as transitions, never copied).
 */
export function sanitizeCoursePageFields(body: Record<string, unknown>): SanitizeResult {
  const data: Record<string, string | null> = {};
  for (const [field, kind] of Object.entries(COURSE_PAGE_FIELDS)) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    const value = body[field];
    switch (kind) {
      case 'string':
        if (typeof value !== 'string' || value.length > MAX_TEXT) return { ok: false, error: `${field} must be text` };
        data[field] = value;
        break;
      case 'nullableString':
        if (value !== null && (typeof value !== 'string' || value.length > MAX_TEXT)) return { ok: false, error: `${field} must be text or null` };
        data[field] = value === '' ? null : (value as string | null);
        break;
      case 'slug':
        if (typeof value !== 'string' || !SLUG_RE.test(value) || value.length > 200) return { ok: false, error: `${field} must be a lowercase slug` };
        data[field] = value;
        break;
      case 'url':
        if (value === null || value === '') { data[field] = null; break; }
        if (!isAcceptableSourceUrl(value)) return { ok: false, error: `${field} must be an https official source URL` };
        data[field] = (value as string).trim();
        break;
      case 'jsonList': {
        let list: unknown = value;
        if (typeof value === 'string') {
          try { list = JSON.parse(value); } catch { return { ok: false, error: `${field} must be a JSON list` }; }
        }
        if (!Array.isArray(list)) return { ok: false, error: `${field} must be a list` };
        const json = JSON.stringify(list);
        if (json.length > MAX_TEXT) return { ok: false, error: `${field} is too long` };
        data[field] = json;
        break;
      }
    }
  }
  return { ok: true, data };
}

/** True when a sanitized patch changes at least one factual field of `existing`. */
export function changesFacts(patch: Record<string, unknown>, existing: Record<string, unknown>): boolean {
  return Object.keys(patch).some(
    (field) => COURSE_PAGE_FACT_FIELDS.has(field) && (patch[field] ?? null) !== (existing[field] ?? null),
  );
}

/**
 * Audit attribution from the authenticated session (never the request body).
 * AuditLog.userId is a foreign key to User, so only canonical `user`-domain
 * identities are written there; portal identities are recorded in the details
 * payload instead of risking a foreign-key failure after the data write.
 */
export function auditActor(auth: { userId?: string; identityDomain?: string; userType?: string; actorUserId?: string | null }) {
  const userId = auth.identityDomain === 'user' && auth.userId ? auth.userId : null;
  return {
    userId,
    actor: {
      userId: auth.userId || null,
      identityDomain: auth.identityDomain || null,
      actorUserId: auth.actorUserId ?? null,
      role: auth.userType || null,
    },
  };
}

/** Drop sanitized fields whose value equals the stored value (no-op writes). */
export function withoutUnchanged(patch: Record<string, string | null>, existing: Record<string, unknown>) {
  const out: Record<string, string | null> = {};
  for (const [field, value] of Object.entries(patch)) {
    if ((value ?? null) !== ((existing[field] as string | null | undefined) ?? null)) out[field] = value;
  }
  return out;
}
