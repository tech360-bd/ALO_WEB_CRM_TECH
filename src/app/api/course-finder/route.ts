import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  PublicQueryError,
  buildCourseFinderOrderBy,
  buildCourseFinderWhere,
  buildPublicIntakeInclude,
  parseCourseFinderParams,
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

export async function GET(req: Request) {
  let filters;
  try {
    filters = parseCourseFinderParams(new URL(req.url).searchParams);
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
          _count: { select: { scholarshipRecords: { where: PUBLIC_SCHOLARSHIP_COUNT_FILTER as any } } },
        },
      }),
    ]);

    const courses = rows.map((row: any) => toPublicCourseRow(row));
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
