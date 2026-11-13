import { NextResponse } from 'next/server';
import { SmsReceiptError } from '@/lib/httpsms-receipts';
import { applyOpensmsReceipt, verifyOpensmsSignature } from '@/lib/opensms-webhook';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const secret = process.env.OPENSMS_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: 'OpenSMS webhook is not configured.' }, { status: 503 });
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return NextResponse.json({ error: 'Request body is required.' }, { status: 400 });
  }

  try {
    const chunks: Uint8Array[] = [];
    let bytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 32_768) {
        await reader.cancel();
        return NextResponse.json({ error: 'Webhook payload is too large.' }, { status: 413 });
      }
      chunks.push(value);
    }

    const rawBody = Buffer.concat(chunks).toString('utf8');
    if (!verifyOpensmsSignature(request, rawBody)) {
      return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 401 });
    }

    const result = await applyOpensmsReceipt(JSON.parse(rawBody));
    return NextResponse.json({ received: true, ...result });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
    }
    if (error instanceof SmsReceiptError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: 'OpenSMS receipt persistence unavailable. Retry this event later, not the SMS send.' },
      { status: 503 },
    );
  }
}
