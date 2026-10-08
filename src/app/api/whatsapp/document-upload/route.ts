import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { readPrivateFile } from '@/lib/storage/private-file-store';
import { canAccessUccDocumentConversation, canUseUccDocuments, canViewUccB2B } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function classifyDocument(fileName: string): string {
  const name = fileName.toLowerCase();
  if (/passport/.test(name)) return 'PASSPORT';
  if (/transcript|marksheet|result/.test(name)) return 'TRANSCRIPT';
  if (/certificate|cert|ssc|hsc|degree/.test(name)) return 'ACADEMIC_CERT';
  if (/bank|statement|finance/.test(name)) return 'BANK_STATEMENT';
  if (/ielts|pte|toefl|duolingo|english/.test(name)) return 'ENGLISH_TEST';
  if (/visa/.test(name)) return 'VISA_DOC';
  if (/offer|admission/.test(name)) return 'OFFER_LETTER';
  if (/cas|coe|i20/.test(name)) return 'CAS_COE_I20';
  if (/receipt|payment|invoice/.test(name)) return 'PAYMENT_RECEIPT';
  if (/cv|resume/.test(name)) return 'CV';
  if (/sop|statement-of-purpose/.test(name)) return 'SOP';
  return 'OTHER';
}

function metadataOf(value: string) {
  try {
    const parsed = JSON.parse(value || '{}');
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!canUseUccDocuments(auth)) return NextResponse.json({ success: false, error: 'WhatsApp document access is not permitted.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    const parsed = await request.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid');
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'A valid document-link request is required.' }, { status: 400 });
  }
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : '';
  const attachmentId = typeof body.attachmentId === 'string' ? body.attachmentId.trim() : '';
  const requestedCategory = typeof body.documentType === 'string' ? body.documentType.trim().toUpperCase().slice(0, 80) : '';
  const requestedApplicationId = typeof body.applicationId === 'string' ? body.applicationId.trim() : '';
  const allowedCategories = new Set(['PASSPORT', 'TRANSCRIPT', 'ACADEMIC_CERT', 'BANK_STATEMENT', 'ENGLISH_TEST', 'IELTS_CERT', 'CV', 'SOP', 'VISA_DOC', 'OFFER_LETTER', 'CAS_COE_I20', 'PAYMENT_RECEIPT', 'OTHER']);
  if (requestedCategory && !allowedCategories.has(requestedCategory)) return NextResponse.json({ success: false, error: 'Select a supported document category.' }, { status: 400 });
  if (!conversationId || !attachmentId) return NextResponse.json({ success: false, error: 'conversationId and a stored WhatsApp attachmentId are required.' }, { status: 400 });

  const conversation = await db.uccConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, studentId: true, assignedToUserId: true, channel: true },
  });
  if (!conversation || conversation.channel !== 'whatsapp' || !canAccessUccDocumentConversation(auth, conversation) || !(await canViewUccConversationB2B(auth, conversation))) {
    return NextResponse.json({ success: false, error: 'WhatsApp conversation not found or access denied.' }, { status: 404 });
  }
  if (!conversation.studentId) {
    return NextResponse.json({ success: false, error: 'This sender is not matched to a student record. A human must match the contact before attaching the file to a student profile.' }, { status: 409 });
  }
  const student = await db.student.findUnique({ where: { id: conversation.studentId }, select: { id: true, studentId: true, status: true, suspended: true } });
  if (!student || student.suspended || student.status.toLowerCase() !== 'active') {
    return NextResponse.json({ success: false, error: 'The linked student profile is not active or could not be verified.' }, { status: 409 });
  }
  if (requestedApplicationId) {
    const application = await db.application.findFirst({ where: { id: requestedApplicationId, studentId: student.id }, select: { id: true, isB2bConfidential: true } });
    if (!application) return NextResponse.json({ success: false, error: 'The selected application does not belong to this student.' }, { status: 422 });
    if (application.isB2bConfidential && !canViewUccB2B(auth)) return NextResponse.json({ success: false, error: 'B2B-confidential application documents require explicit access.' }, { status: 403 });
  }

  const attachment = await db.uccAttachment.findFirst({
    where: { id: attachmentId, conversationId, studentId: conversation.studentId },
    select: { id: true, fileName: true, mimeType: true, fileSize: true, fileUrl: true, ocrExtractedData: true, messageId: true, applicationId: true, createdAt: true },
  });
  if (!attachment || !attachment.messageId) return NextResponse.json({ success: false, error: 'A persisted inbound WhatsApp attachment was not found.' }, { status: 404 });
  const sourceMessage = await db.uccMessage.findFirst({ where: { id: attachment.messageId, conversationId, direction: 'inbound' }, select: { id: true } });
  if (!sourceMessage) return NextResponse.json({ success: false, error: 'Only inbound WhatsApp documents can be attached to a student profile.' }, { status: 403 });

  const privateMetadata = metadataOf(attachment.ocrExtractedData);
  const storagePath = typeof privateMetadata.storagePath === 'string' ? privateMetadata.storagePath : '';
  const fileHash = typeof privateMetadata.fileHash === 'string' ? privateMetadata.fileHash : '';
  if (!storagePath || !/^[a-f0-9]{64}$/i.test(fileHash)) {
    return NextResponse.json({ success: false, error: 'The attachment has no verified private file and cannot be linked.' }, { status: 410 });
  }
  if (!['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(attachment.mimeType)) {
    return NextResponse.json({ success: false, error: 'This private attachment type is not accepted for student document records.' }, { status: 415 });
  }
  let bytes: Buffer;
  try { bytes = await readPrivateFile(storagePath); } catch {
    return NextResponse.json({ success: false, error: 'Private attachment bytes are unavailable.' }, { status: 410 });
  }
  if (bytes.byteLength !== attachment.fileSize || createHash('sha256').update(bytes).digest('hex') !== fileHash.toLowerCase()) {
    return NextResponse.json({ success: false, error: 'The stored file integrity check failed.' }, { status: 500 });
  }

  const category = requestedCategory || classifyDocument(attachment.fileName);
  const existing = await db.studentDocument.findFirst({
    where: { studentId: student.id, storagePath, fileHash, isArchived: false },
    select: { id: true, category: true, fileName: true, fileSize: true, status: true, createdAt: true },
  });
  if (existing) {
    if (requestedApplicationId) await db.uccAttachment.update({ where: { id: attachment.id }, data: { applicationId: requestedApplicationId } });
    return NextResponse.json({ success: true, duplicate: true, document: existing, message: 'This privately stored WhatsApp file is already attached to the student record and remains pending human review.' });
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const document = await tx.studentDocument.create({
        data: {
          studentId: student.id,
          category,
          fileName: attachment.fileName,
          fileUrl: '',
          storagePath,
          mimeType: attachment.mimeType,
          fileHash,
          fileSize: attachment.fileSize,
          status: 'pending_review',
        },
      });
      await tx.studentDocument.update({ where: { id: document.id }, data: { fileUrl: `/api/student/documents/${document.id}/download` } });
      await tx.documentVersion.create({
        data: { documentId: document.id, version: 1, filePath: storagePath, fileSize: attachment.fileSize, fileType: attachment.mimeType, uploadedBy: 'whatsapp-cloud-api', reviewStatus: 'PENDING', isLatest: true },
      });
      await tx.documentAudit.create({
        data: { documentId: document.id, studentId: student.id, actorId: auth.userId, actorName: auth.name || auth.email, actorRole: auth.roles[0] || auth.userType, action: 'upload', newStatus: 'pending_review', note: 'Linked from a privately stored inbound WhatsApp attachment. Human review is required.' },
      });
      await tx.uccAttachment.update({ where: { id: attachment.id }, data: { applicationId: requestedApplicationId || attachment.applicationId } });
      const existingOcr = await tx.ocrJob.findFirst({ where: { attachmentId: attachment.id }, select: { id: true } });
      if (!existingOcr) {
        await tx.ocrJob.create({
          data: { documentId: document.id, documentType: category, fileUrl: attachment.fileUrl, fileName: attachment.fileName, mimeType: attachment.mimeType, fileHash, status: 'queued', studentId: student.id, conversationId, attachmentId: attachment.id },
        });
      }
      return document;
    });
    return NextResponse.json({
      success: true,
      duplicate: false,
      document: { id: result.id, category: result.category, fileName: result.fileName, fileSize: result.fileSize, status: result.status, createdAt: result.createdAt },
      message: 'Private WhatsApp file attached to the student profile. OCR is queued; the file is not verified until a human reviews it.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'WhatsApp document could not be linked to the student profile.' }, { status: 503 });
  }
}
