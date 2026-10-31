/** Server-only SMS transport. Callers own authentication, consent and rate limits.
 * httpSMS and the Domovina fork use x-api-key, E.164 sender/recipient and data.id.
 * An accepted request is not proof of handset delivery. No automatic send retries.
 */
import { db } from '@/lib/db';

export type SmsProvider = 'httpsms' | 'domovina' | 'opensms' | 'threecx' | 'generic';
export interface SendSmsOpts {
  to: string;
  message: string;
  from?: string;
  provider?: SmsProvider;
  studentId?: string;
  applicationId?: string;
  requireDeliveryReceipt?: boolean;
  /** Never persist OTPs or other authentication material in the message log. */
  sensitive?: boolean;
}
export class SmsDeliveryError extends Error {
  constructor(readonly outcome: 'rejected' | 'unknown', message: string) {
    super(message);
    this.name = 'SmsDeliveryError';
  }
}
export function normalizeSmsNumber(raw: string): string {
  if (typeof raw !== 'string' || !/^[+\d\s().-]+$/.test(raw)) throw new Error('A valid SMS phone number is required.');
  let digits = raw.replace(/[^\d]/g, '');
  if (/^01\d{9}$/.test(digits)) digits = `880${digits.slice(1)}`;
  if (!/^[1-9]\d{7,14}$/.test(digits)) throw new Error('Use an international phone number with country code.');
  return `+${digits}`;
}
function configuredUrl(raw: string): string {
  const url = new URL(raw);
  if (url.protocol !== 'https:' || url.username || url.password || url.hash || url.search) {
    throw new Error('SMS provider URL must use HTTPS without credentials, query or fragment.');
  }
  return url.toString().replace(/\/$/, '');
}
function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export async function sendSms(opts: SendSmsOpts): Promise<{ messageId: string; provider: SmsProvider; status: string; auditPersisted: boolean }> {
  const to = normalizeSmsNumber(opts.to);
  if (typeof opts.message !== 'string' || !opts.message.trim() || opts.message.length > 1800) {
    throw new Error('SMS message must contain 1–1800 characters.');
  }
  const provider = opts.provider || process.env.SMS_PROVIDER || 'generic';
  if (!['httpsms', 'domovina', 'opensms', 'threecx', 'generic'].includes(provider)) throw new Error('Unsupported SMS provider.');
  if (provider === 'threecx') throw new Error('3CX outbound SMS transport is not implemented; the journal is not a sending API.');
  if (opts.requireDeliveryReceipt) throw new Error('Synchronous delivery receipts are not supported. Provider acceptance is not delivery.');

  let url: string;
  let from: string;
  let headers: Record<string, string>;
  let payload: Record<string, string>;
  if (provider === 'httpsms' || provider === 'domovina') {
    const base = provider === 'domovina' ? process.env.DOMOVINA_SMS_URL : process.env.HTTPSMS_BASE_URL || 'https://api.httpsms.com';
    const key = process.env.HTTPSMS_API_KEY || process.env.HTTPSMS_TOKEN;
    // Legacy PHONE_ID is the gateway's E.164 phone number, NOT a secret or JWT key.
    const sender = opts.from || process.env.HTTPSMS_FROM || process.env.HTTPSMS_PHONE_ID;
    if (!base || !key || !sender) throw new Error('httpSMS URL, API key and sender phone number are required.');
    from = normalizeSmsNumber(sender);
    url = `${configuredUrl(base)}/v1/messages/send`;
    headers = { 'Content-Type': 'application/json', 'x-api-key': key };
    payload = { from, to, content: opts.message };
  } else if (provider === 'opensms') {
    // Verified upstream contract: daslearning-org/OpenSMS app/services/postApi.py
    // FastAPI route `@app.post("/sms/")` requires the trailing slash so uvicorn
    // does not emit a 307 redirect, uses HTTPBearer (`osms_...`), accepts
    // `{ number: "+880...", text: "..." }`, and returns `{ stat: boolean }`.
    const base = process.env.OPENSMS_BASE_URL;
    const key = process.env.OPENSMS_API_KEY;
    if (!base || !key) throw new Error('OpenSMS URL and API key are required.');
    const rawSender = opts.from || process.env.OPENSMS_FROM;
    from = rawSender ? normalizeSmsNumber(rawSender) : 'opensms-default-sim';
    url = `${configuredUrl(base)}/sms/`;
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
    payload = { number: to, text: opts.message };
  } else {
    const key = process.env.SMS_PROVIDER_API_KEY;
    const base = process.env.SMS_PROVIDER_URL;
    if (!base || !key) throw new Error('Generic SMS provider URL and API key are required.');
    url = configuredUrl(base);
    from = opts.from || process.env.SMS_SENDER_ID || '';
    headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` };
    payload = { to, text: opts.message, from };
  }

  // Persist intent BEFORE contacting a paid provider; a database outage must not send.
  const log = await db.smsLog.create({ data: {
    provider, direction: 'OUTBOUND', fromNumber: from, toNumber: to,
    messageText: opts.sensitive ? '[REDACTED: authentication message]' : opts.message,
    deliveryStatus: 'PENDING', studentId: opts.studentId,
  } });
  const record = async (status: string, providerMessageId?: string) => {
    try {
      await db.smsLog.update({ where: { id: log.id }, data: {
        deliveryStatus: status,
        ...(providerMessageId ? { providerMessageId } : {}),
        ...(status === 'SENT' || status === 'DELIVERED' ? { sentAt: new Date() } : {}),
      } });
      return true;
    } catch {
      // Never throw after acceptance: that would invite duplicate OTPs/paid sends.
      // No phone, message, credentials or provider response in this log.
      console.error('[sms] Status reconciliation required', { logId: log.id, status });
      return false;
    }
  };

  let response: Response;
  try {
    response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), redirect: 'error', signal: AbortSignal.timeout(15_000) });
  } catch {
    await record('UNKNOWN');
    throw new SmsDeliveryError('unknown', 'SMS provider acceptance is unknown. Do not automatically retry.');
  }
  if (!response.ok) {
    await record(response.status >= 500 ? 'UNKNOWN' : 'FAILED');
    throw new SmsDeliveryError(response.status >= 500 ? 'unknown' : 'rejected', `SMS provider returned HTTP ${response.status}.`);
  }
  let json: Record<string, unknown>;
  try { json = object(await response.json()); } catch { json = {}; }
  if (provider === 'opensms') {
    if (json.stat === false) {
      await record('FAILED');
      throw new SmsDeliveryError('rejected', 'OpenSMS Android gateway failed to dispatch the message.');
    }
    if (json.stat !== true) {
      await record('UNKNOWN');
      throw new SmsDeliveryError('unknown', 'OpenSMS gateway returned an unrecognized acknowledgement. Do not automatically retry.');
    }
    const upstreamId = typeof json.id === 'string' && json.id.trim() && json.id.length <= 191 && !/[\x00-\x1f]/.test(json.id)
      ? json.id.trim()
      : `opensms:${log.id}`;
    const auditPersisted = await record('SENT', upstreamId);
    return { messageId: upstreamId, provider: 'opensms', status: 'sent', auditPersisted };
  }
  const data = provider === 'generic' ? json : object(json.data);
  const messageId = data.id;
  const status = typeof data.status === 'string' ? data.status.toLowerCase() : 'accepted';
  if (json.status === 'error' || json.success === false || ['failed', 'error', 'rejected', 'expired'].includes(status)) {
    await record('FAILED');
    throw new SmsDeliveryError('rejected', 'SMS provider rejected the message.');
  }
  if (typeof messageId !== 'string' || !messageId.trim() || messageId.length > 191 || /[\x00-\x1f]/.test(messageId) || !['accepted', 'pending', 'queued', 'sending', 'sent', 'delivered'].includes(status)) {
    await record('UNKNOWN');
    throw new SmsDeliveryError('unknown', 'SMS provider returned an unrecognized acknowledgement. Do not automatically retry.');
  }
  const auditPersisted = await record(status.toUpperCase(), messageId);
  return { messageId, provider: provider as SmsProvider, status, auditPersisted };
}

// Compatibility export. Async: callers MUST await the verification result.
export { verifyHttpsmsSignature } from './httpsms-webhook';
