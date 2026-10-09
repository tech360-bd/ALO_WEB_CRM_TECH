/**
 * Lead magnet catalog — gated content that earns the email address.
 *
 * Planning framework adapted from coreyhaines31/marketingskills →
 * skills/lead-magnets: every magnet must solve one specific problem,
 * promise a concrete deliverable, and route into a sequence.
 */

export type LeadMagnet = {
  id: string;
  name: string;
  format: string;
  audience: string;
  /** The promise the signup form makes */
  hook: string;
  description: string;
  /** What the deliverable actually contains */
  deliverable: string[];
  cta: string;
  /** Sequence the downloader enters */
  sequence: 'welcome' | 'nurture';
};

export const LEAD_MAGNETS: LeadMagnet[] = [
  {
    id: 'visa-document-checklist',
    name: 'Visa Document Checklist (UK · US · Australia · Canada)',
    format: 'PDF checklist',
    audience: 'Offer holders preparing visa files',
    hook: 'Every document your visa file needs — in one checklist.',
    description:
      'The exact checklist our counselors use, split by country, with common rejection reasons next to each item.',
    deliverable: [
      'Country-wise document lists',
      'Financial evidence rules',
      'Common refusal reasons per document',
      'Submission timeline',
    ],
    cta: 'Get the checklist',
    sequence: 'nurture',
  },
  {
    id: 'study-cost-calculator',
    name: 'Study Abroad Cost Calculator',
    format: 'Interactive tool',
    audience: 'Students and parents budgeting early',
    hook: 'Know the real number before you fall in love with a university.',
    description:
      'Tuition + living costs + visa fees + flights, computed per destination from verified university data.',
    deliverable: [
      'Per-country cost breakdown',
      'Tuition vs living split',
      'Scholarship offset estimate',
      'Year-by-year budget view',
    ],
    cta: 'Calculate my budget',
    sequence: 'welcome',
  },
  {
    id: 'scholarship-guide',
    name: 'Scholarship Finder Guide',
    format: 'PDF guide',
    audience: 'Merit students with tight budgets',
    hook: 'Scholarships are matched, not found — here is how matching works.',
    description:
      'How ALO matches students to verified scholarships: eligibility, amounts, deadlines, and application strategy.',
    deliverable: [
      'Scholarship categories explained',
      'Eligibility matching method',
      'Application timing strategy',
      'Document preparation tips',
    ],
    cta: 'Find my scholarships',
    sequence: 'nurture',
  },
  {
    id: 'sop-template',
    name: 'SOP Template & Annotated Examples',
    format: 'DOCX + PDF examples',
    audience: 'Students drafting applications',
    hook: 'A structure that admissions officers actually read.',
    description:
      'A fill-in SOP structure with two annotated real examples (one admit, one scholarship).',
    deliverable: [
      'Section-by-section template',
      'Two annotated examples',
      'Common SOP mistakes',
      'Length and format rules',
    ],
    cta: 'Download the template',
    sequence: 'nurture',
  },
  {
    id: 'university-comparison-sheet',
    name: 'University Comparison Worksheet',
    format: 'Spreadsheet (XLSX)',
    audience: 'Students shortlisting universities',
    hook: 'Compare offers on facts, not brochures.',
    description:
      'A side-by-side worksheet: course content, entry requirements, fees, scholarships, deadlines, visa history.',
    deliverable: [
      '10-university comparison grid',
      'Requirement match scoring',
      'Total-cost column',
      'Deadline tracker',
    ],
    cta: 'Get the worksheet',
    sequence: 'welcome',
  },
  {
    id: 'ielts-roadmap',
    name: 'IELTS 7+ Roadmap',
    format: 'PDF roadmap',
    audience: 'Students starting English preparation',
    hook: 'From your current band to your target band — week by week.',
    description:
      'A 12-week preparation roadmap by starting band, with practice resources and retake planning.',
    deliverable: [
      'Band diagnostic guide',
      '12-week study plan',
      'Free practice resources',
      'Retake decision framework',
    ],
    cta: 'Get the roadmap',
    sequence: 'welcome',
  },
];
