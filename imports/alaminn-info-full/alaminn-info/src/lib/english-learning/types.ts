/**
 * English Learning platform — shared TypeScript types.
 * --------------------------------------------------------------------
 * Mirrors the Prisma models (prefixed `EnglishLearning…`) but written
 * as plain TS interfaces so they can be imported by both server and
 * client code without pulling Prisma's generated runtime.
 *
 * Conventions mirror `src/lib/higher-study/types.ts`:
 *  - Verification + publication discipline on every public entity.
 *  - Optional related rows only populated on detail pages.
 *  - JSON columns typed as `unknown` / parsed at the call site.
 */

// ─── Status unions ───────────────────────────────────────────────────

export type VerificationStatus =
  | "draft"
  | "pending-review"
  | "verified"
  | "published"
  | "needs-update"
  | "archived";

export type PublicationStatus = "draft" | "published" | "archived";
export type ReferralStatus =
  | "created"
  | "transferred"
  | "completed"
  | "failed"
  | "expired";
export type EnrollmentStatus =
  | "enrolled"
  | "started"
  | "completed"
  | "abandoned";
export type ProgressStatus = "not-started" | "in-progress" | "completed";

// ─── Taxonomies ──────────────────────────────────────────────────────

export type CourseLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "ielts"
  | "toefl"
  | "pte"
  | "det"
  | "gre"
  | "gmat";

export type TestType =
  | "ielts-reading"
  | "ielts-listening"
  | "ielts-writing"
  | "ielts-speaking"
  | "toefl-reading"
  | "toefl-listening"
  | "toefl-writing"
  | "toefl-speaking"
  | "pte"
  | "duolingo"
  | "gre-verbal"
  | "gmat-verbal";

export type LessonType =
  | "video"
  | "reading"
  | "listening"
  | "speaking"
  | "writing"
  | "grammar"
  | "vocab"
  | "quiz";

export type QuestionType =
  | "multiple-choice"
  | "true-false"
  | "fill-blank"
  | "short-answer"
  | "essay"
  | "matching";

export type SkillArea =
  | "reading"
  | "listening"
  | "speaking"
  | "writing"
  | "grammar"
  | "vocab";

export type ResourceType =
  | "article"
  | "video"
  | "infographic"
  | "audio"
  | "pdf";

export type ReferralType =
  | "course-package"
  | "tutor-booking"
  | "mock-test-bundle";

// ─── Entities ────────────────────────────────────────────────────────

export interface Course {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  level: CourseLevel | string;
  durationWeeks?: number | null;
  hoursPerWeek?: number | null;
  priceUsd?: number | null;
  currency: string;
  isFeatured: boolean;
  isPublished: boolean;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  lastVerifiedAt?: Date | null;
  lastVerifiedBy?: string | null;
  officialSourceUrl?: string | null;
  createdByUserId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  metaTitle?: string | null;
  metaDescription?: string | null;
  keywords?: unknown;
  tags?: unknown;
  heroImageUrl?: string | null;
  introVideoUrl?: string | null;
  syllabus?: unknown;
  prerequisites?: unknown;
  targetAudience?: unknown;
  learningOutcomes?: unknown;
  certificationType?: string | null;
  passScore?: number | null;
  enrollmentCount: number;
  lessons?: Lesson[];
  enrollments?: Enrollment[];
}

export interface Lesson {
  id: string;
  courseId: string;
  slug: string;
  title: string;
  summary?: string | null;
  content?: string | null;
  orderIndex: number;
  durationMinutes?: number | null;
  lessonType: LessonType | string;
  videoUrl?: string | null;
  transcript?: string | null;
  isFreePreview: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeTest {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  testType: TestType | string;
  level: CourseLevel | string;
  durationMinutes?: number | null;
  totalQuestions: number;
  passingScore?: number | null;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  questions?: Question[];
}

export interface Question {
  id: string;
  testId: string;
  questionType: QuestionType | string;
  questionText: string;
  options?: unknown;
  correctAnswer?: string | null;
  explanation?: string | null;
  points: number;
  orderIndex: number;
  skillArea: SkillArea | string;
}

/** Public-facing question (correctAnswer + explanation stripped). */
export interface PublicQuestion
  extends Omit<Question, "correctAnswer" | "explanation"> {
  correctAnswer: null;
  explanation: null;
}

export interface Tutor {
  id: string;
  slug: string;
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  specialties?: unknown;
  qualifications?: unknown;
  yearsExperience?: number | null;
  hourlyRateUsd?: number | null;
  currency: string;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isPublished: boolean;
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: Date | null;
  officialProfileUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resource {
  id: string;
  slug: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  resourceType: ResourceType | string;
  url?: string | null;
  durationMinutes?: number | null;
  readingTimeMinutes?: number | null;
  level: CourseLevel | string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  authorName?: string | null;
  sourceName?: string | null;
}

export interface Enrollment {
  id: string;
  userId?: string | null;
  sessionId: string;
  courseId: string;
  status: EnrollmentStatus;
  progressPercent: number;
  lastAccessedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  course?: Course;
  progress?: Progress[];
}

export interface Progress {
  id: string;
  enrollmentId: string;
  lessonId?: string | null;
  testId?: string | null;
  status: ProgressStatus;
  scorePercent?: number | null;
  timeSpentMinutes: number;
  lastAttemptAt?: Date | null;
  attemptsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Referral {
  id: string;
  referralCode: string;
  referralType: ReferralType;
  sourceEntityId?: string | null;
  sourceEntityType?: string | null;
  targetUrl: string;
  status: ReferralStatus;
  createdAt: Date;
  completedAt?: Date | null;
  ipHash?: string | null;
  userAgent?: string | null;
  notes?: unknown;
}

// ─── Filter objects ──────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
}

export interface BaseFilter extends PaginationParams {
  q?: string;
  level?: string;
  testType?: string;
  isFeatured?: boolean;
}

export interface CourseFilter extends BaseFilter {
  maxPriceUsd?: number;
  minRating?: number;
}

export interface PracticeTestFilter extends BaseFilter {
  testType?: string;
}

export interface TutorFilter extends BaseFilter {
  specialty?: string;
  maxHourlyRate?: number;
  minRating?: number;
  isAvailable?: boolean;
}

export interface ResourceFilter extends BaseFilter {
  resourceType?: string;
}

// ─── API responses ───────────────────────────────────────────────────

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta: Record<string, unknown>;
  errors: unknown[];
}

export interface SearchResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

// ─── Referral helpers ────────────────────────────────────────────────

export interface ReferralContext {
  courseSlug?: string;
  tutorSlug?: string;
  testSlug?: string;
  level?: string;
  campaignCode?: string;
}

export interface ReferralTokenPayload {
  referralCode: string;
  referralType: ReferralType;
  iat: number;
  exp: number;
}

export interface CreateReferralOptions {
  referralType: ReferralType;
  consentGiven: boolean;
  consentVersion?: string;
  ipHash?: string | null;
  userAgent?: string | null;
  context?: ReferralContext;
  sourceEntityId?: string | null;
  sourceEntityType?: string | null;
  campaignCode?: string;
  /** Optional override for the CRM attribution source label. */
  source?: string;
}

// ─── SEO ─────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface EnglishLearningMetadataOptions {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noindex?: boolean;
  keywords?: string[];
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
}

export interface EnglishLearningNavItem {
  label: string;
  href: string;
  icon: string;
  external?: boolean;
  description: string;
}
