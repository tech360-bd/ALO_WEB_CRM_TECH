import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

const ALLOWED_VERIFY_ROLES = [
  'super_admin',
  'admin',
  'counselor',
  'application_manager',
];

/**
 * Verify a document (mark as verified / approved).
 *
 * POST /api/documents/{id}/verify
 * Body: { comment?: string }
 *
 * Validation:
 *  - Document must currently be in 'uploaded', 'under_review', or 'student_submitted'
 *    state (i.e. not already verified / rejected / expired).
 *
 * Side effects:
 *  - Updates Document.status = 'verified', sets reviewedBy + reviewedAt.
 *  - Writes audit log: document.verified
 *  - Notifies the student (creates Notification row).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authOrResponse = await requireRole(request, ALLOWED_VERIFY_ROLES);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    let body: { comment?: string } = {};
    try {
      body = (await request.json()) as { comment?: string };
    } catch {
      // body may be empty — that's fine
    }
    const comment = (body.comment || '').trim();

    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const allowedFromStatuses = new Set([
      'uploaded',
      'student_submitted',
      'under_review',
    ]);
    if (!allowedFromStatuses.has(document.status)) {
      return NextResponse.json(
        {
          error: `Cannot verify a document with status '${document.status}'. Allowed: uploaded, under_review.`,
          code: 'INVALID_STATUS',
          currentStatus: document.status,
        },
        { status: 409 }
      );
    }

    const oldData = {
      status: document.status,
      note: document.note,
      reviewedBy: document.reviewedBy,
      reviewedAt: document.reviewedAt,
    };

    const verifyNote = comment
      ? `[VERIFIED] ${comment}`
      : '[VERIFIED]';

    const updated = await db.document.update({
      where: { id },
      data: {
        status: 'verified',
        note: verifyNote,
        reviewedBy: auth.user.id,
        reviewedAt: new Date(),
      },
    });

    await logAudit({
      userId: auth.user.id,
      action: 'document.verified',
      module: 'documents',
      recordId: id,
      oldData,
      newData: {
        status: updated.status,
        note: updated.note,
        reviewedBy: updated.reviewedBy,
        reviewedAt: updated.reviewedAt,
        comment,
      },
      reason: comment || undefined,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Notify the student (if the document belongs to a student)
    if (document.studentId) {
      const student = await db.student.findUnique({
        where: { id: document.studentId },
        select: { id: true },
      });
      const user = student
        ? await db.user.findFirst({
            where: { referenceId: student.id, userType: 'student' },
            select: { id: true },
          })
        : null;
      if (user) {
        await db.notification.create({
          data: {
            userId: user.id,
            title: 'Document verified',
            message:
              `Your document "${document.documentName}" has been verified.` +
              (comment ? ` Reviewer note: ${comment}` : ''),
            type: 'success',
            link: '/student/documents',
          },
        });
      }
    }

    return NextResponse.json({
      document: updated,
      verified: true,
    });
  } catch (error) {
    console.error('documents/[id]/verify POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
