/**
 * WhatsApp Cloud API integration
 *
 *   - verifyWhatsAppSignature  : HMAC-SHA-256 with WHATSAPP_APP_SECRET,
 *                                 timingSafeEqual. If secret not set → log
 *                                 warning + return true (dev-friendly).
 *   - sendWhatsAppMessage      : POST to graph.facebook.com/v18.0/{PHONE_NUMBER_ID}/messages.
 *                                 If creds missing → graceful skip (returns success=true,
 *                                 messageId=null, error="not configured"). Persists
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
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
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
        "[whatsapp-cloud-api] WHATSAPP_APP_SECRET not set in production — webhook verification bypassed!"
      );
    }
    return true;
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
 * Send a WhatsApp Cloud API message. Returns gracefully when creds
 * are missing so callers don't crash on misconfiguration.
 *
 * Side-effects:
 *   - Creates a SocialInboxMessage (direction=OUTBOUND).
 *   - Persists WhatsAppMessageStatus once the API returns a message ID.
 */
export async function sendWhatsAppMessage(
  params: SendWhatsAppParams
): Promise<SendWhatsAppResult> {
  // ── Credential check ──
  if (!WHATSAPP_ACCESS_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
    return {
      messageId: null,
      success: true,
      error: "not configured",
    };
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

  // Persist OUTBOUND SocialInboxMessage first
  let socialMessageId: string | undefined;
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
    console.error("[whatsapp-cloud-api] failed to persist SocialInboxMessage:", err);
  }

  // Call Graph API
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

  try {
    await db.whatsAppMessageStatus.upsert({
      where: { messageId },
      update: {
        status,
        recipientPhone,
        socialMessageId: socialMessageId ?? undefined,
        providerPayload,
        statusTimestamp: new Date(),
      },
      create: {
        messageId,
        status,
        recipientPhone,
        socialMessageId: socialMessageId ?? undefined,
        providerPayload,
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
