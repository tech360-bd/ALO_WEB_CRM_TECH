export const OFFICIAL_SOURCE_TYPES = [
  'UNIVERSITY_PROFILE',
  'INTERNATIONAL_ADMISSIONS',
  'COURSE_DIRECTORY',
  'UNDERGRADUATE_DIRECTORY',
  'POSTGRADUATE_DIRECTORY',
  'RESEARCH_DIRECTORY',
  'TUITION_FEES',
  'ENTRY_REQUIREMENTS',
  'COUNTRY_REQUIREMENTS',
  'SCHOLARSHIPS',
  'INTAKE_CALENDAR',
  'INDIVIDUAL_COURSE',
] as const;

export type OfficialSourceType = (typeof OFFICIAL_SOURCE_TYPES)[number];

export const OFFICIAL_CRAWL_STATUSES = [
  'DISCOVERED',
  'FETCHED',
  'PARSED',
  'NEEDS_REVIEW',
  'VERIFIED',
  'PUBLISHED',
  'ARCHIVED',
  'REJECTED',
  'FETCH_FAILED',
  'PARSE_FAILED',
] as const;

export type OfficialCrawlStatus = (typeof OFFICIAL_CRAWL_STATUSES)[number];

export interface SourceCheckResult {
  requestedUrl: string;
  finalUrl: string;
  httpStatus: number;
  ok: boolean;
  pageTitle: string;
  sourceType: OfficialSourceType;
  expectedEntity: string;
  entityMatchStatus: 'MATCHED' | 'MISMATCHED' | 'NOT_CHECKED';
  soft404: boolean;
  contentHash: string;
  checkedAt: string;
  failureReason?: string;
  html?: string;
}

export interface CourseUrlDiscovery {
  url: string;
  sourceUrl: string;
  linkText: string;
  contentHash: string;
}

export interface ExtractedUniversityProfile {
  officialName: string;
  aliases: string[];
  officialWebsite: string;
  internationalAdmissionsUrl: string;
  country: string;
  region: string;
  city: string;
  campuses: string[];
  institutionType: string;
  establishedYear?: number;
  availableStudyLevels: string[];
  rankingRecords: Array<{ provider: string; year: string; rankValue: string; sourceUrl: string }>;
  generalTuitionInfo?: string;
  englishRequirements?: string;
  bangladeshRequirements?: string;
  officialSourceChecks?: SourceCheckResult[];
  lastVerifiedAt: string;
  verificationStatus: OfficialCrawlStatus;
}

export interface ExtractedCourseRecord {
  officialCourseTitle: string;
  normalizedTitle: string;
  officialCourseUrl: string;
  courseCode?: string;
  award: string; // BA, BSc, MSc, MBA, PhD, MPhil, Top-up, Foundation
  qualification: string;
  studyLevel: string; // Undergraduate, Postgraduate, Foundation, Research
  discipline?: string;
  department?: string;
  courseStatus: string; // OPEN, CLOSED, ARCHIVED, CLEARING, FUTURE_INTAKE, NEEDS_REVIEW
  
  // Delivery
  campus: string;
  city: string;
  country: string;
  studyMode: string; // Full-time, Part-time
  deliveryMode: string; // Campus-based, Online, Blended
  duration: string;
  placementOption: boolean;
  internshipOption: boolean;
  yearAbroad: boolean;
  startMonth: string;
  startYear: string;
  intakes: Array<{
    intakeMonth: string;
    intakeYear: string;
    deadline?: string;
    tuitionFee?: number;
    feeCurrency?: string;
    deposit?: number;
    status: string;
  }>;
  
  // Tuition & Costs
  internationalTuitionFee?: number;
  homeTuitionFee?: number;
  feeCurrency: string;
  feePeriod: string;
  feeYear: string;
  deposit?: number;
  applicationFee?: number;
  feeSourceUrl: string;

  // Requirements
  academicRequirements: string;
  minimumGradeOrGpa?: string;
  englishRequirements: string;
  ieltsOverall?: number;
  ieltsComponentMin?: number;
  pteScore?: number;
  toeflScore?: number;
  duolingoScore?: number;
  bangladeshRequirements?: string;
  workExperienceRequired: boolean;
  portfolioRequired: boolean;
  interviewRequired: boolean;

  // Content
  courseSummary: string;
  modules?: Array<{ title: string; yearOrSemester?: string; compulsory: boolean }>;
  careerOutcomes?: string;

  // Evidence
  sourceUrl: string;
  pageTitle: string;
  extractedTimestamp: string;
  lastVerifiedTimestamp: string;
  verificationStatus: OfficialCrawlStatus;
  parserVersion: string;
  contentChecksum: string;
  evidenceSnippet: string;
  sourceChecks?: SourceCheckResult[];
  parseWarnings?: string[];
}

export interface UniversityAdapter {
  adapterName: string;
  targetDomain: string;
  discoverCourseUrls(catalogUrl?: string): Promise<CourseUrlDiscovery[]>;
  parseUniversityProfile(url: string): Promise<ExtractedUniversityProfile>;
  parseCourseIdentity(html: string, url: string): Partial<ExtractedCourseRecord>;
  parseCourseDelivery(html: string): Partial<ExtractedCourseRecord>;
  parseFees(html: string, url: string): Partial<ExtractedCourseRecord>;
  parseIntakes(html: string): Array<ExtractedCourseRecord['intakes'][0]>;
  parseRequirements(html: string): Partial<ExtractedCourseRecord>;
  parseModules(html: string): Array<{ title: string; yearOrSemester?: string; compulsory: boolean }>;
  parseScholarships(html: string): Array<{ name: string; amount: string; url: string }>;
  validateRecord(record: ExtractedCourseRecord): { valid: boolean; errors: string[] };
  collectEvidence(url: string, html: string, fieldName: string): string;
}
