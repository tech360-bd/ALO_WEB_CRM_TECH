import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import crypto from "crypto";
import { normalizeBdPhone, determineSenderNumber, MAIN_NUMBER, COO_NUMBER } from "@/lib/whatsapp-number-pool";
import { detectLanguage, detectIntent, detectSentiment, generateAiReply, logAiOperation, calculateLeadScore } from "@/lib/ai-whatsapp-engine";
import { startSlaForThread, calculateSlaDueAt } from "@/lib/sla-engine";
import { handleStopStartCommand, createFollowUpScheduleForStudent } from "@/lib/whatsapp-followup-engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePhone(phone: string): string {
  return normalizeBdPhone(phone);
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return a === b;
  }
}

function verifySignature(rawBody: string, signature: string): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET || process.env.WHATSAPP_VERIFY_TOKEN;
  if (!appSecret) {
    console.warn("[whatsapp.webhook] WHATSAPP_APP_SECRET not set — skipping verification (dev mode)");
    return true;
  }
  if (!signature) return false;
  const expected = "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

async function sendOutboundViaApi(recipientPhone: string, text: string): Promise<{ messageId: string | null; apiResponse: any }> {
  const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { messageId: null, apiResponse: { error: "WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured" } };
  }
  const payload = {
    messaging_product: "whatsapp",
    to: recipientPhone,
    type: "text",
    text: { body: text },
  };
  try {
    const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    const messageId = json?.messages?.[0]?.id || null;
    return { messageId, apiResponse: json };
  } catch (err: any) {
    return { messageId: null, apiResponse: { error: err.message } };
  }
}

function extractMessageContent(msg: any): { type: string; body: string; mediaId?: string; extra?: any } {
  const type = msg.type || 'text';
  switch (type) {
    case 'text':
      return { type, body: msg.text?.body || '' };
    case 'image':
      return { type, body: msg.image?.caption || '[Image]', mediaId: msg.image?.id, extra: { mime: msg.image?.mime_type, sha256: msg.image?.sha256 } };
    case 'document':
      return { type, body: msg.document?.filename || '[Document]', mediaId: msg.document?.id, extra: { filename: msg.document?.filename, mime: msg.document?.mime_type } };
    case 'audio':
      return { type, body: '[Audio]', mediaId: msg.audio?.id, extra: { voice: msg.audio?.voice, duration: msg.audio?.duration } };
    case 'video':
      return { type, body: msg.video?.caption || '[Video]', mediaId: msg.video?.id, extra: { mime: msg.video?.mime_type } };
    case 'location':
      return { type, body: `[Location: ${msg.location?.latitude},${msg.location?.longitude}]`, extra: msg.location };
    case 'contacts':
      return { type, body: `[Contact: ${msg.contacts?.[0]?.name?.formatted_name || 'Contact'}]`, extra: msg.contacts };
    case 'interactive':
      const interactive = msg.interactive;
      if (interactive?.type === 'button_reply') {
        return { type: 'button', body: interactive.button_reply?.title || interactive.button_reply?.id || '[Button Reply]', extra: interactive };
      }
      if (interactive?.type === 'list_reply') {
        return { type: 'interactive', body: interactive.list_reply?.title || interactive.list_reply?.id || '[List Reply]', extra: interactive };
      }
      return { type: 'interactive', body: '[Interactive]', extra: interactive };
    case 'button':
      return { type: 'button', body: msg.button?.text || msg.button?.payload || '[Button]', extra: msg.button };
    default:
      return { type, body: msg.text?.body || `[${type}]`, mediaId: msg[type]?.id };
  }
}

// Generate unique Student ID AE-YYYYNNNN
async function generateStudentId(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AE-${year}`;
  // Find last student with same year prefix
  try {
    const last = await db.student.findFirst({
      where: { studentId: { startsWith: prefix } },
      orderBy: { studentId: 'desc' },
    });
    if (last) {
      const numPart = last.studentId.replace(prefix, '');
      const num = parseInt(numPart, 10) || 0;
      return `${prefix}${String(num + 1).padStart(4, '0')}`;
    }
  } catch {}
  // Fallback count
  try {
    const count = await db.student.count();
    return `${prefix}${String(10001 + count).padStart(4, '0')}`;
  } catch {
    return `${prefix}${String(Math.floor(Math.random() * 90000) + 10000)}`;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";

  // 1. Validate payload & source
  const signatureValid = verifySignature(rawBody, signature);
  if (process.env.WHATSAPP_APP_SECRET && !signatureValid) {
    return NextResponse.json({ error: "Invalid signature — webhook not verified" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (body["hub.mode"] === "subscribe") {
    return NextResponse.json({ "hub.challenge": body["hub.challenge"] });
  }

  // 2. Handle status updates
  const statuses: any[] = body?.entry?.[0]?.changes?.[0]?.value?.statuses || [];
  if (statuses.length > 0) {
    const updated: any[] = [];
    for (const s of statuses) {
      const messageId = s.id;
      const status = s.status?.toUpperCase() || "UNKNOWN";
      const recipientPhone = s.recipient_id || "";
      const errorMessage = s.errors?.[0]?.message || null;
      try {
        const record = await db.whatsAppMessageStatus.create({
          data: { messageId, recipientPhone, status, errorMessage, providerPayload: JSON.stringify(s) },
        });
        // Also update archive
        await db.whatsAppMessageArchive.updateMany({
          where: { whatsappMessageId: messageId },
          data: { deliveryStatus: status, readStatus: status === 'read' ? 'read' : status === 'delivered' ? 'delivered' : 'sent' },
        }).catch(() => {});
        updated.push({ messageId, status, recordId: record.id });
      } catch (err: any) {
        updated.push({ messageId, status, error: err.message });
      }
    }
    await db.webhookEvent.create({
      data: {
        provider: "WHATSAPP",
        eventId: body?.entry?.[0]?.id || `wa-status-${Date.now()}`,
        eventType: "STATUS_UPDATE",
        payload: rawBody,
        signature,
        verified: signatureValid,
        processed: true,
        processedAt: new Date(),
      },
    }).catch(() => {});
    await db.uccWebhookEvent.create({
      data: { provider: "WHATSAPP", eventId: `status-${Date.now()}`, eventType: "STATUS_UPDATE", payload: rawBody, status: "processed" },
    }).catch(() => {});
    return NextResponse.json({ success: true, routed: "status", processed: updated.length, statuses: updated });
  }

  // 3. Parse inbound messages — support multiple entries
  const entries = body?.entry || [];
  const allMessages: any[] = [];
  for (const entry of entries) {
    for (const change of entry?.changes || []) {
      const value = change?.value;
      if (!value) continue;
      // Identify receiving ALO number
      const receivingPhone = value.metadata?.display_phone_number || value.metadata?.phone_number_id || "";
      const messages = value.messages || [];
      const contacts = value.contacts || [];
      for (const msg of messages) {
        const contact = contacts.find((c: any) => c.wa_id === msg.from);
        allMessages.push({
          msg,
          receivingPhone,
          phoneNumberId: value.metadata?.phone_number_id || "",
          contact,
          entryId: entry.id,
        });
      }
    }
  }

  if (allMessages.length === 0) {
    // No messages, but save raw event
    await db.webhookEvent.create({
      data: {
        provider: "WHATSAPP",
        eventId: `wa-empty-${Date.now()}`,
        eventType: body.object || "UNKNOWN",
        payload: rawBody,
        signature,
        verified: signatureValid,
        processed: true,
        processedAt: new Date(),
      },
    }).catch(() => {});
    return NextResponse.json({ success: true, message: "No messages to process" });
  }

  const results = [];

  for (const { msg, receivingPhone, phoneNumberId, contact, entryId } of allMessages) {
    const providerMessageId = msg.id;
    const from = msg.from;
    const timestamp = msg.timestamp ? new Date(parseInt(msg.timestamp, 10) * 1000) : new Date();
    const { type, body: messageBody, mediaId, extra } = extractMessageContent(msg);
    const fromName = contact?.profile?.name || from;

    // 4. Detect duplicates — check WhatsAppMessageArchive by whatsappMessageId
    try {
      const existingArchive = await db.whatsAppMessageArchive.findUnique({
        where: { whatsappMessageId: providerMessageId },
      });
      if (existingArchive) {
        results.push({ messageId: providerMessageId, idempotent: true, duplicate: true });
        continue; // Skip duplicate
      }
    } catch {}

    // 5. Idempotency via webhookEvent provider+eventId
    let webhookEvent: any = null;
    try {
      webhookEvent = await db.webhookEvent.findUnique({
        where: { provider_eventId: { provider: "WHATSAPP", eventId: providerMessageId } },
      });
      if (webhookEvent?.processed) {
        results.push({ messageId: providerMessageId, idempotent: true, webhookEventId: webhookEvent.id });
        continue;
      }
    } catch {}

    if (!webhookEvent) {
      try {
        webhookEvent = await db.webhookEvent.create({
          data: {
            provider: "WHATSAPP",
            eventId: providerMessageId,
            eventType: `MESSAGE_${type.toUpperCase()}`,
            payload: rawBody,
            signature,
            verified: signatureValid,
            processed: false,
          },
        });
      } catch {
        try {
          webhookEvent = await db.webhookEvent.findUnique({
            where: { provider_eventId: { provider: "WHATSAPP", eventId: providerMessageId } },
          });
        } catch {}
      }
    }

    // 6. Save raw event safely
    await db.uccWebhookEvent.create({
      data: {
        provider: "WHATSAPP",
        eventId: providerMessageId,
        eventType: `MESSAGE_${type.toUpperCase()}`,
        payload: JSON.stringify(msg),
        status: "pending",
      },
    }).catch(() => {});

    // 7. Normalize phone, search existing
    const normalizedFrom = normalizePhone(from);

    // Search existing WhatsApp contact
    let waContact = null;
    try {
      waContact = await db.whatsAppContact.findUnique({
        where: { normalizedPhone: normalizedFrom },
      });
    } catch {}

    // Search existing student
    let existingStudent = null;
    try {
      existingStudent = await db.student.findFirst({
        where: {
          OR: [
            { mobile: from },
            { mobile: normalizedFrom },
            { altMobile: from },
            { altMobile: normalizedFrom },
          ],
        },
      });
      if (!existingStudent) {
        existingStudent = await db.portalStudentProfile.findFirst({
          where: {
            OR: [
              { studentId: waContact?.studentId || "" },
              { userId: waContact?.studentId || "" },
            ],
          },
        }).then(async (p) => {
          if (p) return p;
          // Search by phone in portal user
          const portalUser = await db.portalUser.findFirst({
            where: { phone: { in: [from, normalizedFrom] } },
          });
          if (portalUser) {
            return await db.portalStudentProfile.findUnique({ where: { userId: portalUser.id } });
          }
          return null;
        });
      }
    } catch {}

    let leadId: string | null = waContact?.leadId || null;
    let studentId: string | null = waContact?.studentId || (existingStudent as any)?.id || (existingStudent as any)?.studentId || null;

    // Search existing lead if no student
    if (!studentId) {
      try {
        const existingLead = await db.lead.findFirst({
          where: {
            OR: [
              { phone: from },
              { phone: normalizedFrom },
              { altPhone: from },
              { altPhone: normalizedFrom },
            ],
          },
        });
        leadId = existingLead?.id || null;
      } catch {}
    }

    // 8. Handle STOP/START
    const stopStart = await handleStopStartCommand(from, messageBody).catch(() => ({ action: 'NONE' }));

    // 9. Student auto-creation if unknown
    let isNewStudent = false;
    if (!studentId && !leadId) {
      try {
        // Check alternate phone records
        const altCheck = await db.whatsAppContact.findFirst({
          where: { OR: [{ phone: from }, { normalizedPhone: normalizedFrom }] },
        });
        if (!altCheck) {
          const count = await db.lead.count().catch(() => 0);
          const newLead = await db.lead.create({
            data: {
              leadId: `ALO-L-${(10001 + count + 1).toString()}`,
              fullName: `${fromName || `WhatsApp ${from.slice(-4)}`}`,
              phone: from,
              source: "WHATSAPP",
              sourceDetail: `WhatsApp inbound - ${type}`,
              notes: `Auto-created from WhatsApp. First message: "${messageBody.slice(0, 200)}"`,
              status: "NEW",
              welcomeSent: false,
            },
          }).catch(() => null);

          if (newLead) leadId = newLead.id;

          const studentCode = await generateStudentId();
          const newStudent = await db.student.create({
            data: {
              studentId: studentCode,
              firstName: fromName?.split(' ')[0] || 'WhatsApp',
              lastName: fromName?.split(' ').slice(1).join(' ') || from.slice(-4),
              fullName: fromName || `WhatsApp ${from.slice(-4)}`,
              email: `wa_${from.slice(-4)}_${Date.now()}@aloeducation.com`,
              mobile: from,
              nationality: "Bangladeshi",
              leadId: newLead?.id || "",
              profileCompletion: 5,
              status: "ACTIVE",
            },
          }).catch(() => null);

          if (newStudent) {
            studentId = newStudent.id;
            isNewStudent = true;

            // Create WhatsApp contact
            await db.whatsAppContact.create({
              data: {
                phone: from,
                normalizedPhone: normalizedFrom,
                displayName: fromName || `WhatsApp ${from.slice(-4)}`,
                profileName: fromName,
                studentId: newStudent.id,
                leadId: newLead?.id || "",
                source: "WHATSAPP",
                firstContactAt: timestamp,
                lastContactAt: timestamp,
              },
            }).catch(() => {});

            // Timeline
            await db.timelineEvent.create({
              data: {
                leadId: newLead?.id || "",
                type: "LEAD_CREATED",
                title: "Lead auto-created from WhatsApp",
                description: `Auto lead creation from WhatsApp inbound. Message: ${messageBody.slice(0, 100)}`,
              },
            }).catch(() => {});

            // Create follow-up schedule
            await createFollowUpScheduleForStudent({
              studentId: newStudent.id,
              leadId: newLead?.id,
              contactPhone: from,
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.error("Auto-creation error:", err);
      }
    } else if (waContact) {
      // Update existing contact lastContactAt
      await db.whatsAppContact.update({
        where: { id: waContact.id },
        data: { lastContactAt: new Date(), displayName: fromName || waContact.displayName },
      }).catch(() => {});
    }

    // 10. Save normalized message to permanent archive
    let conversationId = `wa-${normalizedFrom}`;
    let threadId = "";

    // Find or create CommunicationThread
    try {
      let thread = await db.communicationThread.findFirst({
        where: { OR: [{ threadCode: conversationId }, { studentId: studentId || "" }] },
        orderBy: { createdAt: 'desc' },
      });

      if (!thread) {
        thread = await db.communicationThread.create({
          data: {
            threadCode: conversationId,
            studentId: studentId || "",
            leadId: leadId || "",
            channel: "whatsapp",
            subject: `WhatsApp with ${fromName}`,
            status: "open",
            lastMessageAt: new Date(),
            lastMessagePreview: messageBody.slice(0, 100),
          },
        });
      } else {
        await db.communicationThread.update({
          where: { id: thread.id },
          data: { lastMessageAt: new Date(), lastMessagePreview: messageBody.slice(0, 100), status: "open" },
        }).catch(() => {});
      }
      threadId = thread.id;
      conversationId = thread.id;
    } catch {}

    // Save to WhatsAppMessageArchive (permanent)
    try {
      await db.whatsAppMessageArchive.create({
        data: {
          whatsappMessageId: providerMessageId,
          conversationId,
          threadId,
          studentId: studentId || "",
          leadId: leadId || "",
          senderPhone: from,
          receiverPhone: receivingPhone || MAIN_NUMBER,
          senderNumber: receivingPhone || MAIN_NUMBER,
          messageType: type,
          messageBody,
          mediaId: mediaId || "",
          timestamp,
          direction: "inbound",
          deliveryStatus: "delivered",
          readStatus: "unread",
          aiGenerated: false,
          rawEventId: webhookEvent?.id || "",
        },
      });
    } catch (err) {
      console.error("Archive save error:", err);
    }

    // Save to SocialInboxMessage (legacy)
    let inboundMessage: any = null;
    try {
      inboundMessage = await db.socialInboxMessage.create({
        data: {
          platform: "WHATSAPP",
          direction: "INBOUND",
          senderId: from,
          senderName: fromName,
          messageText: messageBody,
          conversationId: `wa-${from}`,
          leadId: leadId || "",
          studentId: studentId || "",
          aiHandled: false,
          isRead: false,
        },
      });
    } catch {}

    // Save to UccMessage
    try {
      let uccConv = await db.uccConversation.findFirst({
        where: { participantPhone: normalizedFrom },
      });
      if (!uccConv) {
        uccConv = await db.uccConversation.create({
          data: {
            channel: "whatsapp",
            channelAccountId: phoneNumberId,
            externalId: `wa-${normalizedFrom}`,
            participantName: fromName,
            participantPhone: normalizedFrom,
            studentId: studentId || undefined,
            leadId: leadId || undefined,
            status: "open",
            lastMessageText: messageBody.slice(0, 200),
            lastMessageAt: new Date(),
            unreadCount: 1,
          },
        });
      } else {
        await db.uccConversation.update({
          where: { id: uccConv.id },
          data: { lastMessageText: messageBody.slice(0, 200), lastMessageAt: new Date(), unreadCount: { increment: 1 } },
        }).catch(() => {});
      }

      await db.uccMessage.create({
        data: {
          conversationId: uccConv.id,
          direction: "inbound",
          senderName: fromName,
          senderRole: "user",
          channel: "whatsapp",
          content: messageBody,
          messageType: type,
          status: "delivered",
          aiGenerated: false,
          metadata: JSON.stringify({ whatsappMessageId: providerMessageId, mediaId, ...extra }),
        },
      });

      // If media, create attachment and queue document processing
      if (mediaId && ['image','document','audio','video'].includes(type)) {
        await db.uccAttachment.create({
          data: {
            conversationId: uccConv.id,
            fileName: extra?.filename || `${type}-${providerMessageId}`,
            fileType: type,
            mimeType: extra?.mime || `${type}/*`,
            fileSize: 0,
            fileUrl: `whatsapp-media:${mediaId}`,
            studentId: studentId || undefined,
          },
        }).catch(() => {});

        // Document auto-ingestion
        await db.studentDocument.create({
          data: {
            studentId: studentId || "",
            category: type === 'image' ? 'image' : type === 'document' ? 'document' : type,
            fileName: extra?.filename || `${type}-${providerMessageId}`,
            fileUrl: `whatsapp-media:${mediaId}`,
            status: "pending_verification",
          },
        }).catch(() => {});

        // Queue AI extraction
        await db.ocrJob.create({
          data: {
            documentId: `${type}-${providerMessageId}`,
            fileUrl: `whatsapp-media:${mediaId}`,
            fileName: extra?.filename || `${type}`,
            mimeType: extra?.mime || "",
            status: "queued",
            studentId: studentId || undefined,
            conversationId: uccConv.id,
          },
        }).catch(() => {});
      }
    } catch (err) {
      console.error("UCC save error:", err);
    }

    // 11. AI processing — language, intent, sentiment
    const lang = detectLanguage(messageBody);
    const intent = detectIntent(messageBody);
    const sentiment = detectSentiment(messageBody);

    let aiReplyText = "";
    let shouldHandover = false;
    let handoverReason = "";

    // Check if AI should handle (respect office hours, handover state)
    const shouldAiHandle = !stopStart.optedOut && type === 'text' && messageBody.length > 0;

    if (shouldAiHandle) {
      const aiResult = await generateAiReply({
        message: messageBody,
        studentName: fromName,
        language: lang.language,
        intent: intent.intent,
        sentiment: sentiment.sentiment,
        context: `StudentId: ${studentId}, LeadId: ${leadId}`,
      });
      aiReplyText = aiResult.reply;
      shouldHandover = aiResult.shouldHandover;
      handoverReason = aiResult.handoverReason || "";

      await logAiOperation({
        threadId: threadId || conversationId,
        messageId: providerMessageId,
        studentId: studentId || "",
        intent: intent.intent,
        intentConfidence: intent.confidence,
        sentiment: sentiment.sentiment,
        sentimentConfidence: sentiment.confidence,
        language: lang.language,
        shouldHandover,
        handoverReason,
      }).catch(() => {});

      // Lead scoring
      const leadScore = calculateLeadScore({
        engagement: 5,
        intent: intent.intent,
        urgency: sentiment.isUrgent ? 8 : sentiment.isHighRisk ? 6 : 3,
        responseFrequency: 1,
      });

      if (studentId) {
        await db.aiLeadScore.upsert({
          where: { studentId },
          update: { score: leadScore.score, explanation: leadScore.explanation, calculatedAt: new Date() },
          create: { studentId, leadId: leadId || "", score: leadScore.score, explanation: leadScore.explanation },
        }).catch(() => {});
      }
    }

    // 12. Routing
    const routingContext = {
      studentId: studentId || undefined,
      leadId: leadId || undefined,
      counselorId: (existingStudent as any)?.counselorId || undefined,
      isComplaint: intent.intent === 'complaint',
      isUrgent: sentiment.isUrgent || intent.intent === 'urgent_support',
      isFollowUp: false,
    };

    const routing = await determineSenderNumber(routingContext).catch(() => ({ number: MAIN_NUMBER, reason: 'default', fallback: true }));

    await db.communicationRoutingLog.create({
      data: {
        threadId: threadId || "",
        conversationId,
        studentId: studentId || "",
        fromNumber: from,
        toNumber: routing.number,
        routingReason: routing.reason,
        priority: routingContext.isUrgent ? 3 : routingContext.isComplaint ? 2 : 1,
        assignedToId: routingContext.counselorId || "",
        fallbackUsed: routing.fallback,
      },
    }).catch(() => {});

    // 13. SLA start
    if (threadId && !shouldHandover) {
      await startSlaForThread(threadId, {
        studentId: studentId || "",
        counselorId: routingContext.counselorId,
        channel: "whatsapp",
        slaMinutes: 30,
      }).catch(() => {});
    }

    // 14. Urgent escalation
    if (sentiment.isUrgent || intent.intent === 'urgent_support' || intent.intent === 'complaint') {
      await db.dashboardAlarm.create({
        data: {
          alarmType: intent.intent === 'complaint' ? 'COMPLAINT' : 'URGENT_SUPPORT',
          threadId: threadId || "",
          conversationId,
          studentId: studentId || "",
          studentName: fromName,
          maskedPhone: from.slice(0, 3) + '****' + from.slice(-3),
          unmaskedPhone: from,
          branch: "",
          assignedEmployee: routingContext.counselorId || "",
          slaElapsedMinutes: 0,
          escalationLevel: sentiment.isUrgent ? 2 : 1,
          priority: sentiment.isHighRisk ? 'critical' : 'high',
          status: 'active',
        },
      }).catch(() => {});

      await db.notification.create({
        data: {
          studentId: studentId || "",
          title: sentiment.isUrgent ? 'Urgent Support Request' : 'Complaint Detected',
          message: `Urgent: ${messageBody.slice(0, 100)} from ${fromName} (${from}). Shared COO number ${COO_NUMBER}.`,
          type: 'critical',
        },
      }).catch(() => {});

      // Create urgent task
      await db.counselorTask.create({
        data: {
          employeeId: routingContext.counselorId || 'COO',
          studentId: studentId || "",
          title: `${sentiment.isUrgent ? 'Urgent' : 'Complaint'}: ${fromName} - ${intent.intent}`,
          description: `Message: ${messageBody.slice(0, 200)}. Shared ${COO_NUMBER}.`,
          type: 'urgent_support',
          priority: 'urgent',
          status: 'pending',
          dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        },
      }).catch(() => {});

      // If urgent, AI reply should share COO number
      if (sentiment.isUrgent) {
        aiReplyText = lang.language === 'bangla'
          ? `জরুরি সহায়তার জন্য ধন্যবাদ। আমাদের 24/7 সাপোর্ট নম্বর: ${COO_NUMBER}। আমাদের COO টিম আপনাকে সহায়তা করবে। আপনার Student ID: ${studentId || 'N/A'}`
          : `Thank you for urgent request. Our 24/7 support number: ${COO_NUMBER}. Our COO team will assist you. Your Student ID: ${studentId || 'N/A'}`;
      }
    }

    // 15. Send AI reply if applicable and not handover
    let outboundApiResult: any = null;
    let outboundMessage: any = null;

    if (aiReplyText && !shouldHandover && !stopStart.optedOut) {
      try {
        outboundMessage = await db.socialInboxMessage.create({
          data: {
            platform: "WHATSAPP",
            direction: "OUTBOUND",
            senderName: "ALO AI",
            recipientId: from,
            messageText: aiReplyText,
            conversationId: `wa-${from}`,
            leadId: leadId || "",
            studentId: studentId || "",
            aiHandled: true,
            humanApproved: false,
            isRead: true,
            sentAt: new Date(),
          },
        }).catch(() => null);

        const sendResult = await sendOutboundViaApi(normalizedFrom || from, aiReplyText);
        outboundApiResult = sendResult;

        if (sendResult.messageId && outboundMessage) {
          await db.socialInboxMessage.update({
            where: { id: outboundMessage.id },
            data: { externalId: sendResult.messageId },
          }).catch(() => {});

          await db.whatsAppMessageStatus.create({
            data: {
              messageId: sendResult.messageId,
              socialMessageId: outboundMessage.id,
              recipientPhone: normalizedFrom || from,
              status: "SENT",
              providerPayload: JSON.stringify(sendResult.apiResponse),
            },
          }).catch(() => {});

          await db.whatsAppMessageArchive.create({
            data: {
              whatsappMessageId: sendResult.messageId,
              conversationId,
              threadId,
              studentId: studentId || "",
              leadId: leadId || "",
              senderPhone: receivingPhone || MAIN_NUMBER,
              receiverPhone: from,
              senderNumber: receivingPhone || MAIN_NUMBER,
              messageType: 'text',
              messageBody: aiReplyText,
              timestamp: new Date(),
              direction: 'outbound',
              deliveryStatus: 'sent',
              aiGenerated: true,
              rawEventId: webhookEvent?.id || "",
            },
          }).catch(() => {});
        }
      } catch (err: any) {
        outboundApiResult = { error: err.message };
      }
    } else if (shouldHandover) {
      // Handover: assign conversation, notify employee, preserve transcript
      try {
        await db.communicationThread.update({
          where: { id: threadId },
          data: { needsHumanTakeover: true, isAiHandled: false, assignedToId: routingContext.counselorId || "" },
        }).catch(() => {});

        await db.counselorTask.create({
          data: {
            employeeId: routingContext.counselorId || "",
            studentId: studentId || "",
            title: `AI Handover: ${handoverReason} - ${fromName}`,
            description: `AI transcript: User: ${messageBody.slice(0, 200)} | Intent: ${intent.intent} | Sentiment: ${sentiment.sentiment} | Reason: ${handoverReason}`,
            type: 'ai_handover',
            priority: sentiment.isHighRisk ? 'urgent' : 'high',
            status: 'pending',
            dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        }).catch(() => {});

        await db.notification.create({
          data: {
            studentId: studentId || "",
            title: `AI Handover: ${handoverReason}`,
            message: `Conversation ${conversationId} requires human. Reason: ${handoverReason}. Student: ${fromName}`,
            type: 'high',
          },
        }).catch(() => {});
      } catch {}
    }

    // 16. Audit log
    await db.aloAuditLog.create({
      data: {
        studentId: studentId || "",
        actorType: "system",
        actorName: "whatsapp-webhook",
        action: "WHATSAPP_MESSAGE_RECEIVED",
        resource: "WhatsAppMessageArchive",
        resourceId: providerMessageId,
        details: JSON.stringify({
          from,
          type,
          intent: intent.intent,
          sentiment: sentiment.sentiment,
          language: lang.language,
          isNewStudent,
          studentId,
          leadId,
          routing: routing.reason,
          shouldHandover,
          handoverReason,
          stopStart: stopStart.action,
        }),
      },
    }).catch(() => {});

    // Mark webhook as processed
    if (webhookEvent) {
      try {
        await db.webhookEvent.update({
          where: { id: webhookEvent.id },
          data: { processed: true, processedAt: new Date(), errorMessage: null },
        });
        await db.uccWebhookEvent.updateMany({
          where: { eventId: providerMessageId },
          data: { status: "processed" },
        }).catch(() => {});
      } catch {}
    }

    results.push({
      messageId: providerMessageId,
      from,
      type,
      studentId,
      leadId,
      isNewStudent,
      intent: intent.intent,
      sentiment: sentiment.sentiment,
      language: lang.language,
      routing: routing.reason,
      shouldHandover,
      aiReplySent: !!outboundApiResult?.messageId,
      webhookEventId: webhookEvent?.id,
    });
  }

  // Return quickly
  return NextResponse.json({
    success: true,
    processed: results.length,
    results,
  });
}

// GET — webhook verification per Meta spec
export async function GET(req: NextRequest) {
  const mode = req.nextUrl.searchParams.get("hub.mode");
  const token = req.nextUrl.searchParams.get("hub.verify_token");
  const challenge = req.nextUrl.searchParams.get("hub.challenge");

  // Support both WHATSAPP_VERIFY_TOKEN and WHATSAPP_APP_SECRET as verify token
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || process.env.WHATSAPP_APP_SECRET;

  if (mode === "subscribe" && token === verifyToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  // Also support direct challenge param for testing
  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Invalid verification" }, { status: 403 });
}
