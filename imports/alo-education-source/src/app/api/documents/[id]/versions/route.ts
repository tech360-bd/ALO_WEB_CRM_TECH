import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

interface RouteContext {
  params: Promise<{ id: string }>;
}

// ─── GET: List all versions for a document ───────────────────

export async function GET(req: NextRequest, ctx: RouteContext) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await ctx.params;

    // Fetch the document
    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }

    // Ownership / permission check: students see their own, staff see all
    if (auth.user.role === 'STUDENT' && document.userId !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    // List versions ordered by version DESC (newest first)
    const versions = await db.documentVersion.findMany({
      where: { documentId: id },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({ success: true, data: versions });
  } catch (error) {
    console.error('Error fetching document versions:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch document versions.' }, { status: 500 });
  }
}

// ─── POST: Upload a new version of a document ────────────────

export async function POST(req: NextRequest, ctx: RouteContext) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { id } = await ctx.params;

    // Fetch the document
    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    }

    // Ownership / permission check
    if (auth.user.role === 'STUDENT' && document.userId !== auth.user.id) {
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required.' }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Allowed: pdf, doc, docx, jpg, jpeg, png.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    // Determine next version number
    const latestVersion = await db.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { version: 'desc' },
    });
    const nextVersion = (latestVersion?.version ?? 0) + 1;

    // Save file to disk
    const ext = file.name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const fileName = `v${nextVersion}_${auth.user.id}_${timestamp}_${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents', 'versions');
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    const storagePath = `/uploads/documents/versions/${fileName}`;

    // Supersede previous active version(s)
    await db.documentVersion.updateMany({
      where: { documentId: id, status: 'ACTIVE' },
      data: { status: 'SUPERSEDED' },
    });

    // Create the new version record
    const newVersion = await db.documentVersion.create({
      data: {
        documentId: id,
        fileName,
        filePath: storagePath,
        fileSize: file.size,
        mimeType: file.type,
        version: nextVersion,
        uploadedBy: auth.user.id,
        status: 'ACTIVE',
      },
    });

    // Update the Document record with new file info
    await db.document.update({
      where: { id },
      data: {
        fileName,
        fileType: file.type,
        fileSize: file.size,
        storagePath,
        status: 'STUDENT_SUBMITTED',
        updatedAt: new Date(),
      },
    });

    // Create a notification for the student
    if (document.studentId) {
      await db.notification.create({
        data: {
          userId: document.studentId,
          type: 'DOCUMENT_UPLOADED',
          title: 'Document Updated',
          message: `A new version (v${nextVersion}) of "${document.name}" has been uploaded.`,
          data: JSON.stringify({ documentId: id, version: nextVersion, category: document.category }),
          channel: 'IN_APP',
        },
      });
    }

    await auditLog({
      userId: auth.user.id,
      action: 'DOC_VERSION_UPLOAD',
      resource: 'DocumentVersion',
      resourceId: newVersion.id,
      details: { documentId: id, version: nextVersion, fileName, fileSize: file.size },
    });

    return NextResponse.json({ success: true, data: newVersion }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document version:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload document version.' }, { status: 500 });
  }
}
