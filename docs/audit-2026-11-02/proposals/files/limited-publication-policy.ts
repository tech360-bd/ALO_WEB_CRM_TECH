/**
 * ============================================================
 * ALO EDUCATION — LIMITED-INFORMATION PUBLICATION POLICY
 * ============================================================
 *
 * PROPOSED FILE. Destination: src/lib/partial-publication/limited-publication-policy.ts
 *
 * Why this module exists
 * ----------------------
 * Prisma `CrmCourse.verificationStatus` has exactly one meaning today, and the
 * decision record of 2026-11-02 freezes it:
 *
 *   VERIFIED           — every field a public page renders is backed by
 *                        course-specific official evidence. Unchanged.
 *   PARTIALLY_VERIFIED — some claims are evidenced, some are not. This is NOT a
 *                        weaker kind of VERIFIED and must never be promoted to
 *                        one, and it must never publish by itself.
 *
 * The public catalogue keeps exactly one gate for the fully-verified path
 * (`src/lib/public-catalog.ts`, `src/lib/course-finder/public-content-page-policy.ts`).
 * This module is a SEPARATE, additive pathway for partially verified records. It
 * is deliberately not imported by, and does not alter, either existing gate.
 *
 * Non-negotiable properties enforced here
 * ---------------------------------------
 *  1. Publication requires an explicit, per-course Super Admin approval record.
 *     Absence of a decision is a denial. There is no default-allow, no sorting
 *     heuristic, no "looks good enough" path.
 *  2. Only fields carrying course-specific official evidence are rendered.
 *     Everything else renders as "Not confirmed" — never as a zero, a default,
 *     an estimate, or silence that reads like a fact.
 *  3. Money, timing and eligibility claims are suppressed even when some
 *     evidence exists, until the separate flag below is approved, because a
 *     wrong fee or deadline is a financial misrepresentation.
 *  4. Records on the hard deny list can never publish through this pathway, no
 *     matter what approval row exists. Defence in depth against operator error.
 *  5. `verificationStatus` is never read as truth-in-product: this module writes
 *     nothing, and the approval record is a separate row.
 *
 * The module is pure: no Prisma import, no I/O, no clock. The caller supplies
 * persisted facts, which is what makes every rule below unit-testable without a
 * database.
 */

/** Lifecycle of a limited-publication approval. Stored in the approval table. */
export const LIMITED_PUBLICATION_STATE = {
  NOT_REQUESTED: 'NOT_REQUESTED',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  REVOKED: 'REVOKED',
} as const;
export type LimitedPublicationState =
  (typeof LIMITED_PUBLICATION_STATE)[keyof typeof LIMITED_PUBLICATION_STATE];

/**
 * Master switch for money / timing / eligibility fields.
 *
 * `false` means: even a course-specific, VERIFIED, hashed evidence row does not
 * let fee, deadline, intake date, scholarship or eligibility render through the
 * limited pathway during this phase. Flipping this to `true` requires its own
 * written approval (it changes what the public can rely on) and its own tests.
 */
export const LIMITED_PATHWAY_SENSITIVE_FIELDS_ENABLED = false;

/** Fields the limited pathway may render when (and only when) evidenced. */
export const LIMITED_PATHWAY_OPTIONAL_FIELDS = [
  'identity',
  'study_mode',
  'campus',
  'academic_year',
  'duration',
] as const;

/** Fields that stay "Not confirmed" unless the sensitive-fields flag is approved. */
export const LIMITED_PATHWAY_SENSITIVE_FIELDS = [
  'fee',
  'tuition_fee',
  'entry_requirement',
  'english_requirement',
  'start_months',
  'intake_dates',
  'application_deadline',
  'scholarship',
  'eligibility',
] as const;

/**
 * Records that must never publish through this pathway, whatever approval row
 * exists. Sourced from the 2026-11-02 recovery audit:
 *  - Monash Master of Business: HOLD. Duration, fee, entry requirement, English
 *    requirement, start months and application deadline are unevidenced.
 *  - Aston records: institution-level evidence only, no course-specific source;
 *    publication decision UNPUBLISHED_INSUFFICIENT_EVIDENCE.
 * Keeping them here means a mistake in the approval UI cannot leak them.
 */
export const LIMITED_PUBLICATION_DENY_LIST: ReadonlyArray<{
  universitySlug: string;
  courseSlug: string;
  reason: string;
}> = [
  {
    universitySlug: 'AU-monash-university',
    courseSlug: 'VC-monash-master-of-business',
    reason: 'HOLD: fee, deadline, intake, entry and English requirements are unevidenced.',
  },
  {
    universitySlug: 'aston university',
    courseSlug: 'AS-foundation-programmes',
    reason: 'No course-specific official evidence; institution-level source only.',
  },
  {
    universitySlug: 'aston university',
    courseSlug: 'AS-3d-printing-of-ocular-films-for-treatment-of-ocula',
    reason: 'No course-specific official evidence; institution-level source only.',
  },
  {
    universitySlug: 'aston university',
    courseSlug: 'AS-advancing-episignature-analysis-for-chromatin-diso',
    reason: 'No course-specific official evidence; institution-level source only.',
  },
];

/** Evidence row shape, narrowed to the fields this policy reads. */
export interface LimitedPublicationEvidence {
  evidenceKey: string;
  sourceUrl: string;
  entityType: string;
  courseSlug: string;
  universitySlug: string;
  verificationStatus: string;
  /** sha256 of the stored excerpt; empty means the excerpt is unproven. */
  contentHash: string;
  /** Raw JSON string from CrmOfficialEvidence.fieldScope. */
  fieldScope: string;
}

/** The CrmCourse columns this policy reads. Nothing is mutated. */
export interface LimitedPublicationCourse {
  id: string;
  courseId: string;
  slug: string;
  universityId: string;
  universitySlug: string;
  universityName: string;
  courseTitle: string;
  studyLevel: string;
  studyMode: string;
  campus: string;
  academicYear: string;
  country: string;
  verificationStatus: string;
  publicationStatus: string;
  durationMonths: number;
  tuitionFee: number;
  deadline: string;
}

/** The approval row proposed in this phase (table: CrmCourseLimitedPublication). */
export interface LimitedPublicationApproval {
  id: string;
  courseId: string;
  state: LimitedPublicationState;
  approvedByUserId: string;
  approvedByRoles: string[];
  approvedAt: string;
  revokedAt?: string | null;
  /** Evidence keys captured at approval time; a later re-link invalidates approval. */
  evidenceSnapshotKeys: string[];
}

export interface LimitedPublicationField {
  key: string;
  label: string;
  /** Rendered value, or null when unevidenced. Never a placeholder number. */
  value: string | null;
  state: 'confirmed' | 'not_confirmed';
  evidenceKey?: string;
}

export type LimitedPublicationDecision =
  | {
      publishable: true;
      courseId: string;
      fields: LimitedPublicationField[];
      suppressed: string[];
      banner: string;
    }
  | {
      publishable: false;
      courseId: string;
      blockedBy: string[];
    };

const EVIDENCE_HASH = /^[a-f0-9]{64}$/i;

/** Parse CrmOfficialEvidence.fieldScope, tolerating malformed JSON. */
export function parseFieldScope(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [...new Set(parsed.filter((v): v is string => typeof v === 'string' && v.length > 0))];
  } catch {
    return [];
  }
}

/**
 * True only for evidence that is (a) about this exact course, (b) from this
 * course's own institution, (c) actually verified by a human, and (d) hashed so
 * the excerpt cannot have been edited after the fact.
 *
 * The institution check is the fix for the Phase 0D relink finding: evidence was
 * being attached across institutions when only the course slug was compared.
 */
export function isCourseSpecificEvidence(
  evidence: LimitedPublicationEvidence,
  course: LimitedPublicationCourse,
): boolean {
  return (
    evidence.entityType === 'COURSE'
    && evidence.courseSlug === course.slug
    && evidence.universitySlug === course.universitySlug
    && evidence.verificationStatus === 'VERIFIED'
    && /^https:\/\//i.test(evidence.sourceUrl)
    && EVIDENCE_HASH.test(evidence.contentHash)
  );
}

function denyListEntry(course: LimitedPublicationCourse) {
  return LIMITED_PUBLICATION_DENY_LIST.find(
    (entry) => entry.courseSlug === course.slug && entry.universitySlug === course.universitySlug,
  );
}

/** Fields evidenced for this course, mapped to the union of usable evidence. */
export function evidencedFieldSet(
  course: LimitedPublicationCourse,
  evidence: readonly LimitedPublicationEvidence[],
): Map<string, string> {
  const usable = evidence.filter((row) => isCourseSpecificEvidence(row, course));
  const byField = new Map<string, string>();
  for (const row of usable) {
    for (const field of parseFieldScope(row.fieldScope)) {
      if (!byField.has(field)) byField.set(field, row.evidenceKey);
    }
  }
  return byField;
}

/** Every reason this course may not publish through the limited pathway. */
export function limitedPublicationBlockers(
  course: LimitedPublicationCourse,
  approval: LimitedPublicationApproval | null,
  evidence: readonly LimitedPublicationEvidence[],
): string[] {
  const blocked: string[] = [];

  if (approval === null) {
    blocked.push('NO_APPROVAL_RECORD');
  } else {
    if (approval.courseId !== course.id) blocked.push('APPROVAL_BELONGS_TO_ANOTHER_COURSE');
    if (approval.state !== LIMITED_PUBLICATION_STATE.APPROVED) blocked.push(`APPROVAL_STATE_${approval.state}`);
    if (approval.revokedAt) blocked.push('APPROVAL_REVOKED');
    if (!approval.approvedByRoles.some((role) => role.toLowerCase() === 'super_admin')) {
      blocked.push('APPROVER_WAS_NOT_SUPER_ADMIN');
    }
    if (!approval.approvedAt) blocked.push('APPROVAL_NOT_TIMESTAMPED');
  }

  const deny = denyListEntry(course);
  if (deny) blocked.push(`DENY_LIST:${deny.reason}`);

  // VERIFIED records belong to the existing full-publication gate, not here.
  if (course.verificationStatus === 'VERIFIED') blocked.push('FULLY_VERIFIED_USE_EXISTING_GATE');
  if (course.verificationStatus === 'UNVERIFIED_SYNTHETIC') blocked.push('SYNTHETIC_RECORD');
  if (course.verificationStatus !== 'PARTIALLY_VERIFIED' && course.verificationStatus !== 'VERIFIED') {
    blocked.push(`VERIFICATION_STATUS_NOT_ELIGIBLE:${course.verificationStatus}`);
  }
  if (course.publicationStatus === 'published' || course.publicationStatus === 'PUBLISHED') {
    blocked.push('ALREADY_PUBLISHED');
  }

  const evidenced = evidencedFieldSet(course, evidence);
  if (evidenced.size === 0) blocked.push('NO_COURSE_SPECIFIC_EVIDENCE');

  // A stale approval (evidence set changed since sign-off) is not an approval.
  if (approval && approval.state === LIMITED_PUBLICATION_STATE.APPROVED) {
    const current = new Set(evidenced.values());
    const snapshot = new Set(approval.evidenceSnapshotKeys);
    const same = current.size === snapshot.size && [...current].every((key) => snapshot.has(key));
    if (!same) blocked.push('APPROVAL_EVIDENCE_SNAPSHOT_STALE');
  }

  return blocked;
}

const NOT_CONFIRMED = 'Not confirmed';

/**
 * Build the exact payload a public page may render. Callers must not add fields:
 * the returned array is the complete allow-list for this record.
 */
export function evaluateLimitedPublication(input: {
  course: LimitedPublicationCourse;
  evidence: readonly LimitedPublicationEvidence[];
  approval: LimitedPublicationApproval | null;
}): LimitedPublicationDecision {
  const { course, evidence, approval } = input;
  const blockedBy = limitedPublicationBlockers(course, approval, evidence);
  if (blockedBy.length > 0) {
    return { publishable: false, courseId: course.id, blockedBy };
  }

  const evidenced = evidencedFieldSet(course, evidence);

  /**
   * A field is only ever confirmed by evidence. The output key is fixed by this
   * allow-list; the evidence field is the scope name recorded by the collector.
   */
  const field = (
    outputKey: string,
    evidenceField: string,
    label: string,
    raw: string,
  ): LimitedPublicationField => {
    const trimmed = raw.trim();
    const confirmed = evidenced.has(evidenceField) && trimmed.length > 0;
    return {
      key: outputKey,
      label,
      value: confirmed ? trimmed : null,
      state: confirmed ? 'confirmed' : 'not_confirmed',
      evidenceKey: evidenced.get(evidenceField),
    };
  };

  const fields: LimitedPublicationField[] = [
    field('course_title', 'identity', 'Course', course.courseTitle),
    field('institution', 'identity', 'Institution', course.universityName),
    field('study_level', 'study_level', 'Study level', course.studyLevel),
    field('study_mode', 'study_mode', 'Study mode', course.studyMode),
    field('campus', 'campus', 'Campus', course.campus),
    field('academic_year', 'academic_year', 'Academic year', course.academicYear),
    field('duration', 'duration', 'Duration', course.durationMonths > 0 ? `${course.durationMonths} months` : ''),
  ];

  // Suppressed claims are listed explicitly so the UI states them as unknown
  // rather than omitting them, and so a test can prove no number leaked.
  const suppressed: string[] = LIMITED_PATHWAY_SENSITIVE_FIELDS_ENABLED
    ? []
    : [...LIMITED_PATHWAY_SENSITIVE_FIELDS];

  return {
    publishable: true,
    courseId: course.id,
    fields,
    suppressed,
    banner:
      'This course record is partially verified. Only fields confirmed by the '
      + "institution's own published pages are shown; everything else is marked "
      + '"Not confirmed".',
  };
}

/**
 * Guard for the class of bug where an unset numeric column (default 0) is
 * rendered as a fact — "0 months", "Free", "No deadline". Such a value must
 * become "Not confirmed" instead.
 */
export function renderClaim(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return NOT_CONFIRMED;
  if (typeof value === 'number') return value > 0 ? String(value) : NOT_CONFIRMED;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : NOT_CONFIRMED;
}

export const NOT_CONFIRMED_LABEL = NOT_CONFIRMED;
