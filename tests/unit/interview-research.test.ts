import { describe, expect, it } from 'vitest';
import {
  ANSWER_FACT_KEYS,
  assembleAnswerFramework,
  buildQuestionPack,
  classifyFreshness,
  normalizeConfidence,
  normalizeSourceType,
} from '@/lib/interview/research';
import { INTERVIEW_RESEARCH_WINDOW_MONTHS } from '@/lib/interview/honesty';

const NOW = new Date('2026-10-24T12:00:00.000Z');
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

const verified = {
  source: 'University of Birmingham admissions guidance',
  sourceType: 'OFFICIAL_UNIVERSITY',
  sourceUrl: 'https://example.ac.uk/admissions/interview',
  lastVerifiedAt: daysAgo(30),
  confidence: 'HIGH',
  frequency: 4,
};

describe('interview research provenance', () => {
  it('classifies a sourced question verified inside the window as FRESH', () => {
    expect(classifyFreshness({ id: 'q', category: 'COURSE', question: 'Why this course?', ...verified }, NOW)).toBe('FRESH');
  });

  it('never treats a question without a source as current evidence', () => {
    expect(classifyFreshness({ id: 'q', category: 'COURSE', question: 'Why?', lastVerifiedAt: daysAgo(2) }, NOW)).toBe('UNVERIFIED');
    expect(classifyFreshness({ id: 'q', category: 'COURSE', question: 'Why?', source: 'blog' }, NOW)).toBe('UNVERIFIED');
  });

  it('marks evidence older than the six-month window STALE and older than expiry EXPIRED', () => {
    const stale = classifyFreshness({ id: 'q', category: 'COURSE', question: 'Why?', ...verified, lastVerifiedAt: daysAgo(200) }, NOW);
    const expired = classifyFreshness({ id: 'q', category: 'COURSE', question: 'Why?', ...verified, lastVerifiedAt: daysAgo(400) }, NOW);
    expect(stale).toBe('STALE');
    expect(expired).toBe('EXPIRED');
  });

  it('rejects guidance that promises guaranteed outcomes', () => {
    expect(classifyFreshness({
      id: 'q', category: 'VISA', question: 'Visa?', ...verified,
      guidance: 'This is a 100% visa guaranteed answer.',
    }, NOW)).toBe('UNVERIFIED');
  });

  it('normalizes confidence and source type, refusing unknown values', () => {
    expect(normalizeConfidence('high')).toBe('HIGH');
    expect(normalizeConfidence('certain')).toBeNull();
    expect(normalizeSourceType('official_university')).toBe('OFFICIAL_UNIVERSITY');
    expect(normalizeSourceType('someones-blog')).toBeNull();
  });
});

describe('question pack assembly', () => {
  const questions = [
    { id: 'fresh', category: 'COURSE', question: 'Why this course?', ...verified },
    { id: 'stale', category: 'COURSE', question: 'Old question?', ...verified, lastVerifiedAt: daysAgo(210) },
    { id: 'expired', category: 'VISA', question: 'Very old?', ...verified, lastVerifiedAt: daysAgo(420) },
    { id: 'unverified', category: 'FUNDING', question: 'Who funds you?' },
    { id: 'inactive', category: 'COURSE', question: 'Retired?', ...verified, isActive: false },
    { id: 'otherUni', category: 'COURSE', question: 'Other uni?', ...verified, universitySlug: 'manchester' },
    { id: 'myUni', category: 'COURSE', question: 'My uni question?', ...verified, universitySlug: 'birmingham' },
    { id: 'badGuidance', category: 'COURSE', question: 'Bad guidance?', ...verified, guidance: 'These are the exact questions asked.' },
  ];

  it('publishes only fresh, sourced, in-scope questions by default', () => {
    const pack = buildQuestionPack({ questions, now: NOW, universitySlug: 'birmingham' });
    expect(pack.questions.map((q) => q.id).sort()).toEqual(['fresh', 'myUni']);
    expect(pack.counts.publishable).toBe(2);
    expect(pack.researchWindowMonths).toBe(INTERVIEW_RESEARCH_WINDOW_MONTHS);
    expect(pack.disclaimers.length).toBeGreaterThan(0);
  });

  it('reports every withheld question with a reason instead of dropping it silently', () => {
    const pack = buildQuestionPack({ questions, now: NOW, universitySlug: 'birmingham' });
    const reasons = new Map(pack.excluded.map((entry) => [entry.id, entry.reason]));
    expect(reasons.get('inactive')).toBe('INACTIVE');
    expect(reasons.get('expired')).toBe('EXPIRED');
    expect(reasons.get('otherUni')).toBe('OUT_OF_SCOPE');
    expect(reasons.get('badGuidance')).toBe('POLICY_VIOLATION');
    expect(pack.excluded.some((entry) => entry.id === 'stale')).toBe(true);
    expect(pack.excluded.some((entry) => entry.id === 'unverified')).toBe(true);
  });

  it('surfaces stale evidence for staff only when explicitly requested, still flagged', () => {
    const pack = buildQuestionPack({ questions, now: NOW, includeStale: true });
    const stale = pack.questions.find((q) => q.id === 'stale');
    expect(stale?.freshness).toBe('STALE');
    expect(pack.questions.some((q) => q.id === 'expired')).toBe(false);
    expect(pack.counts.stale).toBe(1);
  });

  it('attaches source, verification age and confidence to every published question', () => {
    const pack = buildQuestionPack({ questions: [questions[0]], now: NOW });
    expect(pack.questions[0]).toMatchObject({
      id: 'fresh',
      sourceType: 'OFFICIAL_UNIVERSITY',
      sourceLabel: 'Official university source',
      confidence: 'HIGH',
      daysSinceVerified: 30,
      freshness: 'FRESH',
    });
    expect(pack.questions[0].lastVerifiedAt).toBe(daysAgo(30).toISOString());
  });

  it('groups questions by category and ranks by reported frequency', () => {
    const pack = buildQuestionPack({
      questions: [
        { id: 'a', category: 'COURSE', question: 'A', ...verified, frequency: 1 },
        { id: 'b', category: 'COURSE', question: 'B', ...verified, frequency: 9 },
        { id: 'c', category: 'VISA', question: 'C', ...verified },
      ],
      now: NOW,
    });
    expect(pack.groups[0].category).toBe('COURSE');
    expect(pack.groups[0].questions.map((q) => q.id)).toEqual(['b', 'a']);
    expect(pack.groups[1].category).toBe('VISA');
  });
});

describe('personalized answer framework', () => {
  const question = { id: 'q1', category: 'COURSE', question: 'Why did you choose this course?' };

  it('refuses to produce an answer when the required student fact is missing', () => {
    const framework = assembleAnswerFramework({ question, facts: {} });
    expect(framework.ready).toBe(false);
    expect(framework.missingFacts).toEqual([ANSWER_FACT_KEYS.REASON_COURSE]);
    expect(framework.shortAnswerDraft).toBeNull();
    expect(framework.expandedAnswerDraft).toBeNull();
  });

  it('treats whitespace as a missing fact rather than guessing', () => {
    const framework = assembleAnswerFramework({ question, facts: { reasonCourse: '   ' } });
    expect(framework.ready).toBe(false);
    expect(framework.missingFacts).toContain(ANSWER_FACT_KEYS.REASON_COURSE);
  });

  it('builds drafts only from the student-supplied facts, verbatim', () => {
    const framework = assembleAnswerFramework({
      question,
      facts: {
        reasonCourse: 'I want the data engineering modules.',
        fundingSource: 'My father funds my studies from his documented savings.',
      },
    });
    expect(framework.ready).toBe(true);
    expect(framework.missingFacts).toEqual([]);
    expect(framework.shortAnswerDraft).toBe('I want the data engineering modules.');
    expect(framework.expandedAnswerDraft).toBe(
      'I want the data engineering modules. My father funds my studies from his documented savings.',
    );
    expect(framework.note).toContain('No employment, income');
    expect(framework.anchors.map((anchor) => anchor.key)).toContain(ANSWER_FACT_KEYS.REASON_COURSE);
  });

  it('requires all credibility anchors before drafting a credibility answer', () => {
    const framework = assembleAnswerFramework({
      question: { id: 'q2', category: 'CREDIBILITY', question: 'Why this university and course?' },
      facts: { reasonCourse: 'Course facts', reasonUniversity: 'University facts' },
    });
    expect(framework.ready).toBe(false);
    expect(framework.missingFacts).toEqual([ANSWER_FACT_KEYS.FUTURE_PLAN]);
  });

  it('never emits numbers that the student did not provide', () => {
    const framework = assembleAnswerFramework({
      question: { id: 'q3', category: 'FINANCIAL', question: 'Who is funding you?' },
      facts: { fundingSource: 'My mother sponsors me.' },
    });
    expect(framework.expandedAnswerDraft).not.toMatch(/\d/);
  });
});
