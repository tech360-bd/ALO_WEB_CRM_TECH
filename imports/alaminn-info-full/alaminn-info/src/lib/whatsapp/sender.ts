/**
 * WhatsApp Cloud API — Message Sender
 * ===================================
 * Sends text messages via the Meta WhatsApp Business Cloud API.
 *
 * In dev (no WHATSAPP_API_TOKEN configured), this module is a no-op —
 * it returns a synthetic "PENDING" status without making an HTTP call.
 * The caller can inspect the returned status to know whether the message
 * was actually sent.
 *
 * SECURITY: The API token is NEVER exposed to the client. This module
 * is server-only — never import from a client component.
 */
import { whatsappConfig, type WhatsappMessageStatus } from "./config";

export type SendResult = {
  status: WhatsappMessageStatus;
  messageId: string | null;
  error: string | null;
  /** True if the message was actually sent via the API (false in dev mode) */
  actuallySent: boolean;
};

/**
 * Send a text message to a WhatsApp number via the Cloud API.
 *
 * @param to Recipient number in international format, digits only (e.g. "8801716609554")
 * @param text Message body (max 4096 chars)
 */
export async function sendWhatsappMessage(
  to: string,
  text: string
): Promise<SendResult> {
  const cfg = whatsappConfig();

  // Dev mode — no actual send
  if (!cfg.apiConfigured || !cfg.apiToken || !cfg.apiPhoneNumberId) {
    return {
      status: "PENDING",
      messageId: `dev-${Date.now()}-${to.slice(-4)}`,
      error: null,
      actuallySent: false,
    };
  }

  // Validate recipient
  const normalized = to.replace(/[^\d]/g, "");
  if (!normalized || normalized.length < 8) {
    return {
      status: "FAILED",
      messageId: null,
      error: "Invalid recipient number",
      actuallySent: false,
    };
  }

  // Truncate overly long messages
  const body = text.length > 4096 ? text.slice(0, 4093) + "..." : text;

  try {
    const url = `https://graph.facebook.com/v18.0/${cfg.apiPhoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: normalized,
        type: "text",
        text: { preview_url: false, body },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return {
        status: "FAILED",
        messageId: null,
        error: `API ${res.status}: ${errBody.slice(0, 200)}`,
        actuallySent: false,
      };
    }

    const data = (await res.json()) as { messages?: { id?: string }[] };
    const messageId = data.messages?.[0]?.id ?? null;

    // API accepted ≠ delivered. Return SENT — actual delivery status
    // comes asynchronously via webhook status updates.
    return {
      status: "SENT",
      messageId,
      error: null,
      actuallySent: true,
    };
  } catch (err) {
    return {
      status: "FAILED",
      messageId: null,
      error: err instanceof Error ? err.message : "Network error",
      actuallySent: false,
    };
  }
}

/**
 * Parse an inbound webhook payload from Meta.
 * Extracts the sender number, message text, and timestamp.
 * Returns null if the payload is not a valid text message.
 */
export type InboundMessage = {
  from: string;
  text: string;
  messageId: string;
  timestamp: string;
  type: "text" | "button" | "interactive" | "unknown";
};

export function parseInboundWebhook(payload: unknown): InboundMessage | null {
  try {
    const p = payload as {
      entry?: Array<{
        changes?: Array<{
          value?: {
            messages?: Array<{
              from?: string;
              id?: string;
              timestamp?: string;
              type?: string;
              text?: { body?: string };
              button?: { text?: string };
              interactive?: {
                button_reply?: { id?: string; title?: string };
                list_reply?: { id?: string; title?: string };
              };
            }>;
          };
        }>;
      }>;
    };
    const msg = p.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!msg || !msg.from) return null;

    let text = "";
    let type: InboundMessage["type"] = "unknown";
    if (msg.type === "text" && msg.text?.body) {
      text = msg.text.body;
      type = "text";
    } else if (msg.type === "button" && msg.button?.text) {
      text = msg.button.text;
      type = "button";
    } else if (msg.type === "interactive") {
      text =
        msg.interactive?.button_reply?.title ||
        msg.interactive?.list_reply?.title ||
        "";
      type = "interactive";
    }

    return {
      from: msg.from,
      text,
      messageId: msg.id || "",
      timestamp: msg.timestamp || String(Math.floor(Date.now() / 1000)),
      type,
    };
  } catch {
    return null;
  }
}
