import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { buildManualCourseRecords } from '@/lib/course-finder/manual-course-create';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const universityId = searchParams.get('universityId') || '';
      const studyLevel = searchParams.get('studyLevel') || '';
      const country = searchParams.get('country') || '';
      const status = searchParams.get('status') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { courseTitle: { contains: search } },
          { courseId: { contains: search } },
          { subjectArea: { contains: search } },
        ];
      }
      if (universityId && universityId !== 'all') where.universityId = universityId;
      if (studyLevel && studyLevel !== 'all') where.studyLevel = studyLevel;
      if (country && country !== 'all') where.country = { contains: country };
      if (status && status !== 'all') where.status = status;

      const [total, courses] = await Promise.all([
        db.crmCourse.count({ where }),
        db.crmCourse.findMany({
          where,
          skip,
          take: limit,
          orderBy: { courseTitle: 'asc' },
          include: {
            university: {
              select: {
                name: true,
                country: true,
                city: true,
                universityId: true,
              },
            },
            intakeFees: {
              take: 2,
            },
            requirements: {
              take: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: courses,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Admin authority required' }, { status: 403 });
      }

      const body = await req.json();
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ success: false, error: 'A JSON object body is required' }, { status: 400 });
      }
      const { courseTitle, universityId, studyLevel, forceCreate } = body;

      if (typeof courseTitle !== 'string' || !courseTitle.trim() || typeof universityId !== 'string' || !universityId) {
        return NextResponse.json({ success: false, error: 'Course title and University ID are required' }, { status: 400 });
      }

      const uni = await db.crmUniversity.findFirst({
        where: { OR: [{ universityId }, { id: universityId }] },
      });
      if (!uni) {
        return NextResponse.json({ success: false, error: `University '${universityId}' not found in database.` }, { status: 404 });
      }

      const normalizedTitle = courseTitle.trim().toLowerCase();
      const existing = await db.crmCourse.findFirst({
        where: {
          universityId: uni.universityId,
          courseTitle: { contains: normalizedTitle },
          studyLevel: studyLevel || undefined,
        },
      });

      if (existing && !forceCreate) {
        return NextResponse.json({
          success: false,
          duplicateDetected: true,
          existingCourse: {
            id: existing.id,
            courseId: existing.courseId,
            courseTitle: existing.courseTitle,
            universityId: existing.universityId,
          },
          error: `Possible duplicate detected: '${existing.courseTitle}' already exists for ${uni.name}.`,
        }, { status: 409 });
      }

      const genCourseCode = `CRS-${uni.universityId.replace('UNI-', '')}-${Date.now().toString(36).toUpperCase()}`;
      const slug = `${courseTitle}-${uni.name}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      // Phase 1 review (P0-A): creation is never verification or publication
      // and missing facts are never invented. See manual-course-create.ts.
      const built = buildManualCourseRecords(body, uni, genCourseCode, slug);
      if (!built.ok) return NextResponse.json({ success: false, error: built.error }, { status: built.status });
      const newCourse = await db.crmCourse.create({ data: built.course as any });
      if (built.intake) await db.crmCourseIntakeFee.create({ data: built.intake as any });
      if (built.requirement) await db.crmCourseRequirement.create({ data: built.requirement as any });

      await db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId || 'system',
          actorRole: auth.roles[0] || 'ADMIN',
          action: 'CREATE_COURSE',
          targetCollection: 'CrmCourse',
          targetId: newCourse.id,
          afterData: JSON.stringify({ title: courseTitle, uni: uni.name, code: genCourseCode }),
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: newCourse, warnings: built.warnings, message: 'Course created as an unpublished draft that needs review.' });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create course' }, { status: 500 });
    }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}
