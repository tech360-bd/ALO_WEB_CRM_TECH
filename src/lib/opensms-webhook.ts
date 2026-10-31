import { createHmac, timingSafeEqual } from 'node:crypto';
import { db } from '@/lib/db';
import { normalizeSmsNumber } from '@/lib/sms-gateway';
import { SmsReceiptError } from '@/lib/httpsms-receipts';

/**
 * Signed receipt bridge for OpenSMS (`daslearning-org/OpenSMS`).
 *
 * Honesty note: upstream OpenSMS `v0.3.0` (`app/services/postApi.py`) exposes
 * `POST /sms/` (`{ stat: boolean }`) and does not natively emit outbound
 * webhooks. When an operator runs a reverse-proxy or Android BroadcastReceiver
 * bridge in front of OpenSMS, it signs callbacks with `OPENSMS_WEBHOOK_SECRET`
 * (`x-opensms-signature: sha256=<hex>`) to reconcile `SmsLog` rows safely.
 *
 * Rules enforced:
 *   - Fails closed if `OPENSMS_WEBHOOK_SECRET` is unset or shorter than 32 chars.
 *   - Constant-time HMAC-SHA256 verification over the raw request body.
 *   - Deduplicates by `(provider='opensms', eventId)` in `WebhookEvent`.
 *   - Never stores message text / OTP content in `WebhookEvent.payload`.
 *   - Monotonic status updates: `DELIVERED` is terminal; late failures never
 *     downgrade `SENT` or `DELIVERED`.
 */

const RECEIPT_STATUS_MAP: Record<string, 'SENT' | 'DELIVERED' | 'FAILED'> = {
  'sms.sent': 'SENT',
  'sms.delivered': 'DELIVERED',
  'sms.failed': 'FAILED',
};

function asObject(raw: unknown): Record<string, unknown> {
  return raw !== null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

export function verifyOpensmsSignature(req: Request, rawBody: string): boolean {
  const secret = process.env.OPENSMS_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) return false;
  const header = req.headers.get('x-opensms-signature') || '';
  if (!header.startsWith('sha256=')) return false;
  const providedHex = header.slice('sha256='.length).trim();
  if (!/^[0-9a-fA-F]{64}$/.test(providedHex)) return false;

  const expectedHex = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const a = Buffer.from(providedHex.toLowerCase(), 'hex');
  const b = Buffer.from(expectedHex, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function applyOpensmsReceipt(raw: unknown): Promise<{ duplicate: boolean; applied: boolean }> {
  const event = asObject(raw);
  const eventId = typeof event.eventId === 'string' ? event.eventId.trim() : '';
  const eventType = typeof event.type === 'string' ? event.type.trim() : '';
  const status = RECEIPT_STATUS_MAP[eventType];
  if (!status) {
    throw new SmsReceiptError(422, 'Unsupported OpenSMS event type. Expected sms.sent, sms.delivered, or sms.failed.');
  }
  if (!eventId || !/^[a-zA-Z0-9:_-]{1,128}$/.test(eventId)) {
    throw new SmsReceiptError(400, 'A valid eventId is required.');
  }

  const messageId = typeof event.messageId === 'string' ? event.messageId.trim() : '';
  if (!messageId || messageId.length > 191 || /[\x00-\x1f]/.test(messageId)) {
    throw new SmsReceiptError(400, 'A valid messageId is required.');
  }

  let toNumber: string;
  try {
    toNumber = normalizeSmsNumber(String(event.to || ''));
  } catch {
    throw new SmsReceiptError(400, 'A valid E.164 recipient number is required.');
  }

  const timestamp = new Date(String(event.timestamp || ''));
  if (!Number.isFinite(timestamp.getTime()) || timestamp.getTime() > Date.now() + 60_000) {
    throw new SmsReceiptError(400, 'A valid receipt timestamp is required.');
  }

  try {
    return await db.$transaction(async (tx) => {
      const duplicate = await tx.webhookEvent.findUnique({
        where: { provider_eventId: { provider: 'opensms', eventId } },
      });
      if (duplicate?.processed) return { duplicate: true, applied: false };

      const log = await tx.smsLog.findUnique({
        where: { provider_providerMessageId: { provider: 'opensms', providerMessageId: messageId } },
      });
      if (!log || log.direction !== 'OUTBOUND' || log.toNumber !== toNumber) {
        throw new SmsReceiptError(409, 'No matching outbound OpenSMS log row. Reconciliation required.');
      }

      const allowedFrom =
        status === 'DELIVERED'
          ? ['PENDING', 'ACCEPTED', 'QUEUED', 'SENDING', 'SENT', 'FAILED', 'UNKNOWN']
          : ['PENDING', 'ACCEPTED', 'QUEUED', 'SENDING', 'UNKNOWN'];

      const updated = await tx.smsLog.updateMany({
        where: { id: log.id, deliveryStatus: { in: allowedFrom } },
        data: {
          deliveryStatus: status,
          ...(status === 'SENT' ? { sentAt: timestamp } : {}),
        },
      });

      await tx.webhookEvent.create({
        data: {
          provider: 'opensms',
          eventId,
          eventType,
          payload: JSON.stringify({ messageId, status, timestamp: timestamp.toISOString() }),
          verified: true,
          processed: true,
          processedAt: new Date(),
        },
      });

      return { duplicate: false, applied: updated.count === 1 };
    });
  } catch (error) {
    if (asObject(error).code === 'P2002') return { duplicate: true, applied: false };
    throw error;
  }
}
