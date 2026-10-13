/**
 * English Learning platform — shared constants.
 * --------------------------------------------------------------------
 * Single source of truth for:
 *  - Course levels (9) — beginner, intermediate, advanced + 6 test prep
 *  - Practice test types (12) — IELTS/TOEFL/PTE/Duolingo/GRE/GMAT
 *  - Lesson types (8), question types (6), skill areas (6),
 *    resource types (5)
 *  - ALO Education integration URLs
 *  - Higher Study cross-link URL (back-link to academic pathway)
 *  - English Learning internal navigation (12 items)
 *
 * NOTE: these constants describe the *shape* of the platform. Counts of
 * courses/tests/tutors come from the database at query time.
 */

import type {
  CourseLevel,
  EnglishLearningNavItem,
  LessonType,
  QuestionType,
  ReferralType,
  ResourceType,
  SkillArea,
  TestType,
} from "@/lib/english-learning/types";

// ─── Course levels (9) ───────────────────────────────────────────────

export interface CourseLevelOption {
  value: CourseLevel;
  label: string;
  description: string;
  color: string;
}

export const COURSE_LEVELS: CourseLevelOption[] = [
  {
    value: "beginner",
    label: "Beginner",
    description: "A1–A2 CEFR. Build core vocabulary and present tense.",
    color: "emerald",
  },
  {
    value: "intermediate",
    label: "Intermediate",
    description: "B1–B2 CEFR. Develop fluency and academic register.",
    color: "blue",
  },
  {
    value: "advanced",
    label: "Advanced",
    description: "C1–C2 CEFR. Refine nuance, idioms and academic writing.",
    color: "purple",
  },
  {
    value: "ielts",
    label: "IELTS Prep",
    description: "Band 6.0–7.5+. Academic Reading, Listening, Writing, Speaking.",
    color: "orange",
  },
  {
    value: "toefl",
    label: "TOEFL Prep",
    description: "Score 80–110+. iBT Reading, Listening, Speaking, Writing.",
    color: "rose",
  },
  {
    value: "pte",
    label: "PTE Academic",
    description: "Score 58–79+. Integrated speaking & writing tasks.",
    color: "cyan",
  },
  {
    value: "det",
    label: "Duolingo English Test",
    description: "Score 105–130+. Adaptive literacy, comprehension & production.",
    color: "lime",
  },
  {
    value: "gre",
    label: "GRE Verbal",
    description: "158–170. Reading comprehension, text completion, sentence equivalence.",
    color: "amber",
  },
  {
    value: "gmat",
    label: "GMAT Verbal",
    description: "36–51. Critical reasoning, reading comprehension, sentence correction.",
    color: "indigo",
  },
];

export const COURSE_LEVEL_MAP: Record<string, CourseLevelOption> =
  Object.fromEntries(COURSE_LEVELS.map((l) => [l.value, l]));

// ─── Practice test types (12) ────────────────────────────────────────

export interface TestTypeOption {
  value: TestType;
  label: string;
  group: "IELTS" | "TOEFL" | "PTE" | "Duolingo" | "GRE" | "GMAT";
  description: string;
}

export const TEST_TYPES: TestTypeOption[] = [
  {
    value: "ielts-reading",
    label: "IELTS Reading",
    group: "IELTS",
    description: "3 passages, 40 questions, 60 minutes.",
  },
  {
    value: "ielts-listening",
    label: "IELTS Listening",
    group: "IELTS",
    description: "4 sections, 40 questions, ~30 minutes.",
  },
  {
    value: "ielts-writing",
    label: "IELTS Writing",
    group: "IELTS",
    description: "Task 1 (150 words) + Task 2 (250 words), 60 minutes.",
  },
  {
    value: "ielts-speaking",
    label: "IELTS Speaking",
    group: "IELTS",
    description: "3 parts, 11–14 minutes, face-to-face interview.",
  },
  {
    value: "toefl-reading",
    label: "TOEFL Reading",
    group: "TOEFL",
    description: "3–4 passages, 30–40 questions, 54–72 minutes.",
  },
  {
    value: "toefl-listening",
    label: "TOEFL Listening",
    group: "TOEFL",
    description: "3–4 lectures + 2–3 conversations, 41–57 minutes.",
  },
  {
    value: "toefl-writing",
    label: "TOEFL Writing",
    group: "TOEFL",
    description: "Integrated + independent task, 50 minutes.",
  },
  {
    value: "toefl-speaking",
    label: "TOEFL Speaking",
    group: "TOEFL",
    description: "4 tasks, 17 minutes.",
  },
  {
    value: "pte",
    label: "PTE Academic",
    group: "PTE",
    description: "Integrated reading, listening, speaking & writing, ~77–93 minutes.",
  },
  {
    value: "duolingo",
    label: "Duolingo English Test",
    group: "Duolingo",
    description: "Adaptive literacy & production, ~60 minutes.",
  },
  {
    value: "gre-verbal",
    label: "GRE Verbal",
    group: "GRE",
    description: "Reading comprehension + text completion, 41 minutes.",
  },
  {
    value: "gmat-verbal",
    label: "GMAT Verbal",
    group: "GMAT",
    description: "Critical reasoning + sentence correction, 65 minutes.",
  },
];

export const TEST_TYPE_MAP: Record<string, TestTypeOption> = Object.fromEntries(
  TEST_TYPES.map((t) => [t.value, t]),
);

// ─── Lesson types (8) ────────────────────────────────────────────────

export interface LessonTypeOption {
  value: LessonType;
  label: string;
  icon: string;
}

export const LESSON_TYPES: LessonTypeOption[] = [
  { value: "video", label: "Video Lesson", icon: "Video" },
  { value: "reading", label: "Reading", icon: "BookOpen" },
  { value: "listening", label: "Listening", icon: "Headphones" },
  { value: "speaking", label: "Speaking", icon: "Mic" },
  { value: "writing", label: "Writing", icon: "PenLine" },
  { value: "grammar", label: "Grammar", icon: "SpellCheck" },
  { value: "vocab", label: "Vocabulary", icon: "Languages" },
  { value: "quiz", label: "Quiz", icon: "ListChecks" },
];

export const LESSON_TYPE_MAP: Record<string, LessonTypeOption> = Object.fromEntries(
  LESSON_TYPES.map((l) => [l.value, l]),
);

// ─── Question types (6) ──────────────────────────────────────────────

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "multiple-choice", label: "Multiple Choice" },
  { value: "true-false", label: "True / False" },
  { value: "fill-blank", label: "Fill in the Blank" },
  { value: "short-answer", label: "Short Answer" },
  { value: "essay", label: "Essay" },
  { value: "matching", label: "Matching" },
];

// ─── Skill areas (6) ─────────────────────────────────────────────────

export const SKILL_AREAS: { value: SkillArea; label: string }[] = [
  { value: "reading", label: "Reading" },
  { value: "listening", label: "Listening" },
  { value: "speaking", label: "Speaking" },
  { value: "writing", label: "Writing" },
  { value: "grammar", label: "Grammar" },
  { value: "vocab", label: "Vocabulary" },
];

// ─── Resource types (5) ──────────────────────────────────────────────

export const RESOURCE_TYPES: { value: ResourceType; label: string; icon: string }[] = [
  { value: "article", label: "Article", icon: "FileText" },
  { value: "video", label: "Video", icon: "Video" },
  { value: "infographic", label: "Infographic", icon: "Image" },
  { value: "audio", label: "Audio / Podcast", icon: "Headphones" },
  { value: "pdf", label: "PDF Guide", icon: "Download" },
];

export const RESOURCE_TYPE_MAP: Record<string, string> = Object.fromEntries(
  RESOURCE_TYPES.map((r) => [r.value, r.label]),
);

// ─── ALO Education + cross-platform URLs ─────────────────────────────

/** Root URL of ALO Education student platform. */
export const ALO_EDUCATION_URL = "https://aloeducation.com";

/** Verified English Learning referral handoff route on ALO Education. */
export const ALO_EDUCATION_ENGLISH_REFERRAL_URL =
  "https://aloeducation.com/english-learning/start";

/** Higher Study hub (sister platform on Alaminn.info). */
export const HIGHER_STUDY_URL = "/higher-study";

// ─── English Learning internal navigation (12 items) ────────────────

export const ENGLISH_LEARNING_NAV_ITEMS: EnglishLearningNavItem[] = [
  {
    label: "Home",
    href: "/english-learning",
    icon: "Home",
    description: "English Learning hub home with featured courses and quick links.",
  },
  {
    label: "Courses",
    href: "/english-learning/courses",
    icon: "GraduationCap",
    description: "Browse all English courses by level and test prep type.",
  },
  {
    label: "Practice Tests",
    href: "/english-learning/practice-tests",
    icon: "ClipboardCheck",
    description: "Take IELTS, TOEFL, PTE, Duolingo, GRE and GMAT mock tests.",
  },
  {
    label: "Tutors",
    href: "/english-learning/tutors",
    icon: "UserSearch",
    description: "Find 1:1 English tutors with verified qualifications.",
  },
  {
    label: "Resources",
    href: "/english-learning/resources",
    icon: "BookOpen",
    description: "Articles, videos, infographics and PDF study guides.",
  },
  {
    label: "Book a Tutor",
    href: "/english-learning/book-tutor",
    icon: "CalendarPlus",
    description: "Request a tutor match (handoff to ALO Education).",
  },
  {
    label: "My Progress",
    href: "/english-learning/progress",
    icon: "TrendingUp",
    description: "Anonymous progress dashboard (saved in your browser).",
  },
  {
    label: "Level Check",
    href: "/english-learning/eligibility-check",
    icon: "ListChecks",
    description: "10-question quiz that recommends your starting course level.",
  },
  {
    label: "Consultation",
    href: "/english-learning/book-consultation",
    icon: "MessageSquare",
    description: "Book a free 30-minute English-learning consultation.",
  },
  {
    label: "Apply",
    href: "/english-learning/apply",
    icon: "Send",
    description: "Apply for paid course packages via ALO Education.",
  },
  {
    label: "Higher Study",
    href: "/higher-study",
    icon: "ArrowLeftRight",
    description: "Explore academic programs (university + scholarship) after English prep.",
  },
  {
    label: "ALO Education",
    href: "https://aloeducation.com",
    icon: "ExternalLink",
    external: true,
    description: "Apply for paid tutoring and course packages via ALO Education.",
  },
];

// ─── Referral sources (3 channels) ───────────────────────────────────

export interface ReferralSourceOption {
  value: string;
  label: string;
  referralType: ReferralType;
}

export const REFERRAL_SOURCES: ReferralSourceOption[] = [
  {
    value: "ALAMINN_ENGLISH_COURSE_PACKAGE",
    label: "English Course Package Application",
    referralType: "course-package",
  },
  {
    value: "ALAMINN_ENGLISH_TUTOR_BOOKING",
    label: "1:1 Tutor Booking Request",
    referralType: "tutor-booking",
  },
  {
    value: "ALAMINN_ENGLISH_MOCK_TEST_BUNDLE",
    label: "Mock Test Bundle Purchase",
    referralType: "mock-test-bundle",
  },
];

// ─── Misc platform constants ─────────────────────────────────────────

/** Referral token lifetime in milliseconds (24 hours). */
export const REFERRAL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Maximum length of a sanitised string input. */
export const MAX_SAFE_STRING_LENGTH = 500;

/** Referral token length in characters (alphanumeric). */
export const REFERRAL_CODE_LENGTH = 12;

/** Default page size for paginated API responses. */
export const DEFAULT_PAGE_SIZE = 24;

/** Maximum page size for paginated API responses. */
export const MAX_PAGE_SIZE = 100;

/** Homepage FAQ entries (used by JSON-LD FAQPage + FAQ section). */
import type { FaqItem } from "@/lib/english-learning/types";

export const HOMEPAGE_FAQS: FaqItem[] = [
  {
    question: "Is the English Learning platform on Alaminn.info free?",
    answer:
      "Yes. Browsing courses, taking free practice tests, reading resources and tracking your progress are all free. When you choose to enrol in a paid course package or book a 1:1 tutor, you are transferred to ALO Education, our official application partner, with full consent tracking.",
  },
  {
    question: "Which English tests do you cover?",
    answer:
      "We cover IELTS Academic, IELTS for UKVI, TOEFL iBT, PTE Academic, Duolingo English Test, GRE Verbal and GMAT Verbal. Each test has practice tests, lessons, and recommended courses by band/score target.",
  },
  {
    question: "How do tutor bookings work?",
    answer:
      "Browse tutor profiles, check specialties, hourly rates and availability, then click 'Book this tutor'. We create a referral record with only public context (tutor slug, your target test, level) and transfer you to ALO Education's secure booking page where you choose a slot and pay.",
  },
  {
    question: "Do you share my data with ALO Education?",
    answer:
      "No personal data is sent through Alaminn.info. The referral URL only carries public context — your target test, level, and the tutor/course slug. Your name, email and payment details are collected by ALO Education after the transfer, on their own domain.",
  },
  {
    question: "Can I track my progress anonymously?",
    answer:
      "Yes. We generate an anonymous session ID stored in your browser's localStorage. Your progress on lessons and practice tests is saved against that session. If you sign in via ALO Education later, your progress can be merged into your account there.",
  },
  {
    question: "I want to study abroad after English prep — can you help?",
    answer:
      "Yes. Alaminn.info also hosts the Higher Study platform with 30 study destinations, universities, courses, scholarships and PhD opportunities. From any English Learning page you can jump to /higher-study to explore academic pathways after you hit your target score.",
  },
];
