import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { publicCourseWhere } from '@/lib/public-catalog';

export const dynamic = 'force-dynamic';

/** Canonical public intake-coverage read surface. Only approved, public courses. */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const courseSlug = params.get('courseSlug')?.trim();
  const from = params.get('from') || '2027-01';
  const to = params.get('to') || '2028-01';
  if (!courseSlug || courseSlug.length > 191 || !/^20\d\d-(0[1-9]|1[0-2])$/.test(from) || !/^20\d\d-(0[1-9]|1[0-2])$/.test(to) || from > to) {
    return NextResponse.json({ success: false, error: 'A courseSlug and valid from/to YYYY-MM month range are required.' }, { status: 400 });
  }

  const course = await db.crmCourse.findFirst({
    where: { ...publicCourseWhere(), slug: courseSlug },
    select: { courseId: true, courseTitle: true, slug: true, university: { select: { name: true, slug: true, country: true } } },
  });
  if (!course) return NextResponse.json({ success: false, error: 'Published course not found.' }, { status: 404 });

  const records = await db.courseMonthCoverage.findMany({
    where: { courseId: course.courseId, approvalStatus: 'APPROVED', calendarMonth: { gte: from, lte: to } },
    orderBy: [{ calendarMonth: 'asc' }, { campus: 'asc' }, { studyMode: 'asc' }],
    select: {
      calendarMonth: true, campus: true, studyMode: true, qualification: true, availabilityStatus: true,
      startDate: true, applicationOpenDate: true, applicationCloseDate: true, internationalDeadline: true,
      tuitionAmount: true, tuitionCurrency: true, feeAcademicYear: true, feePeriod: true, feeStudentCategory: true,
      applicationFeeAmount: true, applicationFeeCurrency: true, depositAmount: true, depositCurrency: true,
      scholarshipDetails: true, academicRequirements: true, bangladeshRequirements: true, englishRequirements: true,
      additionalRequirements: true, internationalEligibility: true, feeStatus: true, deadlineStatus: true,
      scholarshipStatus: true, sourceUrls: true, sourcePublishedAt: true, lastVerifiedAt: true, confidence: true,
    },
  });
  return NextResponse.json({ success: true, course, from, to, records, returned: records.length });
}
