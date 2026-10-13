import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { publicCourseWhere, publicUniversityWhere } from '@/lib/public-catalog';

/**
 * GET /api/course-finder/facets — PUBLIC
 *
 * Filter vocabulary for the public Course Finder tab UI. Every value is read
 * from published, verified, source-linked catalogue rows (the same visibility
 * filter as the search itself), so a visitor can never pick a filter that
 * returns nothing because of an unpublished record.
 *
 * Returns:
 *   subjects     distinct subject areas on public courses      (COURSES tab)
 *   levels       study levels present in the catalogue          (COURSES tab)
 *   countries    destination countries                          (both tabs)
 *   universities public universities: name, slug, country, rank (UNIVERSITIES tab)
 *   intakes      intake months recorded for the requested year  (intake picker)
 *
 * Caching: the catalogue changes when an import publishes, not per request, so
 * this is cached for 10 minutes at the CDN and revalidated in the background.
 */

const FACET_CACHE_SECONDS = 600;
const SUBJECT_LIMIT = 400;
const UNIVERSITY_LIMIT = 500;

function clean(values: (string | null | undefined)[]): string[] {
  const seen = new Set<string>();
  for (const value of values) {
    const trimmed = (value ?? '').trim();
    if (trimmed) seen.add(trimmed);
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedYear = Number(searchParams.get('year'));
    const year = Number.isSafeInteger(requestedYear) && requestedYear >= 2000 && requestedYear <= 2100
      ? requestedYear
      : new Date().getFullYear() + 1;

    const [subjects, levels, countries, universities, intakes] = await Promise.all([
      db.crmCourse.findMany({
        where: { ...publicCourseWhere(), subjectArea: { not: '' } },
        distinct: ['subjectArea'],
        select: { subjectArea: true },
        take: SUBJECT_LIMIT,
        orderBy: { subjectArea: 'asc' },
      }),
      db.crmCourse.findMany({
        where: publicCourseWhere() as any,
        distinct: ['studyLevel'],
        select: { studyLevel: true },
        take: 40,
        orderBy: { studyLevel: 'asc' },
      }),
      db.crmUniversity.findMany({
        where: { ...publicUniversityWhere(), country: { not: '' } },
        distinct: ['country'],
        select: { country: true },
        take: 100,
        orderBy: { country: 'asc' },
      }),
      db.crmUniversity.findMany({
        where: publicUniversityWhere() as any,
        select: {
          universityId: true,
          slug: true,
          name: true,
          country: true,
          city: true,
          worldRanking: true,
          _count: { select: { courses: { where: publicCourseWhere() as any } } },
        },
        orderBy: [{ name: 'asc' }],
        take: UNIVERSITY_LIMIT,
      }),
      db.crmCourseIntakeFee.findMany({
        where: {
          status: 'active',
          verificationStatus: { in: ['VERIFIED', 'verified', 'SOURCE_VERIFIED', 'CONFIRMED'] },
          intakeYear: year,
        },
        distinct: ['intakeMonth'],
        select: { intakeMonth: true },
        take: 24,
      }),
    ]);

    // Month numbers are more useful to the UI than whatever string form the
    // intake row stores ("January", "Jan", "01", "1").
    const monthNumbers = new Set<number>();
    for (const row of intakes) {
      const value = String(row.intakeMonth || '').trim().toLowerCase();
      if (/^\d{1,2}$/.test(value)) {
        const month = Number(value);
        if (month >= 1 && month <= 12) monthNumbers.add(month);
        continue;
      }
      const names = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
      const index = names.findIndex((name) => name.startsWith(value.slice(0, 3)));
      if (index >= 0) monthNumbers.add(index + 1);
    }

    return NextResponse.json(
      {
        success: true,
        year,
        subjects: clean(subjects.map((row) => row.subjectArea)),
        levels: clean(levels.map((row) => row.studyLevel)),
        countries: clean(countries.map((row) => row.country)),
        universities: universities.map((row) => ({
          id: row.universityId,
          slug: row.slug || row.universityId,
          name: row.name,
          country: row.country || '',
          city: row.city || '',
          worldRanking: row.worldRanking > 0 ? row.worldRanking : null,
          courseCount: row._count?.courses ?? 0,
        })),
        // Recorded months first, then the full Jan-Dec range so the optional
        // intake picker is always usable even for a future year.
        recordedIntakeMonths: [...monthNumbers].sort((a, b) => a - b),
      },
      { headers: { 'Cache-Control': `public, s-maxage=${FACET_CACHE_SECONDS}, stale-while-revalidate=60` } },
    );
  } catch (error) {
    console.error('[api/course-finder/facets] failed', error);
    return NextResponse.json(
      { success: false, error: 'Filter options are temporarily unavailable. Please try again.' },
      { status: 500 },
    );
  }
}
