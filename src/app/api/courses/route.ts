import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOptionalAuth } from '@/lib/auth-middleware';
import { publicCourseWhere } from '@/lib/public-catalog';

// Public GET /api/courses — Course Finder database engine (Part 9 & 46)
// Filters: country, universityId, level, subject, intake, tuition, scholarship, englishRequirement, status
// Public visibility: anonymous visitors only receive published, VERIFIED,
// source-linked courses (publicCourseWhere). ?status=all is honored only for
// privileged staff; for everyone else it is ignored.
export async function GET(req: NextRequest) {
  try {
    const auth = await getOptionalAuth(req);
    const privileged = (auth?.roles || []).some((role) =>
      ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'STAFF', 'APPLICATION_OFFICER', 'super_admin', 'admin', 'counselor'].includes(role),
    );
    const country = req.nextUrl.searchParams.get('country') || '';
    const universityId = req.nextUrl.searchParams.get('universityId') || '';
    const level = req.nextUrl.searchParams.get('level') || '';
    const subject = req.nextUrl.searchParams.get('subject') || '';
    const search = req.nextUrl.searchParams.get('search') || '';
    const status = req.nextUrl.searchParams.get('status') || 'active';
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10) || 50, 100);

    const where: any = privileged ? {} : publicCourseWhere();
    if (privileged && status !== 'all') where.status = status;
    if (country && country !== 'all') where.country = country;
    if (universityId) where.universityId = universityId;
    if (level && level !== 'all') where.studyLevel = level;
    if (subject && subject !== 'all') where.subjectArea = { contains: subject };
    if (search) where.courseTitle = { contains: search };

    // No .catch(()=>[]) here: DB failures must surface as 500, not empty lists.
    const courses = await db.crmCourse.findMany({
      where,
      take: limit,
      orderBy: { courseTitle: 'asc' },
      include: {
        university: { select: { name: true, slug: true } },
        intakeFees: { take: 1 },
        englishRequirements: { take: 1 },
      },
    });

    const safe = courses.map((c: any) => ({
      id: c.id,
      courseId: c.courseId,
      courseTitle: c.courseTitle,
      universityId: c.universityId,
      universityName: c.university?.name || '',
      universitySlug: c.university?.slug || '',
      country: c.country,
      city: c.city,
      studyLevel: c.studyLevel || c.programLevel,
      subjectArea: c.subjectArea,
      durationMonths: c.durationMonths,
      tuitionFee: c.tuitionFee,
      currency: c.currency,
      status: c.status,
      verificationStatus: c.verificationStatus,
      intakeFees: c.intakeFees || [],
      englishRequirement: c.englishRequirements?.[0] || null,
    }));

    return NextResponse.json({ success: true, courses: safe, data: safe, total: safe.length });
  } catch (e: any) {
    // Log full diagnostics server-side; never echo raw driver/Prisma messages
    // (they contain DB usernames/hosts) to the public client.
    console.error('[api/courses] error', e);
    return NextResponse.json({ success: false, error: 'Failed to load courses' }, { status: 500 });
  }
}
