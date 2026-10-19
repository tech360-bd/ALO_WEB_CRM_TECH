// Student success score contracts (spec s112, s15, s93).
import { describe, expect, it } from 'vitest';
import {
  SUCCESS_SCORE_DISCLAIMER,
  bandFromScore,
  computeStudentSuccess,
} from '@/lib/risk/student-success-score';

const NOW = new Date('2026-10-18T00:00:00.000Z');

function base(overrides: Record<string, unknown> = {}) {
  return computeStudentSuccess({
    studentId: 'stu-1',
    profileCompletePercent: 100,
    requiredDocumentCount: 4,
    usableDocumentCount: 4,
    applicationCount: 2,
    submittedApplicationCount: 2,
    offerCount: 1,
    hasOutstandingPayment: false,
    financialSettled: true,
    visaReadinessScore: 90,
    visaAssessed: true,
    nearestDeadline: new Date('2027-03-01T00:00:00.000Z'),
    now: NOW,
    ...overrides,
  });
}

describe('Student success score — disclaimer is never droppable (s15, s93)', () => {
  it('always carries the non-guarantee disclaimer', () => {
    expect(base().disclaimer).toBe(SUCCESS_SCORE_DISCLAIMER);
    expect(base({ profileCompletePercent: 0 }).disclaimer).toBe(SUCCESS_SCORE_DISCLAIMER);
  });

  it('states plainly that this is not an admission or visa prediction', () => {
    expect(SUCCESS_SCORE_DISCLAIMER).toMatch(/not a prediction/i);
    expect(SUCCESS_SCORE_DISCLAIMER).toMatch(/visa/i);
    expect(SUCCESS_SCORE_DISCLAIMER).toMatch(/admission/i);
  });
});

describe('Student success score — bands', () => {
  it('maps scores to the four bands monotonically', () => {
    expect(bandFromScore(100)).toBe('ON_TRACK');
    expect(bandFromScore(80)).toBe('ON_TRACK');
    expect(bandFromScore(79)).toBe('NEEDS_SUPPORT');
    expect(bandFromScore(60)).toBe('NEEDS_SUPPORT');
    expect(bandFromScore(59)).toBe('AT_RISK');
    expect(bandFromScore(40)).toBe('AT_RISK');
    expect(bandFromScore(39)).toBe('CRITICAL');
    expect(bandFromScore(0)).toBe('CRITICAL');
  });

  it('scores a fully prepared student ON_TRACK', () => {
    const result = base();
    expect(result.band).toBe('ON_TRACK');
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.nextActions).toEqual([]);
  });
});

describe('Student success score — components', () => {
  it('returns exactly the six specified components, weighted to 1.0', () => {
    const result = base();
    expect(result.components.map((component) => component.key).sort()).toEqual([
      'application',
      'deadline',
      'documents',
      'financial',
      'profile',
      'visa',
    ]);
    const totalWeight = result.components.reduce((sum, component) => sum + component.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);
  });

  it('keeps every component score within 0..100', () => {
    for (const overrides of [
      {},
      { profileCompletePercent: -50 },
      { profileCompletePercent: 999 },
      { requiredDocumentCount: 0, usableDocumentCount: 0 },
      { usableDocumentCount: 99, requiredDocumentCount: 1 },
      { visaReadinessScore: 1000 },
    ]) {
      const result = base(overrides);
      for (const component of result.components) {
        expect(component.score).toBeGreaterThanOrEqual(0);
        expect(component.score).toBeLessThanOrEqual(100);
      }
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    }
  });

  it('weights documents most heavily — the biggest real blocker', () => {
    const result = base();
    const weights = Object.fromEntries(result.components.map((c) => [c.key, c.weight]));
    expect(weights.documents).toBeGreaterThan(weights.profile);
    expect(weights.documents).toBeGreaterThan(weights.financial);
  });
});

describe('Student success score — honest handling of unknown data', () => {
  it('does NOT treat an unrecorded document checklist as perfect', () => {
    const unknown = base({ requiredDocumentCount: 0, usableDocumentCount: 0 });
    const complete = base({ requiredDocumentCount: 4, usableDocumentCount: 4 });
    const docsOf = (result: typeof complete) =>
      result.components.find((component) => component.key === 'documents');
    expect(docsOf(unknown)!.score).toBeLessThan(docsOf(complete)!.score);
    expect(docsOf(unknown)!.detail).toMatch(/no checklist recorded/i);
  });

  it('does NOT treat an unassessed visa file as ready', () => {
    const result = base({ visaAssessed: false, visaReadinessScore: null });
    const visa = result.components.find((component) => component.key === 'visa')!;
    expect(visa.score).toBeLessThan(60);
    expect(visa.detail).toMatch(/no visa readiness assessment/i);
    expect(result.nextActions).toContain('Run a visa readiness assessment');
  });

  it('reuses the real visa readiness score when one exists', () => {
    const result = base({ visaAssessed: true, visaReadinessScore: 42 });
    const visa = result.components.find((component) => component.key === 'visa')!;
    expect(visa.score).toBe(42);
    expect(visa.detail).toContain('42');
  });

  it('scores a student with no application low and says what to do', () => {
    const result = base({ applicationCount: 0, submittedApplicationCount: 0, offerCount: 0 });
    const application = result.components.find((component) => component.key === 'application')!;
    expect(application.score).toBeLessThanOrEqual(20);
    expect(result.nextActions.some((action) => /application/i.test(action))).toBe(true);
    expect(result.band).not.toBe('ON_TRACK');
  });

  it('distinguishes drafted from submitted from offered', () => {
    const drafted = base({ applicationCount: 2, submittedApplicationCount: 0, offerCount: 0 });
    const submitted = base({ applicationCount: 2, submittedApplicationCount: 2, offerCount: 0 });
    const offered = base({ applicationCount: 2, submittedApplicationCount: 2, offerCount: 1 });
    const scoreOf = (result: typeof offered) =>
      result.components.find((component) => component.key === 'application')!.score;
    expect(scoreOf(drafted)).toBeLessThan(scoreOf(submitted));
    expect(scoreOf(submitted)).toBeLessThan(scoreOf(offered));
  });
});

describe('Student success score — money and deadlines', () => {
  it('drops the financial component when money is outstanding', () => {
    const result = base({ hasOutstandingPayment: true, financialSettled: false });
    const financial = result.components.find((component) => component.key === 'financial')!;
    expect(financial.score).toBeLessThan(50);
    expect(result.nextActions.some((action) => /outstanding/i.test(action))).toBe(true);
  });

  it('is CRITICAL when a deadline has already passed', () => {
    const result = base({ nearestDeadline: new Date('2026-09-01T00:00:00.000Z') });
    const deadline = result.components.find((component) => component.key === 'deadline')!;
    expect(deadline.score).toBe(0);
    expect(result.nextActions.some((action) => /passed deadline/i.test(action))).toBe(true);
  });

  it('penalises a deadline inside seven days', () => {
    const result = base({ nearestDeadline: new Date('2026-10-22T00:00:00.000Z') });
    const deadline = result.components.find((component) => component.key === 'deadline')!;
    expect(deadline.score).toBeLessThan(50);
    expect(deadline.detail).toMatch(/4 day/);
  });

  it('ignores an unparseable deadline rather than inventing urgency', () => {
    const result = base({ nearestDeadline: 'garbage' });
    const deadline = result.components.find((component) => component.key === 'deadline')!;
    expect(deadline.detail).toMatch(/no upcoming deadline/i);
  });

  it('de-duplicates repeated next actions', () => {
    const result = base({
      profileCompletePercent: 10,
      requiredDocumentCount: 5,
      usableDocumentCount: 1,
      applicationCount: 0,
      submittedApplicationCount: 0,
      offerCount: 0,
      hasOutstandingPayment: true,
      visaAssessed: false,
    });
    expect(new Set(result.nextActions).size).toBe(result.nextActions.length);
    expect(result.nextActions.length).toBeGreaterThanOrEqual(4);
    expect(result.band).toBe('CRITICAL');
  });

  it('is deterministic for identical input', () => {
    expect(base()).toEqual(base());
  });
});
