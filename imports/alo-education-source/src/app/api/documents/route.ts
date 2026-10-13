import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth as requireAuthApi } from '@/lib/api-auth';
import { requireAuth, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_MIME = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

// ─── GET: List documents ─────────────────────────────────────

export async function GET(req: NextRequest) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp);

    const where: Record<string, unknown> = {};
    if (sp.get('userId')) where.userId = sp.get('userId');
    if (sp.get('studentId')) where.studentId = sp.get('studentId');
    if (sp.get('applicationId')) where.applicationId = sp.get('applicationId');
    if (sp.get('category')) where.category = sp.get('category');
    if (sp.get('status')) where.status = sp.get('status');

    // Students can only see their own documents
    if (auth.user.role === 'STUDENT') {
      where.userId = auth.user.id;
    }

    const [data, total] = await Promise.all([
      db.document.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      db.document.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json({ success: false, error: 'Failed to list documents.' }, { status: 500 });
  }
}

// ─── POST: Upload document ───────────────────────────────────

const uploadSchema = z.object({
  studentId: z.string().optional(),
  applicationId: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
});

export async function POST(req: NextRequest) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const studentId = formData.get('studentId') as string | null;
    const applicationId = formData.get('applicationId') as string | null;
    const category = formData.get('category') as string | null;

    // Validate
    const parsed = uploadSchema.safeParse({ studentId, applicationId, category });
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    if (!file) {
      return NextResponse.json({ success: false, error: 'File is required.' }, { status: 400 });
    }

    if (!ALLOWED_MIME.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'Invalid file type. Allowed: pdf, doc, docx, jpg, jpeg, png.' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ success: false, error: 'File size exceeds 10MB limit.' }, { status: 400 });
    }

    // Save file
    const ext = file.name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const fileName = `${auth.user.id}_${timestamp}_${file.name}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
    await mkdir(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const storagePath = `/uploads/documents/${fileName}`;

    // Create DB record
    const document = await db.document.create({
      data: {
        userId: auth.user.id,
        studentId: parsed.data.studentId || undefined,
        applicationId: parsed.data.applicationId || undefined,
        category: parsed.data.category,
        name: file.name,
        fileName,
        fileType: file.type,
        fileSize: file.size,
        storagePath,
        status: 'STUDENT_SUBMITTED',
        uploadedAt: new Date(),
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'DOC_UPLOAD',
      resource: 'Document',
      resourceId: document.id,
      details: { category: parsed.data.category, fileName, fileSize: file.size },
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json({ success: false, error: 'Failed to upload document.' }, { status: 500 });
  }
}
