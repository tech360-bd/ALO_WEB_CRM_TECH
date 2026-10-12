/**
 * ALO Education — rule-based course eligibility engine (canonical).
 *
 * Pure functions only: no database, network, AI or clock access (the caller
 * passes `now`), so every rule is deterministic and unit-testable.
 *
 * Integrity rules enforced here:
 *  - A university requirement is only compared when it exists in the verified
 *    course record passed in. Nothing is defaulted or guessed: a missing
 *    requirement produces a "not recorded" row, never an invented threshold.
 *  - Different grading systems (GPA vs percentage vs UK classification) are
 *    never silently converted; the row is sent to counsellor review instead.
 *  - No exchange rates are applied. Budget is compared only when the student
 *    budget and the verified fee use the same currency, and budget is a
 *    preference — it never makes a student "not eligible".
 *  - The result never depends on a single score: the category is derived from
 *    the full set of requirement rows.
 *  - Every non-eligible result carries a reason and at least one next step.
 */

export const ELIGIBILITY_CATEGORIES = [
  'ELIGIBLE',
  'LIKELY_ELIGIBLE',
  'CONDITIONALLY_ELIGIBLE',
  'PARTIALLY_MATCHED',
  'NOT_CURRENTLY_ELIGIBLE',
  'INSUFFICIENT_INFO',
  'COUNSELLOR_REVIEW_REQUIRED',
] as const;
export type EligibilityCategory = (typeof ELIGIBILITY_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<EligibilityCategory, string> = {
  ELIGIBLE: 'Eligible',
  LIKELY_ELIGIBLE: 'Likely eligible',
  CONDITIONALLY_ELIGIBLE: 'Conditionally eligible',
  PARTIALLY_MATCHED: 'Partially matched',
  NOT_CURRENTLY_ELIGIBLE: 'Not currently eligible',
  INSUFFICIENT_INFO: 'Insufficient information',
  COUNSELLOR_REVIEW_REQUIRED: 'Counsellor review required',
};

/** Mandatory public disclaimers shown with every eligibility result. */
export const ELIGIBILITY_DISCLAIMERS = [
  'This is an indicative, rule-based check against the course information ALO Education has verified. It is not an offer of admission and does not guarantee admission, a scholarship or a visa.',
  'Universities make the final decision and may consider your full academic history, personal statement, references, interview and document checks. Requirements, fees and intakes can change; always check the last verified date and the official university page.',
  'An ALO Education counsellor can review your documents and confirm your options before you apply.',
] as const;

export type RowResult = 'MET' | 'NOT_MET' | 'MISSING_INFO' | 'CONDITION';
export type RowKind = 'mandatory' | 'condition' | 'preference';

export interface RequirementRow {
  /** Stable key for programmatic use. */
  key: string;
  name: string;
  universityRequirement: string | null;
  studentValue: string | null;
  result: RowResult;
  kind: RowKind;
  /** 'university' = from the verified course record; 'alo_rule' = generic ALO progression rule. */
  sourceType: 'university' | 'alo_rule';
  source: string | null;
  lastVerifiedAt: string | null;
  action: string | null;
  /** Internal flags used for categorisation. */
  missingSide?: 'student' | 'university';
  needsCounsellor?: boolean;
  smallGap?: boolean;
}

export interface ImprovementItem {
  currentGap: string;
  requiredAction: string;
  estimatedTimeline: string;
  recommendedAlternative: string | null;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface StudentQualificationInput {
  qualificationType?: string | null;
  gpa?: number | null;
  gpaScale?: number | null;
  percentage?: number | null;
  classification?: string | null;
  completionYear?: number | null;
  backlogs?: number | null;
  mediumOfInstruction?: string | null;
}

export interface StudentEnglishTestInput {
  testType?: string | null;
  overallScore?: number | null;
  listening?: number | null;
  reading?: number | null;
  writing?: number | null;
  speaking?: number | null;
  testDate?: string | null;
  expiryDate?: string | null;
}

export interface StudentProfile {
  qualifications: StudentQualificationInput[];
  englishTests: StudentEnglishTestInput[];
  workExperienceMonths?: number | null;
  studyGapYears?: number | null;
  budget?: { amount: number; currency: string } | null;
}

export interface CourseRequirementRecord {
  academicReq?: string | null;
  minScore?: string | null;
  gradingSystem?: string | null;
  ieltsOverall?: number | null;
  ieltsMinBand?: number | null;
  pteOverall?: number | null;
  pteMinBand?: number | null;
  toeflOverall?: number | null;
  detOverall?: number | null;
  moiAccepted?: boolean | null;
  ownEnglishTest?: boolean | null;
  workExperience?: string | null;
  portfolioRequired?: boolean | null;
  interviewRequired?: boolean | null;
  officialRequirementUrl?: string | null;
  lastCheckedAt?: string | null;
}

export interface CourseFeeRecord {
  yearlyTuition?: number | null;
  currency?: string | null;
  sourceUrl?: string | null;
  lastCheckedAt?: string | null;
}

export interface CourseRuleInput {
  courseId: string;
  title: string;
  slug?: string | null;
  universityName?: string | null;
  country?: string | null;
  studyLevel?: string | null;
  programLevel?: string | null;
  internationalEligibility?: string | null;
  sourceUrl?: string | null;
  lastVerifiedAt?: string | null;
  /** Verified requirement record, or null when none has been verified. */
  requirement?: CourseRequirementRecord | null;
  /** Verified fee record, or null. */
  fee?: CourseFeeRecord | null;
}

export interface EligibilityEvaluation {
  courseId: string;
  category: EligibilityCategory;
  categoryLabel: string;
  /** Share of evaluated mandatory requirements that are met. Not an admission probability. */
  requirementsMetPercent: number;
  reason: string;
  requirements: RequirementRow[];
  improvementPlan: ImprovementItem[];
  nextSteps: string[];
  normalizedLevel: CourseLevel;
}

// ---------------------------------------------------------------------------
// International status
// ---------------------------------------------------------------------------

export type InternationalStatus =
  | 'INTERNATIONAL_OPEN'
  | 'INTERNATIONAL_CLOSED'
  | 'DOMESTIC_ONLY'
  | 'NOT_VERIFIED';

const OPEN_VALUES = new Set([
  'international_open', 'open', 'eligible', 'eligible for international students',
  'eligible_for_international_students', 'international students eligible',
  'international_students_eligible', 'international eligible', 'international_eligible',
  'yes', 'true',
]);
const CLOSED_VALUES = new Set(['international_closed', 'closed', 'no', 'false', 'not_open', 'suspended']);
const DOMESTIC_VALUES = new Set(['domestic_only', 'domestic', 'home_only', 'uk_only', 'home students only']);

export function normalizeInternationalStatus(value: string | null | undefined): InternationalStatus {
  const v = (value ?? '').trim().toLowerCase();
  if (OPEN_VALUES.has(v)) return 'INTERNATIONAL_OPEN';
  if (CLOSED_VALUES.has(v)) return 'INTERNATIONAL_CLOSED';
  if (DOMESTIC_VALUES.has(v)) return 'DOMESTIC_ONLY';
  return 'NOT_VERIFIED';
}

/** Raw stored values that must never be shown publicly. */
export const NON_PUBLIC_INTERNATIONAL_VALUES = [
  ...CLOSED_VALUES,
  ...DOMESTIC_VALUES,
  ...[...CLOSED_VALUES, ...DOMESTIC_VALUES].map((v) => v.toUpperCase()),
];

// ---------------------------------------------------------------------------
// Levels
// ---------------------------------------------------------------------------

export type CourseLevel =
  | 'FOUNDATION'
  | 'INTERNATIONAL_YEAR_ONE'
  | 'DIPLOMA'
  | 'UNDERGRADUATE'
  | 'YEAR_2_ENTRY'
  | 'YEAR_3_ENTRY'
  | 'TOP_UP'
  | 'PRE_MASTERS'
  | 'POSTGRADUATE_TAUGHT'
  | 'MRES'
  | 'MPHIL'
  | 'PHD'
  | 'PROFESSIONAL_DOCTORATE'
  | 'UNKNOWN';

export function normalizeCourseLevel(...values: Array<string | null | undefined>): CourseLevel {
  const text = values.filter(Boolean).join(' ').toLowerCase();
  if (!text.trim()) return 'UNKNOWN';
  if (/pre[- ]?master/.test(text)) return 'PRE_MASTERS';
  if (/international year one|\biy1\b/.test(text)) return 'INTERNATIONAL_YEAR_ONE';
  if (/foundation/.test(text)) return 'FOUNDATION';
  if (/top[- ]?up/.test(text)) return 'TOP_UP';
  if (/year ?3 entry|third[- ]year entry/.test(text)) return 'YEAR_3_ENTRY';
  if (/year ?2 entry|second[- ]year entry/.test(text)) return 'YEAR_2_ENTRY';
  if (/\b(dba|edd|dprof|professional doctorate|dclinpsy|engd)\b/.test(text)) return 'PROFESSIONAL_DOCTORATE';
  if (/\b(phd|dphil|doctorate|doctoral)\b/.test(text)) return 'PHD';
  if (/\bmphil\b/.test(text)) return 'MPHIL';
  if (/\bmres\b|master of research/.test(text)) return 'MRES';
  if (/postgraduate|\bmasters?\b|\bmsc\b|\bma\b|\bmba\b|\bllm\b|\bmeng\b|pg ?cert|pg ?dip|postgraduate taught/.test(text)) return 'POSTGRADUATE_TAUGHT';
  if (/undergraduate|bachelor|\bbsc\b|\bba\b|\bbeng\b|\bllb\b|\bbba\b/.test(text)) return 'UNDERGRADUATE';
  if (/diploma|certificate|\bhnd\b|\bhnc\b/.test(text)) return 'DIPLOMA';
  return 'UNKNOWN';
}

const RESEARCH_LEVELS: CourseLevel[] = ['MPHIL', 'PHD', 'PROFESSIONAL_DOCTORATE'];

/**
 * Generic progression ladder (ALO rule, not a university-specific requirement):
 * 1 secondary (SSC/O-level), 2 upper secondary (HSC/A-level/IB),
 * 3 diploma/HND/associate/foundation/partial bachelor's, 4 bachelor's,
 * 5 master's/MPhil, 6 doctorate.
 */
export function qualificationLevel(type: string | null | undefined): number | null {
  const t = (type ?? '').trim().toLowerCase();
  if (!t) return null;
  if (/ph\.?d|doctor|dphil/.test(t)) return 6;
  if (/master|mphil|\bmsc\b|\bma\b|\bmba\b|\bllm\b/.test(t)) return 5;
  if (/incomplete|partial|first year|year one completed/.test(t)) return 3;
  if (/bachelor|\bbsc\b|\bba\b|\bbeng\b|\bllb\b|\bbba\b|\bmbbs\b|honours|top-up|top up/.test(t)) return 4;
  if (/diploma|\bhnd\b|\bhnc\b|associate|foundation|level 5|level 4/.test(t)) return 3;
  if (/\bhsc\b|a-?levels?|\bib\b|international baccalaureate|12th|intermediate|higher secondary|alim/.test(t)) return 2;
  if (/\bssc\b|o-?levels?|10th|secondary|dakhil|gcse/.test(t)) return 1;
  return null;
}

/** Minimum ladder level per course level; `conditional` = may be possible after review. */
const LEVEL_ENTRY: Record<CourseLevel, { min: number; conditional?: number; label: string }> = {
  FOUNDATION: { min: 2, conditional: 1, label: 'Upper secondary (e.g. HSC / A-levels)' },
  INTERNATIONAL_YEAR_ONE: { min: 2, label: 'Upper secondary (e.g. HSC / A-levels)' },
  DIPLOMA: { min: 2, conditional: 1, label: 'Upper secondary (e.g. HSC / A-levels)' },
  UNDERGRADUATE: { min: 2, label: 'Upper secondary (e.g. HSC / A-levels)' },
  YEAR_2_ENTRY: { min: 3, label: 'Completed first year of a degree, diploma or HND' },
  YEAR_3_ENTRY: { min: 3, label: 'Completed diploma / HND / two years of a degree' },
  TOP_UP: { min: 3, label: 'Completed HND / diploma / foundation degree' },
  PRE_MASTERS: { min: 4, conditional: 3, label: "Bachelor's degree (or equivalent)" },
  POSTGRADUATE_TAUGHT: { min: 4, label: "Bachelor's degree" },
  MRES: { min: 4, label: "Bachelor's degree" },
  MPHIL: { min: 4, label: "Bachelor's degree (often a master's)" },
  PHD: { min: 5, conditional: 4, label: "Master's degree (some accept a strong bachelor's)" },
  PROFESSIONAL_DOCTORATE: { min: 5, conditional: 4, label: "Master's degree plus professional experience" },
  UNKNOWN: { min: 0, label: 'Not classified' },
};

// ---------------------------------------------------------------------------
// Academic score parsing
// ---------------------------------------------------------------------------

export type ScoreBasis = 'GPA' | 'PERCENT' | 'UK_CLASS';
export interface ParsedScore { basis: ScoreBasis; value: number; scale?: number; label: string }

const UK_CLASS_LABEL: Record<number, string> = { 4: 'First-class honours', 3: 'Upper second (2:1)', 2: 'Lower second (2:2)', 1: 'Third-class honours' };

function parseUkClass(text: string): number | null {
  const t = text.toLowerCase();
  if (/\b2[:.]1\b|upper second(?!ary)/.test(t)) return 3;
  if (/\b2[:.]2\b|lower second(?!ary)/.test(t)) return 2;
  if (/\bfirst\b|1st class/.test(t)) return 4;
  if (/\bthird\b/.test(t)) return 1;
  return null;
}

/** Parses a university minimum score string. Returns null if it cannot be read safely. */
export function parseRequirementScore(minScore: string | null | undefined, academicReq?: string | null): ParsedScore | null {
  const raw = `${minScore ?? ''}`.trim();
  const both = `${raw} ${academicReq ?? ''}`;
  const gpa = raw.match(/(\d+(?:\.\d+)?)\s*(?:\/|out of)\s*(\d+(?:\.\d+)?)/i);
  if (gpa) {
    const value = Number(gpa[1]);
    const scale = Number(gpa[2]);
    if (scale === 100) return { basis: 'PERCENT', value, label: `${value}%` };
    if (scale > 0 && value <= scale) return { basis: 'GPA', value, scale, label: `${value}/${scale}` };
  }
  const pct = raw.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/i);
  if (pct) return { basis: 'PERCENT', value: Number(pct[1]), label: `${Number(pct[1])}%` };
  const cls = parseUkClass(raw) ?? (raw ? null : parseUkClass(academicReq ?? ''));
  if (cls !== null) return { basis: 'UK_CLASS', value: cls, label: UK_CLASS_LABEL[cls] ?? both.trim() };
  return null;
}

/** Student result on every basis the student actually supplied (no conversion between bases). */
export function studentScores(q: StudentQualificationInput): ParsedScore[] {
  const out: ParsedScore[] = [];
  if (q.gpa != null && q.gpa > 0 && q.gpaScale != null && q.gpaScale > 0 && q.gpa <= q.gpaScale) {
    out.push({ basis: 'GPA', value: q.gpa, scale: q.gpaScale, label: `${q.gpa}/${q.gpaScale}` });
  }
  if (q.percentage != null && q.percentage > 0 && q.percentage <= 100) {
    out.push({ basis: 'PERCENT', value: q.percentage, label: `${q.percentage}%` });
  }
  if (q.classification) {
    const c = parseUkClass(q.classification);
    if (c !== null) out.push({ basis: 'UK_CLASS', value: c, label: q.classification });
  }
  return out;
}

// ---------------------------------------------------------------------------
// English
// ---------------------------------------------------------------------------

type EnglishKey = 'IELTS' | 'PTE' | 'TOEFL' | 'DET' | 'MOI' | 'OTHER';

export function normalizeEnglishTest(type: string | null | undefined): EnglishKey {
  const t = (type ?? '').toLowerCase();
  if (t.includes('ielts')) return 'IELTS';
  if (t.includes('pte')) return 'PTE';
  if (t.includes('toefl')) return 'TOEFL';
  if (t.includes('duolingo') || t === 'det') return 'DET';
  if (t.includes('moi') || t.includes('medium of instruction')) return 'MOI';
  return 'OTHER';
}

/** Standard validity used by IELTS, PTE, TOEFL and Duolingo for admissions (2 years) unless an expiry date is given. */
export const ENGLISH_VALIDITY_MONTHS = 24;

export function englishTestExpired(test: StudentEnglishTestInput, now: Date): boolean | null {
  if (test.expiryDate) {
    const d = new Date(test.expiryDate);
    if (!Number.isNaN(d.getTime())) return d.getTime() < now.getTime();
  }
  if (test.testDate) {
    const d = new Date(test.testDate);
    if (!Number.isNaN(d.getTime())) {
      const exp = new Date(d);
      exp.setMonth(exp.getMonth() + ENGLISH_VALIDITY_MONTHS);
      return exp.getTime() < now.getTime();
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pos(n: number | null | undefined): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

export function parseMonthsFromText(text: string | null | undefined): number | null {
  const t = (text ?? '').toLowerCase();
  if (!t.trim() || /^(no|none|not required|n\/a)$/.test(t.trim())) return 0;
  const y = t.match(/(\d+(?:\.\d+)?)\s*(?:\+\s*)?years?/);
  if (y) return Math.round(Number(y[1]) * 12);
  const m = t.match(/(\d+)\s*months?/);
  if (m) return Number(m[1]);
  return null;
}

function highestQualification(quals: StudentQualificationInput[]): { q: StudentQualificationInput; level: number } | null {
  let best: { q: StudentQualificationInput; level: number } | null = null;
  for (const q of quals) {
    const level = qualificationLevel(q.qualificationType);
    if (level === null) continue;
    if (!best || level > best.level) best = { q, level };
  }
  return best;
}

// ---------------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------------

export function evaluateEligibility(student: StudentProfile, course: CourseRuleInput, now: Date): EligibilityEvaluation {
  const rows: RequirementRow[] = [];
  const plan: ImprovementItem[] = [];
  const req = course.requirement ?? null;
  const reqSource = req?.officialRequirementUrl || course.sourceUrl || null;
  const reqVerified = req?.lastCheckedAt || course.lastVerifiedAt || null;
  const level = normalizeCourseLevel(course.studyLevel, course.programLevel, course.title);
  const isResearch = RESEARCH_LEVELS.includes(level);

  const uniRow = (r: Omit<RequirementRow, 'sourceType' | 'source' | 'lastVerifiedAt'>, source = reqSource, verified = reqVerified): RequirementRow =>
    ({ ...r, sourceType: 'university', source, lastVerifiedAt: verified });
  const aloRow = (r: Omit<RequirementRow, 'sourceType' | 'source' | 'lastVerifiedAt'>): RequirementRow =>
    ({ ...r, sourceType: 'alo_rule', source: 'ALO Education standard progression guidance', lastVerifiedAt: null });

  // 1. International availability ------------------------------------------
  const intl = normalizeInternationalStatus(course.internationalEligibility);
  if (intl === 'INTERNATIONAL_OPEN') {
    rows.push(uniRow({ key: 'international', name: 'Open to international students', universityRequirement: 'International applications accepted', studentValue: 'International applicant', result: 'MET', kind: 'mandatory', action: null }, course.sourceUrl ?? null, course.lastVerifiedAt ?? null));
  } else if (intl === 'INTERNATIONAL_CLOSED' || intl === 'DOMESTIC_ONLY') {
    rows.push(uniRow({ key: 'international', name: 'Open to international students', universityRequirement: intl === 'DOMESTIC_ONLY' ? 'Home/domestic applicants only' : 'Closed to international applicants', studentValue: 'International applicant', result: 'NOT_MET', kind: 'mandatory', action: 'Choose another intake or course that accepts international students.' }, course.sourceUrl ?? null, course.lastVerifiedAt ?? null));
  } else {
    rows.push(uniRow({ key: 'international', name: 'Open to international students', universityRequirement: 'Not yet confirmed in verified data', studentValue: 'International applicant', result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: 'A counsellor will confirm that this course accepts international applicants.' }, course.sourceUrl ?? null, course.lastVerifiedAt ?? null));
  }

  // 2. Academic level (ALO progression rule) -------------------------------
  const best = highestQualification(student.qualifications);
  const entry = LEVEL_ENTRY[level];
  if (level === 'UNKNOWN') {
    rows.push(aloRow({ key: 'academic_level', name: 'Qualification level', universityRequirement: 'Course level not classified', studentValue: best?.q.qualificationType ?? null, result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: 'A counsellor will confirm the entry level for this course.' }));
  } else if (!best) {
    rows.push(aloRow({ key: 'academic_level', name: 'Qualification level', universityRequirement: entry.label, studentValue: null, result: 'MISSING_INFO', kind: 'mandatory', missingSide: 'student', action: 'Add your highest completed qualification.' }));
  } else if (best.level >= entry.min) {
    rows.push(aloRow({ key: 'academic_level', name: 'Qualification level', universityRequirement: entry.label, studentValue: best.q.qualificationType ?? null, result: 'MET', kind: 'mandatory', action: null }));
  } else if (entry.conditional !== undefined && best.level >= entry.conditional) {
    rows.push(aloRow({ key: 'academic_level', name: 'Qualification level', universityRequirement: entry.label, studentValue: best.q.qualificationType ?? null, result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: 'Some universities accept this qualification after review; a counsellor will check.' }));
  } else {
    rows.push(aloRow({ key: 'academic_level', name: 'Qualification level', universityRequirement: entry.label, studentValue: best.q.qualificationType ?? null, result: 'NOT_MET', kind: 'mandatory', action: 'Consider a pathway course (foundation, international year one or pre-master’s) that leads to this level.' }));
    plan.push({ currentGap: `Highest qualification (${best.q.qualificationType}) is below the usual entry level for this course`, requiredAction: 'Complete the next qualification level or apply through a recognised pathway programme', estimatedTimeline: 'Usually 1 academic year', recommendedAlternative: 'Foundation / International Year One / Pre-master’s' });
  }

  // 3. Academic score ------------------------------------------------------
  const reqScore = req ? parseRequirementScore(req.minScore, req.academicReq) : null;
  const reqText = [req?.academicReq, req?.minScore].filter(Boolean).join(' — ') || null;
  if (!req || (!reqScore && !reqText)) {
    rows.push(uniRow({ key: 'academic_score', name: 'Academic result', universityRequirement: 'Not yet recorded in verified data', studentValue: best ? studentScores(best.q).map((s) => s.label).join(' / ') || null : null, result: 'MISSING_INFO', kind: 'mandatory', missingSide: 'university', action: 'A counsellor will check the official academic requirement.' }));
  } else if (!reqScore) {
    rows.push(uniRow({ key: 'academic_score', name: 'Academic result', universityRequirement: reqText, studentValue: best ? studentScores(best.q).map((s) => s.label).join(' / ') || null : null, result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: 'This requirement needs a counsellor to compare against your transcript.' }));
  } else {
    const scores = best ? studentScores(best.q) : [];
    const same = scores.find((s) => s.basis === reqScore.basis && (s.basis !== 'GPA' || s.scale === reqScore.scale));
    if (scores.length === 0) {
      rows.push(uniRow({ key: 'academic_score', name: 'Academic result', universityRequirement: reqScore.label, studentValue: null, result: 'MISSING_INFO', kind: 'mandatory', missingSide: 'student', action: 'Add your GPA (with scale), percentage or degree classification.' }));
    } else if (!same) {
      rows.push(uniRow({ key: 'academic_score', name: 'Academic result', universityRequirement: reqScore.label, studentValue: scores.map((s) => s.label).join(' / '), result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: 'Your result uses a different grading system; the university or a counsellor must assess the equivalence.' }));
    } else if (same.value >= reqScore.value) {
      rows.push(uniRow({ key: 'academic_score', name: 'Academic result', universityRequirement: reqScore.label, studentValue: same.label, result: 'MET', kind: 'mandatory', action: null }));
    } else {
      const range = reqScore.basis === 'GPA' ? (reqScore.scale ?? 4) : reqScore.basis === 'PERCENT' ? 100 : 4;
      // UK classifications are coarse bands, so any shortfall is a full gap.
      const smallGap = reqScore.basis !== 'UK_CLASS' && (reqScore.value - same.value) / range <= 0.05;
      rows.push(uniRow({ key: 'academic_score', name: 'Academic result', universityRequirement: reqScore.label, studentValue: same.label, result: 'NOT_MET', kind: 'mandatory', smallGap, action: smallGap ? 'Slightly below the published minimum — a counsellor can check whether the university considers applications close to the threshold.' : 'Below the published minimum; consider a pathway or a course with a lower entry requirement.' }));
      plan.push({ currentGap: `Academic result ${same.label} is below the published ${reqScore.label}`, requiredAction: smallGap ? 'Ask a counsellor to check flexibility or strengthen the application' : 'Consider a pathway programme or courses with a lower entry requirement', estimatedTimeline: smallGap ? 'Before the application deadline' : 'Usually 1 academic year via a pathway', recommendedAlternative: smallGap ? null : 'Foundation / International Year One / Pre-master’s' });
    }
  }

  // 4. English -------------------------------------------------------------
  const engReq: Partial<Record<EnglishKey, { overall: number; band?: number }>> = {};
  if (req && pos(req.ieltsOverall)) engReq.IELTS = { overall: req.ieltsOverall, band: pos(req.ieltsMinBand) ? req.ieltsMinBand : undefined };
  if (req && pos(req.pteOverall)) engReq.PTE = { overall: req.pteOverall, band: pos(req.pteMinBand) ? req.pteMinBand : undefined };
  if (req && pos(req.toeflOverall)) engReq.TOEFL = { overall: req.toeflOverall };
  if (req && pos(req.detOverall)) engReq.DET = { overall: req.detOverall };
  const engRecorded = Object.keys(engReq).length > 0 || !!req?.moiAccepted || !!req?.ownEnglishTest;
  const engReqLabel = [
    engReq.IELTS && `IELTS ${engReq.IELTS.overall}${engReq.IELTS.band ? ` (min ${engReq.IELTS.band} each band)` : ''}`,
    engReq.PTE && `PTE ${engReq.PTE.overall}${engReq.PTE.band ? ` (min ${engReq.PTE.band} each skill)` : ''}`,
    engReq.TOEFL && `TOEFL iBT ${engReq.TOEFL.overall}`,
    engReq.DET && `Duolingo ${engReq.DET.overall}`,
    req?.moiAccepted ? 'MOI considered' : null,
  ].filter(Boolean).join(' / ') || null;

  const tests = student.englishTests.filter((t) => !!t.testType);
  if (!engRecorded) {
    rows.push(uniRow({ key: 'english', name: 'English language', universityRequirement: 'Not yet recorded in verified data', studentValue: tests.map((t) => `${t.testType ?? 'Test'} ${t.overallScore ?? ''}`.trim()).join(' / ') || null, result: 'MISSING_INFO', kind: 'mandatory', missingSide: 'university', action: 'A counsellor will check the official English requirement.' }));
  } else if (tests.length === 0) {
    rows.push(uniRow({ key: 'english', name: 'English language', universityRequirement: engReqLabel, studentValue: 'No test yet', result: 'CONDITION', kind: 'condition', action: 'Take an accepted English test; offers can be made conditional on the score.' }));
    plan.push({ currentGap: 'No English test result yet', requiredAction: `Book an accepted test and aim for ${engReqLabel}`, estimatedTimeline: '4–8 weeks to prepare and receive results', recommendedAlternative: null });
  } else {
    // Evaluate each supplied test against the matching requirement; keep the best outcome.
    type Outcome = { row: RequirementRow; rank: number };
    const outcomes: Outcome[] = tests.map((t) => {
      const key = normalizeEnglishTest(t.testType);
      const label = `${t.testType ?? key}${pos(t.overallScore) ? ` ${t.overallScore}` : ''}`;
      if (key === 'MOI') {
        return req?.moiAccepted
          ? { rank: 2, row: uniRow({ key: 'english', name: 'English language', universityRequirement: engReqLabel, studentValue: 'Medium of Instruction letter', result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: 'MOI is considered for this course subject to university assessment of your letter.' }) }
          : { rank: 1, row: uniRow({ key: 'english', name: 'English language', universityRequirement: engReqLabel, studentValue: 'Medium of Instruction letter', result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: 'MOI acceptance is not recorded for this course; you may need an accepted test.' }) };
      }
      const need = key !== 'OTHER' ? engReq[key] : undefined;
      if (!need) {
        return { rank: 1, row: uniRow({ key: 'english', name: 'English language', universityRequirement: engReqLabel, studentValue: label, result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: `A ${t.testType ?? 'this test'} minimum is not recorded for this course; a counsellor will confirm whether it is accepted.` }) };
      }
      if (!pos(t.overallScore)) {
        return { rank: 0, row: uniRow({ key: 'english', name: 'English language', universityRequirement: engReqLabel, studentValue: `${t.testType} (score not entered)`, result: 'MISSING_INFO', kind: 'mandatory', missingSide: 'student', action: 'Enter your overall score.' }) };
      }
      const expired = englishTestExpired(t, now);
      if (expired) {
        return { rank: 1, row: uniRow({ key: 'english', name: 'English language', universityRequirement: engReqLabel, studentValue: `${label} (expired)`, result: 'NOT_MET', kind: 'mandatory', smallGap: true, action: 'Your test result is no longer valid; retake the test before applying.' }) };
      }
      const comps = [t.listening, t.reading, t.writing, t.speaking].filter(pos);
      const lowComp = need.band !== undefined && comps.length > 0 ? Math.min(...comps) : null;
      if (t.overallScore >= need.overall && (need.band === undefined || (lowComp !== null && lowComp >= need.band))) {
        return { rank: 4, row: uniRow({ key: 'english', name: 'English language', universityRequirement: engReqLabel, studentValue: label + (lowComp !== null ? ` (lowest band ${lowComp})` : ''), result: 'MET', kind: 'mandatory', action: expired === null ? 'Keep your test report — validity will be checked against the test date.' : null }) };
      }
      if (t.overallScore >= need.overall && need.band !== undefined && lowComp === null) {
        return { rank: 3, row: uniRow({ key: 'english', name: 'English language', universityRequirement: engReqLabel, studentValue: `${label} (component scores not entered)`, result: 'MISSING_INFO', kind: 'mandatory', missingSide: 'student', action: 'Enter your listening, reading, writing and speaking scores.' }) };
      }
      const overallGap = need.overall - t.overallScore;
      const unit = key === 'IELTS' ? 0.5 : key === 'PTE' ? 4 : key === 'TOEFL' ? 6 : 10;
      const small = overallGap <= unit && (lowComp === null || need.band === undefined || need.band - lowComp <= unit);
      return { rank: 1, row: uniRow({ key: 'english', name: 'English language', universityRequirement: engReqLabel, studentValue: label + (lowComp !== null ? ` (lowest band ${lowComp})` : ''), result: 'NOT_MET', kind: 'mandatory', smallGap: small, action: small ? 'Close to the requirement — retake the test or ask whether the university offers a pre-sessional English route (not confirmed in our verified data).' : 'Improve your score with focused preparation and retake the test.' }) };
    });
    outcomes.sort((a, b) => b.rank - a.rank);
    const chosen = outcomes[0].row;
    rows.push(chosen);
    if (chosen.result === 'NOT_MET') {
      plan.push({ currentGap: `English result ${chosen.studentValue} does not meet ${engReqLabel}`, requiredAction: 'Retake an accepted English test', estimatedTimeline: chosen.smallGap ? '4–8 weeks' : '2–4 months of preparation', recommendedAlternative: 'Pre-sessional English, if the university offers it' });
    }
  }

  // 5. Work experience -----------------------------------------------------
  if (req?.workExperience && req.workExperience.trim()) {
    const needMonths = parseMonthsFromText(req.workExperience);
    const has = student.workExperienceMonths;
    if (needMonths === null) {
      rows.push(uniRow({ key: 'work_experience', name: 'Work experience', universityRequirement: req.workExperience, studentValue: has != null ? `${has} months` : null, result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: 'A counsellor will compare your experience with this requirement.' }));
    } else if (needMonths > 0) {
      if (has == null) {
        rows.push(uniRow({ key: 'work_experience', name: 'Work experience', universityRequirement: req.workExperience, studentValue: null, result: 'MISSING_INFO', kind: 'mandatory', missingSide: 'student', action: 'Add your work experience.' }));
      } else if (has >= needMonths) {
        rows.push(uniRow({ key: 'work_experience', name: 'Work experience', universityRequirement: req.workExperience, studentValue: `${has} months`, result: 'MET', kind: 'mandatory', action: null }));
      } else {
        rows.push(uniRow({ key: 'work_experience', name: 'Work experience', universityRequirement: req.workExperience, studentValue: `${has} months`, result: 'NOT_MET', kind: 'mandatory', action: `Gain about ${needMonths - has} more months of relevant experience or consider a course without this requirement.` }));
        plan.push({ currentGap: `Work experience ${has} months vs ${req.workExperience}`, requiredAction: 'Gain further relevant experience', estimatedTimeline: `${needMonths - has} months`, recommendedAlternative: 'A related course without a work-experience requirement' });
      }
    }
  }

  // 6. Portfolio / interview / research ------------------------------------
  if (req?.portfolioRequired) rows.push(uniRow({ key: 'portfolio', name: 'Portfolio', universityRequirement: 'Portfolio required', studentValue: null, result: 'CONDITION', kind: 'condition', action: 'Prepare a portfolio following the university’s guidance.' }));
  if (req?.interviewRequired) rows.push(uniRow({ key: 'interview', name: 'Interview', universityRequirement: 'Interview required', studentValue: null, result: 'CONDITION', kind: 'condition', action: 'Prepare for an admissions interview.' }));
  if (isResearch) rows.push(aloRow({ key: 'research', name: 'Research proposal and supervision', universityRequirement: 'Research degrees depend on a proposal and supervisor availability', studentValue: null, result: 'CONDITION', kind: 'condition', needsCounsellor: true, action: 'Prepare a research proposal; a counsellor will help identify supervisors and funding routes.' }));

  // 7. Study gap (documentation guidance only) -----------------------------
  if (pos(student.studyGapYears) && student.studyGapYears >= 2) {
    rows.push(aloRow({ key: 'study_gap', name: 'Study gap', universityRequirement: 'Gaps are usually explained with supporting documents (not a recorded university limit)', studentValue: `${student.studyGapYears} years`, result: 'CONDITION', kind: 'condition', action: 'Prepare a gap explanation with employment or training evidence.' }));
  }

  // 8. Budget (preference only — never affects eligibility) ----------------
  if (student.budget && pos(student.budget.amount) && course.fee && pos(course.fee.yearlyTuition) && course.fee.currency) {
    const sameCurrency = course.fee.currency.toUpperCase() === student.budget.currency.toUpperCase();
    const feeLabel = `${course.fee.currency.toUpperCase()} ${course.fee.yearlyTuition.toLocaleString('en-GB')} per year`;
    const budgetLabel = `${student.budget.currency.toUpperCase()} ${student.budget.amount.toLocaleString('en-GB')}`;
    rows.push({
      key: 'budget', name: 'Tuition vs your budget', universityRequirement: feeLabel, studentValue: budgetLabel,
      result: !sameCurrency ? 'MISSING_INFO' : student.budget.amount >= course.fee.yearlyTuition ? 'MET' : 'NOT_MET',
      kind: 'preference', sourceType: 'university', source: course.fee.sourceUrl || course.sourceUrl || null, lastVerifiedAt: course.fee.lastCheckedAt || course.lastVerifiedAt || null,
      action: !sameCurrency ? 'Different currencies — no exchange rate is applied; a counsellor can compare costs.' : student.budget.amount >= course.fee.yearlyTuition ? null : 'Tuition is above your budget; check scholarships or lower-cost options.',
    });
  }

  return categorise(course, rows, plan, level);
}

function categorise(course: CourseRuleInput, rows: RequirementRow[], plan: ImprovementItem[], level: CourseLevel): EligibilityEvaluation {
  const mandatory = rows.filter((r) => r.kind === 'mandatory');
  const notMet = mandatory.filter((r) => r.result === 'NOT_MET');
  const missingStudent = mandatory.filter((r) => r.result === 'MISSING_INFO' && r.missingSide === 'student');
  const missingUni = mandatory.filter((r) => r.result === 'MISSING_INFO' && r.missingSide === 'university');
  const conditions = rows.filter((r) => r.kind === 'condition');
  const needsCounsellor = conditions.some((r) => r.needsCounsellor);
  const evaluated = mandatory.filter((r) => r.result === 'MET' || r.result === 'NOT_MET');
  const met = evaluated.filter((r) => r.result === 'MET');
  const percent = evaluated.length ? Math.round((met.length / evaluated.length) * 100) : 0;
  const byKey = (k: string) => rows.find((r) => r.key === k);
  const academicGap = notMet.some((r) => (r.key === 'academic_level') || (r.key === 'academic_score' && !r.smallGap) || r.key === 'work_experience');

  let category: EligibilityCategory;
  let reason: string;

  if (byKey('international')?.result === 'NOT_MET') {
    category = 'NOT_CURRENTLY_ELIGIBLE';
    reason = 'This course is not currently open to international applicants.';
  } else if (academicGap) {
    category = 'NOT_CURRENTLY_ELIGIBLE';
    reason = `Your profile does not yet meet: ${notMet.map((r) => r.name.toLowerCase()).join(', ')}. Pathway and alternative routes are shown below.`;
  } else if (missingUni.some((r) => r.key === 'academic_score') && missingUni.some((r) => r.key === 'english')) {
    category = 'INSUFFICIENT_INFO';
    reason = 'The academic and English requirements for this course have not yet been verified, so we cannot assess it automatically.';
  } else if (missingStudent.length > 0 && met.filter((r) => r.key !== 'international').length === 0 && notMet.length === 0) {
    category = 'INSUFFICIENT_INFO';
    reason = `We need more information from you: ${missingStudent.map((r) => r.name.toLowerCase()).join(', ')}.`;
  } else if (notMet.length > 0) {
    const onlyEnglish = notMet.every((r) => r.key === 'english');
    const onlySmallAcademic = notMet.every((r) => r.key === 'academic_score' && r.smallGap);
    if (onlyEnglish) {
      category = 'CONDITIONALLY_ELIGIBLE';
      reason = 'Your academic profile matches, but your English result does not yet meet the requirement. An offer may be conditional on improving it.';
    } else if (onlySmallAcademic) {
      category = 'PARTIALLY_MATCHED';
      reason = 'Your result is slightly below the published minimum; a counsellor can check whether the university will consider it.';
    } else {
      category = 'PARTIALLY_MATCHED';
      reason = `Some requirements are not yet met: ${notMet.map((r) => r.name.toLowerCase()).join(', ')}.`;
    }
  } else if (RESEARCH_LEVELS.includes(level) || (needsCounsellor && conditions.some((r) => r.key === 'academic_score' || r.key === 'academic_level'))) {
    category = 'COUNSELLOR_REVIEW_REQUIRED';
    reason = RESEARCH_LEVELS.includes(level)
      ? 'Research admission depends on your proposal, supervisor availability and funding, so a counsellor must review your profile.'
      : 'Your qualification needs a counsellor to compare it against this requirement.';
  } else if (missingStudent.length > 0) {
    category = 'PARTIALLY_MATCHED';
    reason = `Requirements checked so far are met, but we still need: ${missingStudent.map((r) => r.name.toLowerCase()).join(', ')}.`;
  } else if (conditions.some((r) => r.key === 'english' && r.result === 'CONDITION' && !r.needsCounsellor)) {
    category = 'CONDITIONALLY_ELIGIBLE';
    reason = 'You meet the recorded academic requirement; an offer would likely be conditional on an English test result.';
  } else if (missingUni.length > 0 || conditions.length > 0) {
    category = 'LIKELY_ELIGIBLE';
    reason = missingUni.length > 0
      ? `The requirements we could check are met; ${missingUni.map((r) => r.name.toLowerCase()).join(', ')} still need to be confirmed against the official source.`
      : 'You meet the recorded requirements; some conditions (such as documents or confirmation) still apply.';
  } else {
    category = 'ELIGIBLE';
    reason = 'You meet every recorded requirement for this course.';
  }

  const nextSteps: string[] = [];
  for (const r of rows) if (r.action && r.result !== 'MET') nextSteps.push(r.action);
  if (category === 'NOT_CURRENTLY_ELIGIBLE' || category === 'PARTIALLY_MATCHED' || category === 'INSUFFICIENT_INFO' || category === 'COUNSELLOR_REVIEW_REQUIRED') {
    nextSteps.push('Book a free counsellor review to confirm your options.');
  }

  return {
    courseId: course.courseId,
    category,
    categoryLabel: CATEGORY_LABELS[category],
    requirementsMetPercent: percent,
    reason,
    requirements: rows,
    improvementPlan: plan,
    nextSteps: [...new Set(nextSteps)],
    normalizedLevel: level,
  };
}

/** Categories that may be offered as an alternative route. */
export const ALTERNATIVE_ACCEPTABLE: EligibilityCategory[] = ['ELIGIBLE', 'LIKELY_ELIGIBLE', 'CONDITIONALLY_ELIGIBLE'];

/** Pathway levels to search when a student does not meet a course's level. */
export function pathwayLevelsFor(level: CourseLevel): CourseLevel[] {
  switch (level) {
    case 'UNDERGRADUATE':
    case 'YEAR_2_ENTRY':
    case 'YEAR_3_ENTRY':
    case 'TOP_UP':
      return ['FOUNDATION', 'INTERNATIONAL_YEAR_ONE', 'DIPLOMA'];
    case 'POSTGRADUATE_TAUGHT':
    case 'MRES':
      return ['PRE_MASTERS'];
    case 'MPHIL':
    case 'PHD':
    case 'PROFESSIONAL_DOCTORATE':
      return ['MRES', 'POSTGRADUATE_TAUGHT'];
    default:
      return [];
  }
}

// ---------------------------------------------------------------------------
// Request payload → engine profile
// ---------------------------------------------------------------------------

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : null;
}
function str(v: unknown, max = 120): string | null {
  return typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;
}

/** Validates and normalises the public eligibility payload. Unknown fields are ignored. */
export function profileFromPayload(body: unknown, now: Date): StudentProfile {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const quals = Array.isArray(b.academicProfile) ? b.academicProfile.slice(0, 10) : [];
  const tests = Array.isArray(b.englishTests) ? b.englishTests.slice(0, 6) : [];
  const work = Array.isArray(b.workExperience) ? b.workExperience.slice(0, 20) : [];
  const gap = (b.studyGap && typeof b.studyGap === 'object' ? b.studyGap : {}) as Record<string, unknown>;
  const prefs = (b.studyPreferences && typeof b.studyPreferences === 'object' ? b.studyPreferences : {}) as Record<string, unknown>;

  const qualifications: StudentQualificationInput[] = quals.map((raw) => {
    const q = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      qualificationType: str(q.qualificationType),
      gpa: num(q.gpa),
      gpaScale: num(q.gpaScale),
      percentage: num(q.percentage),
      classification: str(q.classification) ?? str(q.grade),
      completionYear: num(q.completionYear),
      backlogs: num(q.backlogs),
      mediumOfInstruction: str(q.mediumOfInstruction),
    };
  });

  const englishTests: StudentEnglishTestInput[] = tests.map((raw) => {
    const t = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      testType: str(t.testType),
      overallScore: num(t.overallScore),
      listening: num(t.listening), reading: num(t.reading), writing: num(t.writing), speaking: num(t.speaking),
      testDate: str(t.testDate, 40), expiryDate: str(t.expiryDate, 40),
    };
  }).filter((t) => t.testType && t.testType.toLowerCase() !== 'none');

  let workExperienceMonths: number | null = null;
  for (const raw of work) {
    const w = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const m = num(w.totalMonths);
    if (m !== null && m >= 0) workExperienceMonths = (workExperienceMonths ?? 0) + Math.min(m, 600);
  }

  let studyGapYears = num(gap.totalGap);
  if (studyGapYears === null) {
    const latest = Math.max(0, ...qualifications.map((q) => q.completionYear ?? 0));
    if (latest > 1950) studyGapYears = Math.max(0, now.getUTCFullYear() - latest);
  }

  const amount = num(prefs.maxTuitionBudget);
  const currency = str(prefs.currency, 8);
  return {
    qualifications,
    englishTests,
    workExperienceMonths,
    studyGapYears,
    budget: amount && amount > 0 && currency && /^[A-Za-z]{3}$/.test(currency) ? { amount, currency: currency.toUpperCase() } : null,
  };
}
