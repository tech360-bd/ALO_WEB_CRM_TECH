// ============================================================
// /api/crm/ucc/conversations/[id]/reply
// POST — Send a reply or internal note on a conversation
// RBAC: COUNSELOR, SUPPORT, MARKETING_MANAGER, BRANCH_MANAGER,
//        DEPARTMENT_MANAGER, ADMIN, SUPER_ADMIN
// ============================================================

import { outboundReplyPolicyBlock } from '@/lib/inbox/outbound-reply-policy';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { sendWhatsAppMessage, sendWhatsAppPrivateMedia } from '@/lib/whatsapp-cloud-api';
import { determineSenderNumber } from '@/lib/whatsapp-number-pool';
import { readPrivateFile } from '@/lib/storage/private-file-store';
import { canAccessUccConversation, canAccessUccDocumentConversation, canUseUccCommunication, canUseUccDocuments, canViewUccB2B } from '@/lib/ucc/document-access';
import { canViewUccConversationB2B } from '@/lib/ucc/conversation-visibility';
import { createSecurityIncident, resolveAuthorizedDocumentRecipient } from '@/lib/document-security';

const ALLOWED_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'APPLICATION_TEAM', 'APPLICATION_MANAGER',
  'APPLICATION_OFFICER', 'DOCUMENT_OFFICER', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER',
  'SUPPORT', 'SUPPORT_STAFF', 'FRONT_DESK', 'VISA_OFFICER', 'VISA_INTERVIEW_OFFICER',
];

function privateStorageMetadata(value: string) {
  try {
    const parsed = JSON.parse(value || '{}');
    return {
      storagePath: typeof parsed?.storagePath === 'string' ? parsed.storagePath : '',
      fileHash: typeof parsed?.fileHash === 'string' ? parsed.fileHash : '',
    };
  } catch {
    return { storagePath: '', fileHash: '' };
  }
}

async function latestProviderStatus(providerMessageId: string | null | undefined) {
  if (!providerMessageId) return null;
  try {
    const record = await db.whatsAppMessageStatus.findUnique({
      where: { messageId: providerMessageId },
      select: { status: true, statusTimestamp: true, errorMessage: true },
    });
    const status = String(record?.status || '').toLowerCase();
    if (!record || !['sent', 'delivered', 'read', 'failed'].includes(status)) return null;
    return { status, statusTimestamp: record.statusTimestamp, errorMessage: record.errorMessage };
  } catch {
    return null;
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    if (!mutationOriginAllowed(request, auth)) return NextResponse.json({success:false,error:"Same-origin request required."},{status:403});

    const normalizedRoles = new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase()));
    if (!canUseUccCommunication(auth) || !ALLOWED_ROLES.some((role) => normalizedRoles.has(role))) {
      return NextResponse.json(
        { success: false, error: 'Forbidden — insufficient role to reply to conversations.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: 'A valid reply payload is required.' }, { status: 400 });
    }
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const messageType = typeof body.messageType === 'string' ? body.messageType : 'text';
    const isInternalNote = body.isInternalNote === true;
    const aiGenerated = body.aiGenerated === true;
    const aiApproved = body.aiApproved === true;
    const attachment = body.attachment && typeof body.attachment === 'object' && !Array.isArray(body.attachment)
      ? body.attachment as { attachmentId?: string; caption?: string }
      : null;
    const attachmentId = typeof attachment?.attachmentId === 'string' ? attachment.attachmentId.trim() : '';
    if (content.length > 5000) return NextResponse.json({ success: false, error: 'Message text must be 5000 characters or fewer.' }, { status: 400 });
    if (!content && !attachmentId) {
      return NextResponse.json({ success: false, error: 'Message content is required.' }, { status: 400 });
    }
    if (attachment && !attachmentId) {
      return NextResponse.json({ success: false, error: 'Attachments must reference a privately stored UCC document.' }, { status: 400 });
    }
    if (aiGenerated && !aiApproved) {
      return NextResponse.json({ success: false, error: 'AI-generated text requires an explicit human approval before sending.' }, { status: 403 });
    }
    if (!attachment && messageType !== 'text') {
      return NextResponse.json({ success: false, error: 'Only text replies are available without an approved media attachment.' }, { status: 400 });
    }
    if (attachment && isInternalNote) {
      return NextResponse.json({ success: false, error: 'Internal notes cannot carry attachments.' }, { status: 400 });
    }

    const conversation = await db.uccConversation.findUnique({ where: { id } });
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    }

    if (!canAccessUccConversation(auth, conversation) || !(await canViewUccConversationB2B(auth, conversation))) {
      return NextResponse.json({ success: false, error: 'You can only reply to conversations assigned to you.' }, { status: 403 });
    }
    if (!isInternalNote || attachment) {
      const policyBlock = outboundReplyPolicyBlock();
      if (policyBlock) return NextResponse.json(policyBlock, { status: 503 });
    }
    if (!isInternalNote && conversation.channel === 'whatsapp') {
      const serviceWindowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentInbound = await db.uccMessage.findFirst({
        where: { conversationId: id, direction: 'inbound', createdAt: { gte: serviceWindowStart } },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
      });
      if (!recentInbound) {
        return NextResponse.json({ success: false, code: 'WHATSAPP_SERVICE_WINDOW_CLOSED', error: 'A customer service reply requires an inbound WhatsApp message in the last 24 hours. Use the approved-template workflow instead.' }, { status: 422 });
      }
    }
    const senderRoute = conversation.channel === 'whatsapp'
      ? await determineSenderNumber({ counselorId: auth.userId, studentId: conversation.studentId || undefined, leadId: conversation.leadId || undefined })
      : null;
    if (attachment) {
      if (conversation.channel !== 'whatsapp') {
        return NextResponse.json(
          { success: false, code: 'CHANNEL_UNSUPPORTED_FOR_MEDIA', error: `Attachments may only be sent on WhatsApp conversations via the official Cloud API (this is a ${conversation.channel} conversation).` },
          { status: 422 },
        );
      }
      if (!canUseUccDocuments(auth) || !canAccessUccDocumentConversation(auth, conversation)) {
        return NextResponse.json({ success: false, error: 'Private document access is not permitted for this user or conversation.' }, { status: 403 });
      }
      if (!conversation.participantPhone) {
        return NextResponse.json({ success: false, error: 'Cannot send attachment — conversation has no recipient phone number.' }, { status: 422 });
      }
      const privateAttachment = await db.uccAttachment.findFirst({
        where: { id: attachmentId, conversationId: id },
        select: { id: true, fileName: true, fileSize: true, mimeType: true, studentId: true, applicationId: true, ocrExtractedData: true, messageId: true },
      });
      if (!privateAttachment || privateAttachment.studentId !== conversation.studentId) {
        return NextResponse.json({ success: false, error: 'Private document not found in this conversation.' }, { status: 404 });
      }
      if (privateAttachment.messageId) {
        return NextResponse.json({ success: false, error: 'This document is already linked to a message. Upload it again to create a new send action.' }, { status: 409 });
      }
      if (privateAttachment.applicationId) {
        const application = await db.application.findUnique({
          where: { id: privateAttachment.applicationId },
          select: { studentId: true, isB2bConfidential: true },
        });
        if (!application || application.studentId !== privateAttachment.studentId || (application.isB2bConfidential && !canViewUccB2B(auth))) {
          return NextResponse.json({ success: false, error: 'Private document not found in this conversation.' }, { status: 404 });
        }
      } else if (privateAttachment.studentId) {
        const confidentialApplication = await db.application.findFirst({
          where: { studentId: privateAttachment.studentId, isB2bConfidential: true },
          select: { id: true },
        });
        if (confidentialApplication && !canViewUccB2B(auth)) {
          return NextResponse.json({ success: false, error: 'Private document not found in this conversation.' }, { status: 404 });
        }
      }
      const storedMetadata = privateStorageMetadata(privateAttachment.ocrExtractedData);
      if (!storedMetadata.storagePath || !/^[a-f0-9]{64}$/i.test(storedMetadata.fileHash)) {
        return NextResponse.json({ success: false, error: 'This attachment has no verified private file and cannot be sent.' }, { status: 410 });
      }
      let privateBytes: Buffer;
      try {
        privateBytes = await readPrivateFile(storedMetadata.storagePath);
      } catch {
        return NextResponse.json({ success: false, error: 'Private document bytes are unavailable.' }, { status: 410 });
      }
      if (privateBytes.byteLength !== privateAttachment.fileSize || createHash('sha256').update(privateBytes).digest('hex') !== storedMetadata.fileHash.toLowerCase()) {
        return NextResponse.json({ success: false, error: 'Private document integrity check failed.' }, { status: 500 });
      }
      const caption = content || (typeof attachment.caption === 'string' ? attachment.caption.trim() : '');
      if (caption.length > 1024) {
        return NextResponse.json({ success: false, error: 'WhatsApp document captions must be 1024 characters or fewer.' }, { status: 400 });
      }

      // ── Document recipient authorization (spec §34) ──
      // A student document may only be sent to a destination that is already
      // linked to that student, to their partner, or to an official ALO number.
      // Enforced BEFORE the message row is created, so a refused send leaves no
      // half-written state and never reaches the provider.
      // UccAttachment.studentId is nullable; an attachment that is not linked to a
      // student cannot be authorised for sending at all.
      const attachmentStudentId = (privateAttachment.studentId || '').trim();
      if (!attachmentStudentId) {
        return NextResponse.json({ success: false, error: 'This attachment is not linked to a student and cannot be sent.' }, { status: 410 });
      }
      const recipientDecision = await resolveAuthorizedDocumentRecipient({
        studentId: attachmentStudentId,
        recipientPhone: conversation.participantPhone,
      });
      if (!recipientDecision.allowed) {
        await createSecurityIncident({
          documentId: privateAttachment.id,
          studentId: attachmentStudentId,
          attemptedById: auth.userId,
          attemptedByName: auth.name || auth.email || '',
          attemptedByRole: auth.roles?.[0] || 'employee',
          recipient: conversation.participantPhone,
          recipientType: recipientDecision.recipientType,
          action: 'send',
          severity: recipientDecision.severity,
          reason: recipientDecision.reason,
          blocked: true,
        });
        await logAuditAction(auth, 'DOCUMENT_SEND_BLOCKED', 'UccAttachment', privateAttachment.id, {
          conversationId: id,
          recipientType: recipientDecision.recipientType,
          severity: recipientDecision.severity,
          verified: recipientDecision.verified,
        });
        return NextResponse.json(
          {
            success: false,
            code: 'DOCUMENT_RECIPIENT_NOT_AUTHORIZED',
            error: 'This recipient is not authorized to receive a document belonging to this student.',
          },
          { status: 403 },
        );
      }

      let pendingMessage: any;
      try {
        pendingMessage = await db.$transaction(async (tx) => {
          const record = await tx.uccMessage.create({
            data: {
              conversationId: id,
              direction: 'outbound',
              senderId: auth.userId,
              senderName: auth.name || auth.email || 'Staff',
              senderRole: 'employee',
              channel: conversation.channel,
              content: caption || `[Private document: ${privateAttachment.fileName}]`,
              messageType: privateAttachment.mimeType === 'application/pdf' ? 'document' : 'image',
              status: 'pending',
              aiGenerated,
              aiApproved: aiGenerated ? aiApproved : true,
              metadata: JSON.stringify({ attemptedAt: new Date().toISOString(), attachmentId: privateAttachment.id, senderEmail: auth.email }),
            },
          });
          const claim = await tx.uccAttachment.updateMany({
            where: { id: privateAttachment.id, conversationId: id, messageId: null },
            data: { messageId: record.id },
          });
          if (claim.count !== 1) throw new Error('DOCUMENT_ALREADY_LINKED');
          return record;
        });
      } catch (error: any) {
        if (error?.message === 'DOCUMENT_ALREADY_LINKED') {
          return NextResponse.json({ success: false, error: 'This document is already linked to another message.' }, { status: 409 });
        }
        throw error;
      }

      const mediaSend = await sendWhatsAppPrivateMedia({
        to: conversation.participantPhone,
        bytes: privateBytes,
        mimeType: privateAttachment.mimeType,
        fileName: privateAttachment.fileName,
        caption: caption || undefined,
        actorId: auth.userId,
        senderNumber: senderRoute?.number,
        studentId: conversation.studentId || undefined,
        leadId: conversation.leadId || undefined,
        conversationId: id,
      });
      if (!mediaSend.success || !mediaSend.messageId) {
        const sendError = mediaSend.error || 'The provider did not confirm the media message.';
        await db.$transaction(async (tx) => {
          await tx.uccMessage.update({
            where: { id: pendingMessage.id },
            data: {
              status: 'failed',
              metadata: JSON.stringify({ attemptedAt: new Date().toISOString(), attachmentId: privateAttachment.id, providerMediaId: mediaSend.providerMediaId, sendError, senderEmail: auth.email }),
            },
          });
          await tx.uccAttachment.updateMany({ where: { id: privateAttachment.id, messageId: pendingMessage.id }, data: { messageId: null } });
        });
        await logAuditAction(auth, 'ATTACHMENT_SEND_FAILED', 'UccConversation', id, { messageId: pendingMessage.id, attachmentId: privateAttachment.id, sendError });
        return NextResponse.json(
          { success: false, error: `WhatsApp media send failed: ${sendError}`, messageId: pendingMessage.id },
          { status: /not configured/i.test(sendError) ? 503 : 502 },
        );
      }

      await logAuditAction(auth, 'DOCUMENT_SENT', 'UccAttachment', privateAttachment.id, {
        conversationId: id,
        messageId: pendingMessage.id,
        recipientType: recipientDecision.recipientType,
        recipientVerified: recipientDecision.verified,
      });

      const providerStatus = await latestProviderStatus(mediaSend.messageId);
      let message: any;
      try {
        message = await db.$transaction(async (tx) => {
          const sentMessage = await tx.uccMessage.update({
            where: { id: pendingMessage.id },
            data: {
              status: providerStatus?.status || 'sent',
              metadata: JSON.stringify({
                sentAt: new Date().toISOString(),
                attachmentId: privateAttachment.id,
                providerMessageId: mediaSend.messageId,
                providerMediaId: mediaSend.providerMediaId,
                deliveryStatus: providerStatus?.status || 'sent',
                ...(providerStatus?.statusTimestamp ? { providerStatusAt: providerStatus.statusTimestamp.toISOString() } : {}),
                ...(providerStatus?.errorMessage ? { providerError: providerStatus.errorMessage } : {}),
                senderEmail: auth.email,
              }),
            },
          });
          await tx.uccConversation.update({
            where: { id },
            data: { lastMessageText: (caption || `[Private document: ${privateAttachment.fileName}]`).slice(0, 200), lastMessageAt: new Date() },
          });
          return sentMessage;
        });
      } catch {
        await logAuditAction(auth, 'ATTACHMENT_SEND_PERSISTENCE_WARNING', 'UccConversation', id, { messageId: pendingMessage.id, attachmentId: privateAttachment.id, providerMessageId: mediaSend.messageId }).catch(() => {});
        return NextResponse.json({ success: true, sent: true, persistenceWarning: true, providerMessageId: mediaSend.messageId, message: { ...pendingMessage, status: 'sent' }, attachment: { id: privateAttachment.id, fileName: privateAttachment.fileName, fileUrl: `/api/crm/ucc/documents/${privateAttachment.id}/download` } }, { status: 202 });
      }
      await logAuditAction(auth, 'ATTACHMENT_SENT', 'UccConversation', id, {
        messageId: message.id,
        attachmentId: privateAttachment.id,
        channel: conversation.channel,
        providerMessageId: mediaSend.messageId,
      }).catch(() => {});
      return NextResponse.json({ success: true, message, providerMessageId: mediaSend.messageId, attachment: { id: privateAttachment.id, fileName: privateAttachment.fileName, fileUrl: `/api/crm/ucc/documents/${privateAttachment.id}/download` } });
    }

    if (!isInternalNote && conversation.channel !== 'whatsapp') {
      return NextResponse.json({ success: false, error: `No authorized outbound provider is configured for ${conversation.channel}. The message was not sent.` }, { status: 503 });
    }

    let waTextSend: { messageId: string | null; success: boolean; error?: string; statusRecorded?: boolean } | null = null;
    if (!isInternalNote) {
      if (!conversation.participantPhone) {
        return NextResponse.json({ success: false, error: 'Cannot send reply — conversation has no recipient phone number.' }, { status: 422 });
      }
      waTextSend = await sendWhatsAppMessage({
        to: conversation.participantPhone,
        text: content,
        purpose: 'SERVICE',
        conversationId: id,
        actorId: auth.userId,
        employeeSenderId: auth.userId,
        senderNumber: senderRoute?.number,
        studentId: conversation.studentId || undefined,
        leadId: conversation.leadId || undefined,
      });
      if (!waTextSend.success || !waTextSend.messageId) {
        const sendError = waTextSend.error || 'The provider did not confirm message delivery.';
        const failedMessage = await db.uccMessage.create({
          data: {
            conversationId: id,
            direction: 'outbound',
            senderId: auth.userId,
            senderName: auth.name || auth.email || 'Staff',
            senderRole: 'employee',
            channel: conversation.channel,
            content,
            messageType: 'text',
            status: 'failed',
            aiGenerated,
            aiApproved: aiGenerated ? aiApproved : true,
            metadata: JSON.stringify({ attemptedAt: new Date().toISOString(), sendError, senderEmail: auth.email }),
          },
        });
        await logAuditAction(auth, 'REPLY_SEND_FAILED', 'UccConversation', id, { messageId: failedMessage.id, channel: conversation.channel, sendError });
        return NextResponse.json(
          { success: false, error: `WhatsApp text send failed: ${sendError}`, messageId: failedMessage.id },
          { status: /not configured/i.test(sendError) ? 503 : 502 },
        );
      }
    }

    const direction = isInternalNote ? 'internal_note' : 'outbound';
    const providerStatus = await latestProviderStatus(waTextSend?.messageId);
    let message: any;
    try {
      message = await db.uccMessage.create({
        data: {
          conversationId: id,
          direction,
          senderId: auth.userId,
          senderName: auth.name || auth.email || 'Staff',
          senderRole: 'employee',
          channel: conversation.channel,
          content,
          messageType: isInternalNote ? 'text' : messageType,
          status: isInternalNote ? 'sent' : (providerStatus?.status || (waTextSend?.success ? 'sent' : 'failed')),
          aiGenerated,
          aiApproved: aiGenerated ? aiApproved : true,
          metadata: JSON.stringify({
            sentAt: new Date().toISOString(),
            isInternalNote,
            senderEmail: auth.email,
            ...(waTextSend?.messageId ? { providerMessageId: waTextSend.messageId, deliveryStatus: providerStatus?.status || 'sent' } : {}),
            ...(providerStatus?.statusTimestamp ? { providerStatusAt: providerStatus.statusTimestamp.toISOString() } : {}),
            ...(providerStatus?.errorMessage ? { providerError: providerStatus.errorMessage } : {}),
            ...(waTextSend?.statusRecorded !== undefined ? { statusRecorded: waTextSend.statusRecorded } : {}),
          }),
        },
      });
      await db.uccConversation.update({
        where: { id },
        data: { lastMessageText: content.trim().substring(0, 200), lastMessageAt: new Date() },
      });
    } catch (error) {
      if (waTextSend?.success && waTextSend.messageId) {
        await logAuditAction(auth, 'REPLY_SEND_PERSISTENCE_WARNING', 'UccConversation', id, { providerMessageId: waTextSend.messageId, error: error instanceof Error ? error.message : 'unknown' }).catch(() => {});
        return NextResponse.json({ success: true, sent: true, persistenceWarning: true, providerMessageId: waTextSend.messageId, message: null }, { status: 202 });
      }
      throw error;
    }

    await logAuditAction(auth, isInternalNote ? 'INTERNAL_NOTE_ADDED' : 'REPLY_SENT', 'UccConversation', id, {
      messageId: message.id,
      channel: conversation.channel,
      aiGenerated,
      ...(waTextSend?.messageId ? { providerMessageId: waTextSend.messageId } : {}),
    }).catch(() => {});

    return NextResponse.json({ success: true, message, ...(waTextSend?.messageId ? { providerMessageId: waTextSend.messageId } : {}) });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
