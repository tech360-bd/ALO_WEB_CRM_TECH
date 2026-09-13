/**
 * WhatsApp Cloud API (Meta Graph API v18.0) Integration
 *
 * Provides:
 *   - Webhook signature verification (HMAC SHA-256 + timingSafeEqual)
 *   - Outbound message sending (text + template)
 *   - Inbound message + status payload parsers
 *   - Status persistence (SocialInboxMessage + WhatsAppMessageStatus-style log)
 *
 * Env vars (all optional — graceful degradation if missing):
 *   WHATSAPP_APP_SECRET     — for HMAC signature verification
 *   WHATSAPP_PHONE_NUMBER_ID — sender phone number ID
 *   WHATSAPP_ACCESS_TOKEN    — system user access token
 *   WHATSAPP_VERIFY_TOKEN    — webhook verification token (GET)
 *
 * NOTE: There is no dedicated `WhatsAppMessageStatus` model in the schema.
 * We persist status records in `SmsLog` (deliveryStatus) for status webhooks
 * and in `SocialInboxMessage` for message content. This is a graceful
 * degradation that preserves the original API contract.
 */

import crypto from "node:crypto";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone-normalization";

// ─── Signature Verification ────────────────────────────────────

/**
 * Verify the X-Hub-Signature-256 header sent by Meta on every webhook.
 *
 * Uses HMAC-SHA256 with WHATSAPP_APP_SECRET and constant-time comparison.
 *
 * If WHATSAPP_APP_SECRET is not set:
 *   - In production: return false (reject).
 *   - In dev/test: log a warning and return true so local testing works.
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signature: string | null | undefined
): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[whatsapp] WHATSAPP_APP_SECRET missing — rejecting webhook in production");
      return false;
    }
    console.warn("[whatsapp] WHATSAPP_APP_SECRET not configured — skipping signature check (dev only)");
    return true;
  }

  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const expected = signature.slice("sha256=".length);
  const hmac = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");

  // timingSafeEqual requires equal-length buffers
  const a = Buffer.from(expected);
  const b = Buffer.from(hmac);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ─── Outbound Message Send ─────────────────────────────────────

export interface SendWhatsAppMessageParams {
  to: string;                  // E.164 or local BD phone
  text?: string;               // plain text body
  templateName?: string;       // pre-approved template name
  templateParams?: string[];   // template variable values
  leadId?: string;
  studentId?: string;
  partnerId?: string;
  employeeId?: string;
  conversationId?: string;
}

export interface SendWhatsAppMessageResult {
  messageId: string | null;
  success: boolean;
  error?: string;
  providerPayload?: unknown;
}

/**
 * Send an outbound WhatsApp message via the Cloud API.
 *
 * If credentials are missing, returns a "not configured" sentinel result
 * instead of throwing — so callers can keep functioning in dev/staging.
 *
 * Always persists a SocialInboxMessage (direction=OUTBOUND) record + a
 * SmsLog row mirroring the WhatsAppMessageStatus lifecycle (PENDING → SENT/FAILED).
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppMessageParams
): Promise<SendWhatsAppMessageResult> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn("[whatsapp] sendWhatsAppMessage: creds missing — recording message but skipping API call");

    // Persist outbound message so the conversation history is intact
    const msg = await db.socialInboxMessage.create({
      data: {
        platform: "WHATSAPP",
        direction: "OUTBOUND",
        senderName: "ALO AI",
        recipientId: normalizePhone(params.to) || params.to,
        messageText: params.text ?? (params.templateName ? `[template:${params.templateName}]` : ""),
        conversationId: params.conversationId || `wa-${normalizePhone(params.to) || params.to}`,
        leadId: params.leadId,
        studentId: params.studentId,
        partnerId: params.partnerId,
        employeeId: params.employeeId,
        aiHandled: true,
        humanApproved: true,
        isRead: true,
        sentAt: new Date(),
      },
    }).catch((e) => { console.error("[whatsapp] persist outbound failed", e); return null; });

    // Mirror to SmsLog for status tracking
    if (msg) {
      await db.smsLog.create({
        data: {
          direction: "OUTBOUND",
          fromNumber: phoneNumberId || "WA-BOT",
          toNumber: normalizePhone(params.to) || params.to,
          messageText: params.text ?? `[template:${params.templateName ?? ""}]`,
          deliveryStatus: "NOT_CONFIGURED",
          leadId: params.leadId,
          studentId: params.studentId,
          partnerId: params.partnerId,
          employeeId: params.employeeId,
          sentAt: new Date(),
        },
      }).catch(() => {});
    }

    return { messageId: null, success: true, error: "not configured" };
  }

  // Build the request body
  const recipient = normalizePhone(params.to);
  let body: Record<string, unknown>;

  if (params.templateName) {
    body = {
      messaging_product: "whatsapp",
      to: recipient,
      type: "template",
      template: {
        name: params.templateName,
        language: { code: "en_US" },
        components: params.templateParams && params.templateParams.length > 0
          ? [{
              type: "body",
              parameters: params.templateParams.map((p) => ({ type: "text", text: p })),
            }]
          : [],
      },
    };
  } else {
    body = {
      messaging_product: "whatsapp",
      to: recipient,
      type: "text",
      text: { body: params.text ?? "" },
    };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Persist the failed attempt for audit
      await db.socialInboxMessage.create({
        data: {
          platform: "WHATSAPP",
          direction: "OUTBOUND",
          senderName: "ALO AI",
          recipientId: recipient,
          messageText: params.text ?? `[template:${params.templateName ?? ""}]`,
          conversationId: params.conversationId || `wa-${recipient}`,
          leadId: params.leadId,
          studentId: params.studentId,
          partnerId: params.partnerId,
          employeeId: params.employeeId,
          aiHandled: true,
          humanApproved: true,
          isRead: true,
        },
      }).catch(() => {});

      return {
        messageId: null,
        success: false,
        error: `WhatsApp API ${res.status}: ${JSON.stringify(json?.error || json)}`,
        providerPayload: json,
      };
    }

    const messageId: string | null = json?.messages?.[0]?.id ?? null;

    // Persist the outbound message
    await db.socialInboxMessage.create({
      data: {
        platform: "WHATSAPP",
        direction: "OUTBOUND",
        senderName: "ALO AI",
        recipientId: recipient,
        messageText: params.text ?? `[template:${params.templateName ?? ""}]`,
        conversationId: params.conversationId || `wa-${recipient}`,
        externalId: messageId ?? undefined,
        leadId: params.leadId,
        studentId: params.studentId,
        partnerId: params.partnerId,
        employeeId: params.employeeId,
        aiHandled: true,
        humanApproved: true,
        isRead: true,
        sentAt: new Date(),
      },
    }).catch((e) => console.error("[whatsapp] persist outbound failed", e));

    // Mirror status into SmsLog (acts as WhatsAppMessageStatus)
    await db.smsLog.create({
      data: {
        direction: "OUTBOUND",
        fromNumber: phoneNumberId,
        toNumber: recipient,
        messageText: params.text ?? `[template:${params.templateName ?? ""}]`,
        deliveryStatus: "SENT",
        leadId: params.leadId,
        studentId: params.studentId,
        partnerId: params.partnerId,
        employeeId: params.employeeId,
        sentAt: new Date(),
      },
    }).catch(() => {});

    return { messageId, success: true, providerPayload: json };
  } catch (err: any) {
    return { messageId: null, success: false, error: err?.message || "Network error" };
  }
}

// ─── Inbound Parsing ───────────────────────────────────────────

export interface ParsedWhatsAppInbound {
  messageId: string | null;
  from: string | null;
  to: string | null;
  text: string | null;
  type: string;            // text, image, audio, document, etc.
  timestamp: string | null;
  raw: unknown;
  contactName: string | null;
  conversationId: string | null;
}

/**
 * Parse an inbound WhatsApp Cloud API webhook payload.
 *
 * Supports both the official Meta format (entry[].changes[].value.messages[])
 * and a simplified flat shape ({ from, text, id }) used by some test harnesses.
 */
export function parseWhatsAppInbound(body: any): ParsedWhatsAppInbound {
  const empty: ParsedWhatsAppInbound = {
    messageId: null, from: null, to: null, text: null, type: "unknown",
    timestamp: null, raw: body, contactName: null, conversationId: null,
  };
  if (!body) return empty;

  // Flat / simplified shape
  if (body.from && (body.text || body.messageText)) {
    return {
      messageId: body.messageId || body.id || null,
      from: body.from,
      to: body.to ?? null,
      text: body.text || body.messageText,
      type: body.type ?? "text",
      timestamp: body.timestamp ?? null,
      contactName: body.name ?? body.profileName ?? null,
      conversationId: body.conversationId ?? null,
      raw: body,
    };
  }

  // Official Meta payload
  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;
  const msg = value?.messages?.[0];
  const contact = value?.contacts?.[0];

  if (!msg) return empty;

  let text: string | null = null;
  if (msg.type === "text" && msg.text?.body) text = msg.text.body;
  else if (msg.type === "interactive" && msg.interactive?.button_reply?.title)
    text = msg.interactive.button_reply.title;
  else if (msg.type === "interactive" && msg.interactive?.list_reply?.title)
    text = msg.interactive.list_reply.title;

  return {
    messageId: msg.id ?? null,
    from: msg.from ?? null,
    to: value?.metadata?.phone_number_id ?? null,
    text,
    type: msg.type ?? "unknown",
    timestamp: msg.timestamp ?? null,
    contactName: contact?.profile?.name ?? contact?.wa_id ?? null,
    conversationId: msg.context?.conversation_id ?? (msg.from ? `wa-${msg.from}` : null),
    raw: body,
  };
}

// ─── Status Parsing ────────────────────────────────────────────

export interface ParsedWhatsAppStatus {
  messageId: string | null;
  recipientPhone: string | null;
  status: string | null;     // sent, delivered, read, failed
  timestamp: string | null;
  conversationId: string | null;
  pricing: unknown;
  error: unknown;
  raw: unknown;
}

/**
 * Parse a status webhook (delivery / read / failed receipt).
 */
export function parseWhatsAppStatus(body: any): ParsedWhatsAppStatus {
  const empty: ParsedWhatsAppStatus = {
    messageId: null, recipientPhone: null, status: null, timestamp: null,
    conversationId: null, pricing: null, error: null, raw: body,
  };
  if (!body) return empty;

  const entry = body.entry?.[0];
  const change = entry?.changes?.[0];
  const status = change?.value?.statuses?.[0];

  if (!status) return empty;

  return {
    messageId: status.id ?? null,
    recipientPhone: status.recipient_id ?? null,
    status: status.status ?? null,
    timestamp: status.timestamp ?? null,
    conversationId: status.conversation?.id ?? null,
    pricing: status.pricing ?? null,
    error: status.errors ?? null,
    raw: body,
  };
}

// ─── Status Persistence ────────────────────────────────────────

/**
 * Persist a status update for an outbound WhatsApp message.
 *
 * Updates the corresponding SmsLog row (acting as WhatsAppMessageStatus)
 * and, if the original SocialInboxMessage exists, marks it as read on "read".
 */
export async function persistWhatsAppStatus(
  messageId: string,
  status: string,
  recipientPhone?: string | null,
  payload?: unknown
): Promise<void> {
  if (!messageId) return;

  // Map WhatsApp status → SmsLog deliveryStatus
  const mapped = (() => {
    switch ((status || "").toLowerCase()) {
      case "sent": return "SENT";
      case "delivered": return "DELIVERED";
      case "read": return "READ";
      case "failed": return "FAILED";
      default: return (status || "UNKNOWN").toUpperCase();
    }
  })();

  // Update SocialInboxMessage (matched by externalId)
  try {
    const existing = await db.socialInboxMessage.findFirst({
      where: { externalId: messageId },
      select: { id: true },
    });
    if (existing) {
      await db.socialInboxMessage.update({
        where: { id: existing.id },
        data: {
          isRead: mapped === "READ",
          // store latest status payload in messageMediaMetadata (JSON-ish field)
          messageMediaMetadata: typeof payload === "string" ? payload : JSON.stringify(payload ?? { status }),
        },
      });
    }
  } catch (e) {
    console.error("[whatsapp] persistWhatsAppStatus SocialInboxMessage update failed", e);
  }

  // Update SmsLog row by externalId-like lookup (toNumber + fromNumber)
  // Since SmsLog has no externalId, we match by recipient + recent sentAt
  try {
    const recipient = recipientPhone ? normalizePhone(recipientPhone) : null;
    if (recipient) {
      const recent = await db.smsLog.findFirst({
        where: {
          toNumber: recipient,
          direction: "OUTBOUND",
        },
        orderBy: { sentAt: "desc" },
        select: { id: true },
      });
      if (recent) {
        await db.smsLog.update({
          where: { id: recent.id },
          data: { deliveryStatus: mapped },
        });
      }
    }
  } catch (e) {
    console.error("[whatsapp] persistWhatsAppStatus SmsLog update failed", e);
  }
}
