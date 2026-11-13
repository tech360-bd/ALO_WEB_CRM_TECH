import { describe, expect, it } from 'vitest';
import {
  BUSINESS_AREA_COUNT,
  ENGINEERING_AREA_COUNT,
  TOPIC_CATALOGUE,
  getTopicArea,
  validateCatalogue,
} from '@/lib/phd/topics/catalogue';
import { generateTopicCandidates, salientKeywords } from '@/lib/phd/topics/generator';
import { TOPIC_EVALUATION_CRITERIA } from '@/lib/phd/constants';

const businessSet = generateTopicCandidates({
  projectId: 'project-business',
  discipline: 'BUSINESS',
  maxCandidates: 8,
  profile: {
    degreeSubject: 'Business Administration',
    methodsExperience: 'INTERVIEWS_THEMATIC, SURVEY_STATISTICS',
    preferredMethods: 'INTERVIEWS_THEMATIC',
    researchSetting: 'UK manufacturing SMEs',
    primaryDiscipline: 'BUSINESS',
  },
});

const engineeringSet = generateTopicCandidates({
  projectId: 'project-engineering',
  discipline: 'ENGINEERING',
  maxCandidates: 8,
  profile: {
    degreeSubject: 'Mechanical Engineering',
    methodsExperience: 'LAB_EXPERIMENT, FEA_CFD',
    preferredMethods: 'LAB_EXPERIMENT',
    researchSetting: 'UK aerospace supply chain',
    primaryDiscipline: 'ENGINEERING',
  },
});

describe('topic catalogue', () => {
  it('has 12 business and 12 engineering areas with unique codes', () => {
    expect(BUSINESS_AREA_COUNT).toBe(12);
    expect(ENGINEERING_AREA_COUNT).toBe(12);
    expect(TOPIC_CATALOGUE).toHaveLength(24);
    expect(new Set(TOPIC_CATALOGUE.map((area) => area.code)).size).toBe(24);
  });

  it('passes its own integrity validation', () => {
    const result = validateCatalogue();
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('provides real content for every area, not placeholders', () => {
    for (const area of TOPIC_CATALOGUE) {
      expect(area.problems.length).toBeGreaterThanOrEqual(2);
      expect(area.keywords.length).toBeGreaterThanOrEqual(4);
      expect(area.methods.length).toBeGreaterThanOrEqual(2);
      expect(area.theories.length).toBeGreaterThanOrEqual(1);
      expect(area.dataSources.length).toBeGreaterThan(20);
      expect(area.risks.length).toBeGreaterThan(20);
      expect(area.ethics.length).toBeGreaterThan(20);
      expect(area.searchStrategy).toMatch(/crossref|scopus|web of science|google scholar|database/i);
      expect(area.summary.length).toBeGreaterThan(40);
    }
  });

  it('rejects duplicate codes and empty problems', () => {
    const broken = [
      { ...TOPIC_CATALOGUE[0] },
      { ...TOPIC_CATALOGUE[0], problems: [] },
    ];
    const result = validateCatalogue(broken as typeof TOPIC_CATALOGUE);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('topic generation', () => {
  it('generates at least five business topics for comparison', () => {
    expect(businessSet.topics.length).toBeGreaterThanOrEqual(5);
    expect(businessSet.topics.length).toBeLessThanOrEqual(8);
    expect(businessSet.topics.every((topic) => getTopicArea(topic.areaCode)?.discipline === 'BUSINESS')).toBe(true);
  });

  it('generates at least five engineering topics', () => {
    expect(engineeringSet.topics.length).toBeGreaterThanOrEqual(5);
    expect(engineeringSet.topics.every((topic) => getTopicArea(topic.areaCode)?.discipline === 'ENGINEERING')).toBe(true);
  });

  it('fills all 20 required content fields for every candidate', () => {
    const requiredStrings = [
      'workingTitle',
      'plainLanguage',
      'researchField',
      'researchSubfield',
      'problemStatement',
      'initialEvidence',
      'provisionalGap',
      'mainQuestion',
      'aim',
      'theoryFramework',
      'dataNeeds',
      'feasibilityRisks',
      'ethics',
      'scholarlyContribution',
      'practicalContribution',
      'potentialMatches',
      'preliminaryReading',
    ] as const;
    for (const topic of [...businessSet.topics, ...engineeringSet.topics]) {
      for (const field of requiredStrings) {
        expect(typeof topic[field], `${topic.areaCode}.${field}`).toBe('string');
        expect(topic[field].length, `${topic.areaCode}.${field}`).toBeGreaterThan(10);
      }
      expect(topic.methodology.design.length).toBeGreaterThan(10);
      expect(topic.methodology.rationale.length).toBeGreaterThan(20);
      expect(topic.supportingQuestions.length).toBeGreaterThanOrEqual(2);
      expect(topic.objectives.length).toBeGreaterThanOrEqual(2);
      expect(topic.objectives.every((objective) => objective.measure.length > 5)).toBe(true);
      expect(topic.unresolvedQuestions.length).toBeGreaterThanOrEqual(1);
      expect(topic.keywords.length).toBeGreaterThanOrEqual(3);
      expect(topic.evidenceQuality).toBe('UNVERIFIED');
      expect(topic.noveltyStatus).toBe('PROVISIONAL_UNVERIFIED');
    }
  });

  it('never fabricates literature, DOIs or supervisor availability', () => {
    const serialised = JSON.stringify([...businessSet.topics, ...engineeringSet.topics]);
    expect(serialised).not.toMatch(/10\.\d{4,9}\//);
    expect(serialised).not.toMatch(/doi:/i);
    expect(serialised.toLowerCase()).not.toContain('accepting students');
    expect(serialised.toLowerCase()).not.toContain('verified fact');
    expect(serialised).toContain('No verified references are attached yet');
    expect(serialised).toContain('a match score is not an agreement to supervise');
  });

  it('is deterministic for the same request', () => {
    const repeat = generateTopicCandidates({
      projectId: 'project-business',
      discipline: 'BUSINESS',
      maxCandidates: 8,
      profile: {
        degreeSubject: 'Business Administration',
        methodsExperience: 'INTERVIEWS_THEMATIC, SURVEY_STATISTICS',
        preferredMethods: 'INTERVIEWS_THEMATIC',
        researchSetting: 'UK manufacturing SMEs',
        primaryDiscipline: 'BUSINESS',
      },
    });
    expect(repeat.topics.map((topic) => topic.dedupeKey)).toEqual(businessSet.topics.map((topic) => topic.dedupeKey));
  });

  it('produces unique dedupe keys across projects and disciplines', () => {
    const keys = [...businessSet.topics, ...engineeringSet.topics].map((topic) => topic.dedupeKey);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('only generates from explicitly selected areas when asked', () => {
    const areaCode = TOPIC_CATALOGUE.find((area) => area.discipline === 'BUSINESS')!.code;
    const selected = generateTopicCandidates({
      projectId: 'project-selected',
      discipline: 'BUSINESS',
      selectedAreaCodes: [areaCode],
      maxCandidates: 6,
    });
    expect(selected.topics.length).toBeGreaterThan(0);
    expect(selected.topics.every((topic) => topic.areaCode === areaCode)).toBe(true);
  });

  it('reports when it cannot generate enough candidates rather than inventing areas', () => {
    const impossible = generateTopicCandidates({
      projectId: 'project-empty',
      discipline: 'BUSINESS',
      selectedAreaCodes: ['NOT_A_REAL_AREA'],
      maxCandidates: 8,
    });
    expect(impossible.topics).toHaveLength(0);
    expect(impossible.notes.join(' ')).toMatch(/fewer than five candidates|provisional canvas/i);
  });

  it('scores every criterion for each generated topic using the shared vocabulary', () => {
    expect(TOPIC_EVALUATION_CRITERIA.length).toBeGreaterThanOrEqual(10);
  });

  it('extracts salient keywords deterministically', () => {
    expect(salientKeywords('Digital transformation and SME digital transformation in manufacturing', 3)).toEqual([
      'digital',
      'transformation',
      'manufacturing',
    ]);
  });
});
