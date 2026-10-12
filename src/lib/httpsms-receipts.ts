import { db } from '@/lib/db';
import { normalizeSmsNumber } from '@/lib/sms-gateway';

const RECEIPTS: Record<string, string> = {
  'message.phone.sent': 'SENT', 'message.phone.delivered': 'DELIVERED',
  'message.send.failed': 'FAILED', 'message.send.expired': 'EXPIRED',
};
function object(raw: unknown): Record<string, unknown> { return raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {}; }
export class SmsReceiptError extends Error { constructor(readonly status: number, message: string) { super(message); } }
/** Call only AFTER JWT verification. No receipt content or JWT is persisted.
 * Event identity and a conditional status update commit in one transaction.
 * Unknown/missing correlation is rejected for reconciliation, never guessed.
 */
export async function applyHttpsmsReceipt(raw: unknown) {
  const event = object(raw), data = object(event.data);
  const type = typeof event.type === 'string' ? event.type : '';
  const status = RECEIPTS[type];
  if (!status) throw new SmsReceiptError(422, 'Only outbound delivery lifecycle events are supported.');
  const provider = process.env.HTTPSMS_WEBHOOK_PROVIDER || 'httpsms';
  if (!['httpsms', 'domovina'].includes(provider)) throw new SmsReceiptError(503, 'Webhook provider is not configured.');
  if (event.specversion !== '1.0' || typeof event.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(event.id)) throw new SmsReceiptError(400, 'Invalid CloudEvent identity.');
  const messageId = type === 'message.send.expired' ? data.message_id : data.id;
  if (typeof messageId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(messageId) || data.user_id !== process.env.HTTPSMS_WEBHOOK_SUBJECT) throw new SmsReceiptError(400, 'Invalid receipt ownership or message identity.');
  // Upstream expiration may be transient/retried. Only final expiry terminates.
  if (type === 'message.send.expired' && typeof data.is_final !== 'boolean') throw new SmsReceiptError(400, 'Final-expiry flag is required.');
  let owner: string, contact: string;
  try { owner = normalizeSmsNumber(String(data.owner || '')); contact = normalizeSmsNumber(String(data.contact || '')); }
  catch { throw new SmsReceiptError(400, 'Invalid receipt sender or recipient.'); }
  const timestamp = new Date(String(data.timestamp || ''));
  if (!Number.isFinite(timestamp.getTime()) || timestamp.getTime() > Date.now() + 60_000) throw new SmsReceiptError(400, 'Invalid receipt timestamp.');
  try {
    return await db.$transaction(async (tx) => {
      const duplicate = await tx.webhookEvent.findUnique({ where: { provider_eventId: { provider, eventId: event.id as string } } });
      if (duplicate?.processed) return { duplicate: true, applied: false };
      const log = await tx.smsLog.findUnique({ where: { provider_providerMessageId: { provider, providerMessageId: messageId } } });
      if (!log || log.direction !== 'OUTBOUND' || log.fromNumber !== owner || log.toNumber !== contact) throw new SmsReceiptError(409, 'No matching outbound intent. Provider reconciliation is required.');
      // Monotonic precedence. DELIVERED is terminal; SENT cannot be rolled back
      // by late pending/failure events. No authentication code is made valid.
      const allowed = status === 'DELIVERED'
        ? ['PENDING', 'ACCEPTED', 'QUEUED', 'SENDING', 'SENT', 'FAILED', 'EXPIRED', 'UNKNOWN']
        : status === 'SENT' ? ['PENDING', 'ACCEPTED', 'QUEUED', 'SENDING', 'UNKNOWN']
          : ['PENDING', 'ACCEPTED', 'QUEUED', 'SENDING', 'UNKNOWN'];
      const final = type !== 'message.send.expired' || data.is_final === true;
      const changed = final ? await tx.smsLog.updateMany({ where: { id: log.id, deliveryStatus: { in: allowed } }, data: { deliveryStatus: status, ...(status === 'SENT' ? { sentAt: timestamp } : {}) } }) : { count: 0 };
      await tx.webhookEvent.create({ data: { provider, eventId: event.id as string, eventType: type, payload: JSON.stringify({ messageId, status, timestamp: timestamp.toISOString(), final }), verified: true, processed: true, processedAt: new Date() } });
      return { duplicate: false, applied: changed.count === 1 };
    });
  } catch (error) {
    // A concurrent duplicate loses the unique event-ID insert and rolls back
    // its status update. Provider replay is safe and acknowledged.
    if (object(error).code === 'P2002') return { duplicate: true, applied: false };
    throw error;
  }
}
