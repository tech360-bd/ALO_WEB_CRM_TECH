import { NextRequest, NextResponse } from 'next/server';
import { GET as canonicalWhatsAppVerification, POST as canonicalWhatsAppWebhook } from '@/app/api/whatsapp/webhook/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Compatibility alias for old Meta/WhatsApp webhook URLs. Keep the exact same
 * signature verification, media validation, idempotency and private-storage
 * pipeline as the canonical WhatsApp route; never ingest an unverified copy. */
function isWhatsAppProvider(provider: string): boolean {
  return ['whatsapp', 'meta_business'].includes(provider.toLowerCase());
}

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!isWhatsAppProvider(provider)) {
    return NextResponse.json({ success: false, error: 'No verified webhook handler is configured for this provider.' }, { status: 404 });
  }
  return canonicalWhatsAppVerification(request);
}

export async function POST(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider } = await context.params;
  if (!isWhatsAppProvider(provider)) {
    return NextResponse.json({ success: false, error: 'No verified webhook handler is configured for this provider.' }, { status: 404 });
  }
  return canonicalWhatsAppWebhook(request);
}
