import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { buildManualCourseRecords } from '@/lib/course-finder/manual-course-create';

// POST /api/admin/courses/create — Complete course form per spec section 27 with 16 tabs
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
    if (!isAuthorized) return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });

    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A JSON object body is required' }, { status: 400 });
    const { courseTitle, universityId, forceCreate } = body;

    if (typeof courseTitle !== 'string' || !courseTitle.trim() || typeof universityId !== 'string' || !universityId) return NextResponse.json({ success: false, error: 'Course title and University ID required' }, { status: 400 });

    const uni = await db.crmUniversity.findFirst({ where: { OR: [{ universityId }, { id: universityId }] } });
    if (!uni) return NextResponse.json({ success: false, error: `University ${universityId} not found` }, { status: 404 });

    if (!forceCreate) {
      const existing = await db.crmCourse.findFirst({ where: { universityId: uni.universityId, courseTitle: { contains: courseTitle } } });
      if (existing) return NextResponse.json({ success: false, error: `Duplicate: ${existing.courseTitle} already exists for ${uni.name}`, duplicateDetected: true, existingCourse: { id: existing.id, courseTitle: existing.courseTitle } }, { status: 409 });
    }

    const genCourseCode = `CRS-${uni.universityId.replace('UNI-', '')}-${Date.now().toString(36).toUpperCase()}`;
    const slug = (typeof body.slug === 'string' && body.slug) || `${courseTitle}-${uni.name}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    // Phase 1 review (P0-A): creation is never verification or publication and
    // missing facts are never invented. See manual-course-create.ts.
    const built = buildManualCourseRecords(body, uni, genCourseCode, slug);
    if (!built.ok) return NextResponse.json({ success: false, error: built.error }, { status: built.status });
    const newCourse = await db.crmCourse.create({ data: built.course as any });
    if (built.intake) await db.crmCourseIntakeFee.create({ data: built.intake as any });
    if (built.requirement) await db.crmCourseRequirement.create({ data: built.requirement as any });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles[0] || 'ADMIN',
        action: 'CREATE_COURSE',
        targetCollection: 'CrmCourse',
        targetId: newCourse.id,
        afterData: JSON.stringify({ title: courseTitle, uni: uni.name, code: genCourseCode }),
      },
    }).catch(() => {});

    return NextResponse.json({ success: true, data: newCourse, course: newCourse, warnings: built.warnings, message: 'Course created as an unpublished draft that needs review. It is not verified and not public.' });
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    return NextResponse.json({ success: true, message: 'Use POST to create course with 16 tabs per spec section 27 — Basic Info, University & Campus, Study Classification, Tuition & Fees, Intakes, Deadlines, Academic Requirements, English Requirements, Scholarships, Highlights, Documents, Career Outcomes, SEO, Source Verification, Visibility, Internal/Commission Data (never returned by public/student APIs)' });
  })(request);
}
