/**
 * Higher Study platform — shared TypeScript types.
 * --------------------------------------------------------------------
 * These types describe the public shape of Higher Study entities used
 * across the Higher Study pages and APIs. They mirror the Prisma models
 * in `prisma/schema.prisma` (prefixed with `HigherStudy`) but are written
 * as plain TS interfaces so they can be imported safely by both server
 * and client code without pulling Prisma's generated runtime.
 *
 * All entities follow the verification + publication discipline:
 *  - `verificationStatus` controls editorial sign-off
 *  - `publicationStatus` controls whether the public API returns the row
 *  - `lastVerifiedAt` / `lastVerifiedBy` / `officialSourceUrl` track the
 *    evidence chain (no fabricated metrics, no unverifiable claims).
 */

// ─── Status unions ───────────────────────────────────────────────────

/** Editorial verification lifecycle for Higher Study entities. */
export type VerificationStatus =
  | "draft"
  | "pending-review"
  | "verified"
  | "published"
  | "needs-update"
  | "archived";

/** Publication gate (separate from verification). */
export type PublicationStatus = "draft" | "published" | "archived";

/** Lifecycle of a referral handoff to ALO Education. */
export type ReferralStatus =
  | "created"
  | "transferred"
  | "completed"
  | "failed"
  | "expired";

/** Lifecycle of a deadline alert. */
export type AlertStatus = "active" | "fired" | "cancelled" | "expired";

/** Lifecycle of an event / webinar. */
export type EventStatus = "upcoming" | "live" | "ended" | "cancelled";

/** Lifecycle of a bulk import job. */
export type ImportJobStatus =
  | "pending"
  | "preview"
  | "importing"
  | "completed"
  | "failed"
  | "cancelled";

/** Saved-item / comparison entity categories. */
export type EntityType =
  | "university"
  | "course"
  | "scholarship"
  | "research"
  | "supervisor"
  | "resource"
  | "comparison";

/** Referral channels handled by the platform. */
export type ReferralType =
  | "course-application"
  | "university-application"
  | "scholarship-application"
  | "phd-application"
  | "research-application"
  | "supervisor-enquiry"
  | "eligibility-check"
  | "consultation"
  | "resource-referral"
  | "deadline-alert"
  | "english-referral";

// ─── Study Destinations ──────────────────────────────────────────────

/** Country / study destination record. */
export interface Country {
  id: string;
  slug: string;
  name: string;
  officialName?: string | null;
  region?: string | null;
  overview?: string | null;
  educationSystem?: string | null;
  studyLevels?: string | null;
  popularSubjects?: string | null;
  tuitionFeeRange?: string | null;
  livingCostRange?: string | null;
  majorStudentCities?: string | null;
  admissionRequirements?: string | null;
  englishRequirements?: string | null;
  availableIntakes?: string | null;
  applicationDeadlines?: string | null;
  scholarshipsAvailable: boolean;
  researchOpportunities: boolean;
  studentVisaOverview?: string | null;
  financialEvidence?: string | null;
  workRights?: string | null;
  postStudyOpportunities?: string | null;
  accommodation?: string | null;
  healthcare?: string | null;
  transport?: string | null;
  studentSafety?: string | null;
  culturalInfo?: string | null;
  applicationProcess?: string | null;
  requiredDocuments?: string | null;
  faq?: string | null;
  officialSources?: string | null;
  imageUrl?: string | null;
  flagEmoji?: string | null;
  status: PublicationStatus;
  lastVerifiedAt?: Date | null;
  lastVerifiedBy?: string | null;
  officialSourceUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Inline summary of cities (optional, only populated on detail pages). */
  cities?: City[];
}

/** City inside a country. */
export interface City {
  id: string;
  slug: string;
  name: string;
  countryId: string;
  overview?: string | null;
  livingCost?: string | null;
  transport?: string | null;
  accommodation?: string | null;
  studentLife?: string | null;
  status: PublicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Universities ────────────────────────────────────────────────────

/** External link reference (parsed from JSON column). */
export interface OfficialLink {
  label: string;
  url: string;
}

/** Ranking entry (parsed from JSON column). */
export interface RankingEntry {
  provider: string;
  year?: number | string;
  category?: string;
  rank?: string | number;
  source?: string;
}

/** University record. */
export interface University {
  id: string;
  slug: string;
  officialName: string;
  alternativeNames?: string | null;
  overview?: string | null;
  establishedYear?: number | null;
  institutionType?: string | null;
  countryId: string;
  cityId?: string | null;
  campusLocations?: string | null;
  officialWebsite?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  availableIntakes?: string | null;
  studyLevels?: string | null;
  undergraduateCount?: number | null;
  postgraduateCount?: number | null;
  hasMBA: boolean;
  hasMRes: boolean;
  hasMPhil: boolean;
  hasPhD: boolean;
  hasProfessionalDoctorate: boolean;
  researchDepartments?: string | null;
  researchStrengths?: string | null;
  tuitionFeeRange?: string | null;
  depositInfo?: string | null;
  academicEntryRequirements?: string | null;
  countrySpecificRequirements?: string | null;
  ieltsRequirement?: string | null;
  ieltsUkviRequirement?: string | null;
  pteRequirement?: string | null;
  toeflRequirement?: string | null;
  duolingoRequirement?: string | null;
  languageCertRequirement?: string | null;
  oxfordElltRequirement?: string | null;
  englishWaiverPolicy?: string | null;
  workExperienceRequired: boolean;
  portfolioRequired: boolean;
  interviewRequired: boolean;
  applicationDeadlines?: string | null;
  accommodationOptions?: string | null;
  estimatedLivingCosts?: string | null;
  internationalStudentServices?: string | null;
  disabilitySupport?: string | null;
  careerSupport?: string | null;
  graduateOutcomes?: string | null;
  graduateRouteGuidance?: string | null;
  applicationGuidance?: string | null;
  officialLinks?: string | null;
  rankingsJson?: string | null;
  logoUrl?: string | null;
  featured: boolean;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  lastVerifiedAt?: Date | null;
  lastVerifiedBy?: string | null;
  officialSourceUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Optional related rows (populated only on detail pages). */
  country?: Country;
  city?: City | null;
  courses?: Course[];
  scholarships?: Scholarship[];
  researchProjects?: ResearchProject[];
  supervisors?: Supervisor[];
}

// ─── Subjects & Intakes ─────────────────────────────────────────────

/** Subject / discipline taxonomy node. */
export interface Subject {
  id: string;
  slug: string;
  name: string;
  category?: string | null;
  description?: string | null;
  iconUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Intake / cohort window. */
export interface Intake {
  id: string;
  slug: string;
  name: string;
  startDate?: Date | null;
  endDate?: Date | null;
  applicationDeadline?: Date | null;
  status: "open" | "closed" | "upcoming";
  createdAt: Date;
  updatedAt: Date;
}

// ─── Courses ─────────────────────────────────────────────────────────

/** Course / programme record. */
export interface Course {
  id: string;
  slug: string;
  title: string;
  universityId: string;
  countryId?: string | null;
  subjectId?: string | null;
  studyLevel: string;
  qualification?: string | null;
  specialisation?: string | null;
  overview?: string | null;
  modules?: string | null;
  duration?: string | null;
  studyMode?: string | null;
  tuitionFee?: number | null;
  tuitionCurrency: string;
  otherCosts?: string | null;
  scholarshipAvailable: boolean;
  academicEntryRequirements?: string | null;
  countrySpecificRequirements?: string | null;
  englishRequirements?: string | null;
  workExperienceRequired: boolean;
  portfolioRequired: boolean;
  interviewRequired: boolean;
  careerOutcomes?: string | null;
  placementInfo?: string | null;
  researchComponent?: string | null;
  applicationDeadline?: string | null;
  requiredDocuments?: string | null;
  intakeId?: string | null;
  officialSourceUrl?: string | null;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  lastVerifiedAt?: Date | null;
  lastVerifiedBy?: string | null;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Optional related rows (populated only on detail pages). */
  university?: University;
  country?: Country;
  subject?: Subject | null;
  intake?: Intake | null;
}

// ─── Scholarships ────────────────────────────────────────────────────

/** Scholarship / funding opportunity. */
export interface Scholarship {
  id: string;
  slug: string;
  name: string;
  provider?: string | null;
  countryId?: string | null;
  universityId?: string | null;
  eligibleStudyLevels?: string | null;
  eligibleSubjects?: string | null;
  eligibleNationalities?: string | null;
  fundingType?: string | null;
  fundingAmount?: string | null;
  tuitionCoverage: boolean;
  livingCostCoverage: boolean;
  travelSupport: boolean;
  healthInsurance: boolean;
  otherBenefits?: string | null;
  eligibilityCriteria?: string | null;
  academicRequirement?: string | null;
  englishRequirement?: string | null;
  workExperienceRequired: boolean;
  requiredDocuments?: string | null;
  openingDate?: Date | null;
  deadline?: Date | null;
  applicationProcess?: string | null;
  selectionProcess?: string | null;
  restrictions?: string | null;
  officialSourceUrl?: string | null;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  lastVerifiedAt?: Date | null;
  lastVerifiedBy?: string | null;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Optional related rows (populated only on detail pages). */
  country?: Country;
  university?: University | null;
}

// ─── Research ────────────────────────────────────────────────────────

/** Research area taxonomy node. */
export interface ResearchArea {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** PhD / postdoctoral research project. */
export interface ResearchProject {
  id: string;
  slug: string;
  title: string;
  universityId: string;
  department?: string | null;
  researchGroupId?: string | null;
  researchAreaId?: string | null;
  supervisorId?: string | null;
  coSupervisorId?: string | null;
  projectSummary?: string | null;
  researchObjectives?: string | null;
  methodologySummary?: string | null;
  candidateProfile?: string | null;
  academicRequirements?: string | null;
  englishRequirements?: string | null;
  fundingStatus?: string | null;
  tuitionCoverage: boolean;
  stipend?: string | null;
  additionalFunding?: string | null;
  duration?: string | null;
  startDate?: Date | null;
  applicationDeadline?: Date | null;
  requiredDocuments?: string | null;
  applicationProcess?: string | null;
  officialSourceUrl?: string | null;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  lastVerifiedAt?: Date | null;
  lastVerifiedBy?: string | null;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Optional related rows (populated only on detail pages). */
  university?: University;
  researchArea?: ResearchArea | null;
  supervisor?: Supervisor | null;
}

// ─── Supervisors ─────────────────────────────────────────────────────

/** Supervisor / faculty member (public profile only). */
export interface Supervisor {
  id: string;
  slug: string;
  name: string;
  academicTitle?: string | null;
  universityId: string;
  department?: string | null;
  publicProfileUrl?: string | null;
  researchAreaId?: string | null;
  researchInterests?: string | null;
  selectedPublications?: string | null;
  currentProjects?: string | null;
  acceptingStudents: boolean;
  applicationGuidance?: string | null;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  lastVerifiedAt?: Date | null;
  lastVerifiedBy?: string | null;
  officialSourceUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Optional related rows (populated only on detail pages). */
  university?: University;
  researchArea?: ResearchArea | null;
  researchProjects?: ResearchProject[];
}

// ─── Resources / Stories / Events ────────────────────────────────────

/** Long-form study resource / guide. */
export interface Resource {
  id: string;
  slug: string;
  title: string;
  category?: string | null;
  summary?: string | null;
  content?: string | null;
  author?: string | null;
  reviewer?: string | null;
  publishedAt?: Date | null;
  updatedAt: Date;
  lastVerifiedAt?: Date | null;
  readingTimeMinutes?: number | null;
  tableOfContents?: string | null;
  relatedUniversitySlugs?: string | null;
  relatedCourseSlugs?: string | null;
  relatedScholarshipSlugs?: string | null;
  officialSourceUrl?: string | null;
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  featured: boolean;
  createdAt: Date;
}

/** Student story / testimonial. */
export interface StudentStory {
  id: string;
  slug: string;
  studentName: string;
  universityName?: string | null;
  courseName?: string | null;
  country?: string | null;
  intake?: string | null;
  story?: string | null;
  advice?: string | null;
  imageUrl?: string | null;
  publishedAt?: Date | null;
  featured: boolean;
  createdAt: Date;
}

/** Event / webinar. */
export interface HigherStudyEvent {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  eventDate: Date;
  endDate?: Date | null;
  location?: string | null;
  organiser?: string | null;
  registrationUrl?: string | null;
  imageUrl?: string | null;
  status: EventStatus;
  createdAt: Date;
}

// ─── User-tracked entities ───────────────────────────────────────────

/** Saved item (anonymous session or authenticated user). */
export interface SavedItem {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  entityType: EntityType;
  entitySlug: string;
  entityName: string;
  notes?: string | null;
  createdAt: Date;
}

/** Comparison group (max 4 entities per comparison). */
export interface Comparison {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  entityType: EntityType;
  entitySlugs: string;
  name?: string | null;
  createdAt: Date;
}

/** Deadline alert subscription. */
export interface Alert {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  entityType: "scholarship" | "research" | "course" | "event";
  entitySlug: string;
  entityName: string;
  deadlineDate: Date;
  alertChannel: "email" | "in-app" | "whatsapp";
  alertSent: boolean;
  alertSentAt?: Date | null;
  consentGiven: boolean;
  consentTimestamp?: Date | null;
  status: AlertStatus;
  createdAt: Date;
}

// ─── Referral ────────────────────────────────────────────────────────

/** ALO Education referral handoff audit record. */
export interface Referral {
  id: string;
  referralCode: string;
  source: string;
  referralType: ReferralType;
  targetUrl: string;
  countrySlug?: string | null;
  universitySlug?: string | null;
  courseSlug?: string | null;
  scholarshipSlug?: string | null;
  researchSlug?: string | null;
  supervisorSlug?: string | null;
  studyLevel?: string | null;
  intake?: string | null;
  campaignCode?: string | null;
  consentGiven: boolean;
  consentVersion?: string | null;
  consentTimestamp?: Date | null;
  status: ReferralStatus;
  transferredAt?: Date | null;
  completedAt?: Date | null;
  failureReason?: string | null;
  expiresAt?: Date | null;
  ipHash?: string | null;
  deviceCategory?: "mobile" | "tablet" | "desktop" | null;
  createdAt: Date;
}

// ─── Filter objects ──────────────────────────────────────────────────

/** Common pagination + sort params (parsed from query string). */
export interface PaginationParams {
  page: number;
  limit: number;
  sort: string;
  order: "asc" | "desc";
}

/** Filter options shared by university / course / scholarship filters. */
export interface BaseFilter extends PaginationParams {
  q?: string;
  countrySlug?: string;
  citySlug?: string;
  studyLevel?: string;
  subjectSlug?: string;
  intakeSlug?: string;
  fundingType?: string;
  featured?: boolean;
  /** Comma-separated list of slugs to compare. */
  slugs?: string;
}

/** University-specific filter. */
export interface UniversityFilter extends BaseFilter {
  institutionType?: string;
  hasMBA?: boolean;
  hasPhD?: boolean;
  hasMRes?: boolean;
  hasMPhil?: boolean;
  hasProfessionalDoctorate?: boolean;
  /** Min undergraduate programmes offered. */
  minUndergraduateCount?: number;
  /** Min postgraduate programmes offered. */
  minPostgraduateCount?: number;
}

/** Course-specific filter. */
export interface CourseFilter extends BaseFilter {
  universitySlug?: string;
  scholarshipAvailable?: boolean;
  workExperienceRequired?: boolean;
  studyMode?: string;
  /** Max tuition fee in USD. */
  maxTuitionFee?: number;
}

/** Scholarship-specific filter. */
export interface ScholarshipFilter extends BaseFilter {
  universitySlug?: string;
  provider?: string;
  programme?: string;
  tuitionCoverage?: boolean;
  livingCostCoverage?: boolean;
  travelSupport?: boolean;
  healthInsurance?: boolean;
  /** Filter by deadline after this ISO date. */
  deadlineAfter?: string;
  /** Filter by deadline before this ISO date. */
  deadlineBefore?: string;
}

/** Research project filter. */
export interface ResearchFilter extends BaseFilter {
  universitySlug?: string;
  researchAreaSlug?: string;
  supervisorSlug?: string;
  fundingStatus?: string;
  acceptingStudents?: boolean;
}

/** Supervisor filter. */
export interface SupervisorFilter extends BaseFilter {
  universitySlug?: string;
  researchAreaSlug?: string;
  acceptingStudents?: boolean;
}

/** Resource filter. */
export interface ResourceFilter extends BaseFilter {
  category?: string;
  author?: string;
}

// ─── API responses ───────────────────────────────────────────────────

/** Pagination metadata returned with every list response. */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** Standard envelope returned by every Higher Study API. */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  meta: Record<string, unknown>;
  errors: unknown[];
}

/** Paginated search response. */
export interface SearchResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

/** Comparison row (entity slug + display fields for side-by-side compare UI). */
export interface ComparisonRow {
  slug: string;
  name: string;
  /** Field-key → value map for the comparison grid. */
  fields: Record<string, string | number | boolean | null>;
}

/** Compare response returned by the compare API. */
export interface ComparisonResponse {
  entityType: EntityType;
  columns: string[];
  rows: ComparisonRow[];
}

/** Faceted filter summary (used by filter sidebar). */
export interface FacetBucket {
  value: string;
  label: string;
  count: number;
}

/** Faceted response shape (list + facet counts). */
export interface FacetedResponse<T> extends SearchResponse<T> {
  facets: Record<string, FacetBucket[]>;
}

// ─── Referral helpers ────────────────────────────────────────────────

/** Safe, public-only context attached to a referral (no PII). */
export interface ReferralContext {
  countrySlug?: string;
  universitySlug?: string;
  courseSlug?: string;
  scholarshipSlug?: string;
  researchSlug?: string;
  supervisorSlug?: string;
  studyLevel?: string;
  intake?: string;
  campaignCode?: string;
}

/** Payload encoded inside the signed referral token. */
export interface ReferralTokenPayload {
  referralCode: string;
  referralType: ReferralType;
  iat: number;
  exp: number;
}

/** Options accepted by `createReferralRecord`. */
export interface CreateReferralOptions {
  referralType: ReferralType;
  source?: string;
  consentGiven: boolean;
  consentVersion?: string;
  ipHash?: string | null;
  deviceCategory?: "mobile" | "tablet" | "desktop" | null;
  userAgent?: string | null;
  context?: ReferralContext;
  campaignCode?: string;
}

// ─── SEO ─────────────────────────────────────────────────────────────

/** Breadcrumb entry used by JSON-LD builders. */
export interface BreadcrumbItem {
  name: string;
  url: string;
}

/** FAQ entry used by JSON-LD builder. */
export interface FaqItem {
  question: string;
  answer: string;
}

/** Options accepted by `buildHigherStudyMetadata`. */
export interface HigherStudyMetadataOptions {
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
