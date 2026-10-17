import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/auth-rbac';

/**
 * List all DocumentVersion records for a document.
 *
 * GET /api/documents/{id}/versions
 *
 * Returns:
 *  - versions: DocumentVersion[] (ordered by version asc)
 *  - document: the parent Document (so the caller can see current status)
 *
 * Each version row includes uploader info (User.name, User.email) if
 * uploadedBy is set.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authOrResponse = await requireAuth(request);
    if (authOrResponse instanceof NextResponse) return authOrResponse;

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const document = await db.document.findUnique({
      where: { id },
      select: {
        id: true,
        documentName: true,
        documentType: true,
        status: true,
        studentId: true,
        filePath: true,
      },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const versions = await db.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { version: 'asc' },
    });

    // Resolve uploader info (User.name + email) for each version's uploadedBy
    const uploaderIds = Array.from(
      new Set(versions.map((v) => v.uploadedBy).filter((u): u is string => !!u))
    );
    const uploaders = uploaderIds.length
      ? await db.user.findMany({
          where: { id: { in: uploaderIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const uploaderMap = new Map(uploaders.map((u) => [u.id, u]));

    const versionsWithUploader = versions.map((v) => ({
      ...v,
      uploader: v.uploadedBy ? uploaderMap.get(v.uploadedBy) ?? null : null,
    }));

    return NextResponse.json({
      document,
      versions: versionsWithUploader,
    });
  } catch (error) {
    console.error('documents/[id]/versions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
