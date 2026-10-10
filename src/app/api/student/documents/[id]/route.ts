import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/documents/[id]
 *
 * Metadata for a single uploaded document. Scoped to the caller's studentId so
 * a student cannot read another student's record.
 *
 * storagePath and fileHash are never returned: they are server-side storage
 * details, and the download route re-verifies the hash before streaming bytes.
 */
export const GET = withStudentAuth(async (request, auth) => {
  try {
    // withStudentAuth calls the handler with (request, auth) only — it does not
    // forward Next's route context, so the id is read from the pathname the
    // same way the applications detail route does.
    const parts = new URL(request.url).pathname.split('/');
    const id = parts[parts.length - 1];

    if (!id || id === 'route') {
      return NextResponse.json({ success: false, error: 'Document ID is required' }, { status: 400 });
    }

    const document = await db.studentDocument.findFirst({
      where: { id, studentId: auth.studentId },
      select: {
        id: true,
        category: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        status: true,
        version: true,
        previousVersionId: true,
        reviewedBy: true,
        reviewedAt: true,
        reviewerNote: true,
        rejectionReason: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }

    const audit = await db.documentAudit.findMany({
      where: { documentId: document.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        actorName: true,
        actorRole: true,
        action: true,
        newStatus: true,
        note: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...document,
        downloadUrl: `/api/student/documents/${document.id}/download`,
        uploadedAt: document.createdAt,
      },
      audit,
    });
  } catch (error) {
    console.error('Student Document GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Could not load that document' },
      { status: 500 },
    );
  }
});
