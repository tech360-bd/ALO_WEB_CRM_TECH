import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/sop
// Returns student's SOP drafts with pagination
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

      const [sops, total] = await Promise.all([
        db.sopDraft.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.sopDraft.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: sops,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch SOP drafts';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/sop
// Create a new SOP draft or update an existing one
// Body: { id? } to update existing, or { applicationId, country, universityName, courseName, content }
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, applicationId, country, universityName, courseName, content } = body;

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
        const existing = await db.sopDraft.findUnique({ where: { id } });
        if (!existing || existing.studentId !== profile.id) {
          return NextResponse.json(
            { success: false, error: 'SOP draft not found.' },
            { status: 404 }
          );
        }

        const updateData: Record<string, unknown> = { updatedAt: new Date() };
        if (content !== undefined) {
          updateData.content = content;
          updateData.version = { increment: 1 };
        }
        if (country !== undefined) updateData.country = country;
        if (universityName !== undefined) updateData.universityName = universityName;
        if (courseName !== undefined) updateData.courseName = courseName;

        const updated = await db.sopDraft.update({
          where: { id },
          data: updateData,
        });

        await logAuditAction(auth, 'SOP_UPDATED', 'SopDraft', id, { version: updated.version });
        return NextResponse.json({ success: true, data: updated });
      }

      // Create new draft
      if (!content || !content.trim()) {
        return NextResponse.json(
          { success: false, error: 'SOP content is required.' },
          { status: 400 }
        );
      }

      const sop = await db.sopDraft.create({
        data: {
          studentId: profile.id,
          applicationId: applicationId || '',
          country: country || '',
          universityName: universityName || '',
          courseName: courseName || '',
          content: content.trim(),
          version: 1,
          status: 'draft',
          reviewRequested: false,
        },
      });

      await logAuditAction(auth, 'SOP_CREATED', 'SopDraft', sop.id, {
        universityName: universityName || '',
        courseName: courseName || '',
      });

      return NextResponse.json({ success: true, data: sop }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to save SOP draft';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// PUT /api/student-portal/sop
// Request review for an SOP draft
// ============================================================
export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, reviewRequested } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'SOP draft id is required.' },
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

      const existing = await db.sopDraft.findUnique({ where: { id } });
      if (!existing || existing.studentId !== profile.id) {
        return NextResponse.json(
          { success: false, error: 'SOP draft not found.' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (reviewRequested !== undefined) {
        updateData.reviewRequested = reviewRequested;
        if (reviewRequested) updateData.status = 'under_review';
      }

      const updated = await db.sopDraft.update({
        where: { id },
        data: updateData,
      });

      await logAuditAction(auth, 'SOP_REVIEW_REQUESTED', 'SopDraft', id, {
        reviewRequested: updateData.reviewRequested,
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update SOP draft';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
