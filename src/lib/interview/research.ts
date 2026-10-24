// ============================================================================
// ALO Interview Research Engine — provenance, freshness and grounded answers.
//
// Spec: INTERVIEW RESEARCH ENGINE (§31), INTERVIEW QUESTION GENERATOR (§32),
// PERSONALIZED ANSWER ENGINE (§33), KNOWLEDGE PROVENANCE (§53), KNOWLEDGE
// EXPIRY (§54), AI CONFIDENCE (§95), NO HALLUCINATION POLICY (§96).
//
// This module is pure: no database, no network, no clock of its own. Every
// function takes `now` explicitly so packs stay reproducible and testable.
//
// Two hard rules are enforced here rather than in a prompt:
//   1. A question is only publishable when it carries a real source and a
//      verification date inside the rolling research window. Anything else is
//      surfaced as UNVERIFIED/STALE/EXPIRED instead of being presented as
//      current.
//   2. An answer framework may only reuse facts the student actually supplied.
//      When a required fact is missing the engine returns `ready: false` and
//      lists the gap — it never fills the gap with invented content.
// ============================================================================

import {
  INTERVIEW_RESEARCH_WINDOW_MONTHS,
  INTERVIEW_DISCLAIMERS,
  validateInterviewGuidance,
} from './honesty';

export type InterviewConfidence = 'HIGH' | 'MEDIUM' | 'LOW';
export type InterviewFreshness = 'FRESH' | 'STALE' | 'EXPIRED' | 'UNVERIFIED';

/** Source classes accepted as evidence. Order = preference for ranking. */
export const RESEARCH_SOURCE_TYPES = [
  'OFFICIAL_UNIVERSITY',
  'OFFICIAL_GOVERNMENT',
  'OFFICIAL_IMMIGRATION',
  'ALO_VERIFIED_REPORT',
  'COUNSELOR_APPROVED',
  'PUBLIC_RELIABLE',
] as const;

export type ResearchSourceType = (typeof RESEARCH_SOURCE_TYPES)[number];

const SOURCE_TYPE_LABELS: Record<ResearchSourceType, string> = {
  OFFICIAL_UNIVERSITY: 'Official university source',
  OFFICIAL_GOVERNMENT: 'Official government source',
  OFFICIAL_IMMIGRATION: 'Official immigration guidance',
  ALO_VERIFIED_REPORT: 'ALO verified interview report',
  COUNSELOR_APPROVED: 'Counselor-approved record',
  PUBLIC_RELIABLE: 'Reliable public source',
};

export interface ResearchQuestionInput {
  id: string;
  category: string;
  question: string;
  universitySlug?: string | null;
  courseSlug?: string | null;
  countrySlug?: string | null;
  theme?: string | null;
  source?: string | null;
  sourceType?: string | null;
  sourceUrl?: string | null;
  lastVerifiedAt?: Date | string | null;
  confidence?: string | null;
  frequency?: number | null;
  guidance?: string | null;
  isActive?: boolean | null;
  sortOrder?: number | null;
}

export interface PreparedQuestion {
  id: string;
  category: string;
  question: string;
  theme: string | null;
  universitySlug: string | null;
  courseSlug: string | null;
  countrySlug: string | null;
  guidance: string | null;
  source: string;
  sourceType: ResearchSourceType | null;
  sourceLabel: string | null;
  sourceUrl: string | null;
  lastVerifiedAt: string | null;
  daysSinceVerified: number | null;
  confidence: InterviewConfidence;
  freshness: InterviewFreshness;
  frequency: number;
}

export interface ExcludedQuestion {
  id: string;
  question: string;
  reason: 'INACTIVE' | 'POLICY_VIOLATION' | 'EXPIRED' | 'OUT_OF_SCOPE';
  detail?: string;
}

export interface QuestionPack {
  generatedAt: string;
  researchWindowMonths: number;
  questions: PreparedQuestion[];
  groups: Array<{ category: string; questions: PreparedQuestion[] }>;
  excluded: ExcludedQuestion[];
  counts: {
    total: number;
    publishable: number;
    fresh: number;
    stale: number;
    expired: number;
    unverified: number;
  };
  disclaimers: string[];
}

const DAY_MS = 86_400_000;

/** A verification older than this is treated as expired, not merely stale. */
export const INTERVIEW_QUESTION_EXPIRY_MONTHS = INTERVIEW_RESEARCH_WINDOW_MONTHS * 2;

export function monthsAgo(now: Date, months: number): Date {
  const result = new Date(now.getTime());
  result.setUTCMonth(result.getUTCMonth() - months);
  return result;
}

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function normalizeConfidence(value: string | null | undefined): InterviewConfidence | null {
  const normalized = String(value ?? '').trim().toUpperCase();
  return normalized === 'HIGH' || normalized === 'MEDIUM' || normalized === 'LOW' ? normalized : null;
}

export function normalizeSourceType(value: string | null | undefined): ResearchSourceType | null {
  const normalized = String(value ?? '').trim().toUpperCase();
  return (RESEARCH_SOURCE_TYPES as readonly string[]).includes(normalized)
    ? (normalized as ResearchSourceType)
    : null;
}

/**
 * Freshness of a single question.
 *
 * UNVERIFIED  no source, no verification date, or guidance that trips the
 *             honesty policy — never presented as current.
 * EXPIRED     verified more than the expiry window ago.
 * STALE       verified outside the rolling 6-month research window.
 * FRESH       verified inside the research window.
 */
export function classifyFreshness(question: ResearchQuestionInput, now: Date): InterviewFreshness {
  const source = String(question.source ?? '').trim();
  const verifiedAt = toDate(question.lastVerifiedAt);
  if (!source || !verifiedAt) return 'UNVERIFIED';
  if (question.guidance && !validateInterviewGuidance(question.guidance).ok) return 'UNVERIFIED';
  if (verifiedAt > now) return 'UNVERIFIED';
  if (verifiedAt < monthsAgo(now, INTERVIEW_QUESTION_EXPIRY_MONTHS)) return 'EXPIRED';
  if (verifiedAt < monthsAgo(now, INTERVIEW_RESEARCH_WINDOW_MONTHS)) return 'STALE';
  return 'FRESH';
}

function matchesScope(
  question: ResearchQuestionInput,
  scope: { universitySlug?: string | null; countrySlug?: string | null; courseSlug?: string | null },
): boolean {
  // A question with no location/course binding is generic guidance and always
  // applies. A bound question only applies to its own binding.
  if (question.universitySlug && scope.universitySlug && question.universitySlug !== scope.universitySlug) return false;
  if (question.courseSlug && scope.courseSlug && question.courseSlug !== scope.courseSlug) return false;
  if (question.countrySlug && scope.countrySlug && question.countrySlug !== scope.countrySlug) return false;
  return true;
}

/**
 * Build a publishable question pack.
 *
 * `includeStale` is deliberately opt-in: stale evidence may be shown to staff
 * for context, but the default pack only publishes FRESH questions with a real
 * source. Expired and unverified questions are reported in `excluded`, never
 * silently dropped, so the caller can see what was withheld and why.
 */
export function buildQuestionPack(input: {
  questions: ResearchQuestionInput[];
  now: Date;
  universitySlug?: string | null;
  countrySlug?: string | null;
  courseSlug?: string | null;
  includeStale?: boolean;
}): QuestionPack {
  const { questions, now } = input;
  const includeStale = input.includeStale === true;
  const prepared: PreparedQuestion[] = [];
  const excluded: ExcludedQuestion[] = [];

  for (const question of questions) {
    if (question.isActive === false) {
      excluded.push({ id: question.id, question: question.question, reason: 'INACTIVE' });
      continue;
    }
    if (!matchesScope(question, input)) {
      excluded.push({ id: question.id, question: question.question, reason: 'OUT_OF_SCOPE' });
      continue;
    }
    if (question.guidance) {
      const policy = validateInterviewGuidance(question.guidance);
      if (!policy.ok) {
        excluded.push({
          id: question.id,
          question: question.question,
          reason: 'POLICY_VIOLATION',
          detail: policy.violations.join(', '),
        });
        continue;
      }
    }

    const freshness = classifyFreshness(question, now);
    if (freshness === 'EXPIRED') {
      excluded.push({ id: question.id, question: question.question, reason: 'EXPIRED' });
      continue;
    }
    if (freshness !== 'FRESH' && !includeStale) {
      excluded.push({ id: question.id, question: question.question, reason: 'OUT_OF_SCOPE', detail: freshness });
      continue;
    }

    const verifiedAt = toDate(question.lastVerifiedAt);
    const sourceType = normalizeSourceType(question.sourceType);
    prepared.push({
      id: question.id,
      category: question.category,
      question: question.question,
      theme: question.theme ?? null,
      universitySlug: question.universitySlug ?? null,
      courseSlug: question.courseSlug ?? null,
      countrySlug: question.countrySlug ?? null,
      guidance: question.guidance ?? null,
      source: String(question.source ?? '').trim(),
      sourceType,
      sourceLabel: sourceType ? SOURCE_TYPE_LABELS[sourceType] : null,
      sourceUrl: question.sourceUrl ?? null,
      lastVerifiedAt: verifiedAt ? verifiedAt.toISOString() : null,
      daysSinceVerified: verifiedAt ? Math.max(0, Math.floor((now.getTime() - verifiedAt.getTime()) / DAY_MS)) : null,
      confidence: normalizeConfidence(question.confidence) ?? 'LOW',
      freshness,
      frequency: Number.isFinite(question.frequency) ? Number(question.frequency) : 0,
    });
  }

  prepared.sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (b.frequency !== a.frequency) return b.frequency - a.frequency;
    return a.question.localeCompare(b.question);
  });

  const groups: Array<{ category: string; questions: PreparedQuestion[] }> = [];
  for (const question of prepared) {
    const group = groups.find((entry) => entry.category === question.category);
    if (group) group.questions.push(question);
    else groups.push({ category: question.category, questions: [question] });
  }

  const count = (freshness: InterviewFreshness) => prepared.filter((q) => q.freshness === freshness).length;

  return {
    generatedAt: now.toISOString(),
    researchWindowMonths: INTERVIEW_RESEARCH_WINDOW_MONTHS,
    questions: prepared,
    groups,
    excluded,
    counts: {
      total: questions.length,
      publishable: prepared.length,
      fresh: count('FRESH'),
      stale: count('STALE'),
      expired: excluded.filter((entry) => entry.reason === 'EXPIRED').length,
      unverified: prepared.filter((q) => q.freshness === 'UNVERIFIED').length,
    },
    disclaimers: [...INTERVIEW_DISCLAIMERS],
  };
}

// ----------------------------------------------------------------------------
// Personalized answer framework (spec §33)
// ----------------------------------------------------------------------------

export const ANSWER_FACT_KEYS = {
  REASON_UNIVERSITY: 'reasonUniversity',
  REASON_COURSE: 'reasonCourse',
  FUNDING_SOURCE: 'fundingSource',
  FUTURE_PLAN: 'futurePlan',
} as const;

export type AnswerFactKey = (typeof ANSWER_FACT_KEYS)[keyof typeof ANSWER_FACT_KEYS];

/**
 * Facts a question category needs before a grounded answer can exist. Unknown
 * categories require nothing extra — the framework still refuses to invent, it
 * simply has fewer anchors.
 */
const REQUIRED_FACTS_BY_CATEGORY: Record<string, AnswerFactKey[]> = {
  UNIVERSITY: [ANSWER_FACT_KEYS.REASON_UNIVERSITY],
  COURSE: [ANSWER_FACT_KEYS.REASON_COURSE],
  FINANCIAL: [ANSWER_FACT_KEYS.FUNDING_SOURCE],
  FUTURE_PLAN: [ANSWER_FACT_KEYS.FUTURE_PLAN],
  CREDIBILITY: [ANSWER_FACT_KEYS.REASON_UNIVERSITY, ANSWER_FACT_KEYS.REASON_COURSE, ANSWER_FACT_KEYS.FUTURE_PLAN],
};

const FACT_LABELS: Record<AnswerFactKey, string> = {
  reasonUniversity: 'Why this university',
  reasonCourse: 'Why this course',
  fundingSource: 'Who funds your studies',
  futurePlan: 'What you plan to do after graduation',
};

export interface AnswerFramework {
  questionId: string;
  ready: boolean;
  missingFacts: AnswerFactKey[];
  /** Verbatim student facts used — no generated content is added here. */
  anchors: Array<{ key: AnswerFactKey; label: string; value: string }>;
  structure: string[];
  shortAnswerDraft: string | null;
  expandedAnswerDraft: string | null;
  followUps: string[];
  avoid: string[];
  note: string;
}

/**
 * Assemble an answer framework strictly from supplied facts.
 *
 * Nothing is invented: when a required fact is blank the framework is returned
 * with `ready:false`, the missing keys, and no drafts. The drafts are literal
 * concatenations of the student's own words so a counselor can see exactly
 * what evidence the answer rests on.
 */
export function assembleAnswerFramework(input: {
  question: { id: string; category: string; question: string };
  facts: Partial<Record<AnswerFactKey, string | null | undefined>>;
}): AnswerFramework {
  const category = String(input.question.category ?? '').toUpperCase();
  const required = REQUIRED_FACTS_BY_CATEGORY[category] ?? [];
  const cleaned = new Map<AnswerFactKey, string>();
  for (const [key, value] of Object.entries(input.facts)) {
    const text = String(value ?? '').trim();
    if (text) cleaned.set(key as AnswerFactKey, text);
  }

  const missingFacts = required.filter((key) => !cleaned.get(key));
  const anchors = [...cleaned.entries()]
    .filter(([key]) => (Object.values(ANSWER_FACT_KEYS) as string[]).includes(key))
    .map(([key, value]) => ({ key, label: FACT_LABELS[key], value }));

  const note =
    'Built only from facts supplied by the student. No employment, income, family, travel, result or motivation is generated by AI.';

  if (missingFacts.length > 0) {
    return {
      questionId: input.question.id,
      ready: false,
      missingFacts,
      anchors,
      structure: [],
      shortAnswerDraft: null,
      expandedAnswerDraft: null,
      followUps: [],
      avoid: [],
      note,
    };
  }

  const reasonUniversity = cleaned.get(ANSWER_FACT_KEYS.REASON_UNIVERSITY);
  const reasonCourse = cleaned.get(ANSWER_FACT_KEYS.REASON_COURSE);
  const funding = cleaned.get(ANSWER_FACT_KEYS.FUNDING_SOURCE);
  const future = cleaned.get(ANSWER_FACT_KEYS.FUTURE_PLAN);

  // Lead with the fact that actually answers the question category, so a
  // "why this course" answer does not open with the university reason.
  const lead = category === 'COURSE' ? reasonCourse ?? reasonUniversity : reasonUniversity ?? reasonCourse;
  const shortParts = [lead].filter(Boolean) as string[];
  const expandedParts = [reasonUniversity, reasonCourse, funding, future].filter(Boolean) as string[];

  return {
    questionId: input.question.id,
    ready: true,
    missingFacts: [],
    anchors,
    structure: [
      'Direct answer in one sentence, using your own fact.',
      'One concrete detail from your documents (module, campus, budget line).',
      'Link to your future plan in one sentence.',
      'Stop. Do not add facts that are not on your documents.',
    ],
    shortAnswerDraft: shortParts.length > 0 ? shortParts.join(' ') : null,
    expandedAnswerDraft: expandedParts.length > 0 ? expandedParts.join(' ') : null,
    followUps: [
      'Which module or campus facility convinced you?',
      'How does this programme connect to the role you want?',
    ],
    avoid: [
      'Do not state numbers you cannot evidence.',
      'Do not describe a sponsor or income that is not documented.',
      'Do not claim work experience you cannot prove.',
    ],
    note,
  };
}
