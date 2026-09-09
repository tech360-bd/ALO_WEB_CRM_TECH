import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const universityId = searchParams.get('universityId') || '';
    const country = searchParams.get('country') || '';
    const level = searchParams.get('level') || '';
    const subject = searchParams.get('subject') || '';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build Prisma AND conditions
    const andConditions: Prisma.CrmCourseWhereInput[] = [{ status: 'active' }];

    if (universityId) {
    andConditions.push({ universityId });
    }

    if (country && !universityId) {
    const uniIds = await db.crmUniversity.findMany({
      where: { country: { contains: country }, status: 'active' },
      select: { universityId: true },
    });
    andConditions.push({ universityId: { in: uniIds.map(u => u.universityId) } });
    }

    if (subject) {
    andConditions.push({ subjectArea: { contains: subject } });
    }

    // Level: search both studyLevel and programLevel
    if (level) {
    andConditions.push({
      OR: [
        { studyLevel: { contains: level } },
        { programLevel: { contains: level } },
      ],
    });
    }

    // Search: search across course title, subject, and program level
    if (search) {
    andConditions.push({
      OR: [
        { courseTitle: { contains: search } },
        { subjectArea: { contains: search } },
        { programLevel: { contains: search } },
        { studyLevel: { contains: search } },
      ],
    });
    }

    const where: Prisma.CrmCourseWhereInput = { AND: andConditions };

    const [courses, total] = await Promise.all([
    db.crmCourse.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.crmCourse.count({ where }),
    ]);

    // Enrich courses with university info and fee data
    const enrichedCourses = await Promise.all(
    courses.map(async (course) => {
      const uni = await db.crmUniversity.findUnique({
        where: { universityId: course.universityId },
        select: { name: true, country: true, city: true, ranking: true, worldRanking: true, type: true },
      });
      const fee = await db.crmCourseIntakeFee.findFirst({
        where: { courseId: course.courseId, intakeYear: 2025 },
        orderBy: { createdAt: 'desc' },
      });
      const req = await db.crmCourseRequirement.findFirst({
        where: { courseId: course.courseId },
      });
      return {
        ...course,
        university: uni,
        tuition: fee?.yearlyTuition || 0,
        tuitionCurrency: fee?.tuitionCurrency || 'GBP',
        intakeMonth: fee?.intakeMonth || '',
        ieltsRequired: req?.ieltsOverall || 0,
        ieltsMinBand: req?.ieltsMinBand || 0,
        pteRequired: req?.pteOverall || 0,
        toeflRequired: req?.toeflOverall || 0,
        academicRequirement: req?.academicReq || '',
        minScore: req?.minScore || '',
      };
    })
    );

    return NextResponse.json({
    success: true,
    data: enrichedCourses,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch courses' }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}