import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { removePrivateFile, storePrivateFile } from '@/lib/storage/private-file-store';
import { canAccessUccDocumentConversation, canUseUccDocuments, canViewUccB2B } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};

function detectMime(bytes: Buffer): string | null {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  return null;
}

function safeOriginalName(value: string): string | null {
  const name = value.split(/[\\/]/).pop()?.trim() || '';
  if (!name || name.length > 191 || /[\u0000-\u001f]/.test(name)) return null;
  return name;
}

function safeAttachment(attachment: any) {
  return {
    id: attachment.id,
    conversationId: attachment.conversationId,
    messageId: attachment.messageId,
    fileName: attachment.fileName,
    fileType: attachment.fileType,
    mimeType: attachment.mimeType,
    fileSize: attachment.fileSize,
    fileUrl: attachment.fileUrl,
    detectedDocType: attachment.detectedDocType,
    studentId: attachment.studentId,
    applicationId: attachment.applicationId,
    createdAt: attachment.createdAt,
  };
}

async function verifyApplicationLink(applicationId: string, studentId: string | null, auth: Awaited<ReturnType<typeof authenticateRequest>>) {
  if (!applicationId) return { ok: true as const, applicationId: null };
  if (auth instanceof NextResponse) return { ok: false as const, response: auth };
  const application = await db.application.findUnique({
    where: { id: applicationId },
    select: { id: true, studentId: true, isB2bConfidential: true },
  });
  if (!application || !studentId || application.studentId !== studentId) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: 'Application is not linked to this conversation’s student.' }, { status: 403 }) };
  }
  if (application.isB2bConfidential && !canViewUccB2B(auth)) {
    return { ok: false as const, response: NextResponse.json({ success: false, error: 'B2B-confidential application documents require explicit B2B access.' }, { status: 403 }) };
  }
  return { ok: true as const, applicationId: application.id };
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!canUseUccDocuments(auth)) return NextResponse.json({ success: false, error: 'Document upload access is not permitted.' }, { status: 403 });

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_FILE_BYTES + 128 * 1024) {
    return NextResponse.json({ success: false, error: 'The multipart upload exceeds the 20 MB file limit.' }, { status: 413 });
  }
  let form: FormData;
  try { form = await request.formData(); } catch {
    return NextResponse.json({ success: false, error: 'A multipart upload containing actual file bytes is required.' }, { status: 415 });
  }
  const file = form.get('file');
  const conversationId = String(form.get('conversationId') || '').trim();
  const requestedStudentId = String(form.get('studentId') || '').trim();
  const applicationId = String(form.get('applicationId') || '').trim();
  const messageId = String(form.get('messageId') || '').trim();
  const purpose = String(form.get('purpose') || 'document_review').trim().toLowerCase();
  if (!['document_review', 'outbound_media'].includes(purpose)) return NextResponse.json({ success: false, error: 'Upload purpose is not supported.' }, { status: 400 });
  if (!(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ success: false, error: 'A non-empty file no larger than 20 MB is required.' }, { status: 400 });
  }
  const originalName = safeOriginalName(file.name);
  if (!originalName) return NextResponse.json({ success: false, error: 'File name is invalid.' }, { status: 400 });
  if (!conversationId) return NextResponse.json({ success: false, error: 'conversationId is required; unlinked uploads are disabled.' }, { status: 400 });

  const conversation = await db.uccConversation.findUnique({
    where: { id: conversationId },
    select: { id: true, studentId: true, assignedToUserId: true, channel: true },
  });
  if (!conversation) return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
  if (purpose === 'outbound_media' && conversation.channel !== 'whatsapp') return NextResponse.json({ success: false, error: 'Outbound media upload is only available for WhatsApp conversations.' }, { status: 422 });
  if (!canAccessUccDocumentConversation(auth, conversation) || !(await canViewUccConversationB2B(auth, conversation))) return NextResponse.json({ success: false, error: 'Access to this conversation is not permitted.' }, { status: 403 });
  if (requestedStudentId && requestedStudentId !== conversation.studentId) {
    return NextResponse.json({ success: false, error: 'Student id does not match the linked conversation.' }, { status: 403 });
  }
  if (messageId) {
    const message = await db.uccMessage.findFirst({ where: { id: messageId, conversationId }, select: { id: true } });
    if (!message) return NextResponse.json({ success: false, error: 'Message does not belong to the conversation.' }, { status: 403 });
  }
  if (conversation.studentId) {
    const confidentialApplication = await db.application.findFirst({
      where: { studentId: conversation.studentId, isB2bConfidential: true },
      select: { id: true },
    });
    if (confidentialApplication && !canViewUccB2B(auth)) {
      return NextResponse.json({ success: false, error: 'Document upload for this student requires explicit B2B access.' }, { status: 403 });
    }
    if (confidentialApplication && !applicationId) {
      return NextResponse.json({ success: false, error: 'This student has B2B-confidential applications. Link the document to an application before uploading.' }, { status: 400 });
    }
  }
  const applicationCheck = await verifyApplicationLink(applicationId, conversation.studentId, auth);
  if (!applicationCheck.ok) return applicationCheck.response;

  const bytes = Buffer.from(await file.arrayBuffer());
  const mimeType = detectMime(bytes);
  const extension = originalName.split('.').pop()?.toLowerCase() || '';
  if (!mimeType || MIME_BY_EXTENSION[extension] !== mimeType || (file.type && file.type !== mimeType)) {
    return NextResponse.json({ success: false, error: 'File content does not match an allowed PDF or image type.' }, { status: 400 });
  }

  const fileHash = createHash('sha256').update(bytes).digest('hex');
  // Reusing the same unsent private attachment makes a retry after a provider
  // outage idempotent instead of storing another copy of the same bytes.
  const recentUnsent = await db.uccAttachment.findMany({
    where: { conversationId, messageId: null, studentId: conversation.studentId, applicationId: applicationCheck.ok ? applicationCheck.applicationId : null, fileName: originalName, mimeType, fileSize: bytes.byteLength },
    orderBy: { createdAt: 'desc' },
    take: 25,
    select: { id: true, conversationId: true, messageId: true, fileName: true, fileType: true, mimeType: true, fileSize: true, fileUrl: true, detectedDocType: true, studentId: true, applicationId: true, createdAt: true, ocrExtractedData: true },
  });
  const duplicate = recentUnsent.find((item) => {
    try { return JSON.parse(item.ocrExtractedData || '{}').fileHash === fileHash; } catch { return false; }
  });
  if (duplicate) return NextResponse.json({ success: true, duplicate: true, attachment: safeAttachment(duplicate), message: 'An identical unsent private attachment is already stored for this conversation.' });

  const stored = await storePrivateFile(bytes, originalName);
  const actorRole = [...auth.roles, auth.userType].join(',');
  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '';
  try {
    const result = await db.$transaction(async (tx) => {
      const attachment = await tx.uccAttachment.create({
        data: {
          conversationId,
          messageId: messageId || undefined,
          fileName: originalName,
          fileType: 'document',
          mimeType,
          fileSize: stored.fileSize,
          fileUrl: '',
          detectedDocType: 'unknown',
          studentId: conversation.studentId || undefined,
          applicationId: applicationCheck.ok ? applicationCheck.applicationId || undefined : undefined,
          ocrExtractedData: JSON.stringify({ storagePath: stored.storagePath, fileHash, uploadedBy: auth.userId, originalName }),
        },
      });
      const downloadUrl = `/api/crm/ucc/documents/${attachment.id}/download`;
      await tx.uccAttachment.update({ where: { id: attachment.id }, data: { fileUrl: downloadUrl } });
      let ocrJob: any = null;
      if (purpose === 'document_review') {
        ocrJob = await tx.ocrJob.create({
          data: {
            documentId: attachment.id,
            documentType: 'unknown',
            fileUrl: downloadUrl,
            fileName: originalName,
            mimeType,
            fileHash,
            status: 'queued',
            studentId: conversation.studentId || undefined,
            conversationId,
            attachmentId: attachment.id,
          },
        });
      }
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.actorUserId || auth.userId,
          action: 'UCC_DOCUMENT_UPLOADED',
          entityType: 'UccAttachment',
          entityId: attachment.id,
          ipAddress,
          userAgent: request.headers.get('user-agent') || '',
          metadata: JSON.stringify({ effectiveUserId: auth.userId, actorRole, conversationId, studentId: conversation.studentId, applicationId: applicationCheck.applicationId, fileHash }),
        },
      });
      return { attachment: { ...attachment, fileUrl: downloadUrl }, ocrJob };
    });
    return NextResponse.json({
      success: true,
      attachment: safeAttachment(result.attachment),
      ...(result.ocrJob ? { ocrJob: { id: result.ocrJob.id, status: result.ocrJob.status } } : {}),
      message: purpose === 'outbound_media' ? 'Private media is ready to send through the WhatsApp Cloud API.' : 'Private document bytes were stored. OCR is queued and requires human verification.',
    }, { status: 201 });
  } catch {
    await removePrivateFile(stored.storagePath).catch(() => {});
    return NextResponse.json({ success: false, error: 'Document upload could not be completed.' }, { status: 503 });
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!canUseUccDocuments(auth)) return NextResponse.json({ success: false, error: 'Document access is not permitted.' }, { status: 403 });

  const { searchParams } = request.nextUrl;
  const conversationId = searchParams.get('conversationId');
  const studentId = searchParams.get('studentId');
  const applicationId = searchParams.get('applicationId');
  const supervisor = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER'].some((role) =>
    [...auth.roles, auth.userType].some((value) => value.toUpperCase() === role),
  );
  if (conversationId) {
    const conversation = await db.uccConversation.findUnique({ where: { id: conversationId }, select: { id: true, studentId: true, assignedToUserId: true } });
    if (!conversation || !canAccessUccDocumentConversation(auth, conversation) || !(await canViewUccConversationB2B(auth, conversation))) {
      return NextResponse.json({ success: false, error: 'Conversation not found or access denied.' }, { status: 404 });
    }
    if (studentId && studentId !== conversation.studentId) return NextResponse.json({ success: false, error: 'Student id does not match this conversation.' }, { status: 403 });
  }
  if (applicationId) {
    const application = await db.application.findUnique({ where: { id: applicationId }, select: { id: true, studentId: true, isB2bConfidential: true } });
    if (!application || (application.isB2bConfidential && !canViewUccB2B(auth))) {
      return NextResponse.json({ success: false, error: 'Application not found or access denied.' }, { status: 404 });
    }
    if (conversationId) {
      const conversation = await db.uccConversation.findUnique({ where: { id: conversationId }, select: { studentId: true } });
      if (!conversation || application.studentId !== conversation.studentId) return NextResponse.json({ success: false, error: 'Application is not linked to this conversation.' }, { status: 403 });
    } else {
      return NextResponse.json({ success: false, error: 'conversationId is required when filtering application documents.' }, { status: 400 });
    }
  }

  const where: any = {};
  if (conversationId) where.conversationId = conversationId;
  if (studentId) where.studentId = studentId;
  if (applicationId) where.applicationId = applicationId;
  if (!supervisor) where.conversation = { assignedToUserId: auth.userId };
  try {
    const foundAttachments = await db.uccAttachment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, conversationId: true, messageId: true, fileName: true, fileType: true, mimeType: true, fileSize: true, fileUrl: true, detectedDocType: true, studentId: true, applicationId: true, createdAt: true },
    });
    const applicationIds = [...new Set(foundAttachments.map((item) => item.applicationId).filter((value): value is string => !!value))];
    const studentIds = [...new Set(foundAttachments.map((item) => item.studentId).filter((value): value is string => !!value))];
    const linkedApplications: Array<{ id: string; studentId: string; isB2bConfidential: boolean }> = applicationIds.length
      ? await db.application.findMany({ where: { id: { in: applicationIds } }, select: { id: true, studentId: true, isB2bConfidential: true } })
      : [];
    const confidentialStudentApplications: Array<{ studentId: string }> = studentIds.length
      ? await db.application.findMany({ where: { studentId: { in: studentIds }, isB2bConfidential: true }, select: { studentId: true } })
      : [];
    const applicationsById = new Map(linkedApplications.map((item) => [item.id, item]));
    const confidentialStudentIds = new Set(confidentialStudentApplications.map((item) => item.studentId));
    const attachments = foundAttachments.filter((item) => {
      if (item.applicationId) {
        const linkedApplication = applicationsById.get(item.applicationId);
        if (!linkedApplication || linkedApplication.studentId !== item.studentId) return false;
        if (linkedApplication.isB2bConfidential && !canViewUccB2B(auth)) return false;
      } else if (item.studentId && confidentialStudentIds.has(item.studentId) && !canViewUccB2B(auth)) {
        return false;
      }
      return true;
    });
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'UCC_DOCUMENTS_LIST_VIEWED',
        entityType: 'UccAttachment',
        entityId: conversationId || studentId || 'assigned-scope',
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
        userAgent: request.headers.get('user-agent') || '',
        metadata: JSON.stringify({ effectiveUserId: auth.userId, role: auth.roles[0] || auth.userType, resultCount: attachments.length }),
      },
    }).catch(() => {});
    return NextResponse.json({ success: true, attachments, total: attachments.length });
  } catch {
    return NextResponse.json({ success: false, error: 'UCC document list is temporarily unavailable.' }, { status: 503 });
  }
}
