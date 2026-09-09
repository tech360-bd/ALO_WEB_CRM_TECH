import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/applications
// Returns student's applications with pagination, filters, sorting
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const stage = searchParams.get('stage') || '';
      const country = searchParams.get('country') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const where: Record<string, unknown> = { studentProfileId: profile.id };
      if (stage) where.stage = stage;
      if (country) where.country = country;

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [applications, total] = await Promise.all([
        db.portalStudentApplication.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.portalStudentApplication.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: applications,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch applications';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/applications
// Create a new draft application
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { university, course, intake, country } = body;

      // Validate required fields
      if (!university && !course) {
        return NextResponse.json(
          { success: false, error: 'At least university or course is required.' },
          { status: 400 }
        );
      }

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const application = await db.portalStudentApplication.create({
        data: {
          studentProfileId: profile.id,
          university: university || '',
          course: course || '',
          intake: intake || '',
          country: country || '',
          stage: 'research',
          nextAction: 'Explore program requirements',
        },
      });

      // Audit log
      await logAuditAction(auth, 'APPLICATION_CREATED', 'PortalStudentApplication', application.id, {
        university,
        course,
        country,
      });

      return NextResponse.json({ success: true, data: application }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create application';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// PUT /api/student-portal/applications
// Update application stage and notes
// ============================================================
export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, stage, counselorNote, nextAction, deadline, university, course, intake, country } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Application id is required.' },
          { status: 400 }
        );
      }

      // Verify student owns this application
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const existing = await db.portalStudentApplication.findUnique({
        where: { id },
      });
      if (!existing || existing.studentProfileId !== profile.id) {
        return NextResponse.json(
          { success: false, error: 'Application not found.' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (stage !== undefined) updateData.stage = stage;
      if (counselorNote !== undefined) updateData.counselorNote = counselorNote;
      if (nextAction !== undefined) updateData.nextAction = nextAction;
      if (deadline !== undefined) updateData.deadline = deadline;
      if (university !== undefined) updateData.university = university;
      if (course !== undefined) updateData.course = course;
      if (intake !== undefined) updateData.intake = intake;
      if (country !== undefined) updateData.country = country;

      const updated = await db.portalStudentApplication.update({
        where: { id },
        data: updateData,
      });

      // Audit log
      await logAuditAction(auth, 'APPLICATION_UPDATED', 'PortalStudentApplication', id, {
        updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt'),
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update application';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
