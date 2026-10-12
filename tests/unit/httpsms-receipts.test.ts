import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
const mocks = vi.hoisted(() => ({ eventFind: vi.fn(), eventCreate: vi.fn(), smsFind: vi.fn(), smsUpdate: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { $transaction: mocks.transaction } }));
import { applyHttpsmsReceipt } from '@/lib/httpsms-receipts';
import { POST } from '@/app/api/integrations/httpsms/webhook/route';
const messageId = 'msg-1';
function receipt(type = 'message.phone.delivered') { return { specversion: '1.0', id: 'event-1', type, data: { id: messageId, message_id: messageId, owner: '+8801700000000', contact: '+8801712345678', user_id: 'tenant1', timestamp: new Date().toISOString(), content: 'SECRET OTP 123456', is_final: true } }; }
beforeEach(() => {
  vi.stubEnv('HTTPSMS_WEBHOOK_PROVIDER', 'httpsms'); vi.stubEnv('HTTPSMS_WEBHOOK_SUBJECT', 'tenant1');
  vi.stubEnv('HTTPSMS_WEBHOOK_URL', 'https://alo.example/hook'); vi.stubEnv('HTTPSMS_WEBHOOK_SIGNING_KEY', 'x'.repeat(40));
  mocks.eventFind.mockReset().mockResolvedValue(null); mocks.eventCreate.mockReset().mockResolvedValue({});
  mocks.smsFind.mockReset().mockResolvedValue({ id: 'log-1', direction: 'OUTBOUND', fromNumber: '+8801700000000', toNumber: '+8801712345678', deliveryStatus: 'SENT' });
  mocks.smsUpdate.mockReset().mockResolvedValue({ count: 1 });
  mocks.transaction.mockReset().mockImplementation((fn) => fn({ webhookEvent: { findUnique: mocks.eventFind, create: mocks.eventCreate }, smsLog: { findUnique: mocks.smsFind, updateMany: mocks.smsUpdate } }));
});
afterEach(() => vi.unstubAllEnvs());
describe('correlated, redacted and deduplicated SMS receipts', () => {
  it('atomically applies a delivery receipt and stores no content/token', async () => {
    expect(await applyHttpsmsReceipt(receipt())).toEqual({ duplicate: false, applied: true });
    expect(mocks.smsFind).toHaveBeenCalledWith({ where: { provider_providerMessageId: { provider: 'httpsms', providerMessageId: messageId } } });
    expect(mocks.smsUpdate.mock.calls[0][0].data.deliveryStatus).toBe('DELIVERED');
    expect(JSON.stringify(mocks.eventCreate.mock.calls)).not.toContain('123456');
    expect(mocks.smsUpdate.mock.calls[0][0].where.deliveryStatus.in).not.toContain('DELIVERED');
  });
  it('acknowledges duplicate events without writing again', async () => {
    mocks.eventFind.mockResolvedValue({ processed: true });
    expect(await applyHttpsmsReceipt(receipt())).toMatchObject({ duplicate: true });
    expect(mocks.smsUpdate).not.toHaveBeenCalled(); expect(mocks.eventCreate).not.toHaveBeenCalled();
  });
  it('never guesses correlation or accepts another provider account/number', async () => {
    const other = receipt(); other.data.user_id = 'other';
    await expect(applyHttpsmsReceipt(other)).rejects.toMatchObject({ status: 400 });
    mocks.smsFind.mockResolvedValue(null);
    await expect(applyHttpsmsReceipt(receipt())).rejects.toMatchObject({ status: 409 });
    expect(mocks.smsUpdate).not.toHaveBeenCalled();
  });
  it('does not let late failures roll back sent/delivered or transient expiry terminate', async () => {
    await applyHttpsmsReceipt(receipt('message.send.failed'));
    expect(mocks.smsUpdate.mock.calls[0][0].where.deliveryStatus.in).not.toContain('SENT');
    expect(mocks.smsUpdate.mock.calls[0][0].where.deliveryStatus.in).not.toContain('DELIVERED');
    mocks.smsUpdate.mockClear();
    const transient = receipt('message.send.expired'); transient.data.is_final = false;
    expect(await applyHttpsmsReceipt(transient)).toMatchObject({ applied: false });
    expect(mocks.smsUpdate).not.toHaveBeenCalled();
  });
  it('rejects unsupported inbound/heartbeat events instead of dropping content into audit', async () => {
    await expect(applyHttpsmsReceipt(receipt('message.phone.received'))).rejects.toMatchObject({ status: 422 });
  });
  it('handles transaction unique-race rollback as an acknowledged replay', async () => {
    mocks.transaction.mockRejectedValue({ code: 'P2002' });
    expect(await applyHttpsmsReceipt(receipt())).toMatchObject({ duplicate: true });
  });
});
async function request(body: string, authenticated = true) {
  const now = Math.floor(Date.now() / 1000);
  const token = await new SignJWT({ iat: now, exp: now + 600, nbf: now - 600, sub: 'tenant1', iss: 'api.httpsms.com', aud: ['https://alo.example/hook'] }).setProtectedHeader({ alg: 'HS256' }).sign(new TextEncoder().encode('x'.repeat(40)));
  return new Request('https://alo.example/hook', { method: 'POST', headers: authenticated ? { Authorization: `Bearer ${token}` } : {}, body });
}
describe('SMS receipt HTTP boundary', () => {
  it('requires JWT before any database work', async () => {
    expect((await POST(await request('{}', false))).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('bounds chunked bodies and rejects malformed JSON', async () => {
    expect((await POST(await request('x'.repeat(32769)))).status).toBe(413);
    expect((await POST(await request('not-json'))).status).toBe(400);
  });
  it('returns receipt success but never a raw OTP/payload', async () => {
    const response = await POST(await request(JSON.stringify(receipt())));
    expect(response.status).toBe(200); expect(await response.text()).not.toContain('123456');
  });
});
