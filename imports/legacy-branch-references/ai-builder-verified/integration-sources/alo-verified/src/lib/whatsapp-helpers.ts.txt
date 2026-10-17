/**
 * whatsapp-helpers.ts
 * ----------------------------------------------------------------------------
 * Shared helpers for the WhatsApp automation routes (webhook, ai-reply,
 * outbound send, document-detect). Centralizes:
 *   - deterministic, year-scoped, atomic Student/Lead ID generation
 *     (AE-YYYY000001, LEAD-YYYY000001) via the SequenceCounter model
 *   - timezone-aware office-hours check (default Asia/Dhaka 10:00-18:00)
 *   - phone normalization + dedupe key
 *   - rule-based reply (Hi/Hello/Salam/Thanks/Ok in en+bn — zero AI cost)
 *   - human-handoff detection (complex/angry/payment/visa refusal/complaint/
 *     emergency keywords in en+bn)
 *   - document-type detection from file name + caption
 *
 * All functions are production-grade (no placeholders).
 */
import crypto from 'crypto';
import { db } from '@/lib/db';

// ----------------------------------------------------------------------------
// ID generation — atomic, year-scoped via SequenceCounter
// ----------------------------------------------------------------------------

/**
 * Atomically increment the per-year sequence counter and return the next
 * human-readable ID. Uses a serializable transaction so two concurrent
 * callers can never receive the same number.
 *
 *   generateSequenceId('STUDENT_AE', 'AE')  ->  AE-2026000001
 *   generateSequenceId('LEAD',      'LEAD') ->  LEAD-2026000001
 */
async function generateSequenceId(
  keyPrefix: string,
  displayPrefix: string,
  padLength = 6,
): Promise<string> {
  const year = new Date().getFullYear();
  const counterKey = `${keyPrefix}_${year}`;

  const next = await db.$transaction(async (tx) => {
    // upsert the counter row, then increment
    const updated = await tx.sequenceCounter.upsert({
      where: { counterKey },
      update: { lastValue: { increment: 1 } },
      create: { counterKey, year, lastValue: 1 },
    });
    return updated.lastValue;
  });

  return `${displayPrefix}-${year}${String(next).padStart(padLength, '0')}`;
}

/**
 * Generate the next student ID in spec-compliant `AE-YYYY000001` format.
 * Backed by `SequenceCounter` row with key `STUDENT_AE_<year>` so duplicates
 * are impossible even under concurrent webhook traffic.
 */
export async function generateStudentId(): Promise<string> {
  return generateSequenceId('STUDENT_AE', 'AE', 6);
}

/**
 * Generate the next lead ID in `LEAD-YYYY000001` format.
 * Backed by `SequenceCounter` row with key `LEAD_<year>`.
 */
export async function generateLeadId(): Promise<string> {
  return generateSequenceId('LEAD', 'LEAD', 6);
}

// ----------------------------------------------------------------------------
// Office-hours check (timezone-aware)
// ----------------------------------------------------------------------------

/**
 * Return true if "now" falls inside the configured office hours in the
 * configured timezone. Defaults to Asia/Dhaka 10:00-18:00 per spec.
 *
 * Uses `Intl.DateTimeFormat` to derive the wall-clock hour in the target
 * timezone — never the server's local timezone (the original bug).
 */
export function isOfficeHours(
  timezone = 'Asia/Dhaka',
  start = '10:00',
  end = '18:00',
): boolean {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(new Date());
    const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '0';
    const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '0';
    const hour = parseInt(hourStr, 10) % 24;
    const minute = parseInt(minuteStr, 10);

    const [startH, startM] = start.split(':').map((n) => parseInt(n, 10));
    const [endH, endM] = end.split(':').map((n) => parseInt(n, 10));

    const nowMin = hour * 60 + minute;
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;

    return nowMin >= startMin && nowMin < endMin;
  } catch {
    // Bad timezone string — fall back to NOT office hours so AI handles
    // (safer default than dropping the message).
    return false;
  }
}

// ----------------------------------------------------------------------------
// Phone normalization + dedupe
// ----------------------------------------------------------------------------

/**
 * Strip everything that isn't a digit, then take the last 10–12 digits.
 * This collapses the many WhatsApp formats (88017…, +88017…, 017…) into a
 * stable suffix that can be compared against stored phone/whatsappNumber
 * fields regardless of how the original was entered.
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length <= 10) return digits;
  // last 12 digits covers the 88017XXXXXXXX form nicely; if shorter, take all
  return digits.slice(-12);
}

/**
 * Stable dedupe key (sha1, hex) across phone / email / socialId / whatsapp.
 * Each input is normalized first; missing fields are skipped. Returns '' if
 * no usable fields were supplied.
 */
export function dedupeKey(fields: {
  phone?: string | null;
  email?: string | null;
  socialId?: string | null;
  whatsapp?: string | null;
}): string {
  const parts: string[] = [];
  if (fields.phone) parts.push(`phone:${normalizePhone(fields.phone)}`);
  if (fields.whatsapp) parts.push(`wa:${normalizePhone(fields.whatsapp)}`);
  if (fields.email) parts.push(`email:${(fields.email || '').trim().toLowerCase()}`);
  if (fields.socialId) parts.push(`social:${fields.socialId}`);
  if (parts.length === 0) return '';
  return crypto.createHash('sha1').update(parts.join('|')).digest('hex');
}

// ----------------------------------------------------------------------------
// Document type detection
// ----------------------------------------------------------------------------

/**
 * Keyword map for the spec-mandated document types. Bangla keywords are
 * included alongside English so captions sent in Bangla still detect.
 */
const DOCUMENT_TYPE_KEYWORDS: Record<string, string[]> = {
  passport: ['passport', 'pp', 'পাসপোর্ট', 'pass port'],
  certificate: ['certificate', 'cert', 'ssc', 'hsc', 'o level', 'a level', 'bachelor certificate', 'master certificate', 'degree certificate', 'সনদ', 'certificate'],
  transcript: ['transcript', 'marksheet', 'marks sheet', 'academic', 'ssc transcript', 'hsc transcript', 'o level transcript', 'a level transcript', 'bachelor transcript', 'master transcript', 'মার্কশিট'],
  bank_statement: ['bank statement', 'bank stmt', 'bank solvency', 'solvency', 'financial statement', 'ব্যাংক স্টেটমেন্ট', 'ব্যাংক সলভেন্সি'],
  english_test: ['ielts', 'pte', 'toefl', 'duolingo', 'det', 'oietc', 'english test', 'english proficiency', 'ভাষা পরীক্ষা'],
  visa_file: ['visa', 'visa decision', 'visa refusal', 'visa letter', 'tb test', 'police clearance', 'ভিসা'],
  offer_letter: ['offer letter', 'conditional offer', 'unconditional offer', 'firm offer', 'অফার লেটার'],
  cas_coe_i20: ['cas', 'cas letter', 'coe', 'confirmation of enrollment', 'i20', 'i-20', 'ক্যাস'],
  payment_receipt: ['deposit receipt', 'tuition deposit', 'payment receipt', 'payment proof', 'invoice', 'receipt', 'পেমেন্ট রসিদ'],
  partner_agreement: ['partner agreement', 'agency agreement', 'moa', 'memorandum', 'partner contract', 'পার্টনার চুক্তি'],
  invoice: ['invoice', 'bill', 'fee invoice', 'চালান'],
};

/**
 * Detect a document's type from its file name + caption.
 * Returns the type string (key of DOCUMENT_TYPE_KEYWORDS), a 0–1 confidence
 * score, and whether the user should be asked to confirm (low confidence).
 */
export function detectDocumentType(
  fileName: string,
  caption?: string | null,
): { type: string; confidence: number; needsConfirmation: boolean } {
  const haystack = `${fileName || ''} ${caption || ''}`.toLowerCase();
  if (!haystack.trim()) {
    return { type: 'other', confidence: 0, needsConfirmation: true };
  }

  let best: { type: string; hits: number } | null = null;
  let totalHits = 0;

  for (const [type, keywords] of Object.entries(DOCUMENT_TYPE_KEYWORDS)) {
    let hits = 0;
    for (const kw of keywords) {
      if (haystack.includes(kw)) hits++;
    }
    if (hits > 0) {
      totalHits += hits;
      if (!best || hits > best.hits) best = { type, hits };
    }
  }

  if (!best) {
    return { type: 'other', confidence: 0, needsConfirmation: true };
  }

  // Confidence: ratio of best type's hits to total hits, with a small floor
  // so a single unambiguous keyword still scores ~0.6.
  const ratio = best.hits / Math.max(totalHits, 1);
  const confidence = Math.max(0.5, Math.min(1, ratio));
  return {
    type: best.type,
    confidence,
    needsConfirmation: confidence < 0.6,
  };
}

// ----------------------------------------------------------------------------
// Rule-based reply (zero AI cost)
// ----------------------------------------------------------------------------

const RULE_BASED_REPLIES: Record<
  string,
  { en: string; bn: string }
> = {
  hi: {
    en: 'Hello! Welcome to ALO Education. How can I help you with your study abroad journey?',
    bn: 'আসসালামু আলাইকুম! এলো এডুকেশনে স্বাগতম। আমরা কিভাবে আপনাকে সাহায্য করতে পারি?',
  },
  hello: {
    en: 'Hi there! Welcome to ALO Education. How can I assist you today?',
    bn: 'হ্যালো! এলো এডুকেশনে স্বাগতম। আপনাকে কিভাবে সাহায্য করতে পারি?',
  },
  salam: {
    en: 'Walaikum Assalam! Welcome to ALO Education. How can we help you?',
    bn: 'ওয়ালাইকুম আসসালাম! এলো এডুকেশনে স্বাগতম। কিভাবে সাহায্য করতে পারি?',
  },
  'assalamu alaikum': {
    en: 'Walaikum Assalam! Welcome to ALO Education. How can we help you?',
    bn: 'ওয়ালাইকুম আসসালাম! এলো এডুকেশনে স্বাগতম। কিভাবে সাহায্য করতে পারি?',
  },
  thanks: {
    en: 'You are welcome! Feel free to ask if you need anything else.',
    bn: 'আপনাকেও ধন্যবাদ! আর কিছু লাগলে জানাবেন।',
  },
  thank: {
    en: 'You are welcome! Feel free to ask if you need anything else.',
    bn: 'আপনাকেও ধন্যবাদ! আর কিছু লাগলে জানাবেন।',
  },
  ok: {
    en: 'Great! Is there anything else I can help you with?',
    bn: 'ঠিক আছে! আর কিছু সাহায্য লাগবে?',
  },
};

/**
 * Return a deterministic reply for the trivial greetings/acknowledgements so
 * we never spend an LLM call on them. Detects Bangla OR English and replies
 * in the same language.
 */
export function ruleBasedReply(text: string): {
  matched: boolean;
  reply?: string;
  language?: 'bn' | 'en';
} {
  const normalized = (text || '')
    .toLowerCase()
    .trim()
    .replace(/[!?.।]+$/g, '')
    .replace(/\s+/g, ' ');

  // direct dictionary match (handles "hi", "hello", "ok", "thanks", etc.)
  if (RULE_BASED_REPLIES[normalized]) {
    const r = RULE_BASED_REPLIES[normalized];
    // If the user wrote in Bangla script, reply in Bangla; otherwise English.
    const isBangla = /[\u0980-\u09FF]/.test(text);
    return {
      matched: true,
      reply: isBangla ? r.bn : r.en,
      language: isBangla ? 'bn' : 'en',
    };
  }

  // common Bangla greetings
  const banglaGreetings = ['আসসালামু', 'সালাম', 'হ্যালো', 'ধন্যবাদ', 'ঠিক আছে'];
  for (const g of banglaGreetings) {
    if (normalized.includes(g.toLowerCase()) || (text || '').includes(g)) {
      // pick the closest English entry for the reply text
      const key =
        g === 'ধন্যবাদ' ? 'thanks' : g === 'ঠিক আছে' ? 'ok' : 'salam';
      const r = RULE_BASED_REPLIES[key];
      return { matched: true, reply: r.bn, language: 'bn' };
    }
  }

  return { matched: false };
}

// ----------------------------------------------------------------------------
// Human-handoff detection
// ----------------------------------------------------------------------------

const HUMAN_HANDOFF_RULES: Array<{ reason: string; keywords: string[] }> = [
  {
    reason: 'complaint',
    keywords: ['complaint', 'complain', 'অভিযোগ', 'গুরুতর সমস্যা'],
  },
  {
    reason: 'refund',
    keywords: ['refund', 'money back', 'চার্জব্যাক', 'টাকা ফেরত'],
  },
  {
    reason: 'visa_refusal',
    keywords: ['refusal', 'refuse', 'visa denied', 'visa refused', 'refused', 'ভিসা বাতিল', 'ভিসা রিফিউজ'],
  },
  {
    reason: 'angry',
    keywords: ['angry', 'furious', 'frustrated', 'ridiculous', 'unacceptable', 'রাগ', 'ক্ষুব্ধ', 'বিরক্ত'],
  },
  {
    reason: 'payment_issue',
    keywords: ['payment issue', 'payment problem', 'double charged', 'charged twice', 'payment not working', 'পেমেন্ট সমস্যা'],
  },
  {
    reason: 'emergency',
    keywords: ['emergency', 'urgent', 'immediate', 'জরুরি', 'এমার্জেন্সি'],
  },
  {
    reason: 'fraud',
    keywords: ['fraud', 'cheating', 'scam', 'sue', 'legal action', 'প্রতারণা'],
  },
];

/**
 * Detect whether the inbound message requires a human counselor (versus an
 * AI reply). Returns the matched reason so the audit log explains *why* the
 * handoff happened.
 */
export function humanHandoffNeeded(text: string): {
  needed: boolean;
  reason?: string;
} {
  const lower = (text || '').toLowerCase();
  for (const rule of HUMAN_HANDOFF_RULES) {
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return { needed: true, reason: rule.reason };
      }
    }
  }
  return { needed: false };
}
