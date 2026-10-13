/**
 * Shared comparison helpers used by the three compare detail pages
 * (universities, courses, scholarships).
 *
 * Each page calls `fetchComparisonRows(entityType, slugs)` to get a
 * list of `ComparisonRow` objects, where each row has the entity's
 * display fields + a slug for the comparison table.
 */
import { db } from "@/lib/db";
import type {
  University,
  Course,
  Scholarship,
} from "@/lib/higher-study/types";
import type { Prisma } from "@prisma/client";

export type CompareEntityType = "universities" | "courses" | "scholarships";

export interface ComparisonRow {
  slug: string;
  name: string;
  fields: Record<string, string | number | boolean | null>;
  verifiedAt?: string | null;
  officialUrl?: string | null;
}

export interface ComparisonDimension {
  key: string;
  label: string;
  /** Hint: "text" | "number" | "boolean" | "currency" | "date" */
  format?: "text" | "number" | "boolean" | "currency" | "date";
}

// ── Dimension definitions per entity type ───────────────────────────

export const UNIVERSITY_DIMENSIONS: ComparisonDimension[] = [
  { key: "country", label: "Country" },
  { key: "city", label: "City" },
  { key: "ranking", label: "Ranking (latest)", format: "text" },
  { key: "tuitionFeeRange", label: "Tuition fee range" },
  { key: "estimatedLivingCosts", label: "Living cost" },
  { key: "institutionType", label: "Institution type" },
  { key: "establishedYear", label: "Established", format: "number" },
  { key: "studyLevels", label: "Study levels offered" },
  { key: "ieltsRequirement", label: "IELTS requirement" },
  { key: "pteRequirement", label: "PTE requirement" },
  { key: "toeflRequirement", label: "TOEFL requirement" },
  { key: "applicationDeadlines", label: "Application deadlines" },
  { key: "graduateOutcomes", label: "Graduate outcomes" },
  { key: "careerSupport", label: "Career support" },
  { key: "scholarshipsCount", label: "Scholarships listed", format: "number" },
  { key: "featured", label: "Featured", format: "boolean" },
];

export const COURSE_DIMENSIONS: ComparisonDimension[] = [
  { key: "university", label: "University" },
  { key: "country", label: "Country" },
  { key: "studyLevel", label: "Study level" },
  { key: "qualification", label: "Qualification" },
  { key: "specialisation", label: "Specialisation" },
  { key: "duration", label: "Duration" },
  { key: "studyMode", label: "Study mode" },
  { key: "tuitionFee", label: "Tuition fee", format: "currency" },
  { key: "scholarshipAvailable", label: "Scholarship available", format: "boolean" },
  { key: "workExperienceRequired", label: "Work experience required", format: "boolean" },
  { key: "portfolioRequired", label: "Portfolio required", format: "boolean" },
  { key: "interviewRequired", label: "Interview required", format: "boolean" },
  { key: "englishRequirements", label: "English requirements" },
  { key: "applicationDeadline", label: "Application deadline" },
  { key: "careerOutcomes", label: "Career outcomes" },
];

export const SCHOLARSHIP_DIMENSIONS: ComparisonDimension[] = [
  { key: "provider", label: "Provider" },
  { key: "country", label: "Country" },
  { key: "university", label: "University" },
  { key: "fundingType", label: "Funding type" },
  { key: "fundingAmount", label: "Funding amount" },
  { key: "tuitionCoverage", label: "Tuition coverage", format: "boolean" },
  { key: "livingCostCoverage", label: "Living cost coverage", format: "boolean" },
  { key: "travelSupport", label: "Travel support", format: "boolean" },
  { key: "healthInsurance", label: "Health insurance", format: "boolean" },
  { key: "eligibleStudyLevels", label: "Eligible study levels" },
  { key: "eligibleSubjects", label: "Eligible subjects" },
  { key: "eligibleNationalities", label: "Eligible nationalities" },
  { key: "deadline", label: "Application deadline", format: "date" },
  { key: "academicRequirement", label: "Academic requirement" },
  { key: "englishRequirement", label: "English requirement" },
];

// ── Fetchers ────────────────────────────────────────────────────────

async function fetchUniversities(slugs: string[]): Promise<ComparisonRow[]> {
  const items = await db.higherStudyUniversity.findMany({
    where: { slug: { in: slugs }, publicationStatus: "published" },
    include: {
      country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
      city: { select: { id: true, slug: true, name: true } },
      _count: { select: { scholarships: true } },
    },
  });
  return items.map((u) => {
    const uni = u as unknown as University & { _count: { scholarships: number } };
    return {
      slug: uni.slug,
      name: uni.officialName,
      verifiedAt: uni.lastVerifiedAt?.toISOString() ?? null,
      officialUrl: uni.officialSourceUrl ?? null,
      fields: {
        country: uni.country?.name ?? null,
        city: uni.city?.name ?? null,
        ranking: parseFirstRanking(uni.rankingsJson),
        tuitionFeeRange: uni.tuitionFeeRange ?? null,
        estimatedLivingCosts: uni.estimatedLivingCosts ?? null,
        institutionType: uni.institutionType ?? null,
        establishedYear: uni.establishedYear ?? null,
        studyLevels: uni.studyLevels ?? null,
        ieltsRequirement: uni.ieltsRequirement ?? null,
        pteRequirement: uni.pteRequirement ?? null,
        toeflRequirement: uni.toeflRequirement ?? null,
        applicationDeadlines: uni.applicationDeadlines ?? null,
        graduateOutcomes: uni.graduateOutcomes ?? null,
        careerSupport: uni.careerSupport ?? null,
        scholarshipsCount: uni._count?.scholarships ?? 0,
        featured: uni.featured,
      },
    };
  });
}

async function fetchCourses(slugs: string[]): Promise<ComparisonRow[]> {
  const items = await db.higherStudyCourse.findMany({
    where: { slug: { in: slugs }, publicationStatus: "published" },
    include: {
      university: {
        select: { id: true, slug: true, officialName: true, logoUrl: true,
          country: { select: { id: true, slug: true, name: true, flagEmoji: true } } },
      },
      country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
    },
  });
  return items.map((c) => {
    const course = c as unknown as Course;
    return {
      slug: course.slug,
      name: course.title,
      verifiedAt: course.lastVerifiedAt?.toISOString() ?? null,
      officialUrl: course.officialSourceUrl ?? null,
      fields: {
        university: course.university?.officialName ?? null,
        country: course.country?.name ?? course.university?.country?.name ?? null,
        studyLevel: course.studyLevel ?? null,
        qualification: course.qualification ?? null,
        specialisation: course.specialisation ?? null,
        duration: course.duration ?? null,
        studyMode: course.studyMode ?? null,
        tuitionFee: course.tuitionFee ?? null,
        scholarshipAvailable: course.scholarshipAvailable,
        workExperienceRequired: course.workExperienceRequired,
        portfolioRequired: course.portfolioRequired,
        interviewRequired: course.interviewRequired,
        englishRequirements: course.englishRequirements ?? null,
        applicationDeadline: course.applicationDeadline ?? null,
        careerOutcomes: course.careerOutcomes ?? null,
      },
    };
  });
}

async function fetchScholarships(slugs: string[]): Promise<ComparisonRow[]> {
  const items = await db.higherStudyScholarship.findMany({
    where: { slug: { in: slugs }, publicationStatus: "published" },
    include: {
      country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
      university: {
        select: { id: true, slug: true, officialName: true, logoUrl: true },
      },
    },
  });
  return items.map((s) => {
    const sch = s as unknown as Scholarship;
    return {
      slug: sch.slug,
      name: sch.name,
      verifiedAt: sch.lastVerifiedAt?.toISOString() ?? null,
      officialUrl: sch.officialSourceUrl ?? null,
      fields: {
        provider: sch.provider ?? null,
        country: sch.country?.name ?? null,
        university: sch.university?.officialName ?? null,
        fundingType: sch.fundingType ?? null,
        fundingAmount: sch.fundingAmount ?? null,
        tuitionCoverage: sch.tuitionCoverage,
        livingCostCoverage: sch.livingCostCoverage,
        travelSupport: sch.travelSupport,
        healthInsurance: sch.healthInsurance,
        eligibleStudyLevels: sch.eligibleStudyLevels ?? null,
        eligibleSubjects: sch.eligibleSubjects ?? null,
        eligibleNationalities: sch.eligibleNationalities ?? null,
        deadline: sch.deadline ? sch.deadline.toISOString() : null,
        academicRequirement: sch.academicRequirement ?? null,
        englishRequirement: sch.englishRequirement ?? null,
      },
    };
  });
}

// ── Public API ──────────────────────────────────────────────────────

export async function fetchComparisonRows(
  entityType: CompareEntityType,
  slugs: string[],
): Promise<{ rows: ComparisonRow[]; error: string | null }> {
  if (slugs.length === 0) return { rows: [], error: null };
  try {
    const rows =
      entityType === "universities"
        ? await fetchUniversities(slugs)
        : entityType === "courses"
          ? await fetchCourses(slugs)
          : await fetchScholarships(slugs);
    // Preserve the order of the input slugs
    const bySlug = new Map(rows.map((r) => [r.slug, r]));
    const ordered = slugs
      .map((s) => bySlug.get(s))
      .filter((r): r is ComparisonRow => r !== undefined);
    return { rows: ordered, error: null };
  } catch (e) {
    console.error(`[compare:${entityType}] DB error`, e);
    return {
      rows: [],
      error: `Could not load ${entityType} for comparison.`,
    };
  }
}

export function getDimensions(entityType: CompareEntityType): ComparisonDimension[] {
  return entityType === "universities"
    ? UNIVERSITY_DIMENSIONS
    : entityType === "courses"
      ? COURSE_DIMENSIONS
      : SCHOLARSHIP_DIMENSIONS;
}

export function getEntityBrowseLink(entityType: CompareEntityType): string {
  return entityType === "universities"
    ? "/higher-study/global-universities"
    : entityType === "courses"
      ? "/higher-study/course-finder"
      : "/higher-study/scholarships";
}

export function getEntityDetailPrefix(entityType: CompareEntityType): string {
  return entityType === "universities"
    ? "/higher-study/universities"
    : entityType === "courses"
      ? "/higher-study/courses"
      : "/higher-study/scholarships";
}

export function getEntityLabel(entityType: CompareEntityType): string {
  return entityType === "universities"
    ? "Universities"
    : entityType === "courses"
      ? "Courses"
      : "Scholarships";
}

// ── Helpers ─────────────────────────────────────────────────────────

function parseFirstRanking(rankingsJson?: string | null): string | null {
  if (!rankingsJson) return null;
  try {
    const parsed = JSON.parse(rankingsJson);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    const first = parsed[0];
    if (!first || typeof first !== "object") return null;
    const r = first as { provider?: string; rank?: string | number; year?: string | number };
    if (!r.provider || r.rank === undefined) return null;
    return `${r.provider} #${r.rank}${r.year ? ` (${r.year})` : ""}`;
  } catch {
    return null;
  }
}

// Use Prisma type to silence unused-import warning
export type { Prisma };
