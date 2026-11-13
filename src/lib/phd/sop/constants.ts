/**
 * SOP / statement-of-purpose builder — shared vocabulary.
 *
 * The document is assembled from facts the student supplied or that were
 * verified from an official source. Nothing in this module invents an
 * achievement, a hardship, a supervisor conversation or a detector score.
 */

export const SOP_SECTIONS = [
  {
    key: 'programme_fit',
    title: 'Why this programme and university',
    guidance: 'Name the programme and the parts of it that genuinely fit your work. Use verified programme facts only.',
    requires: ['programme'],
  },
  {
    key: 'research_interest',
    title: 'Research interest and proposed topic',
    guidance: 'State the topic and the question you intend to pursue, in your own terms.',
    requires: ['topic'],
  },
  {
    key: 'academic_background',
    title: 'Academic background',
    guidance: 'Your degrees, results and the modules that prepared you for this research.',
    requires: ['degree'],
  },
  {
    key: 'research_experience',
    title: 'Research experience',
    guidance: 'Dissertation, lab, fieldwork or professional research. Describe only work you actually did.',
    requires: [],
  },
  {
    key: 'methods',
    title: 'Methods and technical readiness',
    guidance: 'The methods you can use now, and the ones you will need training in.',
    requires: [],
  },
  {
    key: 'motivation',
    title: 'Motivation and professional context',
    guidance: 'Why you are pursuing a doctorate now. This section is yours — it is never generated from a template.',
    requires: ['studentInput'],
  },
  {
    key: 'field_engagement',
    title: 'Engagement with the field',
    guidance: 'Sources you have actually read. Anything cited must be in your literature workspace.',
    requires: [],
  },
  {
    key: 'contribution',
    title: 'Intended contribution',
    guidance: 'What the research will add: to theory, practice, policy or method.',
    requires: ['topic'],
  },
  {
    key: 'career_plan',
    title: 'Career plan after the doctorate',
    guidance: 'Where you intend to take the doctorate. Specific plans only — no generic ambition.',
    requires: ['studentInput'],
  },
  {
    key: 'ai_disclosure',
    title: 'AI use disclosure',
    guidance: 'Required only when the institution asks. It describes how drafting tools were used; it is never used to hide AI assistance.',
    requires: [],
  },
] as const;

export type SopSectionKey = (typeof SOP_SECTIONS)[number]['key'];

/** One-way review trail. Any backwards move creates a new review row. */
export const SOP_STATUSES = [
  'DRAFT',
  'STUDENT_REVIEWED',
  'FINAL_APPROVED',
  'REQUIREMENTS_VERIFIED',
  'EXPORT_VERIFIED',
] as const;

export type SopStatus = (typeof SOP_STATUSES)[number];

export const SOP_STATUS_LABELS: Record<SopStatus, string> = {
  DRAFT: 'Draft',
  STUDENT_REVIEWED: 'Student reviewed',
  FINAL_APPROVED: 'Final approved',
  REQUIREMENTS_VERIFIED: 'Requirements verified',
  EXPORT_VERIFIED: 'Export verified',
};

/** Allowed forward transitions; a reviewer may also send a statement back. */
export const SOP_TRANSITIONS: Record<SopStatus, SopStatus[]> = {
  DRAFT: ['STUDENT_REVIEWED'],
  STUDENT_REVIEWED: ['FINAL_APPROVED', 'DRAFT'],
  FINAL_APPROVED: ['REQUIREMENTS_VERIFIED', 'STUDENT_REVIEWED'],
  REQUIREMENTS_VERIFIED: ['EXPORT_VERIFIED', 'FINAL_APPROVED'],
  EXPORT_VERIFIED: ['REQUIREMENTS_VERIFIED'],
};

export const SOP_REVIEW_DECISIONS = [
  'STUDENT_REVIEWED',
  'FINAL_APPROVED',
  'CHANGES_REQUESTED',
  'REQUIREMENTS_VERIFIED',
  'EXPORT_VERIFIED',
] as const;

/**
 * Sections that may be blank in a final statement. The disclosure is optional
 * unless the institution requires it; everything else must be written.
 */
export const OPTIONAL_SOP_SECTIONS: SopSectionKey[] = ['ai_disclosure'];

/**
 * Explicit statement carried by every generated review report. The platform does
 * not measure, predict, promise or target any AI-detector score.
 */
export const SOP_DETECTOR_STATEMENT =
  'No AI-detector score is measured, estimated, guaranteed or targeted by this platform. The review report checks content quality — evidence, specificity, accuracy and disclosure — and states plainly that detector results vary by tool and version and are not a reliable measure of authorship.';

export const SOP_EXPORT_FILENAMES = {
  docx: 'Student_SOP_Final.docx',
  pdf: 'Student_SOP_Final.pdf',
  report: 'Student_SOP_Review_Report.pdf',
} as const;

export interface SopPersonalFacts {
  /** Free-text motivation written by the student. */
  motivation: string;
  /** Why this programme, in the student's words. */
  whyProgramme: string;
  /** Why this university. */
  whyUniversity: string;
  /** Achievements the student confirms are true. */
  achievements: string[];
  /** Career plan after the doctorate. */
  careerPlan: string;
  /** Practical or professional context that led to the research interest. */
  professionalContext: string;
  /** Whether drafting tools were used, and how. */
  aiUse: string;
  /** Anything the student wants the reviewer to know. */
  reviewerNotes: string;
}

export const EMPTY_PERSONAL_FACTS: SopPersonalFacts = {
  motivation: '',
  whyProgramme: '',
  whyUniversity: '',
  achievements: [],
  careerPlan: '',
  professionalContext: '',
  aiUse: '',
  reviewerNotes: '',
};

export function parsePersonalFacts(raw: string | null | undefined): SopPersonalFacts {
  if (!raw) return { ...EMPTY_PERSONAL_FACTS };
  try {
    const parsed = JSON.parse(raw) as Partial<SopPersonalFacts>;
    return {
      motivation: typeof parsed.motivation === 'string' ? parsed.motivation : '',
      whyProgramme: typeof parsed.whyProgramme === 'string' ? parsed.whyProgramme : '',
      whyUniversity: typeof parsed.whyUniversity === 'string' ? parsed.whyUniversity : '',
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements.map(String).filter(Boolean).slice(0, 20) : [],
      careerPlan: typeof parsed.careerPlan === 'string' ? parsed.careerPlan : '',
      professionalContext: typeof parsed.professionalContext === 'string' ? parsed.professionalContext : '',
      aiUse: typeof parsed.aiUse === 'string' ? parsed.aiUse : '',
      reviewerNotes: typeof parsed.reviewerNotes === 'string' ? parsed.reviewerNotes : '',
    };
  } catch {
    return { ...EMPTY_PERSONAL_FACTS };
  }
}

export function serialisePersonalFacts(facts: SopPersonalFacts): string {
  return JSON.stringify(facts);
}
