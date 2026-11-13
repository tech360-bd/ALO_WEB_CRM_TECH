import type { NextRequest } from 'next/server';
import {
  GET as verifyCanonicalWhatsAppWebhook,
  POST as processCanonicalWhatsAppWebhook,
} from '@/app/api/whatsapp/webhook/route';

/**
 * Backwards-compatible UCC webhook URL.
 *
 * Both historical WhatsApp callback URLs intentionally delegate to the same
 * signed, idempotent ingestion pipeline. Keeping a second message/lead/contact
 * implementation here allowed the same provider event to create parallel CRM
 * rows and bypass the current contact registry, consent, media, and assignment
 * checks. The canonical handler now persists both UCC and legacy inbox records.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  return verifyCanonicalWhatsAppWebhook(request as NextRequest);
}

export async function POST(request: Request) {
  return processCanonicalWhatsAppWebhook(request as NextRequest);
}
