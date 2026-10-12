// ALO Education — Consolidated WhatsApp Webhook Handler
// Merges: src/app/api/whatsapp/webhook/route.ts (934 lines, AI/SLA/number-pool) +
//         src/app/api/crm/ucc/webhooks/whatsapp/route.ts (276 lines, intent/priority, E.164)
// Preserves ALL required functionality from both originals — lossless consolidation 2026-09-14
// See docs/PHP-AUDIT-2026-09-14.md and integration report for inventory.

import { allocateIdentifierCommitted } from '@/lib/identity/student-id';
import crypto from 'crypto';
import { normalizeBdPhone } from '@/lib/whatsapp-number-pool';

// ── Phone normalization ──
// Canonical: normalizeBdPhone (BD-specific, 880 prefix, no +) — used by main webhook, number-pool, tests
// Also: normalizePhoneE164 — E.164 with + prefix, from CRM webhook (preserved for compatibility)
export function normalizePhone(phone: string): string {
  return normalizeBdPhone(phone);
}
export function normalizePhoneE164(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('880') && digits.length === 13) return `+${digits}`;
  if (digits.startsWith('01') && digits.length === 11) return `+880${digits.slice(1)}`;
  return `+${digits}`;
}
// Alias kept for CRM callers that imported normalizePhone expecting E.164
export const normalizePhoneForCRM = normalizePhoneE164;

// ── Signature verification ──
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b)); } catch { return a === b; }
}

// Robust verification from main webhook: supports WHATSAPP_APP_SECRET or WHATSAPP_VERIFY_TOKEN, dev-mode bypass
export function verifySignature(rawBody: string, signature: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET || process.env.WHATSAPP_VERIFY_TOKEN;
  if (!appSecret) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[whatsapp.webhook] WHATSAPP_APP_SECRET not set — skipping verification (dev mode)');
      return true;
    }
    return false;
  }
  if (!signature) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  return safeEqual(expected, signature);
}

// Strict CRM variant: requires WHATSAPP_APP_SECRET, returns 403/503 handling (preserved for callers that need strict)
export function verifySignatureStrict(rawBody: string, signature: string | null): { ok: boolean; reason?: string } {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return { ok: false, reason: 'WHATSAPP_APP_SECRET is not configured — rejected' };
  if (!signature) return { ok: false, reason: 'Signature missing' };
  const expected = 'sha256=' + crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');
  const provided = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (provided.length !== expectedBuffer.length || !crypto.timingSafeEqual(provided, expectedBuffer)) {
    return { ok: false, reason: 'Signature mismatch — rejected' };
  }
  return { ok: true };
}

// ── Outbound API (main webhook) ──
export async function sendOutboundViaApi(recipientPhone: string, text: string): Promise<{ messageId: string | null; apiResponse: any }> {
  const token = process.env.WHATSAPP_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { messageId: null, apiResponse: { error: 'WHATSAPP_TOKEN or WHATSAPP_PHONE_NUMBER_ID not configured' } };
  }
  const payload = { messaging_product: 'whatsapp', to: recipientPhone, type: 'text', text: { body: text } };
  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    const messageId = json?.messages?.[0]?.id || null;
    return { messageId, apiResponse: json };
  } catch (err: any) {
    return { messageId: null, apiResponse: { error: err.message } };
  }
}

// ── Message content extraction (main webhook — comprehensive, 10 types) ──
export function extractMessageContent(msg: any): { type: string; body: string; mediaId?: string; extra?: any } {
  const type = msg.type || 'text';
  switch (type) {
    case 'text': return { type, body: msg.text?.body || '' };
    case 'image': return { type, body: msg.image?.caption || '[Image]', mediaId: msg.image?.id, extra: { mime: msg.image?.mime_type, sha256: msg.image?.sha256 } };
    case 'document': return { type, body: msg.document?.filename || '[Document]', mediaId: msg.document?.id, extra: { filename: msg.document?.filename, mime: msg.document?.mime_type } };
    case 'audio': return { type, body: '[Audio]', mediaId: msg.audio?.id, extra: { voice: msg.audio?.voice, duration: msg.audio?.duration } };
    case 'video': return { type, body: msg.video?.caption || '[Video]', mediaId: msg.video?.id, extra: { mime: msg.video?.mime_type } };
    case 'location': return { type, body: `[Location: ${msg.location?.latitude},${msg.location?.longitude}]`, extra: msg.location };
    case 'contacts': return { type, body: `[Contact: ${msg.contacts?.[0]?.name?.formatted_name || 'Contact'}]`, extra: msg.contacts };
    case 'interactive': {
      const interactive = msg.interactive;
      if (interactive?.type === 'button_reply') return { type: 'button', body: interactive.button_reply?.title || interactive.button_reply?.id || '[Button Reply]', extra: interactive };
      if (interactive?.type === 'list_reply') return { type: 'interactive', body: interactive.list_reply?.title || interactive.list_reply?.id || '[List Reply]', extra: interactive };
      return { type: 'interactive', body: '[Interactive]', extra: interactive };
    }
    case 'button': return { type: 'button', body: msg.button?.text || msg.button?.payload || '[Button]', extra: msg.button };
    default: return { type, body: msg.text?.body || `[${type}]`, mediaId: msg[type]?.id };
  }
}

// ── Intent & Priority (CRM webhook — preserved, regex 8 intents) ──
export function classifyIntent(messageText: string): string {
  const text = (messageText || '').toLowerCase();
  if (/passport|bank statement|transcript|nid|document|certificate|submit|upload/.test(text)) return 'DOCUMENT_REQUIREMENT';
  if (/payment|pay|fees|deposit|money|transfer|receipt/.test(text)) return 'PAYMENT_QUESTION';
  if (/visa|cas|i-20|coe|biometric|embassy|appointment/.test(text)) return 'VISA_QUESTION';
  if (/offer|admission|university|apply|application|accepted|rejected/.test(text)) return 'APPLICATION_QUESTION';
  if (/ielts|toefl|sat|gre|gmat|exam|test|score/.test(text)) return 'TEST_PREPARATION';
  if (/urgent|asap|emergency|deadline|tomorrow|today/.test(text)) return 'URGENT';
  if (/interview|counselor|appointment|meet|office/.test(text)) return 'APPOINTMENT';
  return 'GENERAL';
}
export function detectPriority(intent: string, text: string): string {
  if (intent === 'URGENT') return 'critical';
  if (/payment|visa|cas|coe|i-20|deadline/.test((text || '').toLowerCase())) return 'high';
  if (intent === 'DOCUMENT_REQUIREMENT' || intent === 'PAYMENT_QUESTION') return 'high';
  return 'normal';
}

// ── Student ID generation (main webhook) ──
// Sequence-allocated AE-YYYYNNNNN identifier (committed, never reused).
export async function generateStudentId(_db?: unknown): Promise<string> {
  return allocateIdentifierCommitted('AE');
}

// ── Helpers re-exported for convenience (so callers can import from single handler) ──
export { determineSenderNumber, MAIN_NUMBER, COO_NUMBER, OFFICIAL_NUMBERS } from '@/lib/whatsapp-number-pool';
export { detectLanguage, detectIntent, detectSentiment, generateAiReply, logAiOperation, calculateLeadScore } from '@/lib/ai-whatsapp-engine';
export { startSlaForThread, calculateSlaDueAt } from '@/lib/sla-engine';
export { handleStopStartCommand, createFollowUpScheduleForStudent } from '@/lib/whatsapp-followup-engine';
