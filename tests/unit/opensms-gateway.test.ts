import { createHmac } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  smsCreate: vi.fn(),
  smsUpdate: vi.fn(),
  smsFind: vi.fn(),
  smsUpdateMany: vi.fn(),
  eventFind: vi.fn(),
  eventCreate: vi.fn(),
  transaction: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    smsLog: {
      create: mocks.smsCreate,
      update: mocks.smsUpdate,
    },
    $transaction: mocks.transaction,
  },
}));

import { sendSms, SmsDeliveryError } from '@/lib/sms-gateway';
import { sendOpensms } from '@/lib/opensms-client';
import { applyOpensmsReceipt, verifyOpensmsSignature } from '@/lib/opensms-webhook';
import { POST } from '@/app/api/integrations/opensms/webhook/route';

const TEST_WEBHOOK_KEY = 'o'.repeat(40);

function jsonReply(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function signedWebhookRequest(body: string, key = TEST_WEBHOOK_KEY) {
  const sig = createHmac('sha256', key).update(body, 'utf8').digest('hex');
  return new Request('https://alo.example/api/integrations/opensms/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-opensms-signature': `sha256=${sig}`,
    },
    body,
  });
}

beforeEach(() => {
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.smsCreate.mockReset().mockResolvedValue({ id: 'log-osms-1' });
  mocks.smsUpdate.mockReset().mockResolvedValue({});
  mocks.smsFind.mockReset().mockResolvedValue({
    id: 'log-osms-1',
    direction: 'OUTBOUND',
    fromNumber: 'opensms-default-sim',
    toNumber: '+8801712345678',
    deliveryStatus: 'SENT',
  });
  mocks.smsUpdateMany.mockReset().mockResolvedValue({ count: 1 });
  mocks.eventFind.mockReset().mockResolvedValue(null);
  mocks.eventCreate.mockReset().mockResolvedValue({});
  mocks.transaction.mockReset().mockImplementation((fn) =>
    fn({
      webhookEvent: { findUnique: mocks.eventFind, create: mocks.eventCreate },
      smsLog: { findUnique: mocks.smsFind, updateMany: mocks.smsUpdateMany },
    }),
  );
  mocks.fetch.mockReset();

  vi.stubEnv('OPENSMS_BASE_URL', 'https://opensms-gateway.example');
  vi.stubEnv('OPENSMS_API_KEY', 'osms_unit_test_placeholder_token');
  vi.stubEnv('OPENSMS_WEBHOOK_SECRET', TEST_WEBHOOK_KEY);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe('OpenSMS (daslearning-org/OpenSMS) outbound gateway contract', () => {
  it('posts to /sms/ with trailing slash, Bearer auth, E.164 number+text, and redacts sensitive OTPs', async () => {
    mocks.fetch.mockResolvedValue(jsonReply({ stat: true }));

    const result = await sendOpensms({
      to: '01712345678',
      message: 'ALO verification code 987654',
      sensitive: true,
    });

    expect(result).toEqual({
      messageId: 'opensms:log-osms-1',
      provider: 'opensms',
      status: 'sent',
      auditPersisted: true,
    });

    const [url, init] = mocks.fetch.mock.calls[0];
    expect(url).toBe('https://opensms-gateway.example/sms/');
    expect(init.headers.Authorization).toBe('Bearer osms_unit_test_placeholder_token');
    expect(JSON.parse(init.body)).toEqual({
      number: '+8801712345678',
      text: 'ALO verification code 987654',
    });
    expect(mocks.smsCreate.mock.calls[0][0].data.messageText).not.toContain('987654');
    expect(mocks.smsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deliveryStatus: 'SENT',
          providerMessageId: 'opensms:log-osms-1',
        }),
      }),
    );
  });

  it('treats { stat: false } as an explicit provider rejection and marks FAILED', async () => {
    mocks.fetch.mockResolvedValue(jsonReply({ stat: false }));

    await expect(
      sendSms({ to: '+8801712345678', message: 'Counseling reminder', provider: 'opensms' }),
    ).rejects.toMatchObject({ outcome: 'rejected' });
    expect(mocks.smsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deliveryStatus: 'FAILED' }) }),
    );
  });

  it('never fabricates acceptance when upstream omits boolean stat', async () => {
    mocks.fetch.mockResolvedValue(jsonReply({ ok: true }));

    await expect(
      sendOpensms({ to: '+8801712345678', message: 'Counseling reminder' }),
    ).rejects.toBeInstanceOf(SmsDeliveryError);
    expect(mocks.smsUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ deliveryStatus: 'UNKNOWN' }) }),
    );
  });

  it('fails closed when OPENSMS_BASE_URL is non-HTTPS or credentials are missing', async () => {
    vi.stubEnv('OPENSMS_BASE_URL', 'http://192.168.1.50:9292');
    await expect(sendOpensms({ to: '+8801712345678', message: 'Test' })).rejects.toThrow('HTTPS');

    vi.stubEnv('OPENSMS_BASE_URL', '');
    await expect(sendOpensms({ to: '+8801712345678', message: 'Test' })).rejects.toThrow('OpenSMS URL');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});

describe('OpenSMS signed receipt webhook bridge', () => {
  const validReceipt = () => ({
    eventId: 'evt_osms_1',
    type: 'sms.delivered',
    messageId: 'opensms:log-osms-1',
    to: '01712345678',
    timestamp: new Date().toISOString(),
    text: 'SECRET OTP 987654',
  });

  it('verifies HMAC-SHA256 signature and rejects unsigned or tampered requests before DB access', async () => {
    const unsigned = new Request('https://alo.example/api/integrations/opensms/webhook', {
      method: 'POST',
      body: JSON.stringify(validReceipt()),
    });
    expect(verifyOpensmsSignature(unsigned, '{}')).toBe(false);
    expect((await POST(unsigned)).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('applies delivered receipt atomically, deduplicates replays, and never persists OTP text', async () => {
    const body = JSON.stringify(validReceipt());
    const res = await POST(signedWebhookRequest(body));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ received: true, duplicate: false, applied: true });
    expect(JSON.stringify(mocks.eventCreate.mock.calls)).not.toContain('987654');

    mocks.eventFind.mockResolvedValueOnce({ processed: true });
    expect(await applyOpensmsReceipt(validReceipt())).toEqual({ duplicate: true, applied: false });
  });

  it('prevents late failure events from rolling back SENT or DELIVERED messages', async () => {
    await applyOpensmsReceipt({ ...validReceipt(), eventId: 'evt_fail_1', type: 'sms.failed' });
    const allowedFrom = mocks.smsUpdateMany.mock.calls[0][0].where.deliveryStatus.in as string[];
    expect(allowedFrom).not.toContain('SENT');
    expect(allowedFrom).not.toContain('DELIVERED');
  });
});
