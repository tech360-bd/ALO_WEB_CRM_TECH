import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public GET /api/courses — Course Finder database engine (Part 9 & 46)
// Filters: country, universityId, level, subject, intake, tuition, scholarship, englishRequirement, status
// Publish safety: defaults to status 'active' (seeders write 'active';
// unverified rows stay 'needs_official_source'). ?status=all for internal use.
export async function GET(req: NextRequest) {
  try {
    const country = req.nextUrl.searchParams.get('country') || '';
    const universityId = req.nextUrl.searchParams.get('universityId') || '';
    const level = req.nextUrl.searchParams.get('level') || '';
    const subject = req.nextUrl.searchParams.get('subject') || '';
    const search = req.nextUrl.searchParams.get('search') || '';
    const status = req.nextUrl.searchParams.get('status') || 'active';
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10) || 50, 100);

    const where: any = {};
    if (status !== 'all') where.status = status;
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
    console.error('[api/courses] error', e);
    return NextResponse.json({ success: false, error: e?.message || 'Failed to load courses' }, { status: 500 });
  }
}
