/**
 * ALO Education — 7-step study-abroad roadmap.
 *
 * One canonical journey used by the homepage Smart Course Finder download
 * ("student selected country steps can download — like UK 7 step"): pick a
 * destination, download its 7-step guide, then follow the same steps with a
 * counsellor. The steps describe the ALO process only — they never promise an
 * offer, scholarship or visa outcome, and country-specific facts (fees,
 * deadlines, visa rules) always live on the destination guide / Course Finder,
 * linked from the downloaded file.
 */

import { ALO_CONTACT, ALO_TAGLINE } from '@/lib/alo-site-info';

export interface StudyStep {
  step: number;
  title: string;
  description: string;
}

export const ALO_STUDY_STEPS: StudyStep[] = [
  {
    step: 1,
    title: 'Counseling & Profile Assessment',
    description:
      'Meet an ALO counsellor (free) to review your academic results, budget, English level and career goals, and confirm the destination fits you.',
  },
  {
    step: 2,
    title: 'Course & University Shortlisting',
    description:
      'Use the Smart Course Finder to shortlist courses by subject, study level and destination, then compare tuition fees, intakes and world rankings with your counsellor.',
  },
  {
    step: 3,
    title: 'English Test Preparation',
    description:
      'Prepare for IELTS, PTE, TOEFL or Duolingo with ALO Language Prep and book your test once you consistently reach the score your shortlisted courses require.',
  },
  {
    step: 4,
    title: 'Application Submission & Offer Letter',
    description:
      'Submit complete applications — transcripts, SOP, references and passport — through the student portal and track every offer in one place.',
  },
  {
    step: 5,
    title: 'Scholarships & Financial Planning',
    description:
      'Apply for the scholarships you are eligible for, plan tuition and living costs, and prepare the financial documents your visa route requires.',
  },
  {
    step: 6,
    title: 'Visa Application & Interview Preparation',
    description:
      'File your student visa with a counsellor-checked document set and practise with mock credibility / visa interviews before the real one.',
  },
  {
    step: 7,
    title: 'Pre-Departure Briefing & Fly',
    description:
      'Accommodation, flights, insurance, banking and what to pack — attend the pre-departure briefing, then fly and settle in with ALO post-arrival support.',
  },
];

/** Absolute public URL for a destination guide, e.g. /destinations/uk. */
export function destinationGuidePath(slug: string): string {
  return `/destinations/${slug}`;
}

/** File name used for the downloaded guide, e.g. alo-uk-7-step-study-guide.txt */
export function studyGuideFileName(countryLabel: string): string {
  const slug = countryLabel
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `alo-${slug || 'destination'}-7-step-study-guide.txt`;
}

/**
 * Plain-text 7-step guide for one destination. Plain text is deliberate: it
 * downloads and opens everywhere (including low-end phones) with no PDF
 * toolchain, and every fact in it is an ALO process step plus links to the
 * live destination guide and Course Finder where verified facts are shown.
 */
export function buildStudyGuideText(countryLabel: string, slug: string): string {
  const site = 'https://aloeducation.com';
  const lines: string[] = [
    'ALO Education',
    ALO_TAGLINE,
    '',
    `Your 7-Step Study Guide — ${countryLabel}`,
    '='.repeat(48),
    '',
    `Planning to study in ${countryLabel}? Follow the same 7 steps our`,
    'counsellors use with every ALO student:',
    '',
  ];
  for (const s of ALO_STUDY_STEPS) {
    lines.push(`Step ${s.step}: ${s.title}`);
    lines.push(`  ${s.description}`);
    lines.push('');
  }
  lines.push(
    'Next actions',
    '------------',
    `Destination guide (visa, costs, intakes): ${site}${destinationGuidePath(slug)}`,
    `Search live courses in ${countryLabel}: ${site}/course-finder?country=${encodeURIComponent(countryLabel)}`,
    `Book counselling: ${site}/book-consultation`,
    '',
    'Contact ALO Education',
    '---------------------',
    `WhatsApp: ${ALO_CONTACT.whatsappDisplay} (${ALO_CONTACT.whatsappHref})`,
    `Mobile: ${ALO_CONTACT.mobileDisplay}`,
    `Email: ${ALO_CONTACT.email}`,
    `Address: ${ALO_CONTACT.address}`,
    `Location (Google): ${ALO_CONTACT.mapsUrl}`,
    '',
    'Fees, deadlines and visa rules change — always confirm the current',
    'facts on the destination guide and with your ALO counsellor before',
    'you apply. ALO Education never guarantees an offer or a visa outcome.',
  );
  return lines.join('\n');
}
