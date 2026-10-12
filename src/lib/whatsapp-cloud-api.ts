/**
 * WhatsApp Cloud API integration
 *
 *   - verifyWhatsAppSignature  : HMAC-SHA-256 with WHATSAPP_APP_SECRET,
 *                                 timingSafeEqual. If secret not set → log
 *                                 warning + return true (dev-friendly).
 *   - sendWhatsAppMessage      : POST to graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages.
 *                                 Missing credentials or a provider rejection returns
 *                                 success=false; successful provider acknowledgements are persisted.
 *                                 SocialInboxMessage + WhatsAppMessageStatus.
 *   - parseWhatsAppInbound     : map webhook payload → fields.
 *   - parseWhatsAppStatus      : map webhook payload → status fields.
 *   - persistWhatsAppStatus    : upsert WhatsAppMessageStatus by messageId.
 *
 * Models touched: SocialInboxMessage, WhatsAppMessageStatus, WebhookEvent.
 */

import crypto from "node:crypto";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone-normalization";

// ─── Env access (graceful when missing) ─────────────────────────

const WHATSAPP_APP_SECRET = process.env.WHATSAPP_APP_SECRET;
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_BUSINESS_PHONE = process.env.WHATSAPP_BUSINESS_PHONE; // E.164 of WABA number

const GRAPH_API_VERSION = "v18.0";
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// ─── Signature verification ─────────────────────────────────────

/**
 * Verify X-Hub-Signature-256 header sent by WhatsApp webhooks.
 *
 * If `WHATSAPP_APP_SECRET` is not configured we log a warning and
 * return `true` so local development keeps working — production
 * deployments MUST set the secret.
 */
export function verifyWhatsAppSignature(
  rawBody: string,
  signature: string | null | undefined
): boolean {
  if (!WHATSAPP_APP_SECRET) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[whatsapp-cloud-api] WHATSAPP_APP_SECRET not set — signature verification skipped (dev mode)."
      );
    } else {
      console.error(
        "[whatsapp-cloud-api] WHATSAPP_APP_SECRET is required in production — rejecting webhook."
      );
      return false;
    }
    // Development may explicitly opt into unsigned local webhook testing; a
    // production process must never accept an unverifiable provider request.
    return (process.env.NODE_ENV as string) !== "production";
  }
  if (!signature || !signature.startsWith("sha256=")) {
    return false;
  }

  const expected = signature.slice("sha256=".length);
  const computed = crypto
    .createHmac("sha256", WHATSAPP_APP_SECRET)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    const a = Buffer.from(computed, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// ─── Send message ───────────────────────────────────────────────

export interface SendWhatsAppParams {
  to: string;                  // phone (any format — normalized internally)
  text?: string;
  templateName?: string;
  templateParams?: string[];
}

export interface SendWhatsAppResult {
  messageId: string | null;
  success: boolean;
  error?: string;
  socialMessageId?: string;
  statusRecorded?: boolean;
}

/**
 * Send a WhatsApp Cloud API message. Missing credentials and provider rejection
 * are explicit failures; callers must not record a send without provider ack.
 *
 * Side-effects:
 *   - Creates a SocialInboxMessage only after the provider accepts the message.
 *   - Persists WhatsAppMessageStatus once the API returns a message ID.
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppParams
): Promise<SendWhatsAppResult> {
  // ── Credential check ──
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return {
      messageId: null,
      success: false,
      error: "WhatsApp Cloud API credentials are not configured",
    };
  }
  if (!params.templateName && (!params.text || !params.text.trim())) {
    return { messageId: null, success: false, error: 'Message text or an approved template is required' };
  }
  if (params.text && params.text.length > 4096) {
    return { messageId: null, success: false, error: 'Message text exceeds the provider limit of 4096 characters' };
  }

  const toNormalized = normalizePhone(params.to);
  if (!toNormalized) {
    return { messageId: null, success: false, error: "Invalid recipient phone" };
  }

  // Build request body
  let body: Record<string, unknown>;
  if (params.templateName) {
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toNormalized,
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
      recipient_type: "individual",
      to: toNormalized,
      type: "text",
      text: { preview_url: false, body: params.text ?? "" },
    };
  }

  let socialMessageId: string | undefined;

  // Call the official provider before recording a successful outbound message.
  const url = `${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
  let providerMessageId: string | null = null;
  let errorMessage: string | undefined;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const json: any = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      errorMessage = json?.error?.message ?? `HTTP ${resp.status}`;
      console.error("[whatsapp-cloud-api] send failed:", errorMessage, json);
    } else {
      providerMessageId = json?.messages?.[0]?.id ?? null;
    }
  } catch (err: any) {
    errorMessage = err?.message ?? String(err);
    console.error("[whatsapp-cloud-api] network error during send:", err);
  }

  if (providerMessageId) {
    try {
      const socialMsg = await db.socialInboxMessage.create({
        data: {
          platform: "WHATSAPP",
          direction: "OUTBOUND",
          recipientId: WHATSAPP_BUSINESS_PHONE ?? null,
          senderId: toNormalized,
          senderName: null,
          messageText: params.text ?? params.templateName ?? "",
          conversationId: `wa:${toNormalized}`,
          sentAt: new Date(),
        },
      });
      socialMessageId = socialMsg.id;
    } catch (err) {
      console.error("[whatsapp-cloud-api] failed to persist accepted SocialInboxMessage:", err);
    }
  }

  // Persist WhatsAppMessageStatus (messageId is @unique)
  let statusRecorded = false;
  if (providerMessageId) {
    try {
      await persistWhatsAppStatus(
        providerMessageId,
        "sent",
        toNormalized,
        { socialMessageId, templateName: params.templateName ?? null }
      );
      statusRecorded = true;
    } catch (err) {
      console.error("[whatsapp-cloud-api] failed to persist status:", err);
    }
  }

  return {
    messageId: providerMessageId,
    success: providerMessageId !== null,
    error: errorMessage,
    socialMessageId,
    statusRecorded,
  };
}

// ─── Parse inbound webhook ──────────────────────────────────────

export interface ParsedWhatsAppInbound {
  messageId?: string;
  fromPhone?: string;
  fromName?: string;
  text?: string;
  type?: string;
  timestamp?: string;
  receivedAt?: Date;
  raw: Record<string, unknown>;
}

/**
 * Parse an inbound WhatsApp webhook payload.
 *
 * Returns an empty object (with raw=body) if no message entry found.
 */
export function parseWhatsAppInbound(
  body: Record<string, unknown> | string
): ParsedWhatsAppInbound[] {
  const parsed: ParsedWhatsAppInbound[] = [];
  const root: any = typeof body === "string" ? safeJson(body) : body;
  if (!root || !root.entry) return parsed;

  for (const entry of root.entry as any[]) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const value = change?.value;
      if (!value || !Array.isArray(value.messages)) continue;
      for (const msg of value.messages) {
        const contact = (value.contacts ?? []).find(
          (c: any) => c.wa_id === msg.from
        );
        parsed.push({
          messageId: msg.id,
          fromPhone: msg.from ? normalizePhone(msg.from) : undefined,
          fromName: contact?.profile?.name,
          text:
            msg.type === "text" ? msg.text?.body :
            msg.type === "button" ? msg.button?.text :
            msg.type === "interactive" ? msg.interactive?.button_reply?.title ?? msg.interactive?.list_reply?.title :
            undefined,
          type: msg.type,
          timestamp: msg.timestamp,
          receivedAt: msg.timestamp ? new Date(parseInt(msg.timestamp, 10) * 1000) : new Date(),
          raw: msg,
        });
      }
    }
  }
  return parsed;
}

// ─── Parse status webhook ───────────────────────────────────────

export interface ParsedWhatsAppStatus {
  messageId: string;
  status: string;
  recipientPhone?: string;
  timestamp?: string;
  conversationId?: string;
  pricing?: Record<string, unknown>;
  error?: Record<string, unknown>;
  raw: Record<string, unknown>;
}

export function parseWhatsAppStatus(
  body: Record<string, unknown> | string
): ParsedWhatsAppStatus[] {
  const parsed: ParsedWhatsAppStatus[] = [];
  const root: any = typeof body === "string" ? safeJson(body) : body;
  if (!root || !root.entry) return parsed;

  for (const entry of root.entry as any[]) {
    const changes = entry?.changes ?? [];
    for (const change of changes) {
      const value = change?.value;
      if (!value || !Array.isArray(value.statuses)) continue;
      for (const st of value.statuses) {
        parsed.push({
          messageId: st.id,
          status: st.status,
          recipientPhone: st.recipient_id ? normalizePhone(st.recipient_id) : undefined,
          timestamp: st.timestamp,
          conversationId: st.conversation?.id,
          pricing: st.pricing,
          error: st.errors,
          raw: st,
        });
      }
    }
  }
  return parsed;
}

// ─── Persist status ─────────────────────────────────────────────

/**
 * Upsert a WhatsAppMessageStatus row by messageId (@unique).
 * Optionally link to an existing SocialInboxMessage.
 */
export async function persistWhatsAppStatus(
  messageId: string,
  status: string,
  recipientPhone: string,
  payload?: Record<string, unknown> | null
): Promise<void> {
  if (!messageId) return;
  const socialMessageId = (payload as any)?.socialMessageId ?? null;
  const providerPayload = payload ? JSON.stringify(payload) : null;
  const providerTimestamp = Number((payload as any)?.providerTimestamp);
  const statusTimestamp = Number.isFinite(providerTimestamp) && providerTimestamp > 0
    ? new Date(providerTimestamp * 1000)
    : new Date();
  const rank: Record<string, number> = { sent: 1, failed: 2, delivered: 3, read: 4 };
  const normalizedStatus = status.toLowerCase();

  try {
    const existing = await db.whatsAppMessageStatus.findUnique({
      where: { messageId },
      select: { status: true, statusTimestamp: true },
    });
    if (existing) {
      const priorRank = rank[String(existing.status).toLowerCase()] ?? 0;
      const nextRank = rank[normalizedStatus] ?? 0;
      if (nextRank < priorRank || (nextRank === priorRank && statusTimestamp < existing.statusTimestamp)) return;
    }
    await db.whatsAppMessageStatus.upsert({
      where: { messageId },
      update: {
        status: normalizedStatus,
        recipientPhone,
        socialMessageId: socialMessageId ?? undefined,
        providerPayload,
        statusTimestamp,
        errorMessage: typeof (payload as any)?.providerError === 'string' ? (payload as any).providerError.slice(0, 500) : undefined,
      },
      create: {
        messageId,
        status: normalizedStatus,
        recipientPhone,
        socialMessageId: socialMessageId ?? undefined,
        providerPayload,
        statusTimestamp,
        errorMessage: typeof (payload as any)?.providerError === 'string' ? (payload as any).providerError.slice(0, 500) : undefined,
      },
    });
  } catch (err) {
    console.error("[whatsapp-cloud-api] persistWhatsAppStatus failed:", err);
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function safeJson(s: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(s);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

// ============================================================================
// §131 — outbound attachment send (PDF / image / audio / video) via the
// official WhatsApp Cloud API media-by-link. Transport only: persistence
// (UccMessage + CommunicationAttachment) is the caller's job. Pure payload /
// validation logic lives in ./whatsapp-media (fully unit-testable).
// ============================================================================

import {
  WHATSAPP_MEDIA_TYPES,
  buildWhatsAppMediaPayload,
  buildWhatsAppUploadedMediaPayload,
  validateWhatsAppMediaRequest,
  whatsappCloudConfigError,
  type SendWhatsAppMediaParams,
  type SendWhatsAppUploadedMediaParams,
  type WhatsAppMediaType,
} from "@/lib/whatsapp-media";

export { WHATSAPP_MEDIA_TYPES, buildWhatsAppMediaPayload, buildWhatsAppUploadedMediaPayload, validateWhatsAppMediaRequest };
export type { SendWhatsAppMediaParams, SendWhatsAppUploadedMediaParams, WhatsAppMediaType };

export interface SendWhatsAppPrivateMediaParams {
  to: string;
  bytes: Uint8Array;
  mimeType: string;
  fileName: string;
  caption?: string;
}

/**
 * Send a privately stored CRM document without exposing it through a public URL.
 * Bytes are uploaded to the official WhatsApp Cloud API media endpoint, then
 * referenced by the returned provider media ID in the outbound message.
 */
export async function sendWhatsAppPrivateMedia(params: SendWhatsAppPrivateMediaParams): Promise<{
  messageId: string | null;
  providerMediaId?: string;
  success: boolean;
  error?: string;
}> {
  if (!params.bytes.byteLength || params.bytes.byteLength > 20 * 1024 * 1024) {
    return { messageId: null, success: false, error: 'Document must be non-empty and no larger than 20 MB.' };
  }
  const mimeType = params.mimeType.toLowerCase();
  const mediaType = mimeType === 'application/pdf'
    ? 'document'
    : ['image/jpeg', 'image/png'].includes(mimeType) ? 'image' : null;
  if (!mediaType) {
    return { messageId: null, success: false, error: 'Only PDF, JPEG, and PNG private documents can be sent through this action.' };
  }
  const configError = whatsappCloudConfigError();
  if (configError) return { messageId: null, success: false, error: configError };
  const toNormalized = normalizePhone(params.to);
  if (!toNormalized) return { messageId: null, success: false, error: 'Invalid recipient phone.' };

  try {
    const form = new FormData();
    form.set('messaging_product', 'whatsapp');
    form.set('type', mimeType);
    form.set('file', new Blob([Uint8Array.from(params.bytes)], { type: mimeType }), params.fileName);
    const uploadResponse = await fetch(`${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/media`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}` },
      body: form,
    });
    const uploadData: any = await uploadResponse.json().catch(() => ({}));
    const providerMediaId = typeof uploadData?.id === 'string' ? uploadData.id : '';
    if (!uploadResponse.ok || !providerMediaId) {
      return {
        messageId: null,
        success: false,
        error: uploadData?.error?.message || `WhatsApp media upload failed with HTTP ${uploadResponse.status}.`,
      };
    }

    const messagePayload = buildWhatsAppUploadedMediaPayload(toNormalized, {
      mediaType,
      mediaId: providerMediaId,
      fileName: params.fileName,
      caption: params.caption,
    });
    const messageResponse = await fetch(`${GRAPH_API_BASE}/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload),
    });
    const messageData: any = await messageResponse.json().catch(() => ({}));
    const messageId = typeof messageData?.messages?.[0]?.id === 'string' ? messageData.messages[0].id : null;
    if (!messageResponse.ok || !messageId) {
      return {
        messageId: null,
        providerMediaId,
        success: false,
        error: messageData?.error?.message || `WhatsApp media send failed with HTTP ${messageResponse.status}.`,
      };
    }
    await persistWhatsAppStatus(messageId, 'sent', toNormalized, { uccPrivateMedia: true, providerMediaId });
    return { messageId, providerMediaId, success: true };
  } catch (error: any) {
    return { messageId: null, success: false, error: error?.message || 'Network error sending private document.' };
  }
}

export async function sendWhatsAppMedia(params: SendWhatsAppMediaParams): Promise<{ messageId: string | null; success: boolean; error?: string }> {
  const invalid = validateWhatsAppMediaRequest(params);
  if (!invalid.ok) return { messageId: null, success: false, error: invalid.error };
  const configError = whatsappCloudConfigError();
  if (configError) return { messageId: null, success: false, error: configError };
  const toNormalized = normalizePhone(params.to);
  if (!toNormalized) {
    return { messageId: null, success: false, error: "Invalid recipient phone" };
  }
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildWhatsAppMediaPayload(toNormalized, params)),
    });
    const json = await res.json().catch(() => ({}));
    const messageId = json?.messages?.[0]?.id || null;
    if (!messageId) {
      return { messageId: null, success: false, error: json?.error?.message || `Cloud API returned ${res.status}` };
    }
    return { messageId, success: true };
  } catch (err: any) {
    return { messageId: null, success: false, error: err?.message || "Network error sending media" };
  }
}
