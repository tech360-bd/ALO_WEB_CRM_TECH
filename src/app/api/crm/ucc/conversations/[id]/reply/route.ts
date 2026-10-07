// ============================================================
// /api/crm/ucc/conversations/[id]/reply
// POST — Send a reply or internal note on a conversation
// RBAC: COUNSELOR, SUPPORT, MARKETING_MANAGER, BRANCH_MANAGER,
//        DEPARTMENT_MANAGER, ADMIN, SUPER_ADMIN
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';
import { sendWhatsAppMedia, WHATSAPP_MEDIA_TYPES, type WhatsAppMediaType } from '@/lib/whatsapp-cloud-api';

const ALLOWED_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'MARKETING_MANAGER',
  'BRANCH_MANAGER', 'DEPARTMENT_MANAGER', 'SUPPORT', 'VISA_OFFICER',
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const primaryRole = auth.roles?.[0] || auth.userType || '';
    if (!ALLOWED_ROLES.includes(primaryRole)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden — insufficient role to reply to conversations.' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      content,
      messageType = 'text',
      isInternalNote = false,
      aiGenerated = false,
      aiApproved = false,
      attachment,
    } = body as {
      content: string;
      messageType?: string;
      isInternalNote?: boolean;
      aiGenerated?: boolean;
      aiApproved?: boolean;
      // §131 — outbound attachment (PDF/image/audio/video) from the Command Center
      attachment?: {
        link: string;
        fileName?: string;
        mediaType?: string;
        caption?: string;
        fileSizeBytes?: number;
        mimeType?: string;
      } | null;
    };

    if (!content?.trim() && !attachment?.link) {
      return NextResponse.json({ success: false, error: 'Message content is required.' }, { status: 400 });
    }

    // §131 — attachment validation (official Cloud API supports
    // document/image/audio/video by https link; internal notes never carry files)
    const mediaType = (attachment?.mediaType === 'document' ? 'document' : attachment?.mediaType) as WhatsAppMediaType | undefined;
    if (attachment) {
      if (!attachment.link || !/^https:\/\//.test(attachment.link)) {
        return NextResponse.json({ success: false, error: 'Attachment requires a secure (https) link.' }, { status: 400 });
      }
      if (!mediaType || !WHATSAPP_MEDIA_TYPES.includes(mediaType)) {
        return NextResponse.json(
          { success: false, error: `attachment.mediaType must be one of ${WHATSAPP_MEDIA_TYPES.join(', ')}.` },
          { status: 400 },
        );
      }
      if (isInternalNote) {
        return NextResponse.json(
          { success: false, error: 'Internal notes cannot carry attachments.' },
          { status: 400 },
        );
      }
    }

    const conversation = await db.uccConversation.findUnique({ where: { id } });
    if (!conversation) {
      return NextResponse.json({ success: false, error: 'Conversation not found.' }, { status: 404 });
    }

    // Non-admin employees can only reply to conversations assigned to them
    const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER'].includes(primaryRole);
    if (!isAdmin && conversation.assignedToUserId && conversation.assignedToUserId !== auth.userId) {
      return NextResponse.json(
        { success: false, error: 'You can only reply to conversations assigned to you.' },
        { status: 403 }
      );
    }

    // §131 — attachments leave through the OFFICIAL WhatsApp Cloud API only.
    // On any failure the send is reported truthfully (no fabricated delivery).
    let waMediaSend: { messageId: string | null; success: boolean; error?: string } | null = null;
    if (attachment && mediaType) {
      if (conversation.channel !== 'whatsapp') {
        return NextResponse.json(
          { success: false, code: 'CHANNEL_UNSUPPORTED_FOR_MEDIA', error: `Attachments may only be sent on WhatsApp conversations via the official Cloud API (this is a ${conversation.channel} conversation).` },
          { status: 422 },
        );
      }
      if (!conversation.participantPhone) {
        return NextResponse.json(
          { success: false, error: 'Cannot send attachment — conversation has no recipient phone number.' },
          { status: 422 },
        );
      }
      waMediaSend = await sendWhatsAppMedia({
        to: conversation.participantPhone,
        mediaType,
        link: attachment.link,
        fileName: attachment.fileName,
        caption: attachment.caption || content?.trim() || undefined,
      });
      if (!waMediaSend.success) {
        await db.uccMessage.create({
          data: {
            conversationId: id,
            direction: 'outbound',
            senderId: auth.userId,
            senderName: auth.name || auth.email || 'Staff',
            senderRole: 'employee',
            channel: conversation.channel,
            content: `[Attachment send failed] ${attachment.fileName || attachment.link}`,
            messageType: mediaType,
            status: 'failed',
            aiGenerated: false,
            aiApproved: true,
            metadata: JSON.stringify({ sentAt: new Date().toISOString(), sendError: waMediaSend.error, senderEmail: auth.email }),
          },
        });
        return NextResponse.json(
          { success: false, error: `WhatsApp media send failed: ${waMediaSend.error}` },
          { status: 502 },
        );
      }
    }

    const direction = isInternalNote ? 'internal_note' : 'outbound';

    const message = await db.uccMessage.create({
      data: {
        conversationId: id,
        direction,
        senderId: auth.userId,
        senderName: auth.name || auth.email || 'Staff',
        senderRole: 'employee',
        channel: conversation.channel,
        content: content?.trim() || attachment?.caption || (attachment ? `[${mediaType}: ${attachment.fileName || attachment.link}]` : ''),
        messageType: mediaType || messageType,
        status: waMediaSend ? 'sent' : 'sent',
        aiGenerated,
        aiApproved: aiGenerated ? aiApproved : true,
        metadata: JSON.stringify({
          sentAt: new Date().toISOString(),
          isInternalNote,
          senderEmail: auth.email,
          ...(waMediaSend?.messageId ? { providerMessageId: waMediaSend.messageId } : {}),
        }),
      },
    });

    // Update conversation last message timestamp
    await db.uccConversation.update({
      where: { id },
      data: {
        lastMessageText: content.trim().substring(0, 200),
        lastMessageAt: new Date(),
      },
    });

    // §131 — every attachment (inbound AND outbound) is stored with:
    // file_name, file_type, file_size, sender, recipient, delivery_status,
    // and the student/application/document linkage where known.
    if (attachment && mediaType && waMediaSend?.success) {
      const commThread = await db.communicationThread.findFirst({
        where: {
          channel: 'whatsapp',
          ...(conversation.studentId
            ? { studentId: conversation.studentId }
            : conversation.leadId ? { leadId: conversation.leadId } : {}),
        },
        orderBy: { lastMessageAt: 'desc' },
      }).catch(() => null);

      await db.communicationAttachment.create({
        data: {
          messageId: message.id,
          threadId: commThread?.id || '',
          studentId: conversation.studentId || '',
          applicationId: '',
          documentId: '',
          channel: 'whatsapp',
          direction: 'outbound',
          providerFileId: waMediaSend.messageId || '',
          fileName: attachment.fileName || `${mediaType}_${Date.now()}`,
          fileType: mediaType,
          fileSizeBytes: attachment.fileSizeBytes || 0,
          senderContact: process.env.WHATSAPP_BUSINESS_PHONE || '',
          recipientContact: conversation.participantPhone || '',
          deliveryStatus: 'sent',
          matchReviewRequired: false,
          whatsappMsgRef: waMediaSend.messageId,
        },
      }).catch(() => {});

      await db.uccAttachment.create({
        data: {
          conversationId: id,
          messageId: message.id,
          fileName: attachment.fileName || `${mediaType}_${Date.now()}`,
          fileType: mediaType,
          mimeType: attachment.mimeType || '',
          fileSize: attachment.fileSizeBytes || 0,
          fileUrl: attachment.link,
          studentId: conversation.studentId,
          applicationId: null,
        },
      }).catch(() => {});
    }

    await logAuditAction(auth, isInternalNote ? 'INTERNAL_NOTE_ADDED' : (attachment ? 'ATTACHMENT_SENT' : 'REPLY_SENT'), 'UccConversation', id, {
      messageId: message.id,
      channel: conversation.channel,
      aiGenerated,
      ...(attachment ? { attachment: { fileName: attachment.fileName, mediaType, providerMessageId: waMediaSend?.messageId } } : {}),
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
