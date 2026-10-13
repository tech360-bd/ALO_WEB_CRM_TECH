/**
 * WhatsApp configuration & URL helpers.
 * ====================================
 * Single source of truth for the official WhatsApp number and link
 * generation. Every component, page, and API route that needs to
 * reference WhatsApp MUST import from here — never hard-code the number.
 *
 * OFFICIAL NUMBER: 01716609554 (Bangladesh)
 * INTERNATIONAL:   8801716609554  (used in wa.me deep links)
 *
 * @see DEVELOPMENT.md §AI WhatsApp Agent
 */
import { env } from "@/lib/env";

/** Get the WhatsApp env config (typed). */
export function whatsappConfig() {
  const e = env();
  return {
    number: e.whatsappNumber,
    international: e.whatsappInternationalNumber,
    display: e.whatsappDisplayNumber,
    businessName: e.whatsappBusinessName,
    apiConfigured: e.whatsappApiConfigured,
    apiPhoneNumberId: e.whatsappApiPhoneNumberId,
    apiToken: e.whatsappApiToken,
    webhookVerifyToken: e.whatsappWebhookVerifyToken,
    aiMode: e.whatsappAiMode,
    aiProvider: e.whatsappAiProvider,
    aiModel: e.whatsappAiModel,
  };
}

/**
 * Build a wa.me deep link.
 *
 * @param message Optional pre-filled message text.
 * @returns Absolute URL like "https://wa.me/8801716609554?text=Hello"
 *
 * @example
 *   buildWhatsappUrl()                              // → https://wa.me/8801716609554
 *   buildWhatsappUrl("Hi, I want to study in the UK")
 *   // → https://wa.me/8801716609554?text=Hi%2C%20I%20want%20...
 */
export function buildWhatsappUrl(message?: string): string {
  const { international } = whatsappConfig();
  const base = `https://wa.me/${international}`;
  if (!message || !message.trim()) return base;
  return `${base}?text=${encodeURIComponent(message.trim())}`;
}

/**
 * Build a wa.me link with a conversation reference token (for secure
 * web-chat → WhatsApp handoff). The token is opaque to the user —
 * it does NOT contain conversation content.
 *
 * @param conversationToken  Short opaque token (≤ 64 chars).
 */
export function buildWhatsappHandoffUrl(conversationToken: string): string {
  const msg =
    `Hi, I'm Alaminn AI. I'd like to continue our conversation on WhatsApp. ` +
    `Reference: ${conversationToken}`;
  return buildWhatsappUrl(msg);
}

/**
 * Normalize a user-provided WhatsApp number to international format
 * (digits only, no leading +). Used for deduplication of leads.
 *
 * Handles:
 *   "01716609554"      → "8801716609554"   (Bangladesh local → intl)
 *   "+8801716609554"   → "8801716609554"
 *   "8801716609554"    → "8801716609554"
 *   "+44 7700 900123"  → "447700900123"
 */
export function normalizeWhatsappNumber(input: string | null | undefined): string | null {
  if (!input) return null;
  let s = String(input).trim();
  if (!s) return null;
  // Strip everything except digits
  s = s.replace(/[^\d]/g, "");
  if (!s) return null;
  // Bangladesh local → international (strip leading 0, prepend 880)
  if (s.length === 11 && s.startsWith("0")) {
    return "88" + s.slice(1);
  }
  return s;
}

/**
 * Display a WhatsApp number in a consistent format.
 * Falls back to the raw input if normalization fails.
 */
export function displayWhatsappNumber(input: string | null | undefined): string {
  const norm = normalizeWhatsappNumber(input);
  if (!norm) return input || "";
  // Bangladesh: 880 17XX XXX XXX
  if (norm.startsWith("880") && norm.length === 13) {
    return `+880 ${norm.slice(3, 8)} ${norm.slice(8, 11)} ${norm.slice(11)}`;
  }
  // Generic fallback: groups of 3-4
  return "+" + norm;
}

/**
 * WhatsApp Cloud API message status values.
 * Used for accurate failure handling — API acceptance ≠ delivery.
 */
export type WhatsappMessageStatus =
  | "SENT"        // Accepted by API, not yet delivered
  | "DELIVERED"   // Reached the recipient's device
  | "READ"        // Recipient opened the chat
  | "FAILED"      // API rejected or delivery failed
  | "PENDING";    // Queued, awaiting send

/**
 * AI agent operational status (shown in admin panel).
 */
export type WhatsappAgentStatus =
  | "CONNECTED"        // API configured + AI mode ACTIVE
  | "DISCONNECTED"     // API not configured
  | "ERROR"            // Last operation failed
  | "REQUIRES_AUTH"    // Webhook verify token missing
  | "PAUSED";          // WHATSAPP_AI_MODE=PAUSED

/** Compute current agent status from env config. */
export function getAgentStatus(): WhatsappAgentStatus {
  const cfg = whatsappConfig();
  if (cfg.aiMode === "PAUSED") return "PAUSED";
  if (!cfg.webhookVerifyToken) return "REQUIRES_AUTH";
  if (!cfg.apiConfigured) return "DISCONNECTED";
  return "CONNECTED";
}

/** AI mode labels for the admin UI. */
export const AI_MODE_LABELS: Record<string, string> = {
  ACTIVE: "Active — AI responds automatically",
  HUMAN_ONLY: "Human Only — AI disabled, all messages routed to humans",
  APPROVAL_REQUIRED: "Approval Required — AI drafts, human approves before send",
  PAUSED: "Paused — Agent offline",
};

/** Agent status labels + colors for the admin UI. */
export const STATUS_LABELS: Record<WhatsappAgentStatus, { label: string; color: string }> = {
  CONNECTED: { label: "Connected", color: "emerald" },
  DISCONNECTED: { label: "Disconnected (dev mode)", color: "amber" },
  ERROR: { label: "Error", color: "rose" },
  REQUIRES_AUTH: { label: "Requires Auth", color: "orange" },
  PAUSED: { label: "Paused", color: "slate" },
};
