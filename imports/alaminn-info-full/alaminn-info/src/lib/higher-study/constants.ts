/**
 * Higher Study platform — shared constants.
 * --------------------------------------------------------------------
 * Single source of truth for:
 *  - Study level taxonomy (33 levels across 5 groups)
 *  - Study destination countries (30 countries with region + flag)
 *  - Scholarship funding types (24)
 *  - Major scholarship programmes (named, branded programmes)
 *  - Referral sources (12 CRM channels for attribution)
 *  - English test definitions (7 tests with typical minimum scores)
 *  - Higher Study internal navigation (14 nav items)
 *  - ALO Education integration URLs (verified routes)
 *
 * NOTE: these constants describe the *shape* of the platform. Individual
 * entity counts (universities, courses) come from the database at query
 * time and are never hard-coded here — see docs/CLAIM_REGISTER.md.
 */

import type { ReferralType } from "@/lib/higher-study/types";

// ─── Study levels (33) ───────────────────────────────────────────────

/** Single study level option used by filter dropdowns and selectors. */
export interface StudyLevelOption {
  value: string;
  label: string;
}

/** All 33 supported study levels (matches HigherStudyCourse.studyLevel). */
export const STUDY_LEVELS: StudyLevelOption[] = [
  { value: "foundation", label: "Foundation" },
  { value: "international-year-one", label: "International Year One" },
  { value: "diploma", label: "Diploma" },
  { value: "hnd", label: "Higher National Diploma (HND)" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "bachelors-topup", label: "Bachelor's Top-Up" },
  { value: "graduate-certificate", label: "Graduate Certificate" },
  { value: "graduate-diploma", label: "Graduate Diploma" },
  { value: "pre-masters", label: "Pre-Master's" },
  { value: "masters", label: "Master's Degree" },
  { value: "mba", label: "Master of Business Administration (MBA)" },
  { value: "executive-mba", label: "Executive MBA" },
  { value: "msc", label: "Master of Science (MSc)" },
  { value: "ma", label: "Master of Arts (MA)" },
  { value: "llm", label: "Master of Laws (LLM)" },
  { value: "meng", label: "Master of Engineering (MEng)" },
  { value: "march", label: "Master of Architecture (MArch)" },
  { value: "mph", label: "Master of Public Health (MPH)" },
  { value: "mpa", label: "Master of Public Administration (MPA)" },
  { value: "mres", label: "Master of Research (MRes)" },
  { value: "mphil", label: "Master of Philosophy (MPhil)" },
  { value: "phd", label: "Doctor of Philosophy (PhD)" },
  { value: "dba", label: "Doctor of Business Administration (DBA)" },
  { value: "edd", label: "Doctor of Education (EdD)" },
  { value: "dprof", label: "Professional Doctorate (DProf)" },
  { value: "engineering-doctorate", label: "Engineering Doctorate (EngD)" },
  { value: "postdoc", label: "Postdoctoral Research" },
  { value: "research-fellowship", label: "Research Fellowship" },
  { value: "online", label: "Online Programme" },
  { value: "distance", label: "Distance Learning" },
  { value: "blended", label: "Blended Learning" },
  { value: "executive-education", label: "Executive Education" },
  { value: "professional-cert", label: "Professional Certificate" },
];

/** Lookup map: study level value → label. */
export const STUDY_LEVEL_MAP: Record<string, string> = Object.fromEntries(
  STUDY_LEVELS.map((l) => [l.value, l.label]),
);

// ─── Study level groups (for selector UI) ────────────────────────────

/** Grouped study levels for the selector UI. */
export interface StudyLevelGroup {
  id: string;
  label: string;
  description: string;
  values: string[];
}

/** Five high-level groups that organise the 33 study levels. */
export const STUDY_LEVEL_GROUPS: StudyLevelGroup[] = [
  {
    id: "undergraduate",
    label: "Undergraduate",
    description: "Foundation, diploma and bachelor's pathways.",
    values: [
      "foundation",
      "international-year-one",
      "diploma",
      "hnd",
      "bachelors",
      "bachelors-topup",
    ],
  },
  {
    id: "postgraduate-taught",
    label: "Postgraduate Taught",
    description: "Master's, MBA and specialist taught degrees.",
    values: [
      "graduate-certificate",
      "graduate-diploma",
      "pre-masters",
      "masters",
      "mba",
      "executive-mba",
      "msc",
      "ma",
      "llm",
      "meng",
      "march",
      "mph",
      "mpa",
    ],
  },
  {
    id: "postgraduate-research",
    label: "Postgraduate Research",
    description: "Research master's, doctorates and postdocs.",
    values: [
      "mres",
      "mphil",
      "phd",
      "dba",
      "edd",
      "dprof",
      "engineering-doctorate",
      "postdoc",
      "research-fellowship",
    ],
  },
  {
    id: "professional",
    label: "Professional",
    description: "Executive education and professional certifications.",
    values: ["executive-education", "professional-cert"],
  },
  {
    id: "flexible-learning",
    label: "Flexible Learning",
    description: "Online, distance and blended delivery modes.",
    values: ["online", "distance", "blended"],
  },
];

// ─── Countries (30) ──────────────────────────────────────────────────

/** Country reference (slug, display name, region, flag emoji). */
export interface CountryOption {
  slug: string;
  name: string;
  region: "Europe" | "North America" | "Asia-Pacific" | "Middle East";
  flagEmoji: string;
}

/** 30 supported study destinations. */
export const COUNTRIES_LIST: CountryOption[] = [
  { slug: "uk", name: "United Kingdom", region: "Europe", flagEmoji: "🇬🇧" },
  { slug: "usa", name: "United States", region: "North America", flagEmoji: "🇺🇸" },
  { slug: "canada", name: "Canada", region: "North America", flagEmoji: "🇨🇦" },
  { slug: "australia", name: "Australia", region: "Asia-Pacific", flagEmoji: "🇦🇺" },
  { slug: "ireland", name: "Ireland", region: "Europe", flagEmoji: "🇮🇪" },
  { slug: "new-zealand", name: "New Zealand", region: "Asia-Pacific", flagEmoji: "🇳🇿" },
  { slug: "germany", name: "Germany", region: "Europe", flagEmoji: "🇩🇪" },
  { slug: "netherlands", name: "Netherlands", region: "Europe", flagEmoji: "🇳🇱" },
  { slug: "sweden", name: "Sweden", region: "Europe", flagEmoji: "🇸🇪" },
  { slug: "finland", name: "Finland", region: "Europe", flagEmoji: "🇫🇮" },
  { slug: "denmark", name: "Denmark", region: "Europe", flagEmoji: "🇩🇰" },
  { slug: "norway", name: "Norway", region: "Europe", flagEmoji: "🇳🇴" },
  { slug: "switzerland", name: "Switzerland", region: "Europe", flagEmoji: "🇨🇭" },
  { slug: "france", name: "France", region: "Europe", flagEmoji: "🇫🇷" },
  { slug: "italy", name: "Italy", region: "Europe", flagEmoji: "🇮🇹" },
  { slug: "spain", name: "Spain", region: "Europe", flagEmoji: "🇪🇸" },
  { slug: "belgium", name: "Belgium", region: "Europe", flagEmoji: "🇧🇪" },
  { slug: "austria", name: "Austria", region: "Europe", flagEmoji: "🇦🇹" },
  { slug: "poland", name: "Poland", region: "Europe", flagEmoji: "🇵🇱" },
  { slug: "hungary", name: "Hungary", region: "Europe", flagEmoji: "🇭🇺" },
  { slug: "czech-republic", name: "Czech Republic", region: "Europe", flagEmoji: "🇨🇿" },
  { slug: "portugal", name: "Portugal", region: "Europe", flagEmoji: "🇵🇹" },
  { slug: "malaysia", name: "Malaysia", region: "Asia-Pacific", flagEmoji: "🇲🇾" },
  { slug: "singapore", name: "Singapore", region: "Asia-Pacific", flagEmoji: "🇸🇬" },
  { slug: "japan", name: "Japan", region: "Asia-Pacific", flagEmoji: "🇯🇵" },
  { slug: "south-korea", name: "South Korea", region: "Asia-Pacific", flagEmoji: "🇰🇷" },
  { slug: "china", name: "China", region: "Asia-Pacific", flagEmoji: "🇨🇳" },
  { slug: "uae", name: "United Arab Emirates", region: "Middle East", flagEmoji: "🇦🇪" },
  { slug: "cyprus", name: "Cyprus", region: "Europe", flagEmoji: "🇨🇾" },
  { slug: "malta", name: "Malta", region: "Europe", flagEmoji: "🇲🇹" },
];

/** Lookup map: country slug → country option. */
export const COUNTRIES_MAP: Record<string, CountryOption> = Object.fromEntries(
  COUNTRIES_LIST.map((c) => [c.slug, c]),
);

// ─── Funding types (24) ──────────────────────────────────────────────

/** Single funding type option. */
export interface FundingTypeOption {
  value: string;
  label: string;
}

/** All 24 scholarship funding type values. */
export const FUNDING_TYPES: FundingTypeOption[] = [
  { value: "fully-funded", label: "Fully Funded" },
  { value: "partially-funded", label: "Partially Funded" },
  { value: "government", label: "Government" },
  { value: "university", label: "University" },
  { value: "department", label: "Department" },
  { value: "research-council", label: "Research Council" },
  { value: "merit", label: "Merit-based" },
  { value: "need", label: "Need-based" },
  { value: "country-specific", label: "Country-specific" },
  { value: "subject-specific", label: "Subject-specific" },
  { value: "women", label: "Women in STEM / Leadership" },
  { value: "leadership", label: "Leadership" },
  { value: "sports", label: "Sports Scholarship" },
  { value: "disability", label: "Disability Support" },
  { value: "phd-studentship", label: "PhD Studentship" },
  { value: "research-assistantship", label: "Research Assistantship" },
  { value: "teaching-assistantship", label: "Teaching Assistantship" },
  { value: "tuition-discount", label: "Tuition Discount" },
  { value: "fee-waiver", label: "Fee Waiver" },
  { value: "bursary", label: "Bursary" },
  { value: "grant", label: "Grant" },
  { value: "fellowship", label: "Fellowship" },
  { value: "travel", label: "Travel Grant" },
  { value: "living-cost", label: "Living Cost Support" },
];

/** Lookup map: funding type value → label. */
export const FUNDING_TYPE_MAP: Record<string, string> = Object.fromEntries(
  FUNDING_TYPES.map((f) => [f.value, f.label]),
);

// ─── Scholarship programmes (named branded programmes) ──────────────

/** Major named scholarship programmes (for the "popular programmes" rail). */
export interface ScholarshipProgramme {
  slug: string;
  name: string;
  provider: string;
  region: string;
  summary: string;
  officialUrl: string;
}

/** Major scholarship programmes commonly searched by international students. */
export const SCHOLARSHIP_PROGRAMS: ScholarshipProgramme[] = [
  {
    slug: "chevening",
    name: "Chevening Scholarship",
    provider: "UK Government (FCDO)",
    region: "United Kingdom",
    summary:
      "Fully-funded master's scholarships for emerging global leaders to study in the UK.",
    officialUrl: "https://www.chevening.org",
  },
  {
    slug: "commonwealth",
    name: "Commonwealth Scholarships",
    provider: "Commonwealth Scholarship Commission",
    region: "United Kingdom",
    summary:
      "UK government scholarships for students from Commonwealth countries across all study levels.",
    officialUrl: "https://cscuk.fcdo.gov.uk",
  },
  {
    slug: "great",
    name: "GREAT Scholarships",
    provider: "British Council + UK universities",
    region: "United Kingdom",
    summary:
      "Jointly-funded scholarships for students from selected countries to study at UK universities.",
    officialUrl: "https://study-uk.britishcouncil.org",
  },
  {
    slug: "erasmus-mundus",
    name: "Erasmus Mundus Joint Masters",
    provider: "European Union",
    region: "Europe",
    summary:
      "Fully-funded EU scholarships for international students on joint master's programmes across Europe.",
    officialUrl: "https://www.eacea.ec.europa.eu",
  },
  {
    slug: "rhodes",
    name: "Rhodes Scholarship",
    provider: "Rhodes Trust",
    region: "United Kingdom",
    summary:
      "Fully-funded postgraduate scholarship at the University of Oxford for exceptional students worldwide.",
    officialUrl: "https://www.rhodeshouse.ox.ac.uk",
  },
  {
    slug: "gates-cambridge",
    name: "Gates Cambridge Scholarship",
    provider: "Gates Cambridge Trust",
    region: "United Kingdom",
    summary:
      "Full-cost postgraduate scholarships at the University of Cambridge for outstanding applicants.",
    officialUrl: "https://www.gatescambridge.org",
  },
  {
    slug: "marshall",
    name: "Marshall Scholarship",
    provider: "Marshall Aid Commemoration Commission",
    region: "United Kingdom",
    summary:
      "Postgraduate scholarships for American students to study at any UK university.",
    officialUrl: "https://www.marshallscholarship.org",
  },
  {
    slug: "fulbright",
    name: "Fulbright Programme",
    provider: "US Department of State",
    region: "United States",
    summary:
      "International educational exchange for students, scholars and professionals to study in the US.",
    officialUrl: "https://fulbright.state.gov",
  },
  {
    slug: "daad",
    name: "DAAD Scholarships",
    provider: "Deutscher Akademischer Austauschdienst",
    region: "Germany",
    summary:
      "German academic exchange service funding postgraduate and research stays in Germany.",
    officialUrl: "https://www.daad.de",
  },
  {
    slug: "australia-awards",
    name: "Australia Awards Scholarships",
    provider: "Australian Government (DFAT)",
    region: "Australia",
    summary:
      "Long-term development scholarships for students from partner countries to study in Australia.",
    officialUrl: "https://www.australiaawards.gov.au",
  },
  {
    slug: "new-zealand-scholarships",
    name: "New Zealand Scholarships",
    provider: "New Zealand Government (MFAT)",
    region: "New Zealand",
    summary:
      "Fully-funded scholarships for students from eligible countries to study in New Zealand.",
    officialUrl: "https://www.mfat.govt.nz",
  },
];

// ─── Referral sources (12 CRM channels) ──────────────────────────────

/** Single referral source option for CRM attribution. */
export interface ReferralSourceOption {
  value: string;
  label: string;
  referralType: ReferralType;
}

/** 12 internal referral sources used for CRM attribution and analytics. */
export const REFERRAL_SOURCES: ReferralSourceOption[] = [
  {
    value: "ALAMINN_HIGHER_STUDY",
    label: "Higher Study Hub (browse)",
    referralType: "consultation",
  },
  {
    value: "ALAMINN_COURSE_APPLICATION",
    label: "Course Application",
    referralType: "course-application",
  },
  {
    value: "ALAMINN_UNIVERSITY_APPLICATION",
    label: "University Application",
    referralType: "university-application",
  },
  {
    value: "ALAMINN_SCHOLARSHIP_APPLICATION",
    label: "Scholarship Application",
    referralType: "scholarship-application",
  },
  {
    value: "ALAMINN_PHD_APPLICATION",
    label: "PhD Application",
    referralType: "phd-application",
  },
  {
    value: "ALAMINN_RESEARCH_APPLICATION",
    label: "Research Project Application",
    referralType: "research-application",
  },
  {
    value: "ALAMINN_SUPERVISOR_ENQUIRY",
    label: "Supervisor Enquiry",
    referralType: "supervisor-enquiry",
  },
  {
    value: "ALAMINN_ELIGIBILITY_CHECK",
    label: "Eligibility Check",
    referralType: "eligibility-check",
  },
  {
    value: "ALAMINN_CONSULTATION",
    label: "1:1 Consultation Request",
    referralType: "consultation",
  },
  {
    value: "ALAMINN_RESOURCE_REFERRAL",
    label: "Resource Referral",
    referralType: "resource-referral",
  },
  {
    value: "ALAMINN_DEADLINE_ALERT",
    label: "Deadline Alert",
    referralType: "deadline-alert",
  },
  {
    value: "ALAMINN_ENGLISH_REFERRAL",
    label: "English Learning Referral",
    referralType: "english-referral",
  },
];

/** Lookup map: referral source value → option. */
export const REFERRAL_SOURCE_MAP: Record<string, ReferralSourceOption> =
  Object.fromEntries(REFERRAL_SOURCES.map((r) => [r.value, r]));

// ─── ALO Education integration URLs (verified routes) ───────────────

/** Root URL of the ALO Education student platform. */
export const ALO_EDUCATION_URL = "https://aloeducation.com";

/** Verified student registration route on ALO Education. */
export const ALO_EDUCATION_REGISTER_URL = "https://aloeducation.com/student/register";

/** Verified student login route on ALO Education. */
export const ALO_EDUCATION_LOGIN_URL = "https://aloeducation.com/student/login";

/** English learning subdomain (separate platform). */
export const ENGLISH_LEARNING_URL = "https://english.aloeducation.com";

// ─── English tests (7) ───────────────────────────────────────────────

/** English proficiency test definition. */
export interface EnglishTestOption {
  slug: string;
  name: string;
  fullForm: string;
  typicalRequirement: string;
}

/** English proficiency tests accepted by partner universities. */
export const ENGLISH_TESTS: EnglishTestOption[] = [
  {
    slug: "ielts",
    name: "IELTS Academic",
    fullForm: "International English Language Testing System",
    typicalRequirement: "Overall 6.5 (no band below 6.0)",
  },
  {
    slug: "ielts-ukvi",
    name: "IELTS for UKVI",
    fullForm: "IELTS Academic for UK Visas and Immigration",
    typicalRequirement: "Overall 6.0 (no band below 5.5) — for UK Student Visa route",
  },
  {
    slug: "pte",
    name: "PTE Academic",
    fullForm: "Pearson Test of English Academic",
    typicalRequirement: "Overall 58 (no section below 50)",
  },
  {
    slug: "toefl",
    name: "TOEFL iBT",
    fullForm: "Test of English as a Foreign Language (internet-based)",
    typicalRequirement: "Overall 80 (minimum 18 in each section)",
  },
  {
    slug: "duolingo",
    name: "Duolingo English Test",
    fullForm: "Duolingo English Test (DET)",
    typicalRequirement: "Score 105+ (accepted by many UK/US universities)",
  },
  {
    slug: "languagecert",
    name: "LanguageCert",
    fullForm: "LanguageCert International ESOL (SELT)",
    typicalRequirement: "B2 Communicator High Pass (for UKVI routes)",
  },
  {
    slug: "oxford-ellt",
    name: "Oxford ELLT",
    fullForm: "Oxford English Language Level Test",
    typicalRequirement: "Level B2 (6.5 equivalent) or higher",
  },
];

/** Lookup map: english test slug → option. */
export const ENGLISH_TEST_MAP: Record<string, EnglishTestOption> = Object.fromEntries(
  ENGLISH_TESTS.map((t) => [t.slug, t]),
);

// ─── Higher Study internal navigation (16 items) ────────────────────

/** Single nav item in the Higher Study internal navigation. */
export interface HigherStudyNavItem {
  label: string;
  href: string;
  /** lucide-react icon name (resolved in the component to avoid import cycles). */
  icon: string;
  external?: boolean;
  description: string;
}

/** 16 nav items for the Higher Study internal navigation.
 *  All internal links use canonical URLs (no redirect hops).
 *  Includes Intakes and Application Guide (previously orphan pages).
 */
export const HIGHER_STUDY_NAV_ITEMS: HigherStudyNavItem[] = [
  {
    label: "Home",
    href: "/higher-study",
    icon: "Home",
    description: "Higher Study hub home with featured destinations and quick links.",
  },
  {
    label: "Study Destinations",
    href: "/higher-study/destinations",
    icon: "Globe2",
    description: "Browse all 30 supported study destinations by region.",
  },
  {
    label: "UK Universities",
    href: "/higher-study/uk-universities",
    icon: "Building2",
    description: "Universities across the United Kingdom (England, Scotland, Wales, NI).",
  },
  {
    label: "Global Universities",
    href: "/higher-study/global-universities",
    icon: "Landmark",
    description: "Universities across all destinations, filterable by country.",
  },
  {
    label: "Course Finder",
    href: "/higher-study/course-finder",
    icon: "Search",
    description: "Search 33 study levels across all partner universities.",
  },
  {
    label: "Scholarships",
    href: "/higher-study/scholarships",
    icon: "Award",
    description: "Browse 24 funding types and 11 major scholarship programmes.",
  },
  {
    label: "PhD & Research",
    href: "/higher-study/phd-research",
    icon: "FlaskConical",
    description: "PhD projects, postdocs, fellowships and research areas.",
  },
  {
    label: "Supervisor Finder",
    href: "/higher-study/supervisors",
    icon: "UserSearch",
    description: "Find supervisors currently accepting research students.",
  },
  {
    label: "Study Resources",
    href: "/higher-study/study-resources",
    icon: "BookOpen",
    description: "Guides, SOPs, CV templates, proposal writing and checklists.",
  },
  {
    label: "Intakes",
    href: "/higher-study/intakes",
    icon: "CalendarClock",
    description: "Upcoming application intakes and deadlines by university.",
  },
  {
    label: "Application Guide",
    href: "/higher-study/application-guide",
    icon: "Map",
    description: "Step-by-step guide to a complete university application.",
  },
  {
    label: "Compare",
    href: "/higher-study/compare",
    icon: "Columns3",
    description: "Compare up to 4 universities, courses or scholarships side by side.",
  },
  {
    label: "Saved Items",
    href: "/higher-study/saved",
    icon: "Bookmark",
    description: "Your saved universities, courses, scholarships and resources.",
  },
  {
    label: "ALO Education",
    href: "https://aloeducation.com",
    icon: "GraduationCap",
    external: true,
    description: "Apply for university and scholarship applications via ALO Education.",
  },
  {
    label: "English Learning",
    href: "https://english.aloeducation.com",
    icon: "Languages",
    external: true,
    description: "Improve your IELTS/PTE/TOEFL score with adaptive English learning.",
  },
  {
    label: "Apply Now",
    href: "/higher-study/apply",
    icon: "Send",
    description: "Start a verified application with consent-tracked referral handoff.",
  },
];

// ─── Misc platform constants ─────────────────────────────────────────

/** Referral token lifetime in milliseconds (24 hours). */
export const REFERRAL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Maximum number of entities allowed in a single comparison. */
export const MAX_COMPARISON_ITEMS = 4;

/** Maximum length of a sanitised string input (protects against huge payloads). */
export const MAX_SAFE_STRING_LENGTH = 500;

/** Referral token length in characters (alphanumeric). */
export const REFERRAL_CODE_LENGTH = 12;

/** Default page size for paginated Higher Study API responses. */
export const DEFAULT_PAGE_SIZE = 24;

/** Maximum page size for paginated Higher Study API responses. */
export const MAX_PAGE_SIZE = 100;
