/**
 * VERIFIED UNIVERSITY CATALOGUE — shared types
 * ============================================
 * The 13-month window is January 2027 → January 2028. These types describe the
 * research dataset that is validated, ingested, approved and published into the
 * existing CRM models (CrmUniversity / CrmCourse / CrmCourseMonthlyCoverage /
 * CrmOfficialEvidence). Nothing here invents data: every fact in a dataset must
 * point at an evidence record whose excerpt was taken from an official page.
 */

/** Inclusive course-month window required by the ALO 2027/28 intake programme. */
export const COVERAGE_WINDOW = {
  start: { year: 2027, month: 1 },
  end: { year: 2028, month: 1 },
} as const;

/**
 * Verification taxonomy.
 *
 *  VERIFIED_AVAILABLE        — the official source states the intake exists.
 *  VERIFIED_NOT_OFFERED      — the official source enumerates the programme's
 *                              intakes and this month is absent from it.
 *  NOT_PUBLISHED             — the source was read but does not say either way.
 *  VERIFICATION_PENDING      — research queued / page not yet read.
 *  SOURCE_UNAVAILABLE        — the official source could not be retrieved.
 *  CONFLICT_REQUIRES_REVIEW  — two official sources disagree.
 *
 * Absence of published information is never proof that an intake does not
 * exist: only VERIFIED_NOT_OFFERED claims that, and only from an explicit
 * enumeration on an official page.
 */
export const COVERAGE_STATUSES = [
  'VERIFIED_AVAILABLE',
  'VERIFIED_NOT_OFFERED',
  'NOT_PUBLISHED',
  'VERIFICATION_PENDING',
  'SOURCE_UNAVAILABLE',
  'CONFLICT_REQUIRES_REVIEW',
] as const;

export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];

export const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUPERSEDED'] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export const SOURCE_TYPES = [
  'OFFICIAL_UNIVERSITY',
  'OFFICIAL_GOVERNMENT',
  'OFFICIAL_AUTHORITY',
  'OFFICIAL_TEST_PROVIDER',
  'OFFICIAL_SCHOLARSHIP',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const TRAVERSAL_COMPLETENESS = [
  'NOT_STARTED',
  'PARTIAL',
  'COMPLETE_VERIFIED',
  'BLOCKED',
  'ROBOTS_DISALLOWED',
] as const;
export type TraversalCompleteness = (typeof TRAVERSAL_COMPLETENESS)[number];

export interface EvidenceRecord {
  /** Stable dataset-local id, e.g. "man-msc-accounting-fees-2027". */
  id: string;
  sourceUrl: string;
  finalUrl?: string;
  sourceType: SourceType;
  publisherName: string;
  pageTitle: string;
  /** ISO-8601 collection timestamp (when the researcher retrieved the page). */
  retrievedAt: string;
  /** Publication date stated by the source itself; empty when not stated. */
  publishedAt?: string;
  httpStatus?: number;
  /** Verbatim supporting excerpt copied from the official page. */
  excerpt: string;
  /** Field names this excerpt supports. */
  fieldScope: string[];
  entityType: 'UNIVERSITY' | 'COURSE' | 'COUNTRY';
  universitySlug: string;
  courseSlug?: string;
  language?: string;
  confidence: number;
}

export interface UniversityRecord {
  slug: string;
  name: string;
  country: string;
  countrySlug: string;
  city?: string;
  /** Official institutional website (HTTPS, institution-owned domain). */
  officialWebsite: string;
  /** Official programme/ course catalogue URL that was traversed. */
  catalogueUrl?: string;
  verificationStatus: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'PENDING';
  lastVerifiedAt: string;
  notes?: string;
}

export interface CourseRecord {
  slug: string;
  universitySlug: string;
  title: string;
  qualification: string;
  studyLevel: 'Foundation' | 'Undergraduate' | 'Postgraduate' | 'Postgraduate Research' | 'Diploma';
  subjectArea?: string;
  durationMonths?: number;
  studyMode?: string;
  campus?: string;
  officialCourseUrl: string;
  applicationUrl?: string;
  /** Academic year the verified facts belong to, e.g. "2027/28". */
  academicYear?: string;
  verificationStatus: 'VERIFIED' | 'PARTIALLY_VERIFIED' | 'PENDING';
  lastVerifiedAt: string;
  notes?: string;
}

export interface EnglishRequirements {
  ielts?: string;
  ieltsComponents?: string;
  pte?: string;
  toefl?: string;
  duolingo?: string;
  other?: string;
  sourceNote?: string;
}

export interface CoverageRecord {
  courseSlug: string;
  year: number;
  month: number;
  status: CoverageStatus;
  intakeName?: string;
  startDate?: string;
  applicationOpens?: string;
  applicationCloses?: string;
  internationalDeadline?: string;
  feeAmount?: number;
  feeCurrency?: string;
  academicYear?: string;
  feePeriod?: string;
  studentCategory?: string;
  applicationFee?: number;
  applicationFeeCurrency?: string;
  depositAmount?: number;
  depositCurrency?: string;
  scholarshipNote?: string;
  academicRequirement?: string;
  bangladeshRequirement?: string;
  englishRequirements?: EnglishRequirements;
  workExperienceRequirement?: string;
  portfolioRequirement?: string;
  interviewRequirement?: string;
  documentRequirements?: string[];
  internationalEligibility?: string;
  studyMode?: string;
  campus?: string;
  qualification?: string;
  courseSourceUrl?: string;
  feeSourceUrl?: string;
  intakeSourceUrl?: string;
  requirementSourceUrl?: string;
  sourcePublishedAt?: string;
  /** Dataset-local evidence ids supporting this course-month row. */
  evidenceIds: string[];
  confidence: number;
  conflictNote?: string;
  /** Free-text research note (never parsed; shown to reviewers). */
  notes?: string;
}

export interface TraversalRecord {
  universitySlug: string;
  countrySlug: string;
  catalogueUrl: string;
  catalogueType?: 'PROGRAMME_LIST' | 'FACULTY_DIRECTORY' | 'DEPARTMENT_LIST' | 'PDF_PROSPECTUS';
  facultyOrDepartment?: string;
  httpStatus?: number;
  pageTitle?: string;
  programmeLinksObserved?: number;
  coursesDiscovered?: number;
  coursesVerified?: number;
  paginationComplete?: boolean;
  nextPageUrl?: string;
  completeness: TraversalCompleteness;
  notes?: string;
  lastTraversedAt: string;
}

export interface ResearchQueueRecord {
  countrySlug: string;
  universityName: string;
  universitySlug?: string;
  officialWebsite?: string;
  catalogueUrl?: string;
  priority?: number;
  status?: 'QUEUED' | 'IN_PROGRESS' | 'VERIFIED' | 'BLOCKED' | 'DEFERRED';
  reason: string;
  discoveredVia?: string;
  nextAction?: string;
}

export interface VerifiedDataset {
  schemaVersion: string;
  datasetId: string;
  generatedAt: string;
  window: { startYear: number; startMonth: number; endYear: number; endMonth: number };
  notes?: string;
  evidence: EvidenceRecord[];
  universities: UniversityRecord[];
  courses: CourseRecord[];
  coverage: CoverageRecord[];
  traversals: TraversalRecord[];
  researchQueue: ResearchQueueRecord[];
}

export interface ValidationIssue {
  code: string;
  path: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface IngestCounts {
  evidenceCreated: number;
  evidenceUpdated: number;
  universitiesUpserted: number;
  coursesUpserted: number;
  coverageCreated: number;
  coverageUpdated: number;
  coverageUnchanged: number;
  traversalsUpserted: number;
  queueUpserted: number;
  approvalItemsCreated: number;
  applied: boolean;
}

export interface PublishCounts {
  approved: number;
  rejected: number;
  skipped: number;
  coursesPublished: number;
  universitiesPublished: number;
}
