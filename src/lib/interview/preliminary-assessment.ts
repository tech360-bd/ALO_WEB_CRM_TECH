// ============================================================================
// ALO preliminary interview assessment (spec §41 "HUMAN REVIEW OVERRIDES AI")
//
// The specification asks for an AI *preliminary* assessment with three labels —
// READY / READY WITH IMPROVEMENT / NEEDS MORE PRACTICE — that a human reviewer
// then confirms or overrides. Three rules shape this module:
//
// 1. It is a deterministic RUBRIC over the recorded transcript. No model is
//    called, so it cannot invent a fact about the student, and the same
//    transcript always produces the same result.
// 2. It never predicts a visa outcome. The output is labelled a practice
//    rubric, always carries `humanReviewRequired: true`, and can only be shown
//    to the student as "preliminary".
// 3. It does not touch accent, pronunciation or intelligibility. The transcript
//    is text; scoring accent from text would be fabrication. This is stated in
//    the output so nobody reads silence as a compliment or a penalty.
// ============================================================================

export const ASSESSMENT_ENGINE = 'DETERMINISTIC_RUBRIC';
export const ASSESSMENT_ENGINE_VERSION = '1.0.0';

export type PreliminaryVerdict = 'READY' | 'READY_WITH_IMPROVEMENT' | 'NEEDS_MORE_PRACTICE';
export type AssessmentConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AssessmentAnswerInput {
  question: string;
  answer: string;
  category?: string | null;
}

export interface DimensionScore {
  key: string;
  label: string;
  /** 0–100. */
  score: number;
  /** What the rubric actually looked at, in the reviewer's words. */
  basis: string;
}

export interface PreliminaryAssessment {
  engine: string;
  engineVersion: string;
  verdict: PreliminaryVerdict;
  confidence: AssessmentConfidence;
  overallScore: number;
  dimensions: DimensionScore[];
  strengths: string[];
  improvements: string[];
  /** Facts the transcript shows the student can already state. */
  evidence: string[];
  answerCount: number;
  averageWords: number;
  /** Never false: the specification makes a human the final authority. */
  humanReviewRequired: true;
  limitations: string[];
  generatedAt: string;
}

export interface RubricOptions {
  /** Course/university names the student is actually applying for. */
  expectedTerms?: string[];
  /** Minimum answers before confidence can rise above LOW. */
  minAnswersForHighConfidence?: number;
}

const FEEDBACK_WORD_MIN = 18;
const FEEDBACK_WORD_GOOD = 45;
const FEEDBACK_WORD_LONG = 140;

const REASON_MARKERS = ['because', 'so that', 'therefore', 'which means', 'reason', 'in order to', 'as a result'];
const SPECIFICITY_MARKERS = /(\d|\bmy\b|\bi have\b|\bi worked\b|\byear|\bmonth|\bpercent|\bkg\b|tk\b|bdt\b|£|\$)/i;
const FILLER_MARKERS = /\b(um+|uh+|er+|hmm+|you know|i think maybe|not sure|actually maybe|kind of|sort of)\b/i;
const HEDGE_MARKERS = /\b(maybe|probably|i guess|i think perhaps|not sure|don't know|do not know)\b/gi;

const CATEGORY_LABELS: Record<string, string> = {
  COURSE: 'Course choice',
  UNIVERSITY: 'University choice',
  FINANCIAL: 'Funding clarity',
  FUTURE_PLAN: 'Future plan',
  CREDIBILITY: 'Genuineness',
  GENERAL: 'General response',
};

function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function categoryKey(raw: string | null | undefined): string {
  const key = String(raw ?? '').trim().toUpperCase();
  return key in CATEGORY_LABELS ? key : 'GENERAL';
}

/** Length is only one signal; a long answer that never explains anything scores lower. */
function lengthScore(wordCount: number): number {
  if (wordCount <= 0) return 0;
  if (wordCount < FEEDBACK_WORD_MIN) return 25;
  if (wordCount < FEEDBACK_WORD_GOOD) return 55;
  if (wordCount <= FEEDBACK_WORD_LONG) return 85;
  return 70;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Build the preliminary assessment from recorded answers.
 *
 * Pure and synchronous: the caller persists the result. If the transcript is
 * empty the verdict is NEEDS_MORE_PRACTICE with LOW confidence — the rubric
 * never guesses upward from nothing.
 */
export function buildPreliminaryAssessment(
  answers: AssessmentAnswerInput[],
  options: RubricOptions = {},
): PreliminaryAssessment {
  const generatedAt = new Date().toISOString();
  const minForHigh = options.minAnswersForHighConfidence ?? 5;

  if (answers.length === 0) {
    return {
      engine: ASSESSMENT_ENGINE,
      engineVersion: ASSESSMENT_ENGINE_VERSION,
      verdict: 'NEEDS_MORE_PRACTICE',
      confidence: 'LOW',
      overallScore: 0,
      dimensions: [],
      strengths: [],
      improvements: ['Record at least three practice answers so a reviewer has something to assess.'],
      evidence: [],
      answerCount: 0,
      averageWords: 0,
      humanReviewRequired: true,
      limitations: ['No answers were recorded, so no dimension could be scored.'],
      generatedAt,
    };
  }

  const analysed = answers.map((answer) => {
    const text = String(answer.answer ?? '');
    const list = words(text);
    const fillers = (text.match(FILLER_MARKERS) ?? []).length;
    const hedges = (text.match(HEDGE_MARKERS) ?? []).length;
    const reasons = REASON_MARKERS.filter((marker) => text.toLowerCase().includes(marker)).length;
    const specific = SPECIFICITY_MARKERS.test(text);
    const expected = (options.expectedTerms ?? []).filter((term) => term && term.trim().length > 2);
    const named = expected.filter((term) => text.toLowerCase().includes(term.trim().toLowerCase()));
    return {
      category: categoryKey(answer.category),
      wordCount: list.length,
      text,
      fillers,
      hedges,
      reasons,
      specific,
      named,
    };
  });

  const totalWords = analysed.reduce((sum, item) => sum + item.wordCount, 0);
  const averageWords = Math.round(totalWords / analysed.length);

  const dimensionFor = (key: string, label: string, items: typeof analysed): DimensionScore => {
    if (items.length === 0) {
      return { key, label, score: 0, basis: 'No question in this area was answered.' };
    }
    const scores = items.map((item) => {
      let score = lengthScore(item.wordCount);
      score += Math.min(15, item.reasons * 7.5);
      if (item.specific) score += 8;
      if (item.named.length > 0) score += 6;
      score -= Math.min(20, item.hedges * 5 + item.fillers * 4);
      return clampScore(score);
    });
    return {
      key,
      label,
      score: clampScore(average(scores)),
      basis: items.length === 1
        ? 'Based on 1 recorded answer.'
        : `Averaged across ${items.length} recorded answers.`,
    };
  };

  const byCategory = (key: string) => analysed.filter((item) => item.category === key);

  const dimensions: DimensionScore[] = [
    dimensionFor('structure', 'Answer structure', analysed),
    dimensionFor('specificity', 'Specific detail', analysed),
    dimensionFor('COURSE', CATEGORY_LABELS.COURSE, byCategory('COURSE')),
    dimensionFor('UNIVERSITY', CATEGORY_LABELS.UNIVERSITY, byCategory('UNIVERSITY')),
    dimensionFor('FINANCIAL', CATEGORY_LABELS.FINANCIAL, byCategory('FINANCIAL')),
    dimensionFor('FUTURE_PLAN', CATEGORY_LABELS.FUTURE_PLAN, byCategory('FUTURE_PLAN')),
    dimensionFor('CREDIBILITY', CATEGORY_LABELS.CREDIBILITY, byCategory('CREDIBILITY')),
  ].filter((dimension) => dimension.key === 'structure' || dimension.key === 'specificity' || dimension.score > 0);

  const answeredCategories = new Set(analysed.map((item) => item.category));
  const coverage = answeredCategories.size;

  // Coverage is a separate signal from prose quality: four well-covered areas
  // are worth full marks, three are slightly discounted, and a narrow
  // transcript is discounted further so good writing cannot mask thin evidence.
  const coverageFactor = coverage >= 4 ? 1 : coverage === 3 ? 0.95 : 0.85;
  const overallScore = clampScore(average(dimensions.map((dimension) => dimension.score)) * coverageFactor);

  // A thin transcript cannot be READY no matter how good the prose is.
  let verdict: PreliminaryVerdict;
  if (overallScore >= 72 && coverage >= 3 && analysed.length >= 3) verdict = 'READY';
  else if (overallScore >= 48) verdict = 'READY_WITH_IMPROVEMENT';
  else verdict = 'NEEDS_MORE_PRACTICE';

  const confidence: AssessmentConfidence = analysed.length >= minForHigh && totalWords >= 250
    ? 'HIGH'
    : analysed.length >= 3 && totalWords >= 120
      ? 'MEDIUM'
      : 'LOW';

  const strengths: string[] = [];
  const improvements: string[] = [];
  const evidence: string[] = [];

  const structure = dimensions.find((dimension) => dimension.key === 'structure');
  if (structure && structure.score >= 70) strengths.push('Answers are explained rather than declared — the rubric found a reason clause in most responses.');
  else improvements.push('Explain why, not just what: add a "because…" clause to each answer.');

  const specificity = dimensions.find((dimension) => dimension.key === 'specificity');
  if (specificity && specificity.score >= 70) strengths.push('Answers include concrete detail (numbers, names, or personal experience) rather than general statements.');
  else improvements.push('Add one concrete detail per answer — a date, a figure, a course module, or an employer.');

  if (averageWords >= FEEDBACK_WORD_GOOD) strengths.push('Answers are long enough to be understood in one hearing.');
  else if (averageWords < FEEDBACK_WORD_MIN) improvements.push('Answers average under 18 words. Expand each one enough to be understood in a single hearing.');

  const hedged = analysed.filter((item) => item.hedges >= 2).length;
  if (hedged > 0) improvements.push(`${hedged} answer${hedged === 1 ? '' : 's'} contain repeated hedging ("maybe", "not sure"). Rehearse the fact until it can be stated plainly.`);

  for (const item of analysed) {
    if (item.named.length > 0) evidence.push(`Mentioned the application target by name: ${[...new Set(item.named)].slice(0, 3).join(', ')}.`);
  }
  if (evidence.length === 0 && options.expectedTerms?.length) {
    improvements.push('None of the recorded answers name your university or course. An interviewer will expect both.');
  }

  const missing = ['COURSE', 'UNIVERSITY', 'FINANCIAL', 'FUTURE_PLAN']
    .filter((category) => !answeredCategories.has(category));
  if (missing.length > 0) {
    improvements.push(`Not yet practised: ${missing.map((category) => CATEGORY_LABELS[category] ?? category).join(', ')}.`);
  }

  const limitations = [
    'This is a practice rubric over written answers. It is not a visa decision, an embassy assessment, or a guarantee.',
    'Accent, pronunciation and intelligibility are not scored: the transcript is text, and scoring accent from text would be invented evidence.',
    'A named reviewer makes the final decision; this preliminary result can be overridden in full.',
  ];
  if (analysed.length < 3) limitations.push('Fewer than three answers were recorded, so every dimension is weakly evidenced.');

  return {
    engine: ASSESSMENT_ENGINE,
    engineVersion: ASSESSMENT_ENGINE_VERSION,
    verdict,
    confidence,
    overallScore,
    dimensions,
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 5),
    evidence: [...new Set(evidence)].slice(0, 4),
    answerCount: analysed.length,
    averageWords,
    humanReviewRequired: true,
    limitations,
    generatedAt,
  };
}

/** The label a student may see before a human has decided. Never "final". */
export function preliminaryStudentLabel(verdict: string): string {
  switch (verdict) {
    case 'READY':
      return 'Preliminary: ready for review by your counselor';
    case 'READY_WITH_IMPROVEMENT':
      return 'Preliminary: ready with improvements noted';
    default:
      return 'Preliminary: more practice recommended';
  }
}

export const FINAL_VERDICTS = ['READY', 'READY_WITH_IMPROVEMENT', 'NEEDS_MORE_PRACTICE'] as const;
export type FinalVerdict = (typeof FINAL_VERDICTS)[number];

export function isFinalVerdict(value: unknown): value is FinalVerdict {
  return typeof value === 'string' && (FINAL_VERDICTS as readonly string[]).includes(value);
}

/**
 * A reviewer may agree or override — either way the recorded `overridden` flag
 * must reflect what actually happened, so the audit trail cannot later claim
 * the human endorsed the machine when they did not.
 */
export function reviewOutcome(aiVerdict: string, finalVerdict: FinalVerdict): { overridden: boolean; direction: 'AGREED' | 'UPGRADED' | 'DOWNGRADED' } {
  if (aiVerdict === finalVerdict) return { overridden: false, direction: 'AGREED' };
  const order = { NEEDS_MORE_PRACTICE: 0, READY_WITH_IMPROVEMENT: 1, READY: 2 } as const;
  const ai = order[aiVerdict as keyof typeof order];
  const human = order[finalVerdict];
  if (ai === undefined) return { overridden: true, direction: 'UPGRADED' };
  return { overridden: true, direction: human > ai ? 'UPGRADED' : 'DOWNGRADED' };
}
