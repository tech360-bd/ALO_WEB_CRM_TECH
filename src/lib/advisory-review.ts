/**
 * Advisory review rules — /ai/visa-coach, /ai/sop-helper, /ai/cv-helper
 *
 * These are deterministic, explainable checks. They are deliberately NOT
 * presented as AI judgement: every finding names the rule that produced it, so
 * a student can see why something was flagged and fix it. Where a language
 * model is available the UI can layer narrative feedback on top, but nothing
 * here depends on one.
 *
 * Nothing in this module predicts an outcome. There is no "visa approval
 * chance" and no "admission likelihood" — only structural completeness.
 */

export type Severity = 'error' | 'warning' | 'info';

export interface Finding {
  id: string;
  severity: Severity;
  label: string;
  detail: string;
}

export interface ReviewOutcome {
  findings: Finding[];
  /** Structural completeness, 0–100. Not a probability of success. */
  completenessScore: number;
  wordCount: number;
}

/* ── Visa interview answer review ─────────────────────────────── */

export interface VisaAnswerContext {
  /** What the student intends to study. */
  course?: string;
  university?: string;
  country?: string;
  fundingSource?: string;
  /** What the student plans to do after graduating. */
  returnPlan?: string;
}

/**
 * Structural review of a visa interview answer. Visa officers assess genuine
 * intent, funding and ties to the home country; these checks confirm the answer
 * addresses those areas, not that it will succeed.
 */
export function reviewVisaAnswer(answer: string, context: VisaAnswerContext = {}): ReviewOutcome {
  const text = (answer ?? '').trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const findings: Finding[] = [];

  if (wordCount === 0) {
    findings.push({
      id: 'empty',
      severity: 'error',
      label: 'No answer provided',
      detail: 'Write your answer before requesting a review.',
    });
    return { findings, completenessScore: 0, wordCount: 0 };
  }

  if (wordCount < 20) {
    findings.push({
      id: 'too-short',
      severity: 'warning',
      label: 'Very short answer',
      detail: `This is ${wordCount} words. Interview answers usually need enough detail to explain your reasoning — aim for a few sentences.`,
    });
  } else if (wordCount > 320) {
    findings.push({
      id: 'too-long',
      severity: 'warning',
      label: 'Answer may be too long to deliver',
      detail: `This is ${wordCount} words. Credibility interviews allow only a short response per question — practise trimming it.`,
    });
  }

  if (/\b(um|uh|like|you know|sort of|kind of)\b/i.test(text)) {
    findings.push({
      id: 'fillers',
      severity: 'info',
      label: 'Filler words detected',
      detail: 'Remove fillers such as "um", "like" and "you know" — they make an answer sound rehearsed or uncertain.',
    });
  }

  if (!/[.?!]$/.test(text)) {
    findings.push({
      id: 'punctuation',
      severity: 'info',
      label: 'Missing end punctuation',
      detail: 'Ending sentences clearly helps you pace a spoken answer.',
    });
  }

  if (context.course && !text.toLowerCase().includes(context.course.toLowerCase())) {
    findings.push({
      id: 'course-not-mentioned',
      severity: 'warning',
      label: 'Course not named',
      detail: `You told us you are applying for ${context.course}, but the answer does not mention it. Officers expect you to name your course specifically.`,
    });
  }

  if (context.university && !text.toLowerCase().includes(context.university.toLowerCase())) {
    findings.push({
      id: 'university-not-mentioned',
      severity: 'info',
      label: 'University not named',
      detail: `Naming ${context.university} and why you chose it strengthens a study-plan answer.`,
    });
  }

  if (context.fundingSource && !text.toLowerCase().includes(context.fundingSource.toLowerCase())) {
    findings.push({
      id: 'funding-not-mentioned',
      severity: 'info',
      label: 'Funding source not mentioned',
      detail: `You listed ${context.fundingSource} as your funding source. Funding answers should state who is paying and how.`,
    });
  }

  const hasAmount = /\d/.test(text);
  if (!hasAmount) {
    findings.push({
      id: 'no-specifics',
      severity: 'info',
      label: 'No specific figures',
      detail: 'Where the question asks about costs, duration or dates, give the actual number rather than a general statement.',
    });
  }

  if (context.returnPlan && !mentionsFuture(text)) {
    findings.push({
      id: 'no-future-plan',
      severity: 'warning',
      label: 'No post-study plan stated',
      detail: 'Most credibility interviews ask what you intend to do after graduating. State your plan explicitly.',
    });
  }

  const completenessScore = scoreFromFindings(findings);
  return { findings, completenessScore, wordCount };
}

function mentionsFuture(text: string): boolean {
  return /\b(after|once|when i (finish|graduate|complete)|graduat|return|back to|career|future|plan to)\b/i.test(text);
}

/* ── SOP review ───────────────────────────────────────────────── */

export interface SopContext {
  programme?: string;
  university?: string;
  careerGoal?: string;
}

export function reviewStatementOfPurpose(draft: string, context: SopContext = {}): ReviewOutcome {
  const text = (draft ?? '').trim();
  const wordCount = text ? text.split(/\s+/).length : 0;
  const findings: Finding[] = [];

  if (wordCount === 0) {
    findings.push({
      id: 'empty',
      severity: 'error',
      label: 'No draft provided',
      detail: 'Paste or write your statement before requesting a review.',
    });
    return { findings, completenessScore: 0, wordCount: 0 };
  }

  if (wordCount < 400) {
    findings.push({
      id: 'too-short',
      severity: 'warning',
      label: 'Below typical length',
      detail: `This is ${wordCount} words. Most universities expect roughly 500–1,000 words. Check your programme's stated limit.`,
    });
  } else if (wordCount > 1200) {
    findings.push({
      id: 'too-long',
      severity: 'warning',
      label: 'Above typical length',
      detail: `This is ${wordCount} words. Admissions teams read hundreds of statements — tighten it and check the programme's word limit.`,
    });
  }

  const paragraphs = text.split(/\n{2,}/).filter((block) => block.trim().length > 0).length;
  if (paragraphs < 3) {
    findings.push({
      id: 'structure',
      severity: 'warning',
      label: 'Few paragraphs',
      detail: `Only ${paragraphs} paragraph${paragraphs === 1 ? '' : 's'} detected. Separate your background, your reasons for this programme, and your plans.`,
    });
  }

  if (context.programme && !text.toLowerCase().includes(context.programme.toLowerCase())) {
    findings.push({
      id: 'programme-not-named',
      severity: 'error',
      label: 'Programme not named',
      detail: `The statement never mentions ${context.programme}. Admissions readers need to see it is written for this specific programme.`,
    });
  }

  if (context.university && !text.toLowerCase().includes(context.university.toLowerCase())) {
    findings.push({
      id: 'university-not-named',
      severity: 'warning',
      label: 'University not named',
      detail: `Mentioning ${context.university} — and something specific about it — shows the statement is not generic.`,
    });
  }

  if (context.careerGoal && !text.toLowerCase().includes(context.careerGoal.toLowerCase())) {
    findings.push({
      id: 'goal-not-named',
      severity: 'info',
      label: 'Stated career goal not referenced',
      detail: `You gave "${context.careerGoal}" as your goal, but the statement does not mention it.`,
    });
  }

  if (!/\b(because|therefore|this led|as a result|which is why)\b/i.test(text)) {
    findings.push({
      id: 'no-reasoning',
      severity: 'info',
      label: 'Little explicit reasoning',
      detail: 'Strong statements explain why, not just what. Connect your experience to your decision to study this programme.',
    });
  }

  if (/\b(world-class|prestigious|dream|passionate|since childhood| renowned)\b/i.test(text)) {
    findings.push({
      id: 'cliches',
      severity: 'warning',
      label: 'Clichéd phrasing detected',
      detail: 'Phrases such as "world-class", "prestigious" and "since childhood" are heavily over-used. Replace them with a specific example.',
    });
  }

  return { findings, completenessScore: scoreFromFindings(findings), wordCount };
}

/* ── CV review ────────────────────────────────────────────────── */

export interface CvProfile {
  fullName?: string;
  email?: string;
  phone?: string;
  education?: { institution?: string; qualification?: string; startDate?: string; endDate?: string }[];
  experience?: { role?: string; organisation?: string; startDate?: string; endDate?: string; summary?: string }[];
  skills?: string[];
  achievements?: string[];
  languages?: string[];
}

const CV_SECTIONS: { key: keyof CvProfile; label: string; severity: Severity; detail: string }[] = [
  { key: 'fullName', label: 'Full name', severity: 'error', detail: 'Add your full name exactly as it appears on your passport.' },
  { key: 'email', label: 'Email address', severity: 'error', detail: 'Add a professional email address you check regularly.' },
  { key: 'phone', label: 'Phone number', severity: 'warning', detail: 'Add a contact number with the country code.' },
  { key: 'education', label: 'Education history', severity: 'error', detail: 'List every qualification with institution and dates.' },
  { key: 'experience', label: 'Work experience', severity: 'warning', detail: 'Add employment, internships or voluntary roles. If you have none, say so — do not invent any.' },
  { key: 'skills', label: 'Skills', severity: 'info', detail: 'List technical and transferable skills relevant to your intended programme.' },
  { key: 'achievements', label: 'Achievements', severity: 'info', detail: 'Scholarships, publications, competitions and leadership roles strengthen an application.' },
  { key: 'languages', label: 'Languages', severity: 'info', detail: 'List languages with your proficiency level.' },
];

export function reviewCv(profile: CvProfile): ReviewOutcome {
  const findings: Finding[] = [];

  for (const section of CV_SECTIONS) {
    const value = profile[section.key];
    const present = Array.isArray(value) ? value.length > 0 : Boolean(value && String(value).trim());
    if (present) continue;
    findings.push({
      id: `missing-${String(section.key)}`,
      severity: section.severity,
      label: `${section.label} missing`,
      detail: section.detail,
    });
  }

  const emails = typeof profile.email === 'string' ? profile.email.trim() : '';
  if (emails && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emails)) {
    findings.push({
      id: 'invalid-email',
      severity: 'error',
      label: 'Email address looks invalid',
      detail: `"${emails}" is not a valid email format. Universities use it for every offer and CAS communication.`,
    });
  }

  if (Array.isArray(profile.education)) {
    profile.education.forEach((entry, index) => {
      if (!entry.institution || !entry.qualification) {
        findings.push({
          id: `education-incomplete-${index}`,
          severity: 'warning',
          label: `Education entry ${index + 1} incomplete`,
          detail: 'Each entry needs both an institution and a qualification.',
        });
      }
      if (!entry.startDate || !entry.endDate) {
        findings.push({
          id: `education-dates-${index}`,
          severity: 'warning',
          label: `Education entry ${index + 1} missing dates`,
          detail: 'Admissions teams check study gaps, so start and end dates are required.',
        });
      }
    });
  }

  if (Array.isArray(profile.experience)) {
    profile.experience.forEach((entry, index) => {
      if (!entry.summary || entry.summary.trim().split(/\s+/).length < 8) {
        findings.push({
          id: `experience-summary-${index}`,
          severity: 'info',
          label: `Experience entry ${index + 1} has little detail`,
          detail: 'Describe responsibilities and outcomes in a sentence or two rather than a job title alone.',
        });
      }
    });
  }

  return {
    findings,
    completenessScore: scoreFromFindings(findings),
    wordCount: 0,
  };
}

/* ── Shared scoring ───────────────────────────────────────────── */

const SEVERITY_PENALTY: Record<Severity, number> = { error: 20, warning: 10, info: 4 };

/**
 * Structural completeness score. It measures how many checks the content
 * satisfies — it is never a probability of admission, visa approval or award.
 */
export function scoreFromFindings(findings: Finding[]): number {
  const penalty = findings.reduce((total, finding) => total + SEVERITY_PENALTY[finding.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

export function summariseFindings(findings: Finding[]): { errors: number; warnings: number; info: number } {
  return {
    errors: findings.filter((finding) => finding.severity === 'error').length,
    warnings: findings.filter((finding) => finding.severity === 'warning').length,
    info: findings.filter((finding) => finding.severity === 'info').length,
  };
}
