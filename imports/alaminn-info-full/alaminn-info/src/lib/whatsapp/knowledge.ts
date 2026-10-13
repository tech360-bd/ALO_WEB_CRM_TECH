/**
 * WhatsApp AI — Knowledge Retrieval
 * =================================
 * Queries the authoritative Alaminn.info Higher Study database
 * (universities, courses, scholarships, countries, PhDs, supervisors).
 *
 * The AI agent MUST NOT invent data — when no verified record exists,
 * it returns null and the agent tells the user plainly.
 *
 * Priority of knowledge sources:
 *   1. Verified Alaminn.info data (this module — Prisma queries)
 *   2. Official university/scholarship source URL (returned for the AI to cite)
 *   3. AI general knowledge — only for non-time-sensitive general guidance
 */
import { db } from "@/lib/db";

export type UniversityResult = {
  id: string;
  name: string;
  slug: string;
  country: string | null;
  city: string | null;
  website: string | null;
  overview: string | null;
  institutionType: string | null;
  verificationStatus: string | null;
  officialSourceUrl: string | null;
};

export type CourseResult = {
  id: string;
  title: string;
  slug: string;
  universityName: string | null;
  countryName: string | null;
  studyLevel: string | null;
  duration: string | null;
  tuitionFee: number | null;
  tuitionCurrency: string | null;
  englishRequirements: string | null;
  academicEntryRequirements: string | null;
  applicationDeadline: string | null;
  officialSourceUrl: string | null;
};

export type ScholarshipResult = {
  id: string;
  name: string;
  slug: string;
  provider: string | null;
  fundingAmount: string | null;
  fundingType: string | null;
  eligibilityCriteria: string | null;
  deadline: string | null;
  countryName: string | null;
  eligibleStudyLevels: string | null;
  officialSourceUrl: string | null;
};

export type CountryResult = {
  id: string;
  name: string;
  slug: string;
  flagEmoji: string | null;
  overview: string | null;
  tuitionFeeRange: string | null;
  livingCostRange: string | null;
  workRights: string | null;
  postStudyOpportunities: string | null;
  studentVisaOverview: string | null;
  englishRequirements: string | null;
  applicationProcess: string | null;
  officialSourceUrl: string | null;
  lastVerifiedAt: string | null;
};

export type SupervisorResult = {
  id: string;
  name: string;
  slug: string;
  academicTitle: string | null;
  universityName: string | null;
  department: string | null;
  researchInterests: string | null;
  acceptingStudents: boolean;
  publicProfileUrl: string | null;
};

export type PhdResult = {
  id: string;
  title: string;
  slug: string;
  universityName: string | null;
  researchArea: string | null;
  fundingStatus: string | null;
  applicationDeadline: string | null;
  supervisorName: string | null;
};

export type KnowledgeResult = {
  universities: UniversityResult[];
  courses: CourseResult[];
  scholarships: ScholarshipResult[];
  countries: CountryResult[];
  supervisors: SupervisorResult[];
  phds: PhdResult[];
  totalFound: number;
};

const EMPTY: KnowledgeResult = {
  universities: [],
  courses: [],
  scholarships: [],
  countries: [],
  supervisors: [],
  phds: [],
  totalFound: 0,
};

/**
 * Extract meaningful search terms from a user message.
 * Strips common English stop words and question words, leaving
 * the keywords most likely to match DB records.
 */
function extractKeywords(message: string): string {
  const stopWords = new Set([
    "what", "which", "where", "when", "how", "why", "who", "is", "are", "was",
    "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "can", "shall",
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "about", "into", "through", "during",
    "before", "after", "above", "below", "between", "this", "that", "these",
    "those", "i", "me", "my", "we", "us", "our", "you", "your", "he", "she",
    "it", "they", "them", "their", "find", "show", "list", "get", "want",
    "need", "looking", "search", "help", "please", "available", "options",
    "good", "best", "top", "cheap", "affordable", "me", "give", "tell",
    "know", "see", "like", "would", "also",
  ]);
  const words = message
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !stopWords.has(w));
  return words.join(" ").trim();
}

/**
 * Search the Higher Study database for records matching the user's query.
 * Searches across universities, courses, scholarships, countries, supervisors,
 * and PhD research projects in parallel.
 *
 * If the query is a broad question (e.g. "What scholarships are available?"),
 * stop words are stripped and the remaining keywords are used. If no keywords
 * remain, all records (up to limit) are returned.
 *
 * @param query  Free-text search query (full user message is OK).
 * @param limit  Max results per category (default 5).
 */
export async function retrieveKnowledge(
  query: string,
  limit = 5
): Promise<KnowledgeResult> {
  // Extract keywords from the full message
  const keywords = extractKeywords(query);

  // If no meaningful keywords remain, return all records (broad browse)
  if (!keywords) {
    return retrieveAll(limit);
  }

  // Try the extracted keywords first
  const result = await retrieveByQuery(keywords, limit);
  if (result.totalFound > 0) return result;

  // If no matches with keywords, try each individual word
  const words = keywords.split(/\s+/);
  for (const word of words) {
    if (word.length < 2) continue;
    const wordResult = await retrieveByQuery(word, limit);
    if (wordResult.totalFound > 0) return wordResult;
  }

  // Still no matches — return empty
  return EMPTY;
}

/**
 * Retrieve all records (broad browse — used when query has no keywords).
 */
async function retrieveAll(limit = 5): Promise<KnowledgeResult> {
  const [universities, courses, scholarships, countries, supervisors, phds] =
    await Promise.all([
      db.higherStudyUniversity.findMany({
        take: limit,
        select: {
          id: true, slug: true, officialName: true, overview: true,
          institutionType: true, officialWebsite: true,
          verificationStatus: true, officialSourceUrl: true,
          country: { select: { name: true } },
          city: { select: { name: true } },
        },
        orderBy: { officialName: "asc" },
      }),
      db.higherStudyCourse.findMany({
        take: limit,
        select: {
          id: true, slug: true, title: true, studyLevel: true, duration: true,
          tuitionFee: true, tuitionCurrency: true,
          academicEntryRequirements: true, englishRequirements: true,
          applicationDeadline: true, officialSourceUrl: true,
          university: { select: { officialName: true } },
          country: { select: { name: true } },
        },
        orderBy: { title: "asc" },
      }),
      db.higherStudyScholarship.findMany({
        take: limit,
        select: {
          id: true, slug: true, name: true, provider: true,
          fundingAmount: true, fundingType: true, eligibilityCriteria: true,
          deadline: true, eligibleStudyLevels: true, officialSourceUrl: true,
          country: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      db.higherStudyCountry.findMany({
        take: limit,
        where: { status: "published" },
        select: {
          id: true, name: true, slug: true, flagEmoji: true, overview: true,
          tuitionFeeRange: true, livingCostRange: true, workRights: true,
          postStudyOpportunities: true, studentVisaOverview: true,
          englishRequirements: true, applicationProcess: true,
          officialSourceUrl: true, lastVerifiedAt: true,
        },
        orderBy: { name: "asc" },
      }),
      db.higherStudySupervisor.findMany({
        take: limit,
        where: { acceptingStudents: true },
        select: {
          id: true, slug: true, name: true, academicTitle: true, department: true,
          researchInterests: true, acceptingStudents: true, publicProfileUrl: true,
          university: { select: { officialName: true } },
        },
        orderBy: { name: "asc" },
      }),
      db.higherStudyResearchProject.findMany({
        take: limit,
        select: {
          id: true, slug: true, title: true, fundingStatus: true,
          applicationDeadline: true,
          university: { select: { officialName: true } },
          researchArea: { select: { name: true } },
          supervisor: { select: { name: true } },
        },
        orderBy: { title: "asc" },
      }),
    ]);

  return formatResults(universities, courses, scholarships, countries, supervisors, phds);
}

/**
 * Format raw Prisma query results into the flat KnowledgeResult shape.
 * Shared by retrieveAll and retrieveByQuery.
 */
function formatResults(
  universities: Array<Record<string, unknown>>,
  courses: Array<Record<string, unknown>>,
  scholarships: Array<Record<string, unknown>>,
  countries: Array<Record<string, unknown>>,
  supervisors: Array<Record<string, unknown>>,
  phds: Array<Record<string, unknown>>
): KnowledgeResult {
  const totalFound =
    universities.length +
    courses.length +
    scholarships.length +
    countries.length +
    supervisors.length +
    phds.length;

  return {
    universities: universities.map((u) => ({
      id: u.id as string,
      name: u.officialName as string,
      slug: u.slug as string,
      country: (u.country as { name?: string })?.name ?? null,
      city: (u.city as { name?: string })?.name ?? null,
      website: (u.officialWebsite as string) ?? null,
      overview: (u.overview as string) ?? null,
      institutionType: (u.institutionType as string) ?? null,
      verificationStatus: (u.verificationStatus as string) ?? null,
      officialSourceUrl: (u.officialSourceUrl as string) ?? null,
    })),
    courses: courses.map((c) => ({
      id: c.id as string,
      title: c.title as string,
      slug: c.slug as string,
      universityName: (c.university as { officialName?: string })?.officialName ?? null,
      countryName: (c.country as { name?: string })?.name ?? null,
      studyLevel: (c.studyLevel as string) ?? null,
      duration: (c.duration as string) ?? null,
      tuitionFee: (c.tuitionFee as number) ?? null,
      tuitionCurrency: (c.tuitionCurrency as string) ?? null,
      englishRequirements: (c.englishRequirements as string) ?? null,
      academicEntryRequirements: (c.academicEntryRequirements as string) ?? null,
      applicationDeadline: c.applicationDeadline
        ? String(c.applicationDeadline)
        : null,
      officialSourceUrl: (c.officialSourceUrl as string) ?? null,
    })),
    scholarships: scholarships.map((s) => ({
      id: s.id as string,
      name: s.name as string,
      slug: s.slug as string,
      provider: (s.provider as string) ?? null,
      fundingAmount: (s.fundingAmount as string) ?? null,
      fundingType: (s.fundingType as string) ?? null,
      eligibilityCriteria: (s.eligibilityCriteria as string) ?? null,
      deadline: s.deadline ? (s.deadline as Date).toISOString() : null,
      countryName: (s.country as { name?: string })?.name ?? null,
      eligibleStudyLevels: (s.eligibleStudyLevels as string) ?? null,
      officialSourceUrl: (s.officialSourceUrl as string) ?? null,
    })),
    countries: countries.map((c) => ({
      ...c,
      lastVerifiedAt: c.lastVerifiedAt
        ? new Date(c.lastVerifiedAt as Date).toISOString()
        : null,
    })) as CountryResult[],
    supervisors: supervisors.map((s) => ({
      id: s.id as string,
      name: s.name as string,
      slug: s.slug as string,
      academicTitle: (s.academicTitle as string) ?? null,
      universityName: (s.university as { officialName?: string })?.officialName ?? null,
      department: (s.department as string) ?? null,
      researchInterests: (s.researchInterests as string) ?? null,
      acceptingStudents: s.acceptingStudents as boolean,
      publicProfileUrl: (s.publicProfileUrl as string) ?? null,
    })),
    phds: phds.map((p) => ({
      id: p.id as string,
      title: p.title as string,
      slug: p.slug as string,
      universityName: (p.university as { officialName?: string })?.officialName ?? null,
      researchArea: (p.researchArea as { name?: string })?.name ?? null,
      fundingStatus: (p.fundingStatus as string) ?? null,
      applicationDeadline: p.applicationDeadline
        ? (p.applicationDeadline as Date).toISOString()
        : null,
      supervisorName: (p.supervisor as { name?: string })?.name ?? null,
    })),
    totalFound,
  };
}

/**
 * Retrieve records matching a specific query string.
 */
async function retrieveByQuery(q: string, limit = 5): Promise<KnowledgeResult> {
  const [universities, courses, scholarships, countries, supervisors, phds] =
    await Promise.all([
      db.higherStudyUniversity.findMany({
        where: {
          OR: [
            { officialName: { contains: q } },
            { overview: { contains: q } },
            { alternativeNames: { contains: q } },
            { researchDepartments: { contains: q } },
          ],
        },
        take: limit,
        select: {
          id: true,
          slug: true,
          officialName: true,
          overview: true,
          institutionType: true,
          officialWebsite: true,
          verificationStatus: true,
          officialSourceUrl: true,
          country: { select: { name: true } },
          city: { select: { name: true } },
        },
        orderBy: { officialName: "asc" },
      }),
      db.higherStudyCourse.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { overview: { contains: q } },
            { specialisation: { contains: q } },
            { qualification: { contains: q } },
          ],
        },
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          studyLevel: true,
          duration: true,
          tuitionFee: true,
          tuitionCurrency: true,
          academicEntryRequirements: true,
          englishRequirements: true,
          applicationDeadline: true,
          officialSourceUrl: true,
          university: { select: { officialName: true } },
          country: { select: { name: true } },
        },
        orderBy: { title: "asc" },
      }),
      db.higherStudyScholarship.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { fundingAmount: { contains: q } },
            { eligibilityCriteria: { contains: q } },
            { fundingType: { contains: q } },
          ],
        },
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          provider: true,
          fundingAmount: true,
          fundingType: true,
          eligibilityCriteria: true,
          deadline: true,
          eligibleStudyLevels: true,
          officialSourceUrl: true,
          country: { select: { name: true } },
        },
        orderBy: { name: "asc" },
      }),
      db.higherStudyCountry.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { overview: { contains: q } },
            { slug: { contains: q } },
          ],
        },
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          flagEmoji: true,
          overview: true,
          tuitionFeeRange: true,
          livingCostRange: true,
          workRights: true,
          postStudyOpportunities: true,
          studentVisaOverview: true,
          englishRequirements: true,
          applicationProcess: true,
          officialSourceUrl: true,
          lastVerifiedAt: true,
        },
        orderBy: { name: "asc" },
      }),
      db.higherStudySupervisor.findMany({
        where: {
          OR: [
            { name: { contains: q } },
            { researchInterests: { contains: q } },
            { department: { contains: q } },
            { academicTitle: { contains: q } },
          ],
        },
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          academicTitle: true,
          department: true,
          researchInterests: true,
          acceptingStudents: true,
          publicProfileUrl: true,
          university: { select: { officialName: true } },
        },
        orderBy: { name: "asc" },
      }),
      db.higherStudyResearchProject.findMany({
        where: {
          OR: [
            { title: { contains: q } },
            { projectSummary: { contains: q } },
            { department: { contains: q } },
          ],
        },
        take: limit,
        select: {
          id: true,
          slug: true,
          title: true,
          fundingStatus: true,
          applicationDeadline: true,
          university: { select: { officialName: true } },
          researchArea: { select: { name: true } },
          supervisor: { select: { name: true } },
        },
        orderBy: { title: "asc" },
      }),
    ]);

  return formatResults(universities, courses, scholarships, countries, supervisors, phds);
}

/**
 * Get a single country by slug (for destination-specific queries).
 */
export async function getCountryBySlug(
  slug: string
): Promise<CountryResult | null> {
  const country = await db.higherStudyCountry.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      flagEmoji: true,
      overview: true,
      tuitionFeeRange: true,
      livingCostRange: true,
      workRights: true,
      postStudyOpportunities: true,
      studentVisaOverview: true,
      englishRequirements: true,
      applicationProcess: true,
      officialSourceUrl: true,
      lastVerifiedAt: true,
    },
  });
  if (!country) return null;
  return {
    ...country,
    lastVerifiedAt: country.lastVerifiedAt
      ? new Date(country.lastVerifiedAt).toISOString()
      : null,
  } as CountryResult;
}

/**
 * List all published countries (for destination overview queries).
 */
export async function listCountries(): Promise<CountryResult[]> {
  const countries = await db.higherStudyCountry.findMany({
    where: { status: "published" },
    take: 30,
    select: {
      id: true,
      name: true,
      slug: true,
      flagEmoji: true,
      overview: true,
      tuitionFeeRange: true,
      livingCostRange: true,
      workRights: true,
      postStudyOpportunities: true,
      studentVisaOverview: true,
      englishRequirements: true,
      applicationProcess: true,
      officialSourceUrl: true,
      lastVerifiedAt: true,
    },
    orderBy: { name: "asc" },
  });
  return countries.map((c) => ({
    ...c,
    lastVerifiedAt: c.lastVerifiedAt
      ? new Date(c.lastVerifiedAt).toISOString()
      : null,
  })) as CountryResult[];
}
