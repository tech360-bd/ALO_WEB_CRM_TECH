// @ts-nocheck - Complex webhook with Prisma stub issues, requires generated-client verification in Node 22 CI
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { downloadWhatsAppInboundMedia } from "@/lib/whatsapp-inbound-media";
import { removePrivateFile, storePrivateFile } from "@/lib/storage/private-file-store";
import crypto from "crypto";
import { normalizeBdPhone, determineSenderNumber, MAIN_NUMBER, COO_NUMBER } from "@/lib/whatsapp-number-pool";
import { detectLanguage, detectIntent, detectSentiment, generateAiReply, logAiOperation, calculateLeadScore } from "@/lib/ai-whatsapp-engine";
import { handleIntakeMessage as handleStudentIntake } from "@/lib/ai-agents/student-intake-agent";
import { startSlaForThread, calculateSlaDueAt } from "@/lib/sla-engine";
import { handleStopStartCommand, createFollowUpScheduleForStudent } from "@/lib/whatsapp-followup-engine";
import { classifyIntent as classifyIntentCRM, detectPriority, normalizePhoneE164, extractMessageContent as extractMessageContentHandler } from "@/lib/whatsapp-webhook-handler";
import { deriveWebhookEventId, mapProviderStatus, shouldApplyStatus } from '@/lib/communications/webhook-idempotency';
import { createLeadWithReference } from '@/lib/lead-reference';
import { resolveContactIdentity, shouldAutoCreateLead } from '@/lib/communications/contact-identity';
// Consolidated 2026-09-14: handler provides CRM intent/priority + E.164 + comprehensive extractMessageContent (additional, not replacing local)
// Existing phone normalization, signature verification, routing and message processing stay in place; student IDs are generated only by the reviewed student-creation workflow.

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
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[whatsapp.webhook] WHATSAPP_APP_SECRET is required in production.');
      return false;
    }
    console.warn("[whatsapp.webhook] WHATSAPP_APP_SECRET not set — accepting unsigned requests only in non-production mode");
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

function classifyWhatsAppDocument(fileName: string): string {
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

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode') || '';
  const suppliedToken = url.searchParams.get('hub.verify_token') || '';
  const challenge = url.searchParams.get('hub.challenge') || '';
  const configuredToken = process.env.WHATSAPP_VERIFY_TOKEN || '';
  if (mode !== 'subscribe' || !configuredToken || !challenge || !safeEqual(suppliedToken, configuredToken)) {
    return new Response('Forbidden', { status: 403 });
  }
  return new Response(challenge, { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") || "";

  // 1. Validate payload & source
  const signatureValid = verifySignature(rawBody, signature);
  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature — webhook not verified" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // 2. Handle status updates
  const statuses: any[] = body?.entry?.[0]?.changes?.[0]?.value?.statuses || [];
  if (statuses.length > 0) {
    const updated: any[] = [];
    const skipped: any[] = [];
    for (const s of statuses) {
      const messageId = s.id;
      const recipientPhone = s.recipient_id || "";
      const errorMessage = s.errors?.[0]?.message || null;
      // Spec §173: 'accepted' is not 'delivered', and values Meta uses that are
      // not delivery states at all (e.g. 'warning') must not be recorded as one.
      const deliveryStatus = mapProviderStatus(s.status);
      if (!messageId || !deliveryStatus) {
        skipped.push({ messageId, providerStatus: s.status ?? null, reason: deliveryStatus ? 'missing_message_id' : 'not_a_delivery_status' });
        continue;
      }
      const status = deliveryStatus.toUpperCase();
      // Spec §171: a retried callback must not create a second row, and a stale
      // 'sent' arriving after 'read' must not walk the status backwards.
      const eventId = deriveWebhookEventId({ provider: 'whatsapp', messageId, status: deliveryStatus, eventType: 'status' }).eventId;
      try {
        const alreadyStored = await db.whatsAppMessageStatus.findFirst({
          where: { messageId, status },
          select: { id: true },
        });
        if (alreadyStored) {
          skipped.push({ messageId, status, reason: 'duplicate' });
          continue;
        }
        const latest = await db.whatsAppMessageStatus.findFirst({
          where: { messageId },
          orderBy: { createdAt: 'desc' },
          select: { status: true },
        });
        if (latest && !shouldApplyStatus(mapProviderStatus(latest.status), deliveryStatus)) {
          skipped.push({ messageId, status, reason: 'out_of_order' });
          continue;
        }
        const record = await db.whatsAppMessageStatus.create({
          data: { messageId, recipientPhone, status, errorMessage, providerPayload: JSON.stringify(s) },
        });
        // Also update archive
        await db.whatsAppMessageArchive.updateMany({
          where: { whatsappMessageId: messageId },
          data: { deliveryStatus: status, readStatus: status === 'read' ? 'read' : status === 'delivered' ? 'delivered' : 'sent' },
        }).catch(() => {});
        updated.push({ messageId, status, eventId, recordId: record.id });
      } catch (err: any) {
        updated.push({ messageId, status, error: err.message });
      }
    }
    const batchEventId = deriveWebhookEventId({
      provider: 'whatsapp',
      eventId: body?.entry?.[0]?.id,
      eventType: 'status_batch',
      // Deterministic fallback: the same batch hashes to the same id on retry.
      payload: statuses.map((s: any) => `${s?.id || ''}:${s?.status || ''}`).join('|') + rawBody.length,
    });
    const existingBatch = await db.webhookEvent.findFirst({ where: { eventId: batchEventId.eventId }, select: { id: true } }).catch(() => null);
    if (!existingBatch) {
      await db.webhookEvent.create({
        data: {
          provider: "WHATSAPP",
          eventId: batchEventId.eventId,
          eventType: "STATUS_UPDATE",
          payload: rawBody,
          signature,
          verified: signatureValid,
          processed: true,
          processedAt: new Date(),
        },
      }).catch(() => {});
      await db.uccWebhookEvent.create({
        data: { provider: "WHATSAPP", eventId: batchEventId.eventId, eventType: "STATUS_UPDATE", payload: rawBody, status: "processed" },
      }).catch(() => {});
    }
    return NextResponse.json({ success: true, routed: "status", processed: updated.length, skipped, statuses: updated });
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
        eventId: deriveWebhookEventId({
          provider: 'whatsapp',
          eventId: body?.entry?.[0]?.id,
          eventType: `empty-${body.object || 'unknown'}`,
          payload: rawBody,
        }).eventId,
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
    let mediaIngestionFailure = false;

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

    // Resolve a real Student row only; portal profile/contact IDs are not
    // trusted as Student primary keys until they are looked up explicitly.
    let existingStudent: any = null;
    try {
      existingStudent = await db.student.findFirst({ where: { phone: { in: [from, normalizedFrom] } } });
      if (!existingStudent && waContact?.studentId) {
        existingStudent = await db.student.findFirst({ where: { OR: [{ id: waContact.studentId }, { studentId: waContact.studentId }] } });
      }
      if (!existingStudent) {
        const portalUser = await db.portalUser.findFirst({ where: { phone: { in: [from, normalizedFrom] } }, select: { id: true } });
        if (portalUser) existingStudent = await db.student.findFirst({ where: { userId: portalUser.id } });
      }
      if (!existingStudent) {
        const profile = await db.portalStudentProfile.findFirst({ where: { altPhone: { in: [from, normalizedFrom] } }, select: { studentId: true, userId: true } });
        if (profile) existingStudent = await db.student.findFirst({ where: { OR: [{ id: profile.studentId }, { studentId: profile.studentId }, { userId: profile.userId }] } });
      }
    } catch (error) {
      console.error('[whatsapp.webhook] existing student match lookup failed:', error instanceof Error ? error.message : 'unknown');
    }

    let leadId: string | null = waContact?.leadId || null;
    let studentId: string | null = existingStudent?.id || null;

    // Search existing lead if no student, keeping the owner for UCC assignment.
    let existingLead: any = null;
    if (!studentId) {
      try {
        existingLead = await db.lead.findFirst({
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
    const assignedUserId = String(existingStudent?.counselorId || existingLead?.counselorId || '').trim();

    // 8. Handle STOP/START
    const stopStart = await handleStopStartCommand(from, messageBody).catch(() => ({ action: 'NONE' }));

    // 9. Unknown WhatsApp senders become leads/contacts only. Never create a
    // student from a phone number or an unverified inbound document: the intake
    // workflow must first match an existing student or obtain human confirmation.
    const isNewStudent = false;
    if (!studentId && !leadId) {
      try {
        const altCheck = await db.whatsAppContact.findFirst({
          where: { OR: [{ phone: from }, { normalizedPhone: normalizedFrom }] },
        });
        if (altCheck) {
          leadId = altCheck.leadId || null;
        } else {
          // ── §126 deduplication before creation ──────────────────────────────
          // The candidate list is everything the lookup above already found; the
          // identity policy decides whether a NEW record is justified. A contact
          // that only matches on a weak field (alternate phone, WhatsApp identity)
          // is flagged POSSIBLE EXISTING CONTACT and carries the review notice, so
          // an operator sees the duplicate risk instead of finding two leads later.
          const identity = resolveContactIdentity(
            { phone: from, whatsappNumber: waContact?.normalizedPhone || undefined, altPhone: undefined },
            [
              ...(existingStudent ? [{ kind: 'student' as const, id: existingStudent.id, name: existingStudent.name ?? null, phone: existingStudent.phone ?? null }] : []),
              ...(existingLead ? [{ kind: 'lead' as const, id: existingLead.id, reference: existingLead.leadId ?? null, name: existingLead.fullName ?? null, phone: existingLead.phone ?? null, altPhone: existingLead.altPhone ?? null }] : []),
              ...(waContact ? [{ kind: (waContact.leadId ? 'lead' : 'partner_contact') as const, id: waContact.id, name: waContact.displayName ?? null, whatsappNumber: waContact.normalizedPhone ?? null, matchedOn: 'whatsapp_identity' as const }] : []),
            ],
          );

          if (!shouldAutoCreateLead(identity)) {
            // Impossible here (no candidate means nothing matched), but the guard
            // makes the rule explicit rather than implied by control flow.
            results.push({ messageId: providerMessageId, identity: identity.confidence, skippedLeadCreation: true });
          } else {
          const newLead = await createLeadWithReference(db, {
            fullName: fromName || `WhatsApp ${from.slice(-4)}`,
            phone: from,
            source: "WHATSAPP",
            sourceDetail: `WhatsApp inbound - ${type}`,
            notes: [
              `Contact identity not yet matched. First WhatsApp message: "${messageBody.slice(0, 200)}"`,
              identity.notice ? `Identity review: ${identity.notice}` : '',
            ].filter(Boolean).join('\n'),
            status: "NEW",
            welcomeSent: false,
          }).catch((error) => {
            console.error('[whatsapp.webhook] lead creation failed:', error instanceof Error ? error.message : 'unknown');
            return null;
          });

          if (newLead) {
            leadId = newLead.id;
            await db.whatsAppContact.create({
              data: {
                phone: from,
                normalizedPhone: normalizedFrom,
                displayName: fromName || `WhatsApp ${from.slice(-4)}`,
                profileName: fromName,
                studentId: '',
                leadId: newLead.id,
                source: "WHATSAPP",
                firstContactAt: timestamp,
                lastContactAt: timestamp,
              },
            }).catch(() => {});
            await db.timelineEvent.create({
              data: {
                studentId: '',
                leadId: newLead.id,
                stage: "LEAD_CREATED",
                type: "LEAD_CREATED",
                title: identity.confidence === 'possible' ? "POSSIBLE EXISTING CONTACT — identity review required" : "WhatsApp contact requires identity match",
                description: [
                  `Lead recorded from WhatsApp inbound (${type}); no student profile was created.`,
                  identity.notice || '',
                ].filter(Boolean).join(' '),
              },
            }).catch(() => {});
          }
          }
        }
      } catch (err) {
        console.error("WhatsApp contact review record creation failed:", err);
      }
    } else if (waContact) {
      // Update existing contact lastContactAt
      await db.whatsAppContact.update({
        where: { id: waContact.id },
        data: { lastContactAt: new Date(), displayName: fromName || waContact.displayName, ...(studentId ? { studentId } : {}), ...(leadId ? { leadId } : {}) },
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
            assignedToId: assignedUserId,
            assignedToName: assignedUserId ? String(existingStudent?.counselorName || '') : '',
            status: "open",
            lastMessageAt: new Date(),
            lastMessagePreview: messageBody.slice(0, 100),
          },
        });
      } else {
        await db.communicationThread.update({
          where: { id: thread.id },
          data: { lastMessageAt: new Date(), lastMessagePreview: messageBody.slice(0, 100), status: "open", ...(thread.assignedToId ? {} : { assignedToId: assignedUserId, assignedToName: assignedUserId ? String(existingStudent?.counselorName || '') : '' }) },
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
            assignedToUserId: assignedUserId || undefined,
            assignedRole: assignedUserId ? 'COUNSELOR' : undefined,
            status: "open",
            lastMessageText: messageBody.slice(0, 200),
            lastMessageAt: new Date(),
            unreadCount: 1,
          },
        });
      } else {
        await db.uccConversation.update({
          where: { id: uccConv.id },
          data: { lastMessageText: messageBody.slice(0, 200), lastMessageAt: new Date(), unreadCount: { increment: 1 }, ...(!uccConv.assignedToUserId && assignedUserId ? { assignedToUserId: assignedUserId, assignedRole: 'COUNSELOR' } : {}) },
        }).catch(() => {});
      }

      const uccMessage = await db.uccMessage.create({
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
          metadata: JSON.stringify({ whatsappMessageId: providerMessageId, mediaId, ...extra, ...(mediaId ? { mediaIngestionStatus: 'PENDING' } : {}) }),
        },
      });

      // Inbound media is downloaded from Meta, MIME/signature/size/hash checked,
      // and written to private storage before any document/OCR record is created.
      // A media ID or caller-supplied URL alone is never treated as an upload.
      if (mediaId && ['image', 'document'].includes(type)) {
        const inboundName = String(extra?.filename || `${type}-${providerMessageId}`);
        const detectedDocumentType = classifyWhatsAppDocument(inboundName);
        let storedPath = '';
        try {
          const media = await downloadWhatsAppInboundMedia(mediaId, inboundName, String(extra?.mime || ''));
          const stored = await storePrivateFile(media.bytes, media.fileName);
          storedPath = stored.storagePath;
          try {
            await db.$transaction(async (tx) => {
              const attachment = await tx.uccAttachment.create({
                data: {
                  conversationId: uccConv.id,
                  messageId: uccMessage.id,
                  fileName: media.fileName,
                  fileType: detectedDocumentType.toLowerCase(),
                  mimeType: media.mimeType,
                  fileSize: stored.fileSize,
                  fileUrl: '',
                  detectedDocType: detectedDocumentType.toLowerCase(),
                  studentId: studentId || undefined,
                  ocrExtractedData: JSON.stringify({ storagePath: stored.storagePath, fileHash: stored.fileHash, originalName: media.fileName, source: 'WHATSAPP_CLOUD_API', providerMediaId: media.providerMediaId, providerSha256: media.providerSha256 }),
                },
              });
              const staffDownloadUrl = `/api/crm/ucc/documents/${attachment.id}/download`;
              await tx.uccAttachment.update({ where: { id: attachment.id }, data: { fileUrl: staffDownloadUrl } });

              let verifiedStudentId = '';
              if (studentId) {
                const matchedStudent = await tx.student.findUnique({ where: { id: studentId }, select: { id: true, status: true, suspended: true } }).catch(() => null);
                if (matchedStudent && !matchedStudent.suspended && matchedStudent.status.toLowerCase() === 'active') verifiedStudentId = matchedStudent.id;
              }
              let studentDocumentId = '';
              if (verifiedStudentId) {
                const existingDocument = await tx.studentDocument.findFirst({
                  where: { studentId: verifiedStudentId, fileHash: stored.fileHash, isArchived: false },
                  select: { id: true },
                });
                if (existingDocument) {
                  studentDocumentId = existingDocument.id;
                } else {
                  const studentDocument = await tx.studentDocument.create({
                    data: {
                      studentId: verifiedStudentId,
                      category: detectedDocumentType,
                      fileName: media.fileName,
                      fileUrl: '',
                      storagePath: stored.storagePath,
                      mimeType: media.mimeType,
                      fileHash: stored.fileHash,
                      fileSize: stored.fileSize,
                      status: 'pending_review',
                    },
                  });
                  studentDocumentId = studentDocument.id;
                  await tx.studentDocument.update({ where: { id: studentDocument.id }, data: { fileUrl: `/api/student/documents/${studentDocument.id}/download` } });
                  await tx.documentVersion.create({
                    data: { documentId: studentDocument.id, version: 1, filePath: stored.storagePath, fileSize: stored.fileSize, fileType: media.mimeType, uploadedBy: 'whatsapp-cloud-api', reviewStatus: 'PENDING', isLatest: true },
                  });
                  await tx.documentAudit.create({
                    data: { documentId: studentDocument.id, studentId: verifiedStudentId, actorId: 'whatsapp-cloud-api', actorName: 'WhatsApp Cloud API', actorRole: 'WHATSAPP_WEBHOOK', action: 'upload', newStatus: 'pending_review', note: 'Actual private file bytes received from WhatsApp; OCR queued and human verification required.' },
                  });
                }
              }
              const existingOcrJob = await tx.ocrJob.findFirst({ where: { attachmentId: attachment.id }, select: { id: true } });
              if (!existingOcrJob) {
                await tx.ocrJob.create({
                  data: {
                    documentId: studentDocumentId || attachment.id,
                    documentType: detectedDocumentType,
                    fileUrl: staffDownloadUrl,
                    fileName: media.fileName,
                    mimeType: media.mimeType,
                    fileHash: stored.fileHash,
                    status: 'queued',
                    studentId: verifiedStudentId || undefined,
                    conversationId: uccConv.id,
                    attachmentId: attachment.id,
                  },
                });
              }
              const currentMetadata = (() => { try { return JSON.parse(uccMessage.metadata || '{}'); } catch { return {}; } })();
              await tx.uccMessage.update({ where: { id: uccMessage.id }, data: { metadata: JSON.stringify({ ...currentMetadata, mediaIngestionStatus: 'STORED', attachmentId: attachment.id, studentDocumentId: studentDocumentId || null, fileHash: stored.fileHash }) } });
            });
          } catch (databaseError) {
            await removePrivateFile(stored.storagePath).catch(() => {});
            throw databaseError;
          }
        } catch (mediaError) {
          mediaIngestionFailure = true;
          const safeError = mediaError instanceof Error ? mediaError.message.slice(0, 120) : 'MEDIA_INGESTION_FAILED';
          console.error('[whatsapp.webhook] inbound media could not be stored', safeError);
          const currentMetadata = (() => { try { return JSON.parse(uccMessage.metadata || '{}'); } catch { return {}; } })();
          await db.uccMessage.update({ where: { id: uccMessage.id }, data: { metadata: JSON.stringify({ ...currentMetadata, mediaIngestionStatus: 'FAILED', mediaIngestionError: safeError }) } }).catch(() => {});
          if (storedPath) await removePrivateFile(storedPath).catch(() => {});
        }
      }
    } catch (err) {
      if (mediaId && ['image', 'document'].includes(type)) mediaIngestionFailure = true;
      console.error("UCC save error:", err);
    }

    // 11. AI processing — unified Student Intake Agent (ID-first) for whatsapp + fallback
    const lang = detectLanguage(messageBody);
    const intent = detectIntent(messageBody);
    const sentiment = detectSentiment(messageBody);

    let aiReplyText = "";
    let shouldHandover = false;
    let handoverReason = "";

    // Unified intake agent: first asks Student ID, then informs independent application, then counseling (BN/EN, doc/voice, memory, office-hours human-like, sequential)
    // Respect STOP opt-out; still allow media (image/doc/audio) to be routed via intake
    const shouldAiHandle = !stopStart.optedOut && ((type === 'text' && messageBody.length > 0) || ['image','document','audio','video'].includes(type));
    if (mediaIngestionFailure && !stopStart.optedOut) {
      aiReplyText = 'We could not securely store your attachment. Please resend it as a PDF or clear image, or contact your ALO counsellor. The file has not been added to your student record.';
      shouldHandover = true;
      handoverReason = 'whatsapp_media_ingestion_failed';
    } else if (shouldAiHandle) {
      try {
        const intake = await handleStudentIntake({
          channel: 'whatsapp',
          senderId: normalizedFrom || from,
          text: messageBody,
          mediaType: (['image','document','audio','video'].includes(type) ? (type === 'audio' ? 'voice' : type) : null) as any,
          mediaInfo: { fileName: (extra as any)?.filename || (type === 'image' ? 'image' : undefined), mime: (extra as any)?.mime, mediaId: mediaId || undefined },
        });
        if (intake?.reply) {
          aiReplyText = intake.reply;
          // Keep intent/sentiment logging even when intake handled
          await logAiOperation({
            threadId: threadId || conversationId,
            messageId: providerMessageId,
            studentId: (intake.studentDbId as string) || studentId || "",
            intent: intent.intent,
            intentConfidence: intent.confidence,
            sentiment: sentiment.sentiment,
            sentimentConfidence: sentiment.confidence,
            language: lang.language,
            shouldHandover: false,
            handoverReason: `intake:${intake.context.state}`,
          }).catch(() => {});
        } else {
          // Fallback to legacy engine if intake empty
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
        }
      } catch {
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
      }
      // Lead scoring (always)
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
