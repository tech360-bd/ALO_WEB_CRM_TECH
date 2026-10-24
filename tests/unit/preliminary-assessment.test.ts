import { describe, expect, it } from 'vitest';
import {
  buildPreliminaryAssessment,
  preliminaryStudentLabel,
  reviewOutcome,
  isFinalVerdict,
} from '@/lib/interview/preliminary-assessment';

const strongAnswers = [
  {
    category: 'UNIVERSITY',
    question: 'Why did you choose this university?',
    answer: 'I chose the University of Greenwich because its computing school has a dedicated cyber security lab. I compared three offers and this one offered a placement year, which means I can work in industry before graduating.',
  },
  {
    category: 'COURSE',
    question: 'Why this course?',
    answer: 'I chose MSc Computer Science because my current job in Dhaka is limited by not having a formal qualification. The course covers distributed systems, which I use every day at work, and the modules match the role I want.',
  },
  {
    category: 'FINANCIAL',
    question: 'How will you pay?',
    answer: 'My father sponsors me. He has 4,200,000 BDT in a savings account, and I have a bank statement covering the first year of tuition plus 12 months of living costs.',
  },
  {
    category: 'FUTURE_PLAN',
    question: 'What will you do afterwards?',
    answer: 'I will return to Bangladesh because my employer has offered a senior engineer role in 2028, so the degree is part of a plan I have already agreed with them.',
  },
];

describe('buildPreliminaryAssessment', () => {
  it('never guesses upward from an empty transcript', () => {
    const result = buildPreliminaryAssessment([]);
    expect(result.verdict).toBe('NEEDS_MORE_PRACTICE');
    expect(result.confidence).toBe('LOW');
    expect(result.overallScore).toBe(0);
    expect(result.humanReviewRequired).toBe(true);
    expect(result.improvements[0]).toMatch(/at least three/i);
  });

  it('returns READY for a specific, explained transcript that covers enough ground', () => {
    const result = buildPreliminaryAssessment(strongAnswers, { expectedTerms: ['Greenwich', 'Computer Science'] });
    expect(result.verdict).toBe('READY');
    expect(result.overallScore).toBeGreaterThanOrEqual(72);
    expect(result.evidence.some((line) => /Greenwich|Computer Science/.test(line))).toBe(true);
  });

  it('flags thin answers as needing more practice', () => {
    const result = buildPreliminaryAssessment([
      { category: 'COURSE', question: 'Why this course?', answer: 'It is good.' },
      { category: 'UNIVERSITY', question: 'Why this university?', answer: 'Nice place maybe.' },
    ]);
    expect(result.verdict).not.toBe('READY');
    expect(result.improvements.some((line) => /18 words/i.test(line))).toBe(true);
  });

  it('cannot reach READY on a narrow transcript even if the prose is strong', () => {
    const result = buildPreliminaryAssessment([strongAnswers[0]]);
    expect(result.verdict).not.toBe('READY');
    expect(result.improvements.join(' ')).toMatch(/Not yet practised/i);
  });

  it('never scores accent or pronunciation', () => {
    const result = buildPreliminaryAssessment(strongAnswers);
    const all = result.limitations.join(' ');
    expect(all).toMatch(/Accent, pronunciation and intelligibility are not scored/);
    expect(result.dimensions.map((dimension) => dimension.key)).not.toContain('accent');
  });

  it('always states that a human decides', () => {
    const result = buildPreliminaryAssessment(strongAnswers);
    expect(result.humanReviewRequired).toBe(true);
    expect(result.limitations.join(' ')).toMatch(/not a visa decision/i);
    expect(result.limitations.join(' ')).toMatch(/overrid/i);
  });

  it('penalises repeated hedging', () => {
    const hedged = buildPreliminaryAssessment([{
      category: 'CREDIBILITY',
      question: 'Is this genuine?',
      answer: 'Maybe I think it is probably because I guess maybe I am not sure but maybe it is probably fine and I think maybe it will be okay because I guess so.',
    }]);
    expect(hedged.improvements.join(' ')).toMatch(/hedging/i);
    expect(hedged.overallScore).toBeLessThan(90);
  });

  it('names the application target when the transcript misses it entirely', () => {
    const result = buildPreliminaryAssessment([
      { category: 'COURSE', question: 'Why this course?', answer: 'Because I want to improve my career and earn a better salary in the future for my family.' },
    ], { expectedTerms: ['Greenwich', 'Computer Science'] });
    expect(result.improvements.join(' ')).toMatch(/name your university or course/i);
  });

  it('reports unknown categories as general rather than failing', () => {
    const result = buildPreliminaryAssessment([{ category: 'NOT_A_REAL_CATEGORY', question: 'Q', answer: 'A short but reasonable answer that explains because it matters to me personally.' }]);
    expect(result.answerCount).toBe(1);
    expect(result.dimensions.map((dimension) => dimension.key)).not.toContain('NOT_A_REAL_CATEGORY');
  });

  it('is deterministic for the same input apart from the timestamp', () => {
    const a = buildPreliminaryAssessment(strongAnswers);
    const b = buildPreliminaryAssessment(strongAnswers);
    expect(a.overallScore).toBe(b.overallScore);
    expect(a.dimensions).toEqual(b.dimensions);
    expect(a.verdict).toBe(b.verdict);
  });
});

describe('student-facing labels', () => {
  it('always says preliminary', () => {
    for (const verdict of ['READY', 'READY_WITH_IMPROVEMENT', 'NEEDS_MORE_PRACTICE']) {
      expect(preliminaryStudentLabel(verdict)).toMatch(/^Preliminary/);
    }
  });
});

describe('reviewOutcome', () => {
  it('records agreement without claiming an override', () => {
    expect(reviewOutcome('READY', 'READY')).toEqual({ overridden: false, direction: 'AGREED' });
  });

  it('records an upgrade and a downgrade', () => {
    expect(reviewOutcome('READY_WITH_IMPROVEMENT', 'READY')).toEqual({ overridden: true, direction: 'UPGRADED' });
    expect(reviewOutcome('READY', 'NEEDS_MORE_PRACTICE')).toEqual({ overridden: true, direction: 'DOWNGRADED' });
  });

  it('treats an unrecognised AI verdict as overridden rather than silently agreeing', () => {
    expect(reviewOutcome('human_review_required', 'READY').overridden).toBe(true);
  });
});

describe('isFinalVerdict', () => {
  it('accepts only the three allowed verdicts', () => {
    expect(isFinalVerdict('READY')).toBe(true);
    expect(isFinalVerdict('ready')).toBe(false);
    expect(isFinalVerdict('READY_FOR_VISA')).toBe(false);
    expect(isFinalVerdict(null)).toBe(false);
  });
});
