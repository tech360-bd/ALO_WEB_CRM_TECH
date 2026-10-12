import { NextResponse } from 'next/server';
import { verifyHttpsmsSignature } from '@/lib/httpsms-webhook';
import { applyHttpsmsReceipt, SmsReceiptError } from '@/lib/httpsms-receipts';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  if (!process.env.HTTPSMS_WEBHOOK_SIGNING_KEY || !process.env.HTTPSMS_WEBHOOK_URL || !process.env.HTTPSMS_WEBHOOK_SUBJECT) {
    return NextResponse.json({ error: 'SMS webhook is not configured.' }, { status: 503 });
  }
  if (!await verifyHttpsmsSignature(request, '')) return NextResponse.json({ error: 'Invalid webhook authentication.' }, { status: 401 });
  // Bound even chunked bodies before JSON parsing; never log bearer tokens,
  // message content, phone numbers or provider payloads.
  const reader = request.body?.getReader();
  if (!reader) return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
  let text = '';
  try {
    const chunks: Uint8Array[] = []; let bytes = 0;
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      bytes += value.byteLength;
      if (bytes > 32_768) { await reader.cancel(); return NextResponse.json({ error: 'Webhook payload is too large.' }, { status: 413 }); }
      chunks.push(value);
    }
    text = Buffer.concat(chunks).toString('utf8');
    const result = await applyHttpsmsReceipt(JSON.parse(text));
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    if (error instanceof SyntaxError) return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
    if (error instanceof SmsReceiptError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Receipt persistence unavailable. Retry this event later, not the SMS send.' }, { status: 503 });
  }
}
