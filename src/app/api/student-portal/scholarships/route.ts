import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { publicCourseWhere, publicCrmScholarshipWhere, publicUniversityWhere } from '@/lib/public-catalog';

// ============================================================
// GET /api/student-portal/scholarships
// Search scholarships with filters and pagination
// CrmScholarship uses universityId/courseId as FK strings (no @relation)
// so we do a two-step query to enrich with university/course info.
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
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Phase 1 review (P0-C): only source-verified active scholarships of a
      // public university are listed to students.
      const where: Record<string, unknown> = { AND: [publicCrmScholarshipWhere(), { university: { is: publicUniversityWhere() } }] };

      if (search) {
        where.scholarshipName = { contains: search };
      }

      // If country filter is set, pre-fetch matching university IDs
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

      // If studyLevel filter is set, pre-fetch matching course IDs
      if (studyLevel) {
        const matchingCourses = await db.crmCourse.findMany({
          where: { studyLevel: { contains: studyLevel } },
          select: { courseId: true },
        });
        const courseIds = matchingCourses.map(c => c.courseId);
        if (courseIds.length === 0) {
          return NextResponse.json({ success: true, data: [], total: 0, page, totalPages: 0 });
        }
        where.courseId = { in: courseIds };
      }

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [scholarships, total] = await Promise.all([
        db.crmScholarship.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.crmScholarship.count({ where }),
      ]);

      // Enrich with university and course info
      const universityIds = [...new Set(scholarships.map(s => s.universityId).filter(Boolean))];
      const courseIds = [...new Set(scholarships.map(s => s.courseId).filter(Boolean))];

      const [universities, courses] = await Promise.all([
        universityIds.length > 0
          ? db.crmUniversity.findMany({
              where: { universityId: { in: universityIds } },
              select: { universityId: true, name: true, country: true, city: true },
            })
          : [],
        courseIds.length > 0
          ? db.crmCourse.findMany({
              where: { AND: [{ courseId: { in: courseIds } }, publicCourseWhere()] },
              select: { courseId: true, courseTitle: true, studyLevel: true, subjectArea: true },
            })
          : [],
      ]);

      const uniMap = Object.fromEntries(universities.map(u => [u.universityId, u]));
      const courseMap = Object.fromEntries(courses.map(c => [c.courseId, c]));

      const enrichedScholarships = scholarships.map(s => ({
        ...s,
        university: uniMap[s.universityId] || null,
        course: courseMap[s.courseId] || null,
      }));

      return NextResponse.json({
        success: true,
        data: enrichedScholarships,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch scholarships';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
