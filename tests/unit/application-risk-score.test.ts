// Application risk score contracts (spec s111).
// The scoring core is pure, so these assert behaviour without a database.
import { describe, expect, it } from 'vitest';
import {
  computeApplicationRisk,
  riskLevelFromScore,
} from '@/lib/risk/application-risk-score';

const NOW = new Date('2026-10-18T00:00:00.000Z');

function base(overrides: Parameters<typeof computeApplicationRisk>[0] extends infer T ? Partial<T> : never) {
  return computeApplicationRisk({
    applicationId: 'app-1',
    stage: 'SUBMITTED_TO_UNIVERSITY',
    reviewStatus: 'APPROVED',
    documentStatus: 'COMPLETE',
    paymentStatus: 'PAID',
    depositStatus: 'PAID',
    offerStatus: 'PENDING',
    casI20CoeStatus: 'NOT_STARTED',
    visaHandoverStatus: 'NOT_READY',
    slaStatus: 'ON_TRACK',
    universityId: 'UNI-1',
    universityName: 'Aston University',
    courseId: 'CRS-1',
    courseName: 'MSc Data Science',
    country: 'United Kingdom',
    intake: 'September 2027',
    deadlineDate: new Date('2026-12-01T00:00:00.000Z'),
    documents: [
      { documentType: 'passport', status: 'VERIFIED' },
      { documentType: 'transcript', status: 'VERIFIED' },
    ],
    now: NOW,
    ...overrides,
  } as Parameters<typeof computeApplicationRisk>[0]);
}

describe('Application risk — healthy application is GREEN', () => {
  it('scores a complete, in-date application GREEN with no factors', () => {
    const result = base({});
    expect(result.riskLevel).toBe('GREEN');
    expect(result.score).toBe(0);
    expect(result.factors).toEqual([]);
    expect(result.missingItems).toEqual([]);
    expect(result.applicationId).toBe('app-1');
  });

  it('is deterministic — identical input yields identical output', () => {
    expect(base({})).toEqual(base({}));
  });
});

describe('Application risk — document factors', () => {
  it('flags missing, rejected and expired documents and lists them', () => {
    const result = base({
      documents: [
        { documentType: 'passport', status: 'VERIFIED' },
        { documentType: 'transcript', status: 'MISSING' },
        { documentType: 'english_test', status: 'REJECTED' },
        { documentType: 'bank_statement', status: 'EXPIRED' },
      ],
    });
    expect(result.riskLevel).toBe('RED');
    expect(result.missingItems).toEqual(
      expect.arrayContaining(['transcript', 'english_test', 'bank_statement']),
    );
    const codes = result.factors.map((factor) => factor.code);
    expect(codes).toContain('DOCUMENT_NOT_USABLE');
  });

  it('counts a declared missing type only once', () => {
    const result = base({
      documents: [{ documentType: 'transcript', status: 'MISSING' }],
      missingRequiredDocumentTypes: ['transcript'],
    });
    const transcriptFactors = result.factors.filter((factor) =>
      factor.label.toLowerCase().includes('transcript'),
    );
    expect(transcriptFactors.length).toBe(1);
  });

  it('treats an INCOMPLETE document status as a medium factor', () => {
    const result = base({ documentStatus: 'INCOMPLETE' });
    expect(result.factors.map((factor) => factor.code)).toContain('DOCUMENT_STATUS_INCOMPLETE');
    expect(result.riskLevel).not.toBe('GREEN');
  });
});

describe('Application risk — deadline intelligence (s114)', () => {
  it('is RED once the deadline has passed', () => {
    const result = base({ deadlineDate: new Date('2026-10-10T00:00:00.000Z') });
    expect(result.riskLevel).toBe('RED');
    expect(result.factors.map((factor) => factor.code)).toContain('DEADLINE_PASSED');
  });

  it('escalates as the deadline approaches', () => {
    const imminent = base({ deadlineDate: new Date('2026-10-20T00:00:00.000Z') });
    const soon = base({ deadlineDate: new Date('2026-10-24T00:00:00.000Z') });
    const approaching = base({ deadlineDate: new Date('2026-11-05T00:00:00.000Z') });
    const comfortable = base({ deadlineDate: new Date('2027-01-05T00:00:00.000Z') });

    expect(imminent.score).toBeGreaterThan(soon.score);
    expect(soon.score).toBeGreaterThan(approaching.score);
    expect(approaching.score).toBeGreaterThan(comfortable.score);
    expect(comfortable.score).toBe(0);
  });

  it('does not raise deadline risk for a closed application', () => {
    const result = base({
      stage: 'CLOSED',
      deadlineDate: new Date('2026-10-10T00:00:00.000Z'),
    });
    expect(result.factors.map((factor) => factor.code)).not.toContain('DEADLINE_PASSED');
  });

  it('ignores an unparseable deadline instead of inventing urgency', () => {
    const result = base({ deadlineDate: 'not-a-date' as unknown as Date });
    expect(result.factors.map((factor) => factor.code)).not.toContain('DEADLINE_PASSED');
    expect(result.factors.map((factor) => factor.code)).not.toContain('DEADLINE_IMMINENT');
  });
});

describe('Application risk — decisions, money and handover', () => {
  it('is RED on an internal review rejection', () => {
    const result = base({ reviewStatus: 'REJECTED' });
    expect(result.riskLevel).toBe('RED');
    expect(result.factors.map((factor) => factor.code)).toContain('REVIEW_REJECTED');
  });

  it('is RED on a university rejection', () => {
    const result = base({ offerStatus: 'REJECTED' });
    expect(result.riskLevel).toBe('RED');
  });

  it('scales with the number of unmet offer conditions, capped', () => {
    const one = base({ offerStatus: 'CONDITIONAL_OFFER', unmetOfferConditions: 1 });
    const two = base({ offerStatus: 'CONDITIONAL_OFFER', unmetOfferConditions: 2 });
    const ten = base({ offerStatus: 'CONDITIONAL_OFFER', unmetOfferConditions: 10 });
    expect(two.score).toBeGreaterThan(one.score);
    // Capped so a data-entry mistake cannot manufacture an unbounded score.
    expect(ten.factors.find((factor) => factor.code === 'OFFER_CONDITIONS_UNMET')?.points).toBe(24);
    expect(one.missingItems).toContain('offer_conditions');
  });

  it('flags overdue payment and deposit', () => {
    const result = base({ paymentStatus: 'OVERDUE', depositStatus: 'OVERDUE' });
    const codes = result.factors.map((factor) => factor.code);
    expect(codes).toContain('PAYMENT_OVERDUE');
    expect(codes).toContain('DEPOSIT_OVERDUE');
    expect(result.missingItems).toEqual(expect.arrayContaining(['payment', 'deposit']));
  });

  it('flags a deposit that is blocking the current stage', () => {
    const result = base({ stage: 'DEPOSIT_PENDING', depositStatus: 'PENDING' });
    expect(result.factors.map((factor) => factor.code)).toContain('DEPOSIT_BLOCKING_STAGE');
  });

  it('flags CAS/COE/I-20 not started when the stage demands it', () => {
    const result = base({ stage: 'CAS_PENDING', casI20CoeStatus: 'NOT_STARTED' });
    expect(result.factors.map((factor) => factor.code)).toContain('CONFIRMATION_NOT_STARTED');
    expect(result.missingItems).toContain('cas_coe_i20');
  });

  it('flags a visa handover expected but not ready', () => {
    const result = base({ stage: 'VISA_HANDOVER_READY', visaHandoverStatus: 'NOT_READY' });
    expect(result.factors.map((factor) => factor.code)).toContain('VISA_HANDOVER_NOT_READY');
  });

  it('flags SLA breach and due-today separately', () => {
    expect(base({ slaStatus: 'OVERDUE' }).factors.map((f) => f.code)).toContain('SLA_OVERDUE');
    expect(base({ slaStatus: 'DUE_TODAY' }).factors.map((f) => f.code)).toContain('SLA_DUE_TODAY');
  });
});

describe('Application risk — data integrity', () => {
  it('is RED with no university recorded', () => {
    const result = base({ universityId: '', universityName: '' });
    expect(result.riskLevel).toBe('RED');
    expect(result.factors.map((factor) => factor.code)).toContain('NO_UNIVERSITY');
  });

  it('is RED with no course recorded', () => {
    const result = base({ courseId: '', courseName: '' });
    expect(result.riskLevel).toBe('RED');
    expect(result.factors.map((factor) => factor.code)).toContain('NO_COURSE');
  });

  it('accepts a name when the id is absent — history must not be punished', () => {
    const result = base({ universityId: '', universityName: 'Aston University' });
    expect(result.factors.map((factor) => factor.code)).not.toContain('NO_UNIVERSITY');
  });

  it('flags a missing country and a missing intake', () => {
    const result = base({ country: '', intake: '' });
    const codes = result.factors.map((factor) => factor.code);
    expect(codes).toContain('NO_COUNTRY');
    expect(codes).toContain('NO_INTAKE');
  });
});

describe('Application risk — scoring bounds and ordering', () => {
  it('clamps the score to 0..100 even with many stacked factors', () => {
    const result = base({
      deadlineDate: new Date('2026-10-01T00:00:00.000Z'),
      reviewStatus: 'REJECTED',
      offerStatus: 'REJECTED',
      paymentStatus: 'OVERDUE',
      depositStatus: 'OVERDUE',
      slaStatus: 'OVERDUE',
      universityId: '',
      universityName: '',
      courseId: '',
      courseName: '',
      country: '',
      intake: '',
      documents: [
        { documentType: 'a', status: 'MISSING' },
        { documentType: 'b', status: 'REJECTED' },
        { documentType: 'c', status: 'EXPIRED' },
        { documentType: 'd', status: 'MISSING' },
      ],
    });
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThan(0);
    expect(result.riskLevel).toBe('RED');
  });

  it('sorts factors by severity so the UI leads with the worst', () => {
    const result = base({
      documents: [{ documentType: 'transcript', status: 'MISSING' }],
      slaStatus: 'DUE_TODAY',
      intake: '',
    });
    const points = result.factors.map((factor) => factor.points);
    expect(points).toEqual([...points].sort((a, b) => b - a));
  });

  it('caps a closed application at AMBER unless a hard-red factor applies', () => {
    // A withdrawn file with only SOFT factors (money + SLA) is noise in a live
    // triage queue, so it is capped at AMBER. University/course are supplied:
    // omitting them would legitimately raise a hard-red data-integrity factor.
    const softRedClosed = computeApplicationRisk({
      applicationId: 'app-2',
      stage: 'WITHDRAWN',
      universityId: 'UNI-1',
      courseId: 'CRS-1',
      country: 'United Kingdom',
      intake: 'September 2027',
      paymentStatus: 'OVERDUE',
      depositStatus: 'OVERDUE',
      slaStatus: 'OVERDUE',
      reviewStatus: 'NEEDS_MORE_INFO',
      documentStatus: 'INCOMPLETE',
      now: NOW,
    });
    expect(softRedClosed.score).toBeGreaterThanOrEqual(45);
    expect(softRedClosed.riskLevel).toBe('AMBER');

    // A passed deadline on a WITHDRAWN file is deliberately NOT a risk factor —
    // there is nothing left to act on, so terminal stages skip deadline scoring.
    const hardRedClosed = computeApplicationRisk({
      applicationId: 'app-3',
      stage: 'WITHDRAWN',
      universityId: 'UNI-1',
      courseId: 'CRS-1',
      deadlineDate: new Date('2026-10-01T00:00:00.000Z'),
      now: NOW,
    });
    expect(hardRedClosed.factors.map((factor) => factor.code)).not.toContain('DEADLINE_PASSED');
    expect(hardRedClosed.riskLevel).toBe('GREEN');

    // A rejected decision is still surfaced on a closed file: it is an outcome
    // management must see, not stale urgency.
    const rejectedClosed = computeApplicationRisk({
      applicationId: 'app-3b',
      stage: 'WITHDRAWN',
      universityId: 'UNI-1',
      courseId: 'CRS-1',
      offerStatus: 'REJECTED',
      now: NOW,
    });
    expect(rejectedClosed.riskLevel).toBe('RED');
  });

  it('keeps a closed file RED when its data integrity is broken', () => {
    const result = computeApplicationRisk({
      applicationId: 'app-4',
      stage: 'WITHDRAWN',
      universityId: '',
      universityName: '',
      now: NOW,
    });
    expect(result.factors.map((factor) => factor.code)).toContain('NO_UNIVERSITY');
    expect(result.riskLevel).toBe('RED');
  });

  it('exposes a monotonic band helper', () => {
    expect(riskLevelFromScore(0)).toBe('GREEN');
    expect(riskLevelFromScore(17)).toBe('GREEN');
    expect(riskLevelFromScore(18)).toBe('AMBER');
    expect(riskLevelFromScore(44)).toBe('AMBER');
    expect(riskLevelFromScore(45)).toBe('RED');
    expect(riskLevelFromScore(100)).toBe('RED');
  });

  it('records an ISO evaluation timestamp', () => {
    expect(base({}).evaluatedAt).toBe(NOW.toISOString());
  });
});
