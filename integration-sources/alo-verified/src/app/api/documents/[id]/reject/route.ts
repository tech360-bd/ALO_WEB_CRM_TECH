import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/auth-rbac';
import { logAudit } from '@/lib/audit';

const ALLOWED_REVIEW_ROLES = [
  'super_admin',
  'admin',
  'counselor',
  'application_manager',
];

/**
 * Reject a document (admin / counselor review workflow).
 *
 * POST /api/documents/{id}/reject
 * Body: { reason: string, comment?: string }
 *
 * Validation:
 *  - Document must currently be in 'student_submitted' OR 'under_review'
 *    state. The Document schema uses 'uploaded' as the freshly-submitted
 *    state, so we accept both 'uploaded' (== student_submitted) and
 *    'under_review' as valid reject-from states.
 *
 * Side effects:
 *  - Updates Document.status = 'rejected', stores rejection reason in
 *    Document.note, sets reviewedBy + reviewedAt.
 *  - Creates a DocumentVersion entry capturing the rejected file as
 *    an immutable version (so future re-uploads stack on top).
 *  - Writes audit log: document.rejected
 *  - Notifies the student (creates Notification row).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authOrResponse = await requireRole(request, ALLOWED_REVIEW_ROLES);
    if (authOrResponse instanceof NextResponse) return authOrResponse;
    const auth = authOrResponse;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    let body: { reason?: string; comment?: string } = {};
    try {
      body = (await request.json()) as { reason?: string; comment?: string };
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'INVALID_BODY' },
        { status: 400 }
      );
    }

    const reason = (body.reason || '').trim();
    const comment = (body.comment || '').trim();

    if (!reason) {
      return NextResponse.json(
        { error: 'reason is required', code: 'REASON_REQUIRED' },
        { status: 400 }
      );
    }

    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json(
        { error: 'Document not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate the document is in a rejections-allowed state.
    // Document.status enum is: uploaded | under_review | approved | rejected | expired
    // The spec says 'student_submitted' (== uploaded in our schema) or 'under_review'.
    const allowedFromStatuses = new Set([
      'uploaded',
      'student_submitted',
      'under_review',
    ]);
    if (!allowedFromStatuses.has(document.status)) {
      return NextResponse.json(
        {
          error: `Cannot reject a document with status '${document.status}'. Allowed: uploaded, under_review.`,
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

    const rejectionNote = comment
      ? `[REJECTED — ${reason}] ${comment}`
      : `[REJECTED — ${reason}]`;

    // 1. Update the document
    const updated = await db.document.update({
      where: { id },
      data: {
        status: 'rejected',
        note: rejectionNote,
        reviewedBy: auth.user.id,
        reviewedAt: new Date(),
      },
    });

    // 2. Create an immutable DocumentVersion entry for the rejected file
    //    (versioning — each rejection + re-upload creates a new row).
    const lastVersion = await db.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });
    const nextVersion = (lastVersion?.version ?? 0) + 1;

    const version = await db.documentVersion.create({
      data: {
        documentId: id,
        version: nextVersion,
        fileUrl: document.filePath,
        fileName: document.documentName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedBy: auth.user.id,
        changeNote: `Rejected: ${reason}${comment ? ` — ${comment}` : ''}`,
      },
    });

    // 3. Audit log
    await logAudit({
      userId: auth.user.id,
      action: 'document.rejected',
      module: 'documents',
      recordId: id,
      oldData,
      newData: {
        status: updated.status,
        note: updated.note,
        reviewedBy: updated.reviewedBy,
        reviewedAt: updated.reviewedAt,
        version: { id: version.id, version: version.version },
        reason,
        comment,
      },
      reason,
      ip: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // 4. Notify the student (if the document belongs to a student)
    if (document.studentId) {
      // Find the User.id for this student
      const student = await db.student.findUnique({
        where: { id: document.studentId },
        select: { id: true },
      });
      // Look up the user record whose referenceId points to this student.
      // (Student has no direct userId field; User.referenceId is the link.)
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
            title: 'Document rejected — re-upload required',
            message:
              `Your document "${document.documentName}" was rejected. Reason: ${reason}.` +
              (comment ? ` Reviewer note: ${comment}` : ''),
            type: 'warning',
            link: '/student/documents',
          },
        });
      }
    }

    return NextResponse.json({
      document: updated,
      version,
      rejected: true,
    });
  } catch (error) {
    console.error('documents/[id]/reject POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
