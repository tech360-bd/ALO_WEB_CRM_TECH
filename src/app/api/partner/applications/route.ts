import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// ============================================================
// GET — List partner's student applications with optional stage filter
// ============================================================
export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    // Find partner profile for the authenticated user
    const partner = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage') || '';
    const country = searchParams.get('country') || '';
    const university = searchParams.get('university') || '';
    const studentProfileId = (searchParams.get('studentProfileId') || '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build filter for student profiles belonging to this partner
    const where: Record<string, unknown> = {
      studentProfile: { partnerId: partner.partnerId },
    };
    if (studentProfileId) where.studentProfileId = studentProfileId;

    if (stage) {
      where.stage = stage;
    }
    if (country) {
      where.country = country;
    }
    if (university) {
      where.university = { contains: university };
    }

    // Fetch applications with student info
    const [applications, total] = await Promise.all([
      db.portalStudentApplication.findMany({
        where,
        include: {
          studentProfile: {
            select: {
              id: true,
              userId: true,
              fullName: true,
              studentId: true,
              preferredCountry: true,
              preferredIntake: true,
              journeyStage: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.portalStudentApplication.count({ where }),
    ]);

    // Enrich with student email from PortalUser via studentProfile
    return NextResponse.json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[PARTNER APPLICATIONS GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// ============================================================
// POST — Create a new student application
// ============================================================
export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const partner = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      studentProfileId,
      university,
      course,
      country,
      intake,
      stage,
      nextAction,
      deadline,
      counselorNote,
    } = body;

    // Validate required fields
    if (!studentProfileId) {
      return NextResponse.json({ success: false, error: 'studentProfileId is required' }, { status: 400 });
    }
    if (!university) {
      return NextResponse.json({ success: false, error: 'university is required' }, { status: 400 });
    }
    if (!course) {
      return NextResponse.json({ success: false, error: 'course is required' }, { status: 400 });
    }
    if (!country) {
      return NextResponse.json({ success: false, error: 'country is required' }, { status: 400 });
    }

    // Verify the student profile belongs to this partner
    const studentProfile = await db.portalStudentProfile.findUnique({
      where: { id: studentProfileId },
    });
    if (!studentProfile) {
      return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });
    }
    if (studentProfile.partnerId !== partner.partnerId) {
      return NextResponse.json({ success: false, error: 'Student does not belong to your partner account' }, { status: 403 });
    }

    // Create the application
    const application = await db.portalStudentApplication.create({
      data: {
        studentProfileId,
        university,
        course,
        country,
        intake: intake || '',
        stage: stage || 'research',
        nextAction: nextAction || '',
        deadline: deadline || '',
        counselorNote: counselorNote || '',
      },
      include: {
        studentProfile: {
          select: {
            id: true,
            fullName: true,
            studentId: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: application }, { status: 201 });
  } catch (error) {
    console.error('[PARTNER APPLICATIONS POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create application' }, { status: 500 });
  }
}

// ============================================================
// PUT — Update application stage / fields
// ============================================================
export async function PUT(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const partner = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { applicationId, stage, university, course, country, intake, nextAction, deadline, counselorNote } = body;

    if (!applicationId) {
      return NextResponse.json({ success: false, error: 'applicationId is required' }, { status: 400 });
    }

    // Verify application belongs to partner's student
    const application = await db.portalStudentApplication.findUnique({
      where: { id: applicationId },
      include: { studentProfile: true },
    });
    if (!application) {
      return NextResponse.json({ success: false, error: 'Application not found' }, { status: 404 });
    }
    if (application.studentProfile.partnerId !== partner.partnerId) {
      return NextResponse.json({ success: false, error: 'Application does not belong to your partner account' }, { status: 403 });
    }

    // Build update data with only provided fields
    const updateData: Record<string, string> = {};
    if (stage !== undefined) updateData.stage = stage;
    if (university !== undefined) updateData.university = university;
    if (course !== undefined) updateData.course = course;
    if (country !== undefined) updateData.country = country;
    if (intake !== undefined) updateData.intake = intake;
    if (nextAction !== undefined) updateData.nextAction = nextAction;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (counselorNote !== undefined) updateData.counselorNote = counselorNote;

    const updated = await db.portalStudentApplication.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        studentProfile: {
          select: {
            id: true,
            fullName: true,
            studentId: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PARTNER APPLICATIONS PUT] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update application' }, { status: 500 });
  }
}
