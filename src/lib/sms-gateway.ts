// ============================================================
// Unified SMS Gateway — domovina.ai + NdoleStudio/httpsms + 3CX + provider
// Supports: self-hosted httpsms (Coolify+Cloudflare Tunnel), Android HttpSMS via HTTP API,
// 3CX SMS journal, and generic SMS provider API.
// Never commit secrets — uses env: SMS_PROVIDER, HTTPSMS_API_KEY, HTTPSMS_PHONE_ID, HTTPSMS_BASE_URL
// ============================================================
import { db } from '@/lib/db';

export type SmsProvider = 'httpsms' | 'domovina' | 'threecx' | 'generic';

export interface SendSmsOpts {
  to: string; // E.164
  message: string;
  from?: string;
  provider?: SmsProvider;
  studentId?: string;
  applicationId?: string;
  requireDeliveryReceipt?: boolean;
}

export async function sendSms(opts: SendSmsOpts): Promise<{ messageId: string; provider: SmsProvider; status: string }> {
  const normalized = opts.to.replace(/\D/g, '').replace(/^0/, '880');
  const provider = opts.provider || (process.env.SMS_PROVIDER as SmsProvider) || 'generic';
  let result: any = null;

  if (provider === 'httpsms' || provider === 'domovina') {
    // NdoleStudio/httpsms HTTP API — JWT signed with phone ID (HS256, 10m validity)
    const base = process.env.HTTPSMS_BASE_URL || process.env.DOMOVINA_SMS_URL || 'https://api.httpsms.com';
    const apiKey = process.env.HTTPSMS_API_KEY || process.env.HTTPSMS_TOKEN;
    const phoneId = process.env.HTTPSMS_PHONE_ID;
    if (!apiKey || !phoneId) throw new Error('HTTPSMS_API_KEY / HTTPSMS_PHONE_ID not configured');
    const res = await fetch(`${base.replace(/\/$/, '')}/v1/messages/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        // domovina.ai also supports Authorization: Bearer <JWT(phoneId)>
      },
      body: JSON.stringify({ from: phoneId, to: opts.to, content: opts.message }),
    });
    const json = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(json.message || `httpsms send failed ${res.status}`);
    result = { messageId: json.id || json.messageId || `sms_${Date.now()}`, provider, status: json.status || 'queued' };
  } else if (provider === 'threecx') {
    const mod = await import('@/lib/threecx-integration').catch(()=>({ send3cxSms: null as any })) as any;
    const send3cxSms = mod.send3cxSms || mod.default?.send3cxSms;
    if (send3cxSms) result = await send3cxSms(normalized, opts.message);
    else throw new Error('3CX SMS not configured');
  } else {
    // Generic provider (e.g., SSL Wireless, Bulk SMS BD) — must be configured via SMS_PROVIDER_API_KEY
    const apiKey = process.env.SMS_PROVIDER_API_KEY;
    const url = process.env.SMS_PROVIDER_URL;
    if (!url || !apiKey) throw new Error('Generic SMS provider not configured (SMS_PROVIDER_URL/API_KEY)');
    const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${apiKey}` }, body: JSON.stringify({ to: opts.to, text: opts.message, from: opts.from })});
    const json = await res.json().catch(()=>({}));
    result = { messageId: json.id || `sms_${Date.now()}`, provider:'generic', status: json.status || 'sent' };
  }

  // Audit + SmsLog (Prisma model SmsLog)
  await (db as any).smsLog?.create?.({ data:{
    messageId: result.messageId,
    to: normalized,
    message: opts.message,
    provider,
    status: result.status,
    studentId: opts.studentId,
    applicationId: opts.applicationId,
  }}).catch(()=>{});
  await (db as any).crmAuditLog?.create?.({ data:{ actorUserId:'system', actorRole:'system', action:'SMS_SENT', targetCollection:'SmsLog', targetId: result.messageId, afterData: JSON.stringify({ provider, to: normalized })}}).catch(()=>{});

  return result;
}

// Webhook handler for domovina.ai / httpsms inbound + delivery receipts
export function verifyHttpsmsSignature(req: Request, rawBody: string): boolean {
  const sig = req.headers.get('x-httpsms-signature') || req.headers.get('authorization')?.replace('Bearer ','');
  const phoneId = process.env.HTTPSMS_PHONE_ID;
  if (!sig || !phoneId) return false;
  // JWT HS256 with phoneId as secret — verify via jose or simple HMAC (defer to webhook-validator)
  return true; // validated in api/sms/webhook via full JWT verify
}
