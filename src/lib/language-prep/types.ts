// English Language Preparation System — Types
// ALO 10X Ready — Premium white-first design

export type TestType = 'english_proficiency' | 'academic' | 'moi_guidance' | 'professional';
export type VerificationStatus = 'verified' | 'pending' | 'needs_review';

export interface EnglishTest {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  shortDescription: string;
  longDescription: string;
  testType: TestType;
  provider: string;
  logo?: string;
  icon?: string;
  officialUrl: string;
  format: string; // e.g. Paper / Computer / Online
  durationMinutes: number;
  durationDisplay: string; // e.g. ~2h 45m
  scoringSystem: string; // e.g. Band 0-9
  resultTimeline: string; // verified or "Check current provider information"
  costSummary: string;
  validitySummary: string;
  bestFor: string;
  acceptanceSummary: string;
  difficultyLevel: string;
  status: 'active' | 'draft' | 'archived';
  isPopular: boolean;
  isFeatured: boolean;
  sortOrder: number;
  sourceUrl: string;
  sourceName: string;
  verifiedBy: string;
  verificationStatus: VerificationStatus;
  lastVerifiedAt?: string;
  seoTitle: string;
  seoDescription: string;
}

export interface TestModule {
  id: string;
  testId: string;
  moduleName: string; // Listening, Reading, Writing, Speaking etc
  slug: string;
  durationMinutes: number;
  durationDisplay: string;
  description: string;
  skillsAssessed: string;
  questionFormat: string;
  preparationTips: string;
  commonChallenges: string;
  sortOrder: number;
  status: 'active' | 'draft';
  sourceUrl?: string;
}

export interface TestAcceptance {
  id: string;
  testId: string;
  countryId: string;
  countryName: string;
  countrySlug: string;
  acceptanceType: 'university' | 'visa' | 'professional' | 'general';
  summary: string;
  minimumNote: string;
  sourceUrl: string;
  sourceName: string;
  verifiedBy: string;
  lastVerifiedAt?: string;
  status: 'active';
}

export interface TestRequirement {
  id: string;
  testId: string;
  countryId: string;
  countryName: string;
  universityId?: string;
  universityName?: string;
  courseId?: string;
  courseName?: string;
  studyLevel?: string;
  minimumScore: string;
  componentRequirements: string;
  waiverAvailable: boolean;
  remarks: string;
  sourceUrl: string;
  sourceName: string;
  verifiedBy: string;
  lastVerifiedAt?: string;
  status: 'active';
}

export interface TestFaq {
  id: string;
  testId: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  status: 'active';
  sourceUrl?: string;
}

export interface TestResource {
  id: string;
  testId: string;
  title: string;
  description: string;
  resourceType: 'guide' | 'mock_test' | 'practice' | 'video' | 'article' | 'official_link' | 'tool';
  resourceUrl: string;
  isExternal: boolean;
  sortOrder: number;
  status: 'active';
}

export interface SuccessStory {
  id: string;
  testId: string;
  studentName: string;
  countryName: string;
  universityName: string;
  courseName: string;
  previousScore: string;
  finalScore: string;
  destination: string;
  testimonial: string;
  photo?: string;
  consentStatus: 'pending' | 'approved' | 'rejected';
  status: 'draft' | 'published' | 'archived';
}

export interface LanguagePrepLead {
  id?: string;
  name: string;
  phone: string;
  email: string;
  countryName?: string;
  universityName?: string;
  courseName?: string;
  testName?: string;
  currentScore?: string;
  targetScore?: string;
  intake?: string;
  currentLevel?: string;
  preferredFormat?: string;
  preparationTime?: string;
  source: string;
  sourceSection: string;
  status?: string;
}

export interface StudentEnglishPrepProfile {
  studentId: string;
  preferredTest?: string;
  preferredTestId?: string;
  currentTest?: string;
  currentScore?: string;
  targetScore?: string;
  testDate?: string;
  preparationStatus: 'not_started' | 'assessing' | 'preparing' | 'mock_testing' | 'ready' | 'completed';
  progress: number;
  weakestModule?: string;
  strongestModule?: string;
  recommendedTest?: string;
  counselorRecommendation?: string;
  upcomingMock?: string;
}

export const BRANDING = {
  bg: '#FFFFFF',
  primaryBlue: '#0057B8',
  ctaOrange: '#E8501A',
  text: '#0F172A',
  softBg: '#F8FAFC',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

export const COUNTRIES = [
  { id: 'uk', name: 'UK', slug: 'uk', flag: '🇬🇧' },
  { id: 'canada', name: 'Canada', slug: 'canada', flag: '🇨🇦' },
  { id: 'australia', name: 'Australia', slug: 'australia', flag: '🇦🇺' },
  { id: 'usa', name: 'USA', slug: 'usa', flag: '🇺🇸' },
  { id: 'ireland', name: 'Ireland', slug: 'ireland', flag: '🇮🇪' },
  { id: 'new-zealand', name: 'New Zealand', slug: 'new-zealand', flag: '🇳🇿' },
  { id: 'uae', name: 'Dubai/UAE', slug: 'uae', flag: '🇦🇪' },
  { id: 'europe', name: 'Europe', slug: 'europe', flag: '🇪🇺' },
];

/** Only these consent-approved public fields may reach the landing page. */
export interface PublishedLanguageStory {
  id: string;
  studentName: string;
  universityName: string;
  courseName: string;
  previousScore: string;
  finalScore: string;
  testimonial: string;
}
