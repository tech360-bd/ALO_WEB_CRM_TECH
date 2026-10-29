// @ts-nocheck - Complex webhook with Prisma stub issues, requires generated-client verification in Node 22 CI
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { downloadWhatsAppInboundMedia } from "@/lib/whatsapp-inbound-media";
import { removePrivateFile, storePrivateFile } from "@/lib/storage/private-file-store";
import crypto from "crypto";
import { determineSenderNumber, MAIN_NUMBER } from "@/lib/whatsapp-number-pool";
import { detectLanguage, detectIntent, detectSentiment, logAiOperation, calculateLeadScore } from "@/lib/ai-whatsapp-engine";
import { handleIntakeMessage as handleStudentIntake } from "@/lib/ai-agents/student-intake-agent";
import { startSlaForThread, calculateSlaDueAt } from "@/lib/sla-engine";
import { handleStopStartCommand } from "@/lib/whatsapp-followup-engine";
import { persistWhatsAppStatus, sendWhatsAppMessage } from '@/lib/whatsapp-cloud-api';
import { handleAfterHoursMessage } from "@/lib/communication/after-hours";
import { classifyIntent as classifyIntentCRM, detectPriority, normalizePhoneE164, extractMessageContent as extractMessageContentHandler } from "@/lib/whatsapp-webhook-handler";
import { deriveWebhookEventId, mapProviderStatus, shouldApplyStatus } from '@/lib/communications/webhook-idempotency';
import { claimWebhookEvent, completeWebhookEvent } from '@/lib/communications/webhook-event-claim';
import { normalizePhone, phoneMatchConditions } from '@/lib/phone-normalization';
import { autoAssignCounselor } from '@/lib/crm-automation';
import { createLeadWithReference } from '@/lib/lead-reference';
import { resolveContactIdentity, shouldAutoCreateLead, type ContactCandidate } from '@/lib/communications/contact-identity';
// Consolidated 2026-09-14: handler provides CRM intent/priority + E.164 + comprehensive extractMessageContent (additional, not replacing local)
// Existing phone normalization, signature verification, routing and message processing stay in place; student IDs are generated only by the reviewed student-creation workflow.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const declaredLength = Number(req.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > 2_000_000) {
    return NextResponse.json({ error: 'Webhook payload exceeds the allowed size.' }, { status: 413 });
  }
  const rawBody = await req.text();
  if (Buffer.byteLength(rawBody, 'utf8') > 2_000_000) {
    return NextResponse.json({ error: 'Webhook payload exceeds the allowed size.' }, { status: 413 });
  }
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
      const status = deliveryStatus;
      const eventId = deriveWebhookEventId({ provider: 'whatsapp', messageId, status: deliveryStatus, eventType: 'status' }).eventId;
      try {
        const latest = await db.whatsAppMessageStatus.findUnique({
          where: { messageId },
          select: { id: true, status: true, statusTimestamp: true },
        });
        const providerTimestamp = Number(s.timestamp);
        const eventTimestamp = Number.isFinite(providerTimestamp) && providerTimestamp > 0
          ? new Date(providerTimestamp * 1000)
          : new Date();
        if (latest) {
          const prior = mapProviderStatus(latest.status);
          if (!shouldApplyStatus(prior, deliveryStatus)
            || (prior === deliveryStatus && eventTimestamp < latest.statusTimestamp)) {
            skipped.push({ messageId, status, reason: 'duplicate_or_out_of_order' });
            continue;
          }
        }

        const persisted = await persistWhatsAppStatus(messageId, deliveryStatus, recipientPhone, {
          providerTimestamp,
          providerError: errorMessage || '',
          providerStatus: s.status,
          providerPayload: s,
        });
        if (!persisted) throw new Error('WHATSAPP_STATUS_PERSIST_FAILED');

        const archiveStatus = deliveryStatus === 'accepted' ? 'sent' : deliveryStatus;
        await db.whatsAppMessageArchive.updateMany({
          where: { whatsappMessageId: messageId },
          data: {
            deliveryStatus: archiveStatus,
            readStatus: deliveryStatus === 'read' ? 'read'
              : deliveryStatus === 'delivered' ? 'delivered'
              : deliveryStatus === 'failed' ? 'failed'
              : 'sent',
          },
        }).catch(() => {});

        await db.communicationMessage.updateMany({
          where: { direction: 'outbound', channel: 'whatsapp', OR: [{ communicationCode: messageId }, { content: messageId }] },
          data: { deliveryStatus: archiveStatus },
        }).catch(() => {});

        const uccCandidates = await db.uccMessage.findMany({
          where: { direction: 'outbound', channel: 'whatsapp', metadata: { contains: messageId } },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, metadata: true },
        }).catch(() => []);
        const uccMessage = uccCandidates.find((candidate) => {
          try { return JSON.parse(candidate.metadata || '{}')?.providerMessageId === messageId; }
          catch { return false; }
        });
        if (uccMessage) {
          let metadata: Record<string, unknown> = {};
          try {
            const parsed = JSON.parse(uccMessage.metadata || '{}');
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) metadata = parsed;
          } catch {}
          await db.uccMessage.update({
            where: { id: uccMessage.id },
            data: {
              status: deliveryStatus,
              metadata: JSON.stringify({ ...metadata, deliveryStatus, providerStatusAt: eventTimestamp.toISOString(), ...(errorMessage ? { providerError: String(errorMessage).slice(0, 500) } : {}) }),
            },
          }).catch(() => {});
        }
        const record = await db.whatsAppMessageStatus.findUnique({ where: { messageId }, select: { id: true } });
        updated.push({ messageId, status, eventId, recordId: record?.id || null });
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
    const providerMessageId = typeof msg.id === 'string' ? msg.id : '';
    if (!providerMessageId) {
      results.push({ messageId: null, skipped: true, reason: 'missing_provider_message_id' });
      continue;
    }
    const eventClaim = await claimWebhookEvent({
      provider: 'WHATSAPP',
      eventId: providerMessageId,
      eventType: `MESSAGE_${String(msg.type || 'text').toUpperCase()}`,
      payload: rawBody,
      signature,
      verified: signatureValid,
    });
    if (!eventClaim.claimed) {
      results.push({ messageId: providerMessageId, idempotent: true, reason: eventClaim.reason });
      continue;
    }
    const webhookEvent = { id: eventClaim.id };
    const from = msg.from;
    const providerSeconds = Number(msg.timestamp);
    const timestamp = Number.isFinite(providerSeconds) && providerSeconds > 0 && providerSeconds < 8_640_000_000
      ? new Date(providerSeconds * 1000)
      : new Date();
    const { type, body: messageBody, mediaId, extra } = extractMessageContent(msg);
    const fromName = contact?.profile?.name || from;
    let mediaIngestionFailure = false;

    // 4. Detect duplicates — check WhatsAppMessageArchive by whatsappMessageId
    try {
      const existingArchive = await db.whatsAppMessageArchive.findUnique({
        where: { whatsappMessageId: providerMessageId },
      });
      if (existingArchive) {
        await completeWebhookEvent(eventClaim);
        results.push({ messageId: providerMessageId, idempotent: true, duplicate: true });
        continue; // Skip duplicate
      }
    } catch {}

    // 5. Save raw event safely
    await db.uccWebhookEvent.create({
      data: {
        provider: "WHATSAPP",
        eventId: providerMessageId,
        eventType: `MESSAGE_${type.toUpperCase()}`,
        payload: JSON.stringify(msg),
        status: "pending",
      },
    }).catch(() => {});

    // 7. Normalize the sender and upsert the existing WhatsAppContact model as
    // the shared phone registry. An inbound message records identity only; it
    // never creates marketing consent.
    const normalizedFrom = normalizePhone(from);
    if (!normalizedFrom) {
      await completeWebhookEvent(eventClaim);
      results.push({ messageId: providerMessageId, skipped: true, reason: 'invalid_sender_phone' });
      continue;
    }
    const incomingDisplayName = String(fromName || '').trim().slice(0, 120);
    let waContact = await db.whatsAppContact.upsert({
      where: { normalizedPhone: normalizedFrom },
      create: {
        phone: from,
        normalizedPhone: normalizedFrom,
        externalContactId: String(contact?.wa_id || from).slice(0, 191),
        displayName: incomingDisplayName || `WhatsApp ${normalizedFrom.slice(-4)}`,
        profileName: incomingDisplayName,
        firstContactAt: timestamp,
        lastContactAt: timestamp,
        source: 'WHATSAPP',
      },
      update: {
        lastContactAt: timestamp,
        ...(incomingDisplayName ? { displayName: incomingDisplayName, profileName: incomingDisplayName } : {}),
        ...(contact?.wa_id ? { externalContactId: String(contact.wa_id).slice(0, 191) } : {}),
      },
    });

    const studentPhoneWhere = phoneMatchConditions(from, ['phone']);
    const leadPhoneWhere = phoneMatchConditions(from, ['phone', 'altPhone']);
    const phoneVariants = phoneMatchConditions(from, ['phone'])?.OR.map((condition) => condition.phone) || [];
    const [studentMatches, leadMatches, partnerMatches] = await Promise.all([
      studentPhoneWhere
        ? db.student.findMany({
            where: studentPhoneWhere,
            select: { id: true, studentId: true, name: true, phone: true, email: true, counselorId: true, counselorName: true },
            take: 50,
          })
        : Promise.resolve([]),
      leadPhoneWhere
        ? db.lead.findMany({
            where: leadPhoneWhere,
            select: { id: true, leadId: true, fullName: true, phone: true, altPhone: true, email: true, counselorId: true, branch: true },
            take: 50,
          })
        : Promise.resolve([]),
      phoneVariants.length
        ? db.b2BContact.findMany({
            where: { phone: { in: phoneVariants } },
            select: { id: true, name: true, phone: true, email: true, organization: true },
            take: 50,
          }).catch(() => [])
        : Promise.resolve([]),
    ]);

    const candidatesByKey = new Map<string, ContactCandidate>();
    const addCandidate = (candidate: ContactCandidate) => {
      candidatesByKey.set(`${candidate.kind}:${candidate.id}`, candidate);
    };
    for (const student of studentMatches) addCandidate({
      kind: 'student', id: student.id, reference: student.studentId, name: student.name, phone: student.phone, email: student.email,
    });
    for (const lead of leadMatches) addCandidate({
      kind: 'lead', id: lead.id, reference: lead.leadId, name: lead.fullName, phone: lead.phone, altPhone: lead.altPhone, email: lead.email,
    });

    // Honor historical registry links, but only as weak candidates: if the
    // linked CRM record's phone no longer matches, a human must review it.
    if (waContact.studentId) {
      const linkedStudent = await db.student.findFirst({
        where: { OR: [{ id: waContact.studentId }, { studentId: waContact.studentId }] },
        select: { id: true, studentId: true, name: true, phone: true, email: true, counselorId: true, counselorName: true },
      }).catch(() => null);
      if (linkedStudent) addCandidate({
        kind: 'student', id: linkedStudent.id, reference: linkedStudent.studentId, name: linkedStudent.name,
        phone: linkedStudent.phone, email: linkedStudent.email, matchedOn: 'student_reference',
      });
    }
    if (waContact.leadId) {
      const linkedLead = await db.lead.findFirst({
        where: { OR: [{ id: waContact.leadId }, { leadId: waContact.leadId }] },
        select: { id: true, leadId: true, fullName: true, phone: true, altPhone: true, email: true, counselorId: true, branch: true },
      }).catch(() => null);
      if (linkedLead) addCandidate({
        kind: 'lead', id: linkedLead.id, reference: linkedLead.leadId, name: linkedLead.fullName,
        phone: linkedLead.phone, altPhone: linkedLead.altPhone, email: linkedLead.email, matchedOn: 'lead_reference',
      });
    }

    const identity = resolveContactIdentity(
      { phone: from, whatsappNumber: waContact.normalizedPhone || normalizedFrom },
      [...candidatesByKey.values()],
    );
    const uniqueExactCrmMatch = identity.confidence === 'exact'
      && identity.candidates.length === 1
      && (identity.candidates[0].kind === 'student' || identity.candidates[0].kind === 'lead');
    const selectedIdentity = uniqueExactCrmMatch ? identity.candidates[0] : null;
    let existingStudent: any = selectedIdentity?.kind === 'student'
      ? studentMatches.find((student) => student.id === selectedIdentity.id) || await db.student.findUnique({ where: { id: selectedIdentity.id } }).catch(() => null)
      : null;
    let existingLead: any = selectedIdentity?.kind === 'lead'
      ? leadMatches.find((lead) => lead.id === selectedIdentity.id) || await db.lead.findUnique({ where: { id: selectedIdentity.id } }).catch(() => null)
      : null;
    let studentId: string | null = existingStudent?.id || null;
    let leadId: string | null = existingLead?.id || null;
    let identityReviewId = '';
    const hasPartnerIdentity = Boolean(waContact.partnerId) || partnerMatches.length > 0
      || identity.candidates.some((candidate) => candidate.kind === 'partner_contact');

    // Exact competing matches and weak/reference-only matches are never
    // silently selected. Keep the WhatsApp contact unlinked until an authorized
    // reviewer resolves the candidates from the command center.
    const identityNeedsReview = identity.candidates.length > 1
      || (identity.candidates.length > 0 && !uniqueExactCrmMatch);
    if (identityNeedsReview) {
      const pendingReview = await db.contactMatchReview.findFirst({
        where: { normalizedPhone: normalizedFrom, incomingEmail: null, conversationId: '', status: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      const review = pendingReview || await db.contactMatchReview.create({
        data: {
          incomingPhone: from,
          normalizedPhone: normalizedFrom,
          incomingName: incomingDisplayName || null,
          conversationId: '',
          matchedStudentId: identity.candidates.find((candidate) => candidate.kind === 'student')?.id || null,
          matchedLeadId: identity.candidates.find((candidate) => candidate.kind === 'lead')?.id || null,
          matchedPartnerId: identity.candidates.find((candidate) => candidate.kind === 'partner_contact')?.id || null,
          matchConfidence: identity.confidence === 'exact' ? 100 : identity.confidence === 'possible' ? 60 : 0,
          matchReason: JSON.stringify({
            matchedOn: identity.matchedOn,
            ambiguity: identity.candidates.length > 1,
            candidateIds: identity.candidates.map((candidate) => ({ kind: candidate.kind, id: candidate.id })),
          }).slice(0, 1000),
          status: 'PENDING',
        },
        select: { id: true },
      });
      identityReviewId = review.id;
    }

    // Explicit STOP/START is processed before any lead creation. STOP is an
    // opt-out; START is only renewed consent evidence. Neither command creates
    // a Student or an unsolicited lead.
    const stopStart = await handleStopStartCommand(from, messageBody, providerMessageId).catch(() => ({ action: 'NONE' as const }));
    let isNewStudent = false;
    let assignedUserId = String(existingStudent?.counselorId || existingLead?.counselorId || waContact.assignedCounselorId || '').trim();

    if (selectedIdentity) {
      const branch = existingLead?.branch || '';
      await db.whatsAppContact.update({
        where: { id: waContact.id },
        data: {
          ...(studentId ? { studentId } : {}),
          ...(leadId ? { leadId } : {}),
          assignedCounselorId: assignedUserId,
          ...(branch ? { branch } : {}),
          lastContactAt: timestamp,
        },
      }).catch(() => {});
    } else if (
      shouldAutoCreateLead(identity)
      && !hasPartnerIdentity
      && stopStart.action === 'NONE'
    ) {
      // Resolve an explicitly configured employee/branch inbox before choosing
      // an owner. No sender-number ownership or provider connection is inferred
      // from the incoming display number alone.
      const receivingNormalized = normalizePhone(receivingPhone);
      const numberConfig = await db.whatsAppOfficialNumber.findFirst({
        where: { OR: [
          ...(phoneNumberId ? [{ metaPhoneNumberId: phoneNumberId }] : []),
          ...(receivingNormalized ? [{ normalizedPhone: receivingNormalized }] : []),
        ] },
        select: { ownerType: true, employeeOwnerId: true, branch: true },
      }).catch(() => null);
      const ownerEmployee = numberConfig?.ownerType.toUpperCase() === 'EMPLOYEE' && numberConfig.employeeOwnerId
        ? await db.employee.findFirst({
            where: { OR: [
              { id: numberConfig.employeeOwnerId },
              { userId: numberConfig.employeeOwnerId },
              { employeeId: numberConfig.employeeOwnerId },
            ], status: 'active' },
            select: { userId: true, name: true, branch: true, role: true },
          }).catch(() => null)
        : null;
      const ownerRole = String(ownerEmployee?.role || '').toLowerCase();
      const directOwnerId = ownerEmployee && ownerRole.includes('counselor') ? ownerEmployee.userId : '';
      const assignedBranch = String(numberConfig?.branch || ownerEmployee?.branch || '').trim();

      const createdLead = await db.$transaction(async (tx) => {
        const currentContact = await tx.whatsAppContact.findUnique({ where: { id: waContact.id } });
        if (!currentContact) throw new Error('WHATSAPP_CONTACT_REGISTRY_MISSING');
        if (currentContact.studentId || currentContact.leadId || currentContact.partnerId) {
          return { created: false as const, studentId: currentContact.studentId, leadId: currentContact.leadId, partnerId: currentContact.partnerId };
        }
        const claim = await tx.whatsAppContact.updateMany({
          where: { id: currentContact.id, studentId: '', leadId: '', partnerId: '' },
          data: { leadId: `__pending__${providerMessageId}` },
        });
        if (claim.count !== 1) return { created: false as const, studentId: '', leadId: '', partnerId: '' };

        const lead = await createLeadWithReference<{ id: string; counselorId: string | null }>(tx, {
          fullName: incomingDisplayName || `WhatsApp ${normalizedFrom.slice(-4)}`,
          phone: from,
          source: 'WHATSAPP',
          sourceDetail: `WhatsApp inbound - ${type}`,
          notes: `Inbound identity has no exact Student, Lead, or partner-contact match. First message: ${messageBody.slice(0, 300)}`,
          status: 'NEW',
          welcomeSent: false,
          counselorId: directOwnerId || null,
          branch: assignedBranch || null,
          assignedReason: directOwnerId ? `Inbound WhatsApp number owner ${ownerEmployee?.name || directOwnerId}` : null,
        });
        let finalLead = lead;
        if (!directOwnerId && !assignedBranch) {
          await autoAssignCounselor(lead.id, tx).catch(() => null);
          finalLead = await tx.lead.findUnique({ where: { id: lead.id }, select: { id: true, counselorId: true } }) || lead;
        }
        await tx.whatsAppContact.update({
          where: { id: currentContact.id },
          data: {
            leadId: lead.id,
            assignedCounselorId: finalLead.counselorId || '',
            branch: assignedBranch,
            displayName: incomingDisplayName || undefined,
            lastContactAt: timestamp,
          },
        });
        await tx.timelineEvent.create({
          data: {
            studentId: '',
            leadId: lead.id,
            stage: 'LEAD_CREATED',
            type: 'LEAD_CREATED',
            title: 'Inbound WhatsApp lead created',
            description: assignedBranch && !finalLead.counselorId
              ? `New WhatsApp lead is queued for branch ${assignedBranch}; no cross-branch counselor was selected.`
              : 'Lead created after exact cross-channel identity search; no Student record was created.',
          },
        }).catch(() => {});
        return { created: true as const, studentId: '', leadId: lead.id, partnerId: '', counselorId: finalLead.counselorId || '', branch: assignedBranch };
      });

      if (createdLead.created) {
        leadId = createdLead.leadId;
        existingLead = leadId ? await db.lead.findUnique({ where: { id: leadId } }).catch(() => null) : null;
        assignedUserId = createdLead.counselorId || '';
        waContact = await db.whatsAppContact.findUnique({ where: { id: waContact.id } }) || waContact;
      } else if (createdLead.studentId || createdLead.leadId) {
        const linkedStudentId = String(createdLead.studentId || '');
        const linkedLeadId = String(createdLead.leadId || '');
        if (linkedStudentId && !linkedStudentId.startsWith('__pending__')) {
          existingStudent = await db.student.findFirst({ where: { OR: [{ id: linkedStudentId }, { studentId: linkedStudentId }] } }).catch(() => null);
          studentId = existingStudent?.id || null;
        }
        if (linkedLeadId && !linkedLeadId.startsWith('__pending__')) {
          existingLead = await db.lead.findFirst({ where: { OR: [{ id: linkedLeadId }, { leadId: linkedLeadId }] } }).catch(() => null);
          leadId = existingLead?.id || null;
        }
        assignedUserId = String(existingStudent?.counselorId || existingLead?.counselorId || '').trim();
      }
    }
    // 10. Save normalized message to permanent archive
    let conversationId = `wa-${normalizedFrom}`;
    let threadId = "";

    // Find or create CommunicationThread
    try {
      let thread = await db.communicationThread.findFirst({
        // A thread is keyed by this normalized channel identity. A student may
        // have several contact methods, so matching by studentId alone could
        // attach a different phone's conversation to the wrong person.
        where: { threadCode: conversationId, channel: 'whatsapp' },
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

    let legacyCommunicationMessage: any = null;
    if (threadId) {
      legacyCommunicationMessage = await db.communicationMessage.create({
        data: {
          threadId,
          communicationCode: providerMessageId,
          channel: 'whatsapp',
          direction: 'inbound',
          source: 'whatsapp_webhook',
          senderUserId: '',
          senderName: fromName,
          senderContact: from,
          recipientContact: receivingPhone || '',
          leadId: leadId || '',
          studentId: studentId || '',
          messageSubject: '',
          messageBody,
          content: providerMessageId,
          type,
          messageType: type,
          status: 'unread',
          deliveryStatus: 'delivered',
          isRead: false,
          senderType: studentId ? 'student' : leadId ? 'lead' : 'lead',
          senderId: studentId || leadId || '',
          createdBy: 'whatsapp-webhook',
        },
      }).catch((error) => {
        console.error('[whatsapp.webhook] legacy communication message persistence failed', error instanceof Error ? error.message : 'unknown');
        return null;
      });
    }

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
          receiverPhone: receivingPhone || '',
          senderNumber: receivingPhone || '',
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
          conversationId: `wa-${normalizedFrom}`,
          leadId: leadId || "",
          studentId: studentId || "",
          aiHandled: false,
          isRead: false,
        },
      });
    } catch {}

    // Save to UccMessage
    let uccConversationId = '';
    try {
      let uccConv = await db.uccConversation.findFirst({
        where: { channel: 'whatsapp', participantPhone: normalizedFrom },
        orderBy: { lastMessageAt: 'desc' },
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
        const identityConflict = Boolean(
          (uccConv.studentId && studentId && uccConv.studentId !== studentId)
          || (uccConv.leadId && leadId && uccConv.leadId !== leadId)
          || (uccConv.studentId && leadId)
          || (uccConv.leadId && studentId)
        );
        if (identityConflict && !identityReviewId) {
          const review = await db.contactMatchReview.create({
            data: {
              incomingPhone: from,
              normalizedPhone: normalizedFrom,
              incomingName: incomingDisplayName || null,
              conversationId: uccConv.id,
              matchedStudentId: studentId,
              matchedLeadId: leadId,
              matchConfidence: 100,
              matchReason: JSON.stringify({ identityConflict: true, currentStudentId: uccConv.studentId, currentLeadId: uccConv.leadId, candidateIds: identity.candidates.map((candidate) => ({ kind: candidate.kind, id: candidate.id })) }).slice(0, 1000),
              status: 'PENDING',
            },
            select: { id: true },
          }).catch(() => null);
          identityReviewId = review?.id || '';
        }
        const canAttachIdentity = !identityConflict;
        await db.uccConversation.updateMany({
          where: { id: uccConv.id, studentId: uccConv.studentId, leadId: uccConv.leadId },
          data: {
            lastMessageText: messageBody.slice(0, 200),
            lastMessageAt: new Date(),
            unreadCount: { increment: 1 },
            ...(!uccConv.assignedToUserId && assignedUserId ? { assignedToUserId: assignedUserId, assignedRole: 'COUNSELOR' } : {}),
            ...(canAttachIdentity && studentId && !uccConv.studentId ? { studentId } : {}),
            ...(canAttachIdentity && leadId && !uccConv.leadId ? { leadId } : {}),
          },
        }).catch(() => {});
      }
      uccConversationId = uccConv.id;
      if (identityReviewId) {
        await db.contactMatchReview.updateMany({
          where: { id: identityReviewId, status: 'PENDING' },
          data: { conversationId: uccConv.id },
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
      if (mediaId && ['image', 'document', 'audio', 'video'].includes(type)) {
        const inboundName = String(extra?.filename || `${type}-${providerMessageId}`);
        const detectedDocumentType = classifyWhatsAppDocument(inboundName);
        let storedPath = '';
        try {
          const media = await downloadWhatsAppInboundMedia(mediaId, inboundName, String(extra?.mime || ''));
          const stored = await storePrivateFile(media.bytes, media.fileName);
          storedPath = stored.storagePath;
          try {
            await db.$transaction(async (tx) => {
              let verifiedStudentId = '';
              if (studentId) {
                const matchedStudent = await tx.student.findUnique({ where: { id: studentId }, select: { id: true, status: true, suspended: true } }).catch(() => null);
                if (matchedStudent && !matchedStudent.suspended && matchedStudent.status.toLowerCase() === 'active') verifiedStudentId = matchedStudent.id;
              }
              const documentMedia = type === 'image' || type === 'document';
              const attachment = await tx.uccAttachment.create({
                data: {
                  conversationId: uccConv.id,
                  messageId: uccMessage.id,
                  fileName: media.fileName,
                  fileType: documentMedia ? detectedDocumentType.toLowerCase() : type,
                  mimeType: media.mimeType,
                  fileSize: stored.fileSize,
                  fileUrl: '',
                  detectedDocType: documentMedia ? detectedDocumentType.toLowerCase() : null,
                  studentId: verifiedStudentId || undefined,
                  ocrExtractedData: JSON.stringify({ storagePath: stored.storagePath, fileHash: stored.fileHash, originalName: media.fileName, source: 'WHATSAPP_CLOUD_API', providerMediaId: media.providerMediaId, providerSha256: media.providerSha256 }),
                },
              });
              const staffDownloadUrl = `/api/crm/ucc/documents/${attachment.id}/download`;
              await tx.uccAttachment.update({ where: { id: attachment.id }, data: { fileUrl: staffDownloadUrl } });

              let studentDocumentId = '';
              if (documentMedia && verifiedStudentId) {
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
              if (documentMedia) {
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
              }
              if (legacyCommunicationMessage?.id && threadId) {
                await tx.communicationAttachment.create({
                  data: {
                    messageId: legacyCommunicationMessage.id,
                    threadId,
                    studentId: verifiedStudentId || undefined,
                    channel: 'whatsapp',
                    direction: 'inbound',
                    providerFileId: media.providerMediaId,
                    fileName: media.fileName,
                    fileType: documentMedia ? detectedDocumentType.toLowerCase() : type,
                    fileSizeBytes: stored.fileSize,
                    matchReviewRequired: !verifiedStudentId || !documentMedia,
                    whatsappMsgRef: providerMessageId,
                    documentId: studentDocumentId,
                    senderContact: from,
                    recipientContact: receivingPhone || '',
                    deliveryStatus: 'delivered',
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
      if (mediaId && ['image', 'document', 'audio', 'video'].includes(type)) mediaIngestionFailure = true;
      console.error("UCC save error:", err);
    }

    // 11. AI processing — unified Student Intake Agent (ID-first) for whatsapp + fallback
    const lang = detectLanguage(messageBody);
    const intent = detectIntent(messageBody);
    const sentiment = detectSentiment(messageBody);

    let aiReplyText = "";
    let afterHoursAutoReply: string | null = null;
    let shouldHandover = false;
    let handoverReason = "";

    // Public intake may create a safe reply draft. It is never sent automatically;
    // only the configured, pre-approved after-hours acknowledgement may be sent.
    // Respect STOP opt-out; still allow media (image/doc/audio) to be routed via intake
    const shouldAiHandle = stopStart.action === 'NONE' && ((type === 'text' && messageBody.length > 0) || ['image','document','audio','video'].includes(type));
    if (mediaIngestionFailure && !stopStart.optedOut) {
      aiReplyText = 'We could not securely store your attachment. Please resend it as a PDF or clear image, or contact your ALO counsellor. The file has not been added to your student record.';
      if (inboundMessage?.id) {
        await db.socialInboxMessage.update({ where: { id: inboundMessage.id }, data: { aiDraftReply: aiReplyText, aiHandled: true, humanApproved: false } }).catch(() => {});
      }
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
          if (inboundMessage?.id) {
            await db.socialInboxMessage.update({
              where: { id: inboundMessage.id },
              data: { aiDraftReply: intake.reply.slice(0, 5000), aiHandled: true, humanApproved: false },
            }).catch(() => {});
          }
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
          // No legacy generated fallback: an empty intake result is a human-review case.
          aiReplyText = lang.language === 'bangla'
            ? 'স্বয়ংক্রিয় সহায়তা এই মুহূর্তে প্রস্তুত নয়। অনুগ্রহ করে অনুমোদিত কাউন্সেলরের মানব পর্যালোচনার জন্য অপেক্ষা করুন। এই চ্যাটে OTP, পাসওয়ার্ড, ব্যাংক/কার্ড তথ্য বা ব্যক্তিগত নথি পাঠাবেন না।'
            : 'Automated assistance is unavailable right now. An authorized counselor should review this message. Do not share an OTP, password, bank/card details, or private documents in this chat.';
          if (inboundMessage?.id) {
            await db.socialInboxMessage.update({ where: { id: inboundMessage.id }, data: { aiDraftReply: aiReplyText, aiHandled: true, humanApproved: false } }).catch(() => {});
          }
          shouldHandover = true;
          handoverReason = 'intake_empty_human_review';
        }
      } catch {
        // Keep failures safe and visible; do not invoke a legacy reply generator or send a fallback.
        aiReplyText = lang.language === 'bangla'
          ? 'স্বয়ংক্রিয় সহায়তা এই মুহূর্তে প্রস্তুত নয়। অনুমোদিত কাউন্সেলরের মানব পর্যালোচনা প্রয়োজন। এই চ্যাটে OTP, পাসওয়ার্ড, ব্যাংক/কার্ড তথ্য বা ব্যক্তিগত নথি পাঠাবেন না।'
          : 'Automated assistance is unavailable right now and needs authorized human review. Do not share an OTP, password, bank/card details, or private documents in this chat.';
        if (inboundMessage?.id) {
          await db.socialInboxMessage.update({ where: { id: inboundMessage.id }, data: { aiDraftReply: aiReplyText, aiHandled: true, humanApproved: false } }).catch(() => {});
        }
        shouldHandover = true;
        handoverReason = 'intake_failed_human_review';
      }
      // Optional approved after-hours acknowledgement: no generated draft is sent.
      // This helper checks the persisted Dhaka schedule and creates an idempotent
      // next-opening follow-up task when a lead/student is already linked.
      if (!stopStart.optedOut && !sentiment.isUrgent && intent.intent !== 'urgent_support' && intent.intent !== 'complaint') {
        try {
          const afterHours = await handleAfterHoursMessage({
            channel: 'whatsapp',
            senderPhone: from,
            message: messageBody,
            leadId: leadId || undefined,
            studentId: studentId || undefined,
            assignedTo: assignedUserId || undefined,
          });
          if (afterHours.isAfterHours) afterHoursAutoReply = afterHours.autoReply;
        } catch (error) {
          console.error('[whatsapp.webhook] after-hours automation failed closed', { error: error instanceof Error ? error.name : 'UnknownError' });
        }
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
      counselorId: assignedUserId || (existingStudent as any)?.counselorId || (existingLead as any)?.counselorId || undefined,
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
      shouldHandover = true;
      handoverReason = intent.intent === 'complaint' ? 'complaint_human_review' : 'urgent_support_human_review';
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
          message: `Urgent: ${messageBody.slice(0, 100)} from ${fromName} (${from}). Human follow-up is required; no number value is treated as a verified contact channel.`,
          type: 'critical',
        },
      }).catch(() => {});

      // Only assign an operational task to a real, known counselor identity.
      // The dashboard alarm remains available for manual assignment otherwise.
      if (routingContext.counselorId) {
        await db.counselorTask.create({
          data: {
            employeeId: routingContext.counselorId,
            studentId: studentId || "",
            title: `${sentiment.isUrgent ? 'Urgent' : 'Complaint'}: ${fromName} - ${intent.intent}`,
            description: `Message: ${messageBody.slice(0, 200)}. Human review required.`,
            type: 'urgent_support',
            priority: 'urgent',
            status: 'pending',
            dueDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          },
        }).catch(() => {});
      }

      // Urgent/complaint responses stay as human-review drafts. Never repeat a
      // Student ID or ask for credentials/private records in a public reply.
      if (sentiment.isUrgent) {
        aiReplyText = lang.language === 'bangla'
          ? 'আপনার জরুরি সহায়তার অনুরোধ মানব পর্যালোচনার জন্য পাঠানো হয়েছে। এই চ্যাটে Student ID, OTP, পাসওয়ার্ড বা ব্যক্তিগত নথি দেবেন না।'
          : 'Your urgent support request has been routed for human review. Do not share a Student ID, OTP, password, or private document in this chat.';
        if (inboundMessage?.id) {
          await db.socialInboxMessage.update({
            where: { id: inboundMessage.id },
            data: { aiDraftReply: aiReplyText, aiHandled: true, humanApproved: false },
          }).catch(() => {});
        }
      }
    }

    // 15. Send AI reply if applicable and not handover
    let outboundApiResult: any = null;
    let outboundMessage: any = null;

    if (afterHoursAutoReply && !shouldHandover && !stopStart.optedOut) {
      try {
        const sendResult = await sendWhatsAppMessage({
          to: normalizedFrom || from,
          text: afterHoursAutoReply,
          purpose: 'SERVICE',
          conversationId: threadId || undefined,
          actorId: 'system',
          studentId: studentId || undefined,
          leadId: leadId || undefined,
          senderNumber: routing.number || MAIN_NUMBER,
        });
        if (sendResult.success && sendResult.messageId) {
          outboundApiResult = { sent: true, status: 'sent', messageId: sendResult.messageId };
          outboundMessage = sendResult.socialMessageId
            ? await db.socialInboxMessage.findUnique({ where: { id: sendResult.socialMessageId } }).catch(() => null)
            : null;
          if (outboundMessage?.id) {
            await db.socialInboxMessage.update({
              where: { id: outboundMessage.id },
              data: {
                messageMediaMetadata: JSON.stringify({ deliveryStatus: 'SENT', source: 'approved_after_hours_template', automationApproved: true }),
              },
            }).catch(() => {});
          }
        } else {
          outboundApiResult = { sent: false, status: sendResult.error || 'provider_rejected' };
        }
      } catch {
        outboundApiResult = { sent: false, status: 'failed' };
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

    // Complete the atomic provider-event lease only after all inbound side
    // effects have been attempted. A crashed worker can be recovered after the
    // lease expires; concurrent duplicate callbacks do not create duplicate
    // CRM rows.
    await db.uccWebhookEvent.updateMany({
      where: { eventId: providerMessageId },
      data: { status: "processed" },
    }).catch(() => {});
    await completeWebhookEvent(eventClaim).catch((error) => {
      console.error('[whatsapp.webhook] event lease completion failed', error instanceof Error ? error.message : 'unknown');
    });

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
      aiReplySent: outboundApiResult?.sent === true,
      outboundStatus: outboundApiResult?.status || null,
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
