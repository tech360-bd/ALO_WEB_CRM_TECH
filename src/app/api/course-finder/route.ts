import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// PUBLIC COURSE FINDER API
// Returns courses with university info via manual joins.
// Public (no auth) — used by the public website course finder.
// ============================================================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const studyLevel = searchParams.get('studyLevel') || '';
    const subjectArea = searchParams.get('subjectArea') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    // Build course where clause
    const courseWhere: Record<string, unknown> = { status: 'active' };

    if (search) {
      courseWhere.OR = [
        { courseTitle: { contains: search } },
        { subjectArea: { contains: search } },
      ];
    }
    if (studyLevel) {
      courseWhere.studyLevel = { contains: studyLevel };
    }
    if (subjectArea) {
      courseWhere.subjectArea = { contains: subjectArea };
    }

    // If country filter, fetch matching university IDs first
    let universityIds: string[] | null = null;
    if (country) {
      const unis = await db.crmUniversity.findMany({
        where: { country: { contains: country } },
        select: { universityId: true },
      });
      universityIds = unis.map((u) => u.universityId);
      if (universityIds.length === 0) {
        return NextResponse.json({
          success: true,
          courses: [],
          total: 0,
          page,
          limit,
          pages: 0,
        });
      }
      courseWhere.universityId = { in: universityIds };
    }

    // Fetch courses
    const [total, courses] = await Promise.all([
      db.crmCourse.count({ where: courseWhere }),
      db.crmCourse.findMany({
        where: courseWhere,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    // Fetch related universities and intake fees in parallel
    const uniIds = [...new Set(courses.map((c) => c.universityId))];
    const courseIdsForFee = courses.map((c) => c.courseId);

    const [universities, intakeFees] = await Promise.all([
      db.crmUniversity.findMany({
        where: { universityId: { in: uniIds } },
      }),
      db.crmCourseIntakeFee.findMany({
        where: {
          courseId: { in: courseIdsForFee },
          status: 'active',
        },
        orderBy: { intakeYear: 'desc' },
      }),
    ]);

    const uniMap = new Map(universities.map((u) => [u.universityId, u]));
    const feeMap = new Map<string, typeof intakeFees[number]>();
    for (const f of intakeFees) {
      if (!feeMap.has(f.courseId)) feeMap.set(f.courseId, f);
    }

    // Compose response
    const result = courses.map((c) => {
      const uni = uniMap.get(c.universityId);
      const fee = feeMap.get(c.courseId);
      return {
        universityId: c.universityId,
        universityName: uni?.name || '',
        country: uni?.country || '',
        city: uni?.city || '',
        universityRanking: uni?.ranking || 0,
        universityWorldRanking: uni?.worldRanking || 0,
        universityType: uni?.type || '',
        universityWebsite: uni?.website || '',
        universityOfficialUrl: uni?.officialUrl || '',
        universityVerificationStatus: uni?.verificationStatus || uni?.status || 'NEEDS_REVIEW',
        universityPublicationStatus: uni?.publicationStatus || 'draft',
        universityLastVerifiedAt: uni?.lastVerifiedAt || '',
        universitySourceUrl: uni?.sourceUrl || '',
        ieltsMin: uni?.ieltsMin || 0,
        scholarships: uni?.scholarships || false,
        courseId: c.courseId,
        slug: c.slug || c.courseId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        courseTitle: c.courseTitle,
        qualification: c.qualification || '',
        studyLevel: c.studyLevel,
        programLevel: c.programLevel,
        subjectArea: c.subjectArea,
        disciplineArea: c.disciplineArea,
        campus: c.campus || uni?.campusName || '',
        deliveryMode: c.deliveryMode || '',
        attendanceMode: c.attendanceMode || '',
        internationalEligibility: c.internationalEligibility || 'not_verified',
        officialCourseUrl: c.officialUrl || '',
        officialApplicationUrl: c.officialApplicationUrl || '',
        courseVerificationStatus: c.verificationStatus || c.status || 'NEEDS_REVIEW',
        coursePublicationStatus: c.publicationStatus || 'draft',
        courseLastVerifiedAt: c.lastVerifiedAt || '',
        courseSourceUrl: c.sourceUrl || '',
        durationMonths: c.durationMonths,
        publicTags: c.publicTags,
        intakeYear: fee?.intakeYear || 0,
        intakeMonth: fee?.intakeMonth || '',
        intakeName: fee?.intakeName || '',
        applicationDeadline: fee?.applicationDeadline || '',
        appFeeCurrency: fee?.appFeeCurrency || '',
        appFeeAmount: fee?.appFeeAmount || 0,
        tuitionCurrency: fee?.tuitionCurrency || '',
        yearlyTuition: fee?.yearlyTuition || 0,
        totalTuition: fee?.totalTuition || 0,
        tuitionPeriod: fee?.tuitionPeriod || '',
        feeSourceUrl: fee?.feeSourceUrl || '',
        intakeSourceUrl: fee?.intakeSourceUrl || '',
        feeVerificationStatus: fee?.verificationStatus || 'NEEDS_REVIEW',
        depositCurrency: fee?.depositCurrency || '',
        depositAmount: fee?.depositAmount || 0,
      };
    });

    return NextResponse.json({
      success: true,
      courses: result,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Course finder API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
