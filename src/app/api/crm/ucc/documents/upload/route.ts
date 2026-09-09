// ============================================================
// /api/crm/ucc/documents/upload
// POST — Secure document upload handler
// - Validates MIME type and extension
// - Enforces 20 MB size limit
// - Computes SHA-256 hash for deduplication
// - Creates UccAttachment record
// - Queues OcrJob automatically
// - Audit logs the upload
// ============================================================

import { NextResponse } from 'next/server';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { validateFile } from '@/lib/file-validator';
import { db } from '@/lib/db';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import path from 'path';




export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const conversationId = (formData.get('conversationId') as string) || '';
    const studentId = (formData.get('studentId') as string) || '';
    const applicationId = (formData.get('applicationId') as string) || '';

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided in form-data field "file".' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file.name, file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
    }

    // Read bytes and compute hash for deduplication
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileHash = createHash('sha256').update(buffer).digest('hex');

    // Store attachment file on disk (Fixes Problem 10)
    const timestamp = Date.now();
    const sanitizedName = validation.sanitizedName || file.name;
    const storedFileName = `${timestamp}_${sanitizedName}`;

    const uploadDir = process.env.STORAGE_POOL_C || path.join(process.cwd(), 'public', 'uploads', 'documents');
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, storedFileName);
    writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/documents/${storedFileName}`;


    const attachment = await db.uccAttachment.create({
      data: {
        conversationId: conversationId || 'unlinked',
        fileName: storedFileName,
        fileType: validation.detectedDocType || 'document',
        mimeType: file.type,
        fileSize: file.size,
        fileUrl,
        detectedDocType: validation.detectedDocType || 'unknown',
        studentId: studentId || undefined,
        applicationId: applicationId || undefined,
        ocrExtractedData: JSON.stringify({
          fileHash,
          uploadedBy: auth.userId,
          uploadedByName: auth.name || auth.email,
          uploadedAt: new Date().toISOString(),
          originalName: file.name,
        }),
      },
    });

    // Auto-queue OCR job
    const ocrJob = await db.ocrJob.create({
      data: {
        documentId: attachment.id,
        documentType: validation.detectedDocType || 'unknown',
        fileUrl,
        fileName: storedFileName,
        mimeType: file.type,
        fileHash,
        status: 'queued',
        studentId: studentId || undefined,
        conversationId: conversationId || undefined,
        attachmentId: attachment.id,
      },
    });

    await logAuditAction(auth, 'DOCUMENT_UPLOADED', 'UccAttachment', attachment.id, {
      originalName: file.name,
      detectedDocType: validation.detectedDocType,
      fileHash,
      ocrJobId: ocrJob.id,
      conversationId,
      studentId,
    });

    return NextResponse.json({
      success: true,
      attachment: {
        id: attachment.id,
        fileName: storedFileName,
        fileType: attachment.fileType,
        detectedDocType: attachment.detectedDocType,
        fileSize: attachment.fileSize,
        fileUrl: attachment.fileUrl,
      },
      ocrJob: { id: ocrJob.id, status: ocrJob.status },
      message: 'Document uploaded successfully. OCR processing queued — a human review will be required to verify extracted values.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(request.url);
    const conversationId = url.searchParams.get('conversationId');
    const studentId = url.searchParams.get('studentId');

    const where: Record<string, string> = {};
    if (conversationId) where.conversationId = conversationId;
    if (studentId) where.studentId = studentId;

    const attachments = await db.uccAttachment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, attachments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
