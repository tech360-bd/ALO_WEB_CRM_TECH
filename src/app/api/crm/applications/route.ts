import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { reportServerEvent } from '@/lib/analytics/server-conversions';

// ============================================================
// CRM APPLICATIONS API — PortalStudentApplication with stage filtering
// ============================================================

const VALID_STAGES = [
  'research', 'shortlisted', 'counseling', 'document_ready',
  'submitted', 'under_review', 'offer_received', 'visa_applied',
  'visa_approved', 'enrolled', 'withdrawn', 'rejected',
];

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const stage = searchParams.get('stage') || '';
      const country = searchParams.get('country') || '';
      const intake = searchParams.get('intake') || '';
      const sortBy = searchParams.get('sortBy') || 'updatedAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (stage) {
        const stages = stage.split(',').map(s => s.trim()).filter(Boolean);
        if (stages.length === 1) {
          where.stage = stages[0];
        } else if (stages.length > 1) {
          where.stage = { in: stages };
        }
      }

      if (country) {
        where.country = country;
      }
      if (intake) {
        where.intake = intake;
      }

      if (search) {
        where.OR = [
          { university: { contains: search } },
          { course: { contains: search } },
          { counselorNote: { contains: search } },
          { studentProfile: {
            OR: [
              { fullName: { contains: search } },
              { studentId: { contains: search } },
            ],
          }},
        ];
      }

      // Build orderBy
      const validSortFields = ['createdAt', 'updatedAt', 'university', 'course', 'stage', 'deadline'];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'updatedAt';
      const orderBy = { [orderField]: sortOrder === 'asc' ? 'asc' as const : 'desc' as const };

      const [total, applications] = await Promise.all([
        db.portalStudentApplication.count({ where }),
        db.portalStudentApplication.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            studentProfile: {
              select: {
                id: true,
                studentId: true,
                fullName: true,
                city: true,
                preferredCountry: true,
                counselorName: true,
                partnerName: true,
                profileCompletion: true,
                journeyStage: true,
                user: {
                  select: {
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        success: true,
        data: applications,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error('CRM Applications API error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load applications' },
        { status: 500 }
      );
    }
  })(request);
}

// ============================================================
// PUT — Update application stage
// ============================================================
export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, stage, counselorNote, deadline, nextAction } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Application ID is required' },
          { status: 400 }
        );
      }

      // Validate stage
      if (stage && !VALID_STAGES.includes(stage)) {
        return NextResponse.json(
          { success: false, error: `Invalid stage. Must be one of: ${VALID_STAGES.join(', ')}` },
          { status: 400 }
        );
      }

      // Check application exists
      const existing = await db.portalStudentApplication.findUnique({
        where: { id },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Application not found' },
          { status: 404 }
        );
      }

      // Build update data
      const updateData: Record<string, unknown> = {};
      if (stage !== undefined) updateData.stage = stage;
      if (counselorNote !== undefined) updateData.counselorNote = counselorNote;
      if (deadline !== undefined) updateData.deadline = deadline;
      if (nextAction !== undefined) updateData.nextAction = nextAction;

      const application = await db.portalStudentApplication.update({
        where: { id },
        data: updateData,
        include: {
          studentProfile: {
            select: {
              id: true,
              studentId: true,
              fullName: true,
            },
          },
        },
      });

      // Log audit action
      await logAuditAction(auth, 'update_application_stage', 'PortalStudentApplication', id, {
        previousStage: existing.stage,
        newStage: stage,
        studentId: application.studentProfile?.studentId,
      });

      // `enrollment_completed` — the last conversion in the funnel
      // (traffic -> lead -> qualified -> application -> ENROLMENT). Emitted
      // only on the transition INTO 'enrolled', never on a re-save of an
      // already-enrolled application, so the count cannot be inflated by an
      // edit. The student id used for the audit log is deliberately NOT sent to
      // analytics; the client id is derived from the application record id.
      if (stage === 'enrolled' && existing.stage !== 'enrolled') {
        reportServerEvent({
          event: 'enrollment_completed',
          reference: id,
          params: {
            application_reference: (application as { applicationCode?: string }).applicationCode ?? '',
            enrollment_status: 'enrolled',
            destination: (application as { country?: string }).country ?? undefined,
          },
        });
      }

      return NextResponse.json({
        success: true,
        data: application,
      });
    } catch (error) {
      console.error('CRM Applications PUT error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update application' },
        { status: 500 }
      );
    }
  })(request);
}
