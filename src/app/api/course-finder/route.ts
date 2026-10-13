import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  PublicQueryError,
  buildCourseFinderOrderBy,
  buildCourseFinderWhere,
  buildPublicIntakeInclude,
  parseCourseFinderParams,
  publicRequirementWhere,
  toPublicCourseRow,
  PUBLIC_SCHOLARSHIP_COUNT_FILTER,
} from '@/lib/public-catalog';

// ============================================================
// PUBLIC COURSE FINDER API — canonical search for /course-finder
//
// Visibility: only published, VERIFIED, source-linked courses whose university
// is also public (see src/lib/public-catalog.ts). Same rule as the course
// detail pages, so a result never links to a "not available" page.
//
// Errors: malformed parameters → 400 with a specific message.
//         database failures → 500 with a generic message (never an empty list).
// ============================================================

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];

/**
 * Multi-month intake selection from the Course Finder tab UI:
 *   ?intakeMonth=1&intakeMonth=5&intakeMonth=9  (repeated)
 *   ?intakeMonth=1,5,9                          (comma separated)
 *   ?intakeMonth=Jan,May,Sep                    (names accepted too)
 * Month numbers are validated against 1-12; unknown values are ignored rather
 * than silently filtering on nothing.
 */
function parseIntakeMonths(sp: URLSearchParams): number[] {
  const raw = [...sp.getAll('intakeMonth'), ...sp.getAll('intakeMonths')]
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const months = new Set<number>();
  for (const value of raw) {
    if (/^\d{1,2}$/.test(value)) {
      const month = Number(value);
      if (month >= 1 && month <= 12) months.add(month);
      continue;
    }
    const index = MONTH_NAMES.findIndex((name) => name.startsWith(value.slice(0, 3)));
    if (index >= 0) months.add(index + 1);
  }
  return [...months].sort((a, b) => a - b);
}

export async function GET(req: Request) {
  let filters;
  try {
    const sp = new URL(req.url).searchParams;
    filters = parseCourseFinderParams(sp);
    const intakeMonths = parseIntakeMonths(sp);
    if (intakeMonths.length) {
      filters.intakeMonths = intakeMonths;
      // The repeated months are the selection; a single-month param would
      // otherwise contradict them.
      filters.intakeMonth = undefined;
    }
  } catch (error) {
    if (error instanceof PublicQueryError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    throw error;
  }

  try {
    const where = buildCourseFinderWhere(filters) as any;
    const skip = (filters.page - 1) * filters.limit;

    const [total, rows] = await Promise.all([
      db.crmCourse.count({ where }),
      db.crmCourse.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: buildCourseFinderOrderBy(filters.sort) as any,
        select: {
          id: true,
          courseId: true,
          slug: true,
          courseTitle: true,
          studyLevel: true,
          programLevel: true,
          subjectArea: true,
          disciplineArea: true,
          qualification: true,
          durationMonths: true,
          deliveryMode: true,
          attendanceMode: true,
          campus: true,
          country: true,
          city: true,
          officialUrl: true,
          officialApplicationUrl: true,
          sourceUrl: true,
          verificationStatus: true,
          lastVerifiedAt: true,
          applicationFeeWaiver: true,
          lowDeposit: true,
          internationalEligibility: true,
          university: {
            select: {
              universityId: true,
              slug: true,
              name: true,
              country: true,
              city: true,
              campusName: true,
              ranking: true,
              worldRanking: true,
              website: true,
              officialUrl: true,
              sourceUrl: true,
              lastVerifiedAt: true,
              ieltsMin: true,
            },
          },
          intakeFees: buildPublicIntakeInclude(filters),
          // Interview requirement + entry requirement, used by the results table
          // ("Interview Required Yes/No") and the course detail page.
          requirements: {
            where: publicRequirementWhere() as any,
            take: 2,
            select: {
              interviewRequired: true,
              portfolioRequired: true,
              academicReq: true,
              englishTest: true,
              ieltsOverall: true,
              ieltsMinBand: true,
              officialRequirementUrl: true,
            },
          },
          _count: { select: { scholarshipRecords: { where: PUBLIC_SCHOLARSHIP_COUNT_FILTER as any } } },
        },
      }),
    ]);

    const courses = rows.map((row: any) => {
      const base = toPublicCourseRow(row);
      const intakes = (row.intakeFees ?? []).map((fee: any) => ({
        intakeYear: fee.intakeYear ?? null,
        intakeMonth: fee.intakeMonth || '',
        intakeName: fee.intakeName || '',
        applicationDeadline: fee.applicationDeadline || '',
        yearlyTuition: fee.yearlyTuition && fee.yearlyTuition > 0 ? fee.yearlyTuition : 0,
        tuitionCurrency: fee.tuitionCurrency || '',
      }));
      return {
        ...base,
        // null = not recorded, so the UI shows "—" instead of claiming "No".
        interviewRequired: row.requirements?.[0] ? Boolean(row.requirements[0].interviewRequired) : null,
        portfolioRequired: row.requirements?.[0] ? Boolean(row.requirements[0].portfolioRequired) : null,
        ieltsRequirement: row.requirements?.[0]?.ieltsOverall > 0 ? row.requirements[0].ieltsOverall : null,
        intakes,
      };
    });
    const pages = Math.ceil(total / filters.limit);

    return NextResponse.json({
      success: true,
      courses,
      total,
      page: filters.page,
      limit: filters.limit,
      pages,
      totalPages: pages,
    });
  } catch (error) {
    console.error('[api/course-finder] search failed', error);
    return NextResponse.json(
      { success: false, error: 'Course search is temporarily unavailable. Please try again.' },
      { status: 500 },
    );
  }
}
