import { describe, it, expect } from 'vitest';
import {
  evaluateEligibility,
  normalizeCourseLevel,
  normalizeInternationalStatus,
  parseRequirementScore,
  profileFromPayload,
  englishTestExpired,
  ELIGIBILITY_DISCLAIMERS,
  type CourseRuleInput,
  type StudentProfile,
} from '../../src/lib/course-finder/eligibility-rules';

const NOW = new Date('2026-10-12T00:00:00Z');

const pgCourse: CourseRuleInput = {
  courseId: 'C-PGT-1',
  title: 'MSc Data Science',
  universityName: 'Example University',
  country: 'United Kingdom',
  studyLevel: 'Postgraduate',
  internationalEligibility: 'INTERNATIONAL_OPEN',
  sourceUrl: 'https://www.example.ac.uk/msc-data-science',
  lastVerifiedAt: '2026-09-01',
  requirement: {
    academicReq: "Bachelor's degree in a related subject",
    minScore: '3.0/4.0',
    ieltsOverall: 6.5,
    ieltsMinBand: 6.0,
    officialRequirementUrl: 'https://www.example.ac.uk/msc-data-science#entry',
    lastCheckedAt: '2026-09-01',
  },
  fee: { yearlyTuition: 20000, currency: 'GBP', sourceUrl: 'https://www.example.ac.uk/fees', lastCheckedAt: '2026-09-01' },
};

const strongPgStudent: StudentProfile = {
  qualifications: [{ qualificationType: "Bachelor's", gpa: 3.4, gpaScale: 4 }],
  englishTests: [{ testType: 'IELTS Academic', overallScore: 7, listening: 7, reading: 6.5, writing: 6.5, speaking: 7, testDate: '2026-03-01' }],
  workExperienceMonths: 12,
  studyGapYears: 1,
  budget: { amount: 25000, currency: 'GBP' },
};

const row = (r: ReturnType<typeof evaluateEligibility>, key: string) => r.requirements.find((x) => x.key === key);

describe('canonical eligibility engine', () => {
  it('ELIGIBLE when every recorded requirement is met, with source and verified date on each university row', () => {
    const r = evaluateEligibility(strongPgStudent, pgCourse, NOW);
    expect(r.category).toBe('ELIGIBLE');
    expect(r.requirementsMetPercent).toBe(100);
    const academic = row(r, 'academic_score')!;
    expect(academic.result).toBe('MET');
    expect(academic.source).toBe('https://www.example.ac.uk/msc-data-science#entry');
    expect(academic.lastVerifiedAt).toBe('2026-09-01');
    expect(row(r, 'academic_level')!.sourceType).toBe('alo_rule');
  });

  it('never invents a requirement: no verified requirement record → INSUFFICIENT_INFO, rows say "not yet recorded"', () => {
    const r = evaluateEligibility(strongPgStudent, { ...pgCourse, requirement: null }, NOW);
    expect(r.category).toBe('INSUFFICIENT_INFO');
    expect(row(r, 'academic_score')!.universityRequirement).toMatch(/Not yet recorded/);
    expect(row(r, 'english')!.universityRequirement).toMatch(/Not yet recorded/);
    expect(r.nextSteps.length).toBeGreaterThan(0);
  });

  it('English-only shortfall → CONDITIONALLY_ELIGIBLE with improvement plan', () => {
    const s: StudentProfile = { ...strongPgStudent, englishTests: [{ testType: 'IELTS', overallScore: 6, listening: 6, reading: 6, writing: 6, speaking: 6, testDate: '2026-05-01' }] };
    const r = evaluateEligibility(s, pgCourse, NOW);
    expect(r.category).toBe('CONDITIONALLY_ELIGIBLE');
    expect(row(r, 'english')!.result).toBe('NOT_MET');
    expect(r.improvementPlan.some((p) => /English/.test(p.currentGap))).toBe(true);
  });

  it('component band below the minimum is NOT_MET even when overall passes', () => {
    const s: StudentProfile = { ...strongPgStudent, englishTests: [{ testType: 'IELTS', overallScore: 7, listening: 7, reading: 7, writing: 5.5, speaking: 7, testDate: '2026-05-01' }] };
    const r = evaluateEligibility(s, pgCourse, NOW);
    expect(row(r, 'english')!.result).toBe('NOT_MET');
    expect(row(r, 'english')!.studentValue).toMatch(/lowest band 5.5/);
  });

  it('expired English test (older than 2 years) is NOT_MET with a retake action', () => {
    const s: StudentProfile = { ...strongPgStudent, englishTests: [{ testType: 'IELTS', overallScore: 8, listening: 8, reading: 8, writing: 8, speaking: 8, testDate: '2024-01-01' }] };
    const r = evaluateEligibility(s, pgCourse, NOW);
    expect(row(r, 'english')!.result).toBe('NOT_MET');
    expect(row(r, 'english')!.action).toMatch(/retake/i);
    expect(englishTestExpired({ testDate: '2024-01-01' }, NOW)).toBe(true);
    expect(englishTestExpired({ expiryDate: '2027-01-01' }, NOW)).toBe(false);
  });

  it('no English test yet → CONDITIONALLY_ELIGIBLE (offer can be conditional)', () => {
    const r = evaluateEligibility({ ...strongPgStudent, englishTests: [] }, pgCourse, NOW);
    expect(r.category).toBe('CONDITIONALLY_ELIGIBLE');
  });

  it('academic level below entry (HSC for a master’s) → NOT_CURRENTLY_ELIGIBLE with pathway step and a reason', () => {
    const s: StudentProfile = { ...strongPgStudent, qualifications: [{ qualificationType: 'HSC', gpa: 5, gpaScale: 5 }] };
    const r = evaluateEligibility(s, pgCourse, NOW);
    expect(r.category).toBe('NOT_CURRENTLY_ELIGIBLE');
    expect(r.reason).toMatch(/qualification level/);
    expect(r.nextSteps.join(' ')).toMatch(/pathway|counsellor/i);
  });

  it('GPA well below the published minimum → NOT_CURRENTLY_ELIGIBLE; slightly below → PARTIALLY_MATCHED', () => {
    const low = evaluateEligibility({ ...strongPgStudent, qualifications: [{ qualificationType: "Bachelor's", gpa: 2.4, gpaScale: 4 }] }, pgCourse, NOW);
    expect(low.category).toBe('NOT_CURRENTLY_ELIGIBLE');
    const close = evaluateEligibility({ ...strongPgStudent, qualifications: [{ qualificationType: "Bachelor's", gpa: 2.9, gpaScale: 4 }] }, pgCourse, NOW);
    expect(close.category).toBe('PARTIALLY_MATCHED');
  });

  it('different grading systems are not converted → COUNSELLOR_REVIEW_REQUIRED', () => {
    const s: StudentProfile = { ...strongPgStudent, qualifications: [{ qualificationType: "Bachelor's", percentage: 72 }] };
    const r = evaluateEligibility(s, pgCourse, NOW);
    expect(row(r, 'academic_score')!.result).toBe('CONDITION');
    expect(r.category).toBe('COUNSELLOR_REVIEW_REQUIRED');
  });

  it('GPA on a different scale than the requirement is not compared', () => {
    const s: StudentProfile = { ...strongPgStudent, qualifications: [{ qualificationType: "Bachelor's", gpa: 4.5, gpaScale: 5 }] };
    expect(row(evaluateEligibility(s, pgCourse, NOW), 'academic_score')!.result).toBe('CONDITION');
  });

  it('missing student academic result → INSUFFICIENT_INFO is not claimed when other evidence exists; asks for the result', () => {
    const s: StudentProfile = { ...strongPgStudent, qualifications: [{ qualificationType: "Bachelor's" }] };
    const r = evaluateEligibility(s, pgCourse, NOW);
    expect(row(r, 'academic_score')!.result).toBe('MISSING_INFO');
    expect(['PARTIALLY_MATCHED', 'INSUFFICIENT_INFO']).toContain(r.category);
  });

  it('empty profile → INSUFFICIENT_INFO', () => {
    const r = evaluateEligibility({ qualifications: [], englishTests: [] }, pgCourse, NOW);
    expect(r.category).toBe('INSUFFICIENT_INFO');
  });

  it('closed / domestic-only course → NOT_CURRENTLY_ELIGIBLE with reason', () => {
    const r = evaluateEligibility(strongPgStudent, { ...pgCourse, internationalEligibility: 'domestic_only' }, NOW);
    expect(r.category).toBe('NOT_CURRENTLY_ELIGIBLE');
    expect(r.reason).toMatch(/international/);
  });

  it('unverified international status is a counsellor condition, never assumed open', () => {
    const r = evaluateEligibility(strongPgStudent, { ...pgCourse, internationalEligibility: 'not_verified' }, NOW);
    expect(row(r, 'international')!.result).toBe('CONDITION');
    expect(r.category).toBe('LIKELY_ELIGIBLE');
  });

  it('budget never decides eligibility and no exchange rate is applied', () => {
    const over = evaluateEligibility({ ...strongPgStudent, budget: { amount: 5000, currency: 'GBP' } }, pgCourse, NOW);
    expect(over.category).toBe('ELIGIBLE');
    expect(row(over, 'budget')!.result).toBe('NOT_MET');
    const fx = evaluateEligibility({ ...strongPgStudent, budget: { amount: 3000000, currency: 'BDT' } }, pgCourse, NOW);
    expect(row(fx, 'budget')!.result).toBe('MISSING_INFO');
    expect(row(fx, 'budget')!.action).toMatch(/no exchange rate/i);
  });

  it('research degrees always require counsellor review', () => {
    const phd: CourseRuleInput = { ...pgCourse, courseId: 'C-PHD', title: 'PhD Computer Science', studyLevel: 'Research' };
    const s: StudentProfile = { ...strongPgStudent, qualifications: [{ qualificationType: "Master's", gpa: 3.6, gpaScale: 4 }] };
    expect(evaluateEligibility(s, phd, NOW).category).toBe('COUNSELLOR_REVIEW_REQUIRED');
  });

  it('MOI is never treated as a pass; it is a condition', () => {
    const s: StudentProfile = { ...strongPgStudent, englishTests: [{ testType: 'MOI' }] };
    const r = evaluateEligibility(s, { ...pgCourse, requirement: { ...pgCourse.requirement!, moiAccepted: true } }, NOW);
    expect(row(r, 'english')!.result).toBe('CONDITION');
  });

  it('work experience requirement parsed from text', () => {
    const mba: CourseRuleInput = { ...pgCourse, title: 'MBA', requirement: { ...pgCourse.requirement!, workExperience: '3 years managerial experience' } };
    const r = evaluateEligibility({ ...strongPgStudent, workExperienceMonths: 12 }, mba, NOW);
    expect(row(r, 'work_experience')!.result).toBe('NOT_MET');
    expect(r.category).toBe('NOT_CURRENTLY_ELIGIBLE');
  });

  it('every non-eligible result has a reason and at least one next step', () => {
    const profiles: StudentProfile[] = [
      { qualifications: [], englishTests: [] },
      { ...strongPgStudent, qualifications: [{ qualificationType: 'SSC', gpa: 5, gpaScale: 5 }] },
      { ...strongPgStudent, englishTests: [{ testType: 'IELTS', overallScore: 5, testDate: '2026-01-01' }] },
    ];
    for (const p of profiles) {
      const r = evaluateEligibility(p, pgCourse, NOW);
      expect(r.category).not.toBe('ELIGIBLE');
      expect(r.reason.length).toBeGreaterThan(10);
      expect(r.nextSteps.length).toBeGreaterThan(0);
    }
  });

  it('three mandatory disclaimers exist and disclaim guarantees', () => {
    expect(ELIGIBILITY_DISCLAIMERS).toHaveLength(3);
    expect(ELIGIBILITY_DISCLAIMERS[0]).toMatch(/does not guarantee/);
  });
});

describe('normalisers', () => {
  it('course levels', () => {
    expect(normalizeCourseLevel('Foundation')).toBe('FOUNDATION');
    expect(normalizeCourseLevel('Postgraduate', '', 'Pre-Master’s Programme')).toBe('PRE_MASTERS');
    expect(normalizeCourseLevel('', '', 'BSc (Hons) Computing Top-Up')).toBe('TOP_UP');
    expect(normalizeCourseLevel('Research', '', 'MRes Biology')).toBe('MRES');
    expect(normalizeCourseLevel('', '', 'Doctor of Business Administration (DBA)')).toBe('PROFESSIONAL_DOCTORATE');
    expect(normalizeCourseLevel('')).toBe('UNKNOWN');
  });

  it('international status', () => {
    expect(normalizeInternationalStatus('yes')).toBe('INTERNATIONAL_OPEN');
    expect(normalizeInternationalStatus('closed')).toBe('INTERNATIONAL_CLOSED');
    expect(normalizeInternationalStatus('DOMESTIC_ONLY')).toBe('DOMESTIC_ONLY');
    expect(normalizeInternationalStatus('not_verified')).toBe('NOT_VERIFIED');
    expect(normalizeInternationalStatus(undefined)).toBe('NOT_VERIFIED');
  });

  it('requirement scores', () => {
    expect(parseRequirementScore('2.8/4.0')).toMatchObject({ basis: 'GPA', value: 2.8, scale: 4 });
    expect(parseRequirementScore('60%')).toMatchObject({ basis: 'PERCENT', value: 60 });
    expect(parseRequirementScore('2:1')).toMatchObject({ basis: 'UK_CLASS', value: 3 });
    expect(parseRequirementScore('', 'Upper second-class honours degree')).toMatchObject({ basis: 'UK_CLASS', value: 3 });
    expect(parseRequirementScore('Good grades')).toBeNull();
  });

  it('payload parsing ignores junk, sums work months and derives study gap', () => {
    const p = profileFromPayload({
      academicProfile: [{ qualificationType: "Bachelor's", gpa: '3.2', gpaScale: 4, completionYear: 2022 }],
      englishTests: [{ testType: 'None' }, { testType: 'PTE Academic', overallScore: 65 }],
      workExperience: [{ totalMonths: 10 }, { totalMonths: '14' }],
      studyGap: {},
      studyPreferences: { maxTuitionBudget: 18000, currency: 'gbp' },
      userId: 'someone-else',
    }, NOW);
    expect(p.qualifications[0].gpa).toBe(3.2);
    expect(p.englishTests).toHaveLength(1);
    expect(p.workExperienceMonths).toBe(24);
    expect(p.studyGapYears).toBe(4);
    expect(p.budget).toEqual({ amount: 18000, currency: 'GBP' });
    expect((p as unknown as Record<string, unknown>).userId).toBeUndefined();
  });
});

describe('regressions', () => {
  it('"Upper secondary" is not read as an upper-second degree classification', () => {
    expect(parseRequirementScore('', 'Upper secondary school certificate')).toBeNull();
  });
});
