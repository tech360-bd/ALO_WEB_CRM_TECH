/**
 * Public visibility policy for the legacy catalogue content pages
 * (UniversityPage and CoursePage).
 *
 * Phase 1 review (2026-10-12), P0-C. Several public surfaces (homepage,
 * /api/search, /api/course-finder/eligible, /courses/[slug],
 * /universities/[slug] and the study-guide generator) filtered these
 * models on approvalStatus=PUBLISHED alone (some also required a non-empty
 * source URL). Because the schema defaults are VERIFIED/PUBLISHED and older
 * code wrote VERIFIED on approval/rejection, that exposed unverified and
 * source-less factual records.
 *
 * Policy (catalogue scope only: UniversityPage and CoursePage). A record is
 * public only if ALL of the following hold:
 *   1. approvalStatus = PUBLISHED
 *   2. verificationStatus = VERIFIED (so NEEDS_REVIEW, UNVERIFIED, STALE,
 *      CONFLICTING_SOURCES, ... are hidden)
 *   3. sourceUrl is an absolute https URL to a non-synthetic host
 *      (SQL: startsWith "https://"; JS post-filter: isAcceptableSourceUrl)
 *   4. no open DataConflict (status PENDING or ESCALATED) names its slug
 *   5. for a CoursePage, its UniversityPage also satisfies 1-4.
 * These models have no "active" flag; inactive/withdrawn pages are expected
 * to be moved out of PUBLISHED.
 *
 * Out of scope (unchanged, documented): CountryPage and ExamPage guide
 * content; the Crm* structured catalogue, which already uses
 * src/lib/public-catalog.ts (publicCourseWhere / publicUniversityWhere).
 */
import { db } from '@/lib/db';
import { isAcceptableSourceUrl } from './content-page-guards';

export const OPEN_CONFLICT_STATUSES = ['PENDING', 'ESCALATED'] as const;

export type OpenConflicts = { universitySlugs: string[]; courseSlugs: string[] };
export const NO_CONFLICTS: OpenConflicts = { universitySlugs: [], courseSlugs: [] };

/** Slugs named by open data conflicts. Errors propagate (fail closed). */
export async function loadOpenConflicts(): Promise<OpenConflicts> {
  const rows = await db.dataConflict.findMany({
    where: { status: { in: [...OPEN_CONFLICT_STATUSES] } },
    select: { universitySlug: true, courseSlug: true },
    take: 5000,
  });
  const universitySlugs = new Set<string>();
  const courseSlugs = new Set<string>();
  for (const row of rows) {
    if (row.universitySlug) universitySlugs.add(row.universitySlug);
    if (row.courseSlug) courseSlugs.add(row.courseSlug);
  }
  return { universitySlugs: [...universitySlugs], courseSlugs: [...courseSlugs] };
}

function baseConditions(blockedSlugs: string[]) {
  const and: Record<string, unknown>[] = [
    { approvalStatus: 'PUBLISHED' },
    { verificationStatus: 'VERIFIED' },
    { sourceUrl: { startsWith: 'https://' } },
  ];
  if (blockedSlugs.length) and.push({ slug: { notIn: blockedSlugs } });
  return and;
}

export function publicUniversityPageWhere(conflicts: OpenConflicts = NO_CONFLICTS, extra: Record<string, unknown>[] = []) {
  return { AND: [...baseConditions(conflicts.universitySlugs), ...extra] };
}

export function publicCoursePageWhere(conflicts: OpenConflicts = NO_CONFLICTS, extra: Record<string, unknown>[] = []) {
  return {
    AND: [
      ...baseConditions(conflicts.courseSlugs),
      { university: { is: publicUniversityPageWhere(conflicts) } },
      ...extra,
    ],
  };
}

type PageLike = {
  slug?: string | null;
  approvalStatus?: string | null;
  verificationStatus?: string | null;
  sourceUrl?: string | null;
};

/**
 * JS re-check of a record already loaded with the where-clauses above.
 * Only checks fields that are present on the record (selects may omit
 * status fields that the where-clause already enforced), except sourceUrl,
 * which is mandatory so synthetic/credentialed hosts are dropped.
 */
export function passesPublicPagePolicy(record: PageLike | null | undefined, blockedSlugs: string[] = []): boolean {
  if (!record) return false;
  if (record.approvalStatus !== undefined && record.approvalStatus !== 'PUBLISHED') return false;
  if (record.verificationStatus !== undefined && record.verificationStatus !== 'VERIFIED') return false;
  if (!isAcceptableSourceUrl(record.sourceUrl)) return false;
  if (record.slug && blockedSlugs.includes(record.slug)) return false;
  return true;
}

export function passesPublicCoursePagePolicy(
  record: (PageLike & { university?: PageLike | null }) | null | undefined,
  conflicts: OpenConflicts = NO_CONFLICTS,
): boolean {
  if (!passesPublicPagePolicy(record, conflicts.courseSlugs)) return false;
  // When the university relation was loaded, re-check it as well.
  if (record && record.university && record.university.sourceUrl !== undefined) {
    return passesPublicPagePolicy(record.university, conflicts.universitySlugs);
  }
  return true;
}
