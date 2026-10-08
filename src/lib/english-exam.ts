/**
 * Single source of truth for the English-exam funnel.
 *
 * The English exam is delivered by the separate, live English Test Platform.
 * This repository only LINKS to it. It must never host, rebuild, or imitate an
 * exam experience. Every reference to the exam destination goes through this
 * module so the URL and copy can be audited in one place.
 */

/** The only destination for "Take the English Test" CTAs. */
export const ENGLISH_EXAM_PLATFORM_URL = 'https://english.aloeducation.com' as const;

/** Human-readable host shown next to the CTA so visitors know where they go. */
export const ENGLISH_EXAM_PLATFORM_HOST = 'english.aloeducation.com' as const;

/** Analytics event name for CTA clicks. Stored by the existing behavior-tracking pipeline. */
export const ENGLISH_EXAM_CTA_EVENT = 'english_exam_cta_click' as const;

/** Where a CTA was rendered. Sent as `eventData.location` (no personal data). */
export type EnglishExamCtaLocation =
  | 'homepage_banner'
  | 'homepage_english_tests'
  | 'navbar'
  | 'mobile_navbar'
  | 'footer'
  | 'language_prep_hub'
  | 'language_prep_detail'
  | 'english_test_prep_hub'
  | 'english_test_prep_detail'
  | 'country_page'
  | 'student_portal';

/**
 * Language-proficiency tests whose preparation pages show the REAL EXAM CTA.
 * Admission tests (GRE, GMAT, SAT, ACT), Kaplan and MOI guidance are excluded
 * because they are not English-proficiency exams.
 */
export const ENGLISH_PROFICIENCY_TEST_SLUGS: readonly string[] = [
  'ielts',
  'ielts-ukvi',
  'pte-academic',
  'toefl-ibt',
  'duolingo',
  'oietc',
  'oxford-ellt',
  'languagecert',
  'oet',
];

export function isEnglishProficiencyTestSlug(slug: string | null | undefined): boolean {
  return !!slug && ENGLISH_PROFICIENCY_TEST_SLUGS.includes(slug.toLowerCase());
}

/** Bilingual copy. Keys mirror the exact wording agreed for the funnel. */
export const ENGLISH_EXAM_COPY = {
  en: {
    question: 'Do you want to take an English test?',
    button: 'Take the English Test',
    leaving: `You will continue to ${ENGLISH_EXAM_PLATFORM_HOST}, the English Test Platform.`,
    preparationLabel: 'PREPARATION',
    preparationBody: 'Learn the format, understand the scoring, and plan your study with ALO Education guidance.',
    realExamLabel: 'REAL EXAM',
    realExamBody: 'Ready to sit the test? Continue to the English Test Platform.',
  },
  bn: {
    question: 'আপনি কি ইংরেজি পরীক্ষা দিতে চান?',
    button: 'পরীক্ষা দিন',
    leaving: `আপনি ${ENGLISH_EXAM_PLATFORM_HOST}-এ ইংরেজি পরীক্ষা প্ল্যাটফর্মে যাবেন।`,
    preparationLabel: 'প্রস্তুতি',
    preparationBody: 'পরীক্ষার ধরন জানুন, স্কোরিং বুঝুন এবং ALO Education-এর নির্দেশনায় পড়াশোনার পরিকল্পনা করুন।',
    realExamLabel: 'আসল পরীক্ষা',
    realExamBody: 'পরীক্ষা দেওয়ার জন্য প্রস্তুত? ইংরেজি পরীক্ষা প্ল্যাটফর্মে এগিয়ে যান।',
  },
} as const;
