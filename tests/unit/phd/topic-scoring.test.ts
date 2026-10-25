import { describe, expect, it } from 'vitest';
import { compareTopics, scoreTopic, type ScoringEvidenceContext, type TopicScoringInput } from '@/lib/phd/topics/scoring';
import { TOPIC_EVALUATION_CRITERIA } from '@/lib/phd/constants';

const emptyContext: ScoringEvidenceContext = {
  profileCompleteness: 0.2,
  degreeSubject: '',
  preferredMethods: '',
  existingResearchIdea: '',
  researchSetting: '',
  fundingRequirement: 'UNDECIDED',
  verifiedLiteratureCount: 0,
  totalLiteratureCount: 0,
  gapVerified: false,
  verifiedSupervisorMatches: 0,
  verifiedSupervisorRecords: 0,
  verifiedProgrammeCount: 0,
  dataAccessConfirmed: false,
  requiresLabOrFieldwork: false,
  ethicsPlanPresent: false,
  fundingRouteVerified: false,
};

const strongContext: ScoringEvidenceContext = {
  ...emptyContext,
  profileCompleteness: 0.95,
  degreeSubject: 'Business and Management',
  preferredMethods: 'INTERVIEWS_THEMATIC',
  researchSetting: 'UK manufacturing SMEs',
  verifiedLiteratureCount: 18,
  totalLiteratureCount: 20,
  gapVerified: true,
  verifiedSupervisorMatches: 2,
  verifiedSupervisorRecords: 4,
  verifiedProgrammeCount: 3,
  dataAccessConfirmed: true,
  ethicsPlanPresent: true,
  fundingRouteVerified: true,
};

const base: Omit<TopicScoringInput, 'context'> = {
  title: 'Digital transformation and SME productivity in UK manufacturing',
  keywords: ['digital transformation', 'SME', 'manufacturing', 'productivity'],
  methodology: 'Semi-structured interviews with 24 SME managers, analysed thematically.',
  theoryFramework: 'Dynamic capabilities',
  ethics: 'Informed consent, anonymisation and secure storage; ethics approval before recruitment.',
  dataNeeds: 'Interview access to 24 SMEs; public ONS productivity data.',
  areaDiscipline: 'BUSINESS',
  profile: {
    degreeSubject: 'Business and Management',
    preferredMethods: 'INTERVIEWS_THEMATIC',
    researchSetting: 'UK manufacturing SMEs',
    fundingRequirement: 'REQUIRED',
  },
};

describe('topic scoring', () => {
  it('scores every configured criterion with an explanation', () => {
    const result = scoreTopic({ ...base, context: strongContext });
    expect(result.criteria).toHaveLength(TOPIC_EVALUATION_CRITERIA.length);
    expect(new Set(result.criteria.map((criterion) => criterion.criterion))).toEqual(
      new Set(TOPIC_EVALUATION_CRITERIA.map((criterion) => criterion.key)),
    );
    for (const criterion of result.criteria) {
      expect(criterion.score).toBeGreaterThanOrEqual(0);
      expect(criterion.score).toBeLessThanOrEqual(5);
      expect(criterion.explanation.length).toBeGreaterThan(10);
      expect(criterion.weight).toBeGreaterThanOrEqual(1);
    }
    expect(result.overall).toBeGreaterThan(0);
    expect(result.overall).toBeLessThanOrEqual(100);
  });

  it('does not let an unevidenced topic score highly', () => {
    const result = scoreTopic({ ...base, context: emptyContext });
    const gap = result.criteria.find((criterion) => criterion.criterion === 'gapEvidence')!;
    const supervisor = result.criteria.find((criterion) => criterion.criterion === 'supervisorAlignment')!;
    expect(gap.score).toBeLessThanOrEqual(1);
    expect(gap.missingEvidence.join(' ')).toMatch(/gap|literature|search/i);
    expect(supervisor.score).toBeLessThanOrEqual(1);
    expect(result.overall).toBeLessThan(45);
    expect(result.completeness).toBeLessThan(0.5);
    expect(result.uncertaintyNotes.join(' ')).toMatch(/gap has not been verified/i);
    expect(result.disclaimer).toMatch(/not an admissions prediction/i);
  });

  it('scores a fully evidenced topic higher, and says why', () => {
    const strong = scoreTopic({ ...base, context: strongContext });
    const weak = scoreTopic({ ...base, context: emptyContext });
    expect(strong.overall).toBeGreaterThan(weak.overall);
    expect(strong.completeness).toBeGreaterThan(0.8);
    const gap = strong.criteria.find((criterion) => criterion.criterion === 'gapEvidence')!;
    expect(gap.missingEvidence).toEqual([]);
  });

  it('honours configurable weights instead of hiding them', () => {
    const weighted = scoreTopic({ ...base, context: emptyContext }, { gapEvidence: 1, academicFit: 5 });
    const gap = weighted.criteria.find((criterion) => criterion.criterion === 'gapEvidence')!;
    expect(gap.weight).toBe(1);
    const academic = weighted.criteria.find((criterion) => criterion.criterion === 'academicFit')!;
    expect(academic.weight).toBe(5);
    expect(weighted.overall).not.toBe(scoreTopic({ ...base, context: emptyContext }).overall);
  });

  it('penalises resource-intensive engineering designs without facilities evidence', () => {
    const engineering = scoreTopic({
      ...base,
      areaDiscipline: 'ENGINEERING',
      methodology: 'Laboratory testing with a bespoke test rig and prototype validation.',
      keywords: ['laboratory', 'prototype', 'materials'],
      context: { ...emptyContext, requiresLabOrFieldwork: true, dataAccessConfirmed: false },
    });
    const feasibility = engineering.criteria.find((criterion) => criterion.criterion === 'feasibility')!;
    expect(feasibility.missingEvidence.length).toBeGreaterThan(0);
    expect(`${feasibility.explanation} ${feasibility.missingEvidence.join(' ')}`).toMatch(/lab|equipment|facilit|access/i);
  });

  it('compares five or more topics with per-criterion scores and weakest areas', () => {
    const topics = ['A', 'B', 'C', 'D', 'E'].map((suffix, index) => ({
      topicId: `topic-${suffix}`,
      title: `Topic ${suffix}`,
      result: scoreTopic({ ...base, context: index % 2 === 0 ? strongContext : emptyContext }),
    }));
    const rows = compareTopics(topics);
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(Object.keys(row.scores)).toHaveLength(TOPIC_EVALUATION_CRITERIA.length);
      expect(row.weakest).toHaveLength(3);
      expect(row.label).toMatch(/Fragile|Developing|Credible draft|Strong draft/);
    }
    expect(rows[0].overall).toBeGreaterThan(rows[1].overall);
  });
});
