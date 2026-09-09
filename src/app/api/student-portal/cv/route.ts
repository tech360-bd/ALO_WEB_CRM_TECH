import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/cv
// Returns student's CV drafts with pagination
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const status = searchParams.get('status') || '';
      const applicationId = searchParams.get('applicationId') || '';
      const sortBy = searchParams.get('sortBy') || 'updatedAt';
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

      const where: Record<string, unknown> = { studentId: profile.id };
      if (status) where.status = status;
      if (applicationId) where.applicationId = applicationId;

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [cvs, total] = await Promise.all([
        db.cvDraft.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.cvDraft.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: cvs,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch CV drafts';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/cv
// Create a new CV draft or update an existing one
// Body: { id? } to update existing, or { applicationId, content }
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, applicationId, content } = body;

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

      // Update existing draft
      if (id) {
        const existing = await db.cvDraft.findUnique({ where: { id } });
        if (!existing || existing.studentId !== profile.id) {
          return NextResponse.json(
            { success: false, error: 'CV draft not found.' },
            { status: 404 }
          );
        }

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (content !== undefined) {
          updateData.content = content;
          updateData.version = { increment: 1 };
        }

        const updated = await db.cvDraft.update({
          where: { id },
          data: updateData,
        });

        await logAuditAction(auth, 'CV_UPDATED', 'CvDraft', id, { version: updated.version });
        return NextResponse.json({ success: true, data: updated });
      }

      // Create new draft
      if (!content || !content.trim()) {
        return NextResponse.json(
          { success: false, error: 'CV content is required.' },
          { status: 400 }
        );
      }

      const cv = await db.cvDraft.create({
        data: {
          studentId: profile.id,
          applicationId: applicationId || '',
          content: content.trim(),
          version: 1,
          status: 'draft',
          reviewRequested: false,
          studentReviewRequested: false,
          studentReviewCompleted: false,
        },
      });

      await logAuditAction(auth, 'CV_CREATED', 'CvDraft', cv.id, {});
      return NextResponse.json({ success: true, data: cv }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save CV draft';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// PUT /api/student-portal/cv
// Request review for a CV draft
// ============================================================
export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, reviewRequested, studentReviewRequested } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'CV draft id is required.' },
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

      const existing = await db.cvDraft.findUnique({ where: { id } });
      if (!existing || existing.studentId !== profile.id) {
        return NextResponse.json(
          { success: false, error: 'CV draft not found.' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (reviewRequested !== undefined) {
        updateData.reviewRequested = reviewRequested;
        if (reviewRequested) updateData.status = 'under_review';
      }
      if (studentReviewRequested !== undefined) {
        updateData.studentReviewRequested = studentReviewRequested;
      }

      const updated = await db.cvDraft.update({
        where: { id },
        data: updateData,
      });

      await logAuditAction(auth, 'CV_REVIEW_REQUESTED', 'CvDraft', id, {
        reviewRequested: updateData.reviewRequested,
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update CV draft';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
