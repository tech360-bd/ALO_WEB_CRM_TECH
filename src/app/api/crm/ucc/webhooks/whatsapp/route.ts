import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import {
  normalizePhoneE164 as normalizePhone,
  classifyIntent,
  detectPriority,
  verifySignatureStrict,
  extractMessageContent,
} from '@/lib/whatsapp-webhook-handler';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET;

// Consolidated via src/lib/whatsapp-webhook-handler.ts — preserves all functions from both
// wattps://github.com/engralaminn-collab/alo_education_z....ai — lossless 2026-09-14
// Original local functions now re-exported from handler: normalizePhone (E.164), classifyIntent, detectPriority
// Additional handler utilities available: verifySignature, safeEqual, extractMessageContent, sendOutboundViaApi, generateStudentId


// GET: Meta webhook verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (VERIFY_TOKEN && mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] VERIFIED');
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// POST: Handle incoming WhatsApp events
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // 1. Signature verification is mandatory for every provider request.
    if (!APP_SECRET) {
      console.error('[WhatsApp Webhook] WHATSAPP_APP_SECRET is not configured — rejected');
      return new NextResponse('Webhook verification is not configured', { status: 503 });
    }
    const signature = request.headers.get('x-hub-signature-256') || '';
    const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
    const provided = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(provided, expectedBuffer)) {
      console.warn('[WhatsApp Webhook] Signature mismatch — rejected');
      return new NextResponse('Forbidden', { status: 403 });
    }

    const body = JSON.parse(rawBody);

    if (body.object !== 'whatsapp_business_account') {
      return new NextResponse('Not Found', { status: 404 });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;
        if (!value) continue;

        // Handle message status updates (SENT → DELIVERED → READ → FAILED)
        for (const status of value.statuses || []) {
          await db.communicationMessage.updateMany({
            where: { content: { contains: status.id } },
            data: { deliveryStatus: status.status },
          }).catch(() => null);
        }

        // Handle incoming messages
        for (const message of value.messages || []) {
          const providerMsgId = message.id;
          const senderPhone = normalizePhone(message.from);
          const messageText = message.text?.body || message.caption || '';
          const messageType = message.type || 'text';
          const isFile = ['image', 'document', 'audio', 'video'].includes(messageType);

          // 2. IDEMPOTENCY: Prevent duplicate processing
          const existingMsg = await db.communicationMessage.findFirst({
            where: { content: providerMsgId },
          }).catch(() => null);
          if (existingMsg) continue; // Already processed

          // 3. PHONE DEDUPLICATION & CONTACT MATCHING
          let matchedStudentId = '';
          let matchedLeadId = '';
          let matchType = 'unknown';
          let studentContext: any = null;

          // Try to match student by phone
          const student = await db.student.findFirst({
            where: { OR: [{ phone: senderPhone }, { phone: message.from }] },
            select: {
              id: true, studentId: true, name: true, phone: true,
              counselorId: true, counselorName: true,
            },
          }).catch(() => null);

          if (student) {
            matchedStudentId = student.id;
            matchType = 'student';
            studentContext = student;
          } else {
            // Check existing lead
            const lead = await db.leadForm.findFirst({
              where: { phone: senderPhone },
              select: { id: true, name: true, phone: true },
            }).catch(() => null);

            if (lead) {
              matchedLeadId = lead.id;
              matchType = 'lead';
            } else {
              // 4. Create new Lead (NOT Student — deduplication rule)
              const newLead = await db.leadForm.create({
                data: {
                  name: value.contacts?.[0]?.profile?.name || 'WhatsApp Contact',
                  phone: senderPhone,
                  source: 'whatsapp_inbound',
                  status: 'new',
                },
              }).catch(() => null);
              if (newLead) {
                matchedLeadId = newLead.id;
                matchType = 'new_lead';
              }
            }
          }

          // 5. Find or create thread for this phone/contact
          let thread = await db.communicationThread.findFirst({
            where: {
              channel: 'whatsapp',
              ...(matchedStudentId ? { studentId: matchedStudentId } : { leadId: matchedLeadId }),
              status: { not: 'closed' },
            },
          }).catch(() => null);

          const intent = classifyIntent(messageText);
          const priority = detectPriority(intent, messageText);
          const assignedCounselorId = student?.counselorId || '';
          const assignedCounselorName = student?.counselorName || '';

          // 6. Get SLA rule for this channel/priority
          const slaRule = await db.communicationSlaRule.findFirst({
            where: { status: 'active' },
          }).catch(() => null);
          const slaMinutes = slaRule?.firstResponseMinutes || 30;
          const slaDueAt = new Date(Date.now() + slaMinutes * 60 * 1000);

          if (!thread) {
            thread = await db.communicationThread.create({
              data: {
                threadCode: `WA-${Date.now()}`,
                channel: 'whatsapp',
                studentId: matchedStudentId,
                leadId: matchedLeadId,
                intent,
                priority,
                assignedToId: assignedCounselorId,
                assignedToName: assignedCounselorName,
                status: 'open',
                lastMessageAt: new Date(),
                lastMessagePreview: messageText.substring(0, 120),
                unreadCount: 1,
                slaDueAt,
                slaTriggeredAt: new Date(),
                slaStatus: 'normal',
              },
            });

            // Create SLA event for new thread (§150 — precise timestamps:
            // received + assigned at intake; first-viewed / first-response
            // resolvedAt are recorded by the inbox and reply seams).
            await db.communicationSlaEvent.create({
              data: {
                threadId: thread.id,
                counselorId: assignedCounselorId,
                counselorName: assignedCounselorName,
                channel: 'whatsapp',
                priority,
                slaMinutes,
                receivedAt: new Date(),
                assignedAt: assignedCounselorId ? new Date() : null,
                slaDueAt,
                slaStatus: 'normal',
              },
            });
          } else {
            await db.communicationThread.update({
              where: { id: thread.id },
              data: {
                lastMessageAt: new Date(),
                lastMessagePreview: messageText.substring(0, 120),
                unreadCount: { increment: 1 },
                intent,
                slaDueAt,
                slaTriggeredAt: new Date(),
                slaStatus: 'normal',
              },
            });
          }

          // 7. Save message (use providerMsgId in content for idempotency key)
          const savedMsg = await db.communicationMessage.create({
            data: {
              threadId: thread.id,
              channel: 'whatsapp',
              direction: 'inbound',
              senderContact: senderPhone,
              senderName: value.contacts?.[0]?.profile?.name || senderPhone,
              senderType: matchType === 'student' ? 'student' : 'lead',
              senderId: matchedStudentId || matchedLeadId,
              studentId: matchedStudentId,
              leadId: matchedLeadId,
              content: providerMsgId, // idempotency key
              messageBody: messageText,
              type: messageType,
              messageType: messageType,
              intent,
              priority,
              status: 'unread',
              deliveryStatus: 'delivered',
              isRead: false,
            },
          });

          // 8. Handle file/document attachments
          // §131 Attachment Storage — file_name, file_type, file_size, sender,
          // recipient, delivery_status are stored for EVERY attachment;
          // student/application/document ids are filled once the counselor
          // maps the file to a requirement slot (match review / doc upload).
          if (isFile) {
            const mediaObj = message[messageType] || {};
            await db.communicationAttachment.create({
              data: {
                messageId: savedMsg.id,
                threadId: thread.id,
                studentId: matchedStudentId,
                applicationId: '',
                documentId: '',
                channel: 'whatsapp',
                direction: 'inbound',
                providerFileId: mediaObj.id || '',
                fileName: mediaObj.filename || `${messageType}_${Date.now()}`,
                fileType: messageType,
                fileSizeBytes: mediaObj.file_size || 0,
                senderContact: senderPhone,
                recipientContact: value.metadata?.display_phone_number || value.metadata?.phone_number_id || '',
                deliveryStatus: 'delivered',
                matchReviewRequired: true, // Counselor must confirm which doc slot
                whatsappMsgRef: providerMsgId,
              },
            });
          }
        }
      }
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });
  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
