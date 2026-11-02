/**
 * PROPOSED TEST — section A of the Phase 0D approved decisions (rev 2).
 * Pins the corrected field mapping from `08-SECTIONA-SECURITY-REVIEW.md`.
 * Becomes tests/unit/limited-publication-policy.test.ts (imports via '@/lib/...').
 *
 * Run during review with a relative import so nothing under src/ has to change:
 *   cp <this file> tests/unit/zz-proposed-limited-publication-policy.test.ts
 *   # import path below is already relative to that location
 *
 * Every case is a pure-function assertion: no database, no network, no clock.
 */
import { describe, expect, it } from 'vitest';
import {
  evaluateLimitedPublication,
  isCourseSpecificEvidence,
  limitedPublicationBlockers,
  parseFieldScope,
  renderClaim,
  LIMITED_PUBLICATION_STATE,
  type LimitedPublicationApproval,
  type LimitedPublicationCourse,
  type LimitedPublicationEvidence,
} from '../../docs/audit-2026-11-02/proposals/files/limited-publication-policy.rev2';

const HASH_A = 'a'.repeat(64);
const HASH_B = 'b'.repeat(64);

const course = (over: Partial<LimitedPublicationCourse> = {}): LimitedPublicationCourse => ({
  id: 'crm-course-1',
  courseId: 'VC-centennial-biotechnology-fast-track',
  slug: 'VC-centennial-biotechnology-fast-track',
  universityId: 'CA-centennial-college',
  universitySlug: 'CA-centennial-college',
  universityName: 'Centennial College',
  courseTitle: 'Biotechnology Fast Track',
  studyLevel: 'Diploma',
  deliveryMode: 'On campus',
  campus: 'Progress Campus',
  country: 'Canada',
  verificationStatus: 'PARTIALLY_VERIFIED',
  publicationStatus: 'draft',
  durationMonths: 0,
  tuitionFee: 0,
  deadline: '',
  ...over,
});

const evidence = (over: Partial<LimitedPublicationEvidence> = {}): LimitedPublicationEvidence => ({
  evidenceKey: 'ev-1',
  sourceUrl: 'https://www.centennialcollege.ca/programs/biotechnology',
  entityType: 'COURSE',
  courseSlug: 'VC-centennial-biotechnology-fast-track',
  universitySlug: 'CA-centennial-college',
  verificationStatus: 'VERIFIED',
  contentHash: HASH_A,
  fieldScope: JSON.stringify(['identity', 'study_mode', 'campus']),
  ...over,
});

const approval = (over: Partial<LimitedPublicationApproval> = {}): LimitedPublicationApproval => ({
  id: 'approval-1',
  courseId: 'crm-course-1',
  state: LIMITED_PUBLICATION_STATE.APPROVED,
  approvedByUserId: 'super-1',
  approvedByRoles: ['SUPER_ADMIN'],
  approvedAt: '2026-11-02T09:00:00.000Z',
  revokedAt: null,
  evidenceSnapshotKeys: ['ev-1'],
  ...over,
});

describe('limited publication — field-level evidence', () => {
  it('renders exactly the evidenced fields and marks the rest "Not confirmed"', () => {
    const decision = evaluateLimitedPublication({ course: course(), evidence: [evidence()], approval: approval() });
    expect(decision.publishable).toBe(true);
    if (!decision.publishable) return;

    const byKey = Object.fromEntries(decision.fields.map((f) => [f.key, f]));
    expect(byKey.course_title).toMatchObject({ value: 'Biotechnology Fast Track', state: 'confirmed' });
    expect(byKey.study_mode).toMatchObject({ value: 'On campus', state: 'confirmed' });
    expect(byKey.campus).toMatchObject({ value: 'Progress Campus', state: 'confirmed' });
    expect(byKey.study_level).toMatchObject({ value: null, state: 'not_confirmed' });
    // SA-2: no academic-year field exists on the course, so none may be rendered.
    expect(byKey.academic_year).toBeUndefined();
    expect(byKey.duration).toMatchObject({ value: null, state: 'not_confirmed' });
  });

  it('never turns an unset numeric column into a fact', () => {
    // durationMonths defaults to 0 in the schema; 0 must not read as "0 months".
    const withDurationClaim = evaluateLimitedPublication({
      course: course(),
      evidence: [evidence({ fieldScope: JSON.stringify(['identity', 'duration']) })],
      approval: approval(),
    });
    expect(withDurationClaim.publishable).toBe(true);
    if (!withDurationClaim.publishable) return;
    const duration = withDurationClaim.fields.find((f) => f.key === 'duration');
    expect(duration).toMatchObject({ value: null, state: 'not_confirmed' });
    expect(renderClaim(0)).toBe('Not confirmed');
    expect(renderClaim('')).toBe('Not confirmed');
    expect(renderClaim(12)).toBe('12');
  });

  it('suppresses every money, timing and eligibility claim in this phase', () => {
    const decision = evaluateLimitedPublication({ course: course(), evidence: [evidence()], approval: approval() });
    expect(decision.publishable).toBe(true);
    if (!decision.publishable) return;
    expect(decision.suppressed).toContain('fee');
    expect(decision.suppressed).toContain('application_deadline');
    expect(decision.suppressed).toContain('intake_dates');
    expect(decision.suppressed).toContain('eligibility');
    // No rendered field may carry a fee/deadline/intake/eligibility key or value.
    for (const field of decision.fields) {
      expect(field.key).not.toMatch(/fee|deadline|intake|eligib|start_months|scholarship/);
      expect(String(field.value)).not.toMatch(/deadline|intake|tuition/i);
    }
    expect(decision.banner).toContain('Not confirmed');
  });

  it('rejects evidence that is not about this exact course', () => {
    const foreignCourse = evidence({ courseSlug: 'VC-monash-master-of-business' });
    expect(isCourseSpecificEvidence(foreignCourse, course())).toBe(false);
    const decision = evaluateLimitedPublication({ course: course(), evidence: [foreignCourse], approval: approval() });
    expect(decision.publishable).toBe(false);
  });

  it('rejects evidence whose institution does not match (the Phase 0D relink defect)', () => {
    const relinked = evidence({ universitySlug: 'AU-monash-university' });
    expect(isCourseSpecificEvidence(relinked, course())).toBe(false);
    const decision = evaluateLimitedPublication({ course: course(), evidence: [relinked], approval: approval() });
    expect(decision.publishable).toBe(false);
    if (decision.publishable) return;
    expect(decision.blockedBy).toContain('NO_COURSE_SPECIFIC_EVIDENCE');
  });

  it('rejects an evidence excerpt with no content hash', () => {
    expect(isCourseSpecificEvidence(evidence({ contentHash: '' }), course())).toBe(false);
    expect(isCourseSpecificEvidence(evidence({ contentHash: 'not-a-hash' }), course())).toBe(false);
  });

  it('rejects evidence that was never verified, and non-https sources', () => {
    expect(isCourseSpecificEvidence(evidence({ verificationStatus: 'PENDING_REVIEW' }), course())).toBe(false);
    expect(isCourseSpecificEvidence(evidence({ sourceUrl: 'http://www.centennialcollege.ca/x' }), course())).toBe(false);
  });

  it('parses fieldScope defensively', () => {
    expect(parseFieldScope('["identity","campus","identity"]')).toEqual(['identity', 'campus']);
    expect(parseFieldScope('not json')).toEqual([]);
    expect(parseFieldScope('{"a":1}')).toEqual([]);
    expect(parseFieldScope('')).toEqual([]);
  });
});

describe('limited publication — authorization', () => {
  it('publishes nothing without an approval record', () => {
    const decision = evaluateLimitedPublication({ course: course(), evidence: [evidence()], approval: null });
    expect(decision.publishable).toBe(false);
    if (decision.publishable) return;
    expect(decision.blockedBy).toEqual(['NO_APPROVAL_RECORD']);
  });

  it('publishes nothing while approval is only requested', () => {
    for (const state of [
      LIMITED_PUBLICATION_STATE.NOT_REQUESTED,
      LIMITED_PUBLICATION_STATE.PENDING_APPROVAL,
      LIMITED_PUBLICATION_STATE.REJECTED,
      LIMITED_PUBLICATION_STATE.REVOKED,
    ] as const) {
      const decision = evaluateLimitedPublication({
        course: course(),
        evidence: [evidence()],
        approval: approval({ state }),
      });
      expect(decision.publishable, state).toBe(false);
    }
  });

  it('publishes nothing when the approver was not a Super Admin', () => {
    const decision = evaluateLimitedPublication({
      course: course(),
      evidence: [evidence()],
      approval: approval({ approvedByRoles: ['ADMIN'] }),
    });
    expect(decision.publishable).toBe(false);
    if (decision.publishable) return;
    expect(decision.blockedBy).toContain('APPROVER_WAS_NOT_SUPER_ADMIN');
  });

  it('publishes nothing when the approval belongs to a different course', () => {
    const decision = evaluateLimitedPublication({
      course: course(),
      evidence: [evidence()],
      approval: approval({ courseId: 'some-other-course' }),
    });
    expect(decision.publishable).toBe(false);
    if (decision.publishable) return;
    expect(decision.blockedBy).toContain('APPROVAL_BELONGS_TO_ANOTHER_COURSE');
  });

  it('publishes nothing for an untimestamped or revoked approval', () => {
    expect(limitedPublicationBlockers(course(), approval({ approvedAt: '' }), [evidence()]))
      .toContain('APPROVAL_NOT_TIMESTAMPED');
    expect(limitedPublicationBlockers(course(), approval({ revokedAt: '2026-11-03T00:00:00.000Z' }), [evidence()]))
      .toContain('APPROVAL_REVOKED');
  });

  it('invalidates an approval whose evidence snapshot changed after sign-off', () => {
    const decision = evaluateLimitedPublication({
      course: course(),
      // Same field scope, different evidence key: a re-link happened after approval.
      evidence: [evidence({ evidenceKey: 'ev-2', contentHash: HASH_B })],
      approval: approval({ evidenceSnapshotKeys: ['ev-1'] }),
    });
    expect(decision.publishable).toBe(false);
    if (decision.publishable) return;
    expect(decision.blockedBy).toContain('APPROVAL_EVIDENCE_SNAPSHOT_STALE');
  });
});

describe('limited publication — publication status', () => {
  it('keeps fully verified records on the existing gate', () => {
    const decision = evaluateLimitedPublication({
      course: course({ verificationStatus: 'VERIFIED' }),
      evidence: [evidence()],
      approval: approval(),
    });
    expect(decision.publishable).toBe(false);
    if (decision.publishable) return;
    expect(decision.blockedBy).toContain('FULLY_VERIFIED_USE_EXISTING_GATE');
  });

  it('never publishes synthetic or unreviewed records', () => {
    for (const status of ['UNVERIFIED_SYNTHETIC', 'NEEDS_REVIEW', 'NEEDS_OFFICIAL_SOURCE']) {
      expect(limitedPublicationBlockers(course({ verificationStatus: status }), approval(), [evidence()]).length)
        .toBeGreaterThan(0);
    }
  });

  it('never publishes a record that is already public', () => {
    expect(limitedPublicationBlockers(course({ publicationStatus: 'published' }), approval(), [evidence()]))
      .toContain('ALREADY_PUBLISHED');
  });

  it('honours the hard deny list even with a perfect approval and real evidence', () => {
    const monash: LimitedPublicationCourse = {
      ...course(),
      id: 'crm-monash',
      courseId: 'VC-monash-master-of-business',
      slug: 'VC-monash-master-of-business',
      universityId: 'AU-monash-university',
      universitySlug: 'AU-monash-university',
      universityName: 'Monash University',
      courseTitle: 'Master of Business',
    };
    const monashEvidence = evidence({
      courseSlug: 'VC-monash-master-of-business',
      universitySlug: 'AU-monash-university',
      fieldScope: JSON.stringify(['identity', 'study_mode', 'campus']),
    });
    const decision = evaluateLimitedPublication({
      course: monash,
      evidence: [monashEvidence],
      approval: approval({ courseId: 'crm-monash', evidenceSnapshotKeys: ['ev-1'] }),
    });
    expect(decision.publishable).toBe(false);
    if (decision.publishable) return;
    expect(decision.blockedBy.some((reason) => reason.startsWith('DENY_LIST:'))).toBe(true);
  });

  it('honours the deny list for the unpublished Aston records', () => {
    const aston: LimitedPublicationCourse = {
      ...course(),
      id: 'crm-aston',
      courseId: 'AS-foundation-programmes',
      slug: 'AS-foundation-programmes',
      universityId: 'aston university',
      universitySlug: 'aston university',
      universityName: 'Aston University',
      courseTitle: 'Foundation Programmes',
    };
    const decision = evaluateLimitedPublication({
      course: aston,
      evidence: [evidence({ courseSlug: 'AS-foundation-programmes', universitySlug: 'aston university' })],
      approval: approval({ courseId: 'crm-aston', evidenceSnapshotKeys: ['ev-1'] }),
    });
    expect(decision.publishable).toBe(false);
    if (decision.publishable) return;
    expect(decision.blockedBy.some((reason) => reason.startsWith('DENY_LIST:'))).toBe(true);
  });

  it('publishes nothing when there is no course-specific evidence at all', () => {
    const decision = evaluateLimitedPublication({ course: course(), evidence: [], approval: approval() });
    expect(decision.publishable).toBe(false);
    if (decision.publishable) return;
    expect(decision.blockedBy).toContain('NO_COURSE_SPECIFIC_EVIDENCE');
  });
});
