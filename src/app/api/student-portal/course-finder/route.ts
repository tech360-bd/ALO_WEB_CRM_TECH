import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/course-finder
// Search CRM courses with filters and pagination
// CrmCourse uses universityId as FK string (no @relation to CrmUniversity)
// so we do a two-step query to enrich with university info.
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, _auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const search = searchParams.get('search') || '';
      const country = searchParams.get('country') || '';
      const studyLevel = searchParams.get('studyLevel') || '';
      const subject = searchParams.get('subject') || '';
      const tuitionRange = searchParams.get('tuitionRange') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      const where: Record<string, unknown> = { status: 'active' };

      if (search) {
        where.courseTitle = { contains: search };
      }
      if (studyLevel) {
        where.studyLevel = { contains: studyLevel };
      }
      if (subject) {
        where.subjectArea = { contains: subject };
      }

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      // If country filter, pre-fetch matching university IDs
      if (country) {
        const matchingUnis = await db.crmUniversity.findMany({
          where: { country: { contains: country } },
          select: { universityId: true },
        });
        const uniIds = matchingUnis.map(u => u.universityId);
        if (uniIds.length === 0) {
          return NextResponse.json({ success: true, data: [], total: 0, page, totalPages: 0 });
        }
        where.universityId = { in: uniIds };
      }

      const [courses, total] = await Promise.all([
        db.crmCourse.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.crmCourse.count({ where }),
      ]);

      // Enrich with university info
      const uniIds = [...new Set(courses.map(c => c.universityId).filter(Boolean))];
      const universities = uniIds.length > 0
        ? await db.crmUniversity.findMany({
            where: { universityId: { in: uniIds } },
            select: {
              universityId: true, name: true, country: true, city: true,
              ranking: true, scholarships: true, tuitionRange: true, website: true,
            },
          })
        : [];

      const uniMap = Object.fromEntries(universities.map(u => [u.universityId, u]));

      // Apply tuition range filter
      let enrichedCourses = courses.map(c => ({
        ...c,
        university: uniMap[c.universityId] || null,
      }));

      if (tuitionRange) {
        enrichedCourses = enrichedCourses.filter(c =>
          c.university?.tuitionRange?.includes(tuitionRange)
        );
      }

      const filteredTotal = tuitionRange ? enrichedCourses.length : total;

      return NextResponse.json({
        success: true,
        data: enrichedCourses,
        total: filteredTotal,
        page,
        totalPages: Math.ceil(filteredTotal / limit),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to search courses';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
