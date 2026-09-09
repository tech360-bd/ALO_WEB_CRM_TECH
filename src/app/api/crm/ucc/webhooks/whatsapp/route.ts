import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'alo_education_webhook_verify';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

// ============================================================
// WhatsApp Business Cloud API Webhook
// Requirements 121-177: Signature validation, idempotency,
// phone deduplication, intent classification, SLA start
// ============================================================

function normalizePhone(phone: string): string {
  // Normalize to E.164 international format
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('880') && digits.length === 13) return `+${digits}`;
  if (digits.startsWith('01') && digits.length === 11) return `+880${digits.slice(1)}`;
  return `+${digits}`;
}

function classifyIntent(messageText: string): string {
  const text = messageText.toLowerCase();
  if (/passport|bank statement|transcript|nid|document|certificate|submit|upload/.test(text)) return 'DOCUMENT_REQUIREMENT';
  if (/payment|pay|fees|deposit|money|transfer|receipt/.test(text)) return 'PAYMENT_QUESTION';
  if (/visa|cas|i-20|coe|biometric|embassy|appointment/.test(text)) return 'VISA_QUESTION';
  if (/offer|admission|university|apply|application|accepted|rejected/.test(text)) return 'APPLICATION_QUESTION';
  if (/ielts|toefl|sat|gre|gmat|exam|test|score/.test(text)) return 'TEST_PREPARATION';
  if (/urgent|asap|emergency|deadline|tomorrow|today/.test(text)) return 'URGENT';
  if (/interview|counselor|appointment|meet|office/.test(text)) return 'APPOINTMENT';
  return 'GENERAL';
}

function detectPriority(intent: string, text: string): string {
  if (intent === 'URGENT') return 'critical';
  if (/payment|visa|cas|coe|i-20|deadline/.test(text.toLowerCase())) return 'high';
  if (intent === 'DOCUMENT_REQUIREMENT' || intent === 'PAYMENT_QUESTION') return 'high';
  return 'normal';
}

// GET: Meta webhook verification
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('[WhatsApp Webhook] VERIFIED');
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// POST: Handle incoming WhatsApp events
export async function POST(request: Request) {
  try {
    const rawBody = await request.text();

    // 1. Signature verification (production security)
    if (APP_SECRET) {
      const signature = request.headers.get('x-hub-signature-256') || '';
      const expected = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(rawBody).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        console.warn('[WhatsApp Webhook] Signature mismatch — rejected');
        return new NextResponse('Forbidden', { status: 403 });
      }
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

            // Create SLA event for new thread
            await db.communicationSlaEvent.create({
              data: {
                threadId: thread.id,
                counselorId: assignedCounselorId,
                counselorName: assignedCounselorName,
                channel: 'whatsapp',
                priority,
                slaMinutes,
                receivedAt: new Date(),
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
          if (isFile) {
            const mediaObj = message[messageType] || {};
            await db.communicationAttachment.create({
              data: {
                messageId: savedMsg.id,
                threadId: thread.id,
                studentId: matchedStudentId,
                channel: 'whatsapp',
                direction: 'inbound',
                providerFileId: mediaObj.id || '',
                fileName: mediaObj.filename || `${messageType}_${Date.now()}`,
                fileType: messageType,
                fileSizeBytes: mediaObj.file_size || 0,
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
