import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignJWT } from 'jose';
const mocks = vi.hoisted(() => ({ create: vi.fn(), update: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { smsLog: { create: mocks.create, update: mocks.update } } }));
import { sendSms, normalizeSmsNumber, SmsDeliveryError } from '@/lib/sms-gateway';
import { verifyHttpsmsSignature } from '@/lib/httpsms-webhook';
import { sendHttpsms } from '@/lib/httpsms-client';
import { registerSip, startSipCall, getLinphoneFeatures } from '@/lib/voip/linphone';
import { traceIpFlow } from '@/lib/voip/ipftrace';
import { setupMainIpc, invokeMain } from '@/lib/voip/electron-ipc';
import { createRunningHubTask, getRunningHubTask } from '@/lib/runninghub-client';
import { enqueueComfyWorkflow, pollComfyWorkflow, makeBrandedPoster } from '@/lib/comfyui-client';
import { ComfyUIProvider } from '@/lib/video-engine/ai-generation/comfyui';

beforeEach(() => {
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.create.mockReset().mockResolvedValue({ id: 'log1' });
  mocks.update.mockReset().mockResolvedValue({});
  mocks.fetch.mockReset();
  for (const [key, value] of Object.entries({ SMS_PROVIDER: 'httpsms', HTTPSMS_API_KEY: 'test-key', HTTPSMS_FROM: '+8801700000000', HTTPSMS_BASE_URL: 'https://sms.example', HTTPSMS_WEBHOOK_SIGNING_KEY: 'x'.repeat(40), HTTPSMS_WEBHOOK_URL: 'https://alo.example/api/hook', HTTPSMS_WEBHOOK_SUBJECT: 'tenant1', RUNNINGHUB_API_URL: 'https://cloud.example', RUNNINGHUB_API_KEY: 'rh-key', COMFYUI_API_URL: 'http://comfy.internal:8188' })) vi.stubEnv(key, value);
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const sms = () => sendSms({ to: '01712345678', message: 'Your code is 123456', sensitive: true });

describe('actual httpSMS protocol, audit and uncertainty', () => {
  it('normalizes local and international numbers; rejects malformed input', () => {
    expect(normalizeSmsNumber('01712345678')).toBe('+8801712345678');
    expect(normalizeSmsNumber('+44 7700 900123')).toBe('+447700900123');
    expect(() => normalizeSmsNumber('abc')).toThrow();
    expect(() => normalizeSmsNumber('123')).toThrow();
  });
  it('uses x-api-key/from/to/content, persists intent and redacts OTP before sending', async () => {
    mocks.fetch.mockImplementation(async () => {
      expect(mocks.create).toHaveBeenCalledOnce();
      return reply({ status: 'success', data: { id: 'provider-1', status: 'pending' } });
    });
    expect(await sms()).toEqual({ messageId: 'provider-1', provider: 'httpsms', status: 'pending', auditPersisted: true });
    const [url, init] = mocks.fetch.mock.calls[0];
    expect(url).toBe('https://sms.example/v1/messages/send');
    expect(init.headers['x-api-key']).toBe('test-key');
    expect(JSON.parse(init.body)).toEqual({ from: '+8801700000000', to: '+8801712345678', content: 'Your code is 123456' });
    expect(init.redirect).toBe('error');
    expect(init.signal).toBeInstanceOf(AbortSignal);
    expect(mocks.create.mock.calls[0][0].data.messageText).not.toContain('123456');
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ providerMessageId: 'provider-1', deliveryStatus: 'PENDING' }) }));
  });
  it('does not send if durable intent cannot be written', async () => {
    mocks.create.mockRejectedValue(new Error('DB unavailable'));
    await expect(sms()).rejects.toThrow('DB unavailable');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it.each([{}, { data: { status: 'sent' } }, { data: { id: 'x', status: 'banana' } }])('never fabricates provider IDs for malformed acknowledgement %j', async (body) => {
    mocks.fetch.mockResolvedValue(reply(body));
    await expect(sms()).rejects.toMatchObject({ outcome: 'unknown' });
    expect(mocks.fetch).toHaveBeenCalledOnce();
  });
  it.each([400, 401, 429])('records explicit HTTP %i rejection', async (status) => {
    mocks.fetch.mockResolvedValue(reply({}, status));
    await expect(sms()).rejects.toMatchObject({ outcome: 'rejected' });
  });
  it('does not retry network timeouts or 5xx, since acceptance is unknown', async () => {
    mocks.fetch.mockRejectedValue(new Error('timeout'));
    await expect(sms()).rejects.toBeInstanceOf(SmsDeliveryError);
    expect(mocks.fetch).toHaveBeenCalledOnce();
    mocks.fetch.mockResolvedValue(reply({}, 503));
    await expect(sms()).rejects.toMatchObject({ outcome: 'unknown' });
  });
  it('acceptance survives a post-send audit failure without a duplicate-send exception', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.fetch.mockResolvedValue(reply({ data: { id: 'real', status: 'sent' } }));
    mocks.update.mockRejectedValue(new Error('DB down'));
    expect(await sms()).toMatchObject({ messageId: 'real', auditPersisted: false });
    expect(mocks.fetch).toHaveBeenCalledOnce();
  });
  it('honors the explicit httpSMS facade even if the default provider differs', async () => {
    vi.stubEnv('SMS_PROVIDER', 'generic');
    mocks.fetch.mockResolvedValue(reply({ data: { id: 'real' } }));
    expect(await sendHttpsms({ to: '+447700900123', message: 'Test' })).toMatchObject({ provider: 'httpsms' });
  });
  it('Domovina follows the fork protocol rather than invented /sms endpoints', async () => {
    vi.stubEnv('DOMOVINA_SMS_URL', 'https://fork.example');
    mocks.fetch.mockResolvedValue(reply({ data: { id: 'real', status: 'queued' } }));
    await sendSms({ to: '+447700900123', message: 'Test', provider: 'domovina' });
    expect(mocks.fetch.mock.calls[0][0]).toBe('https://fork.example/v1/messages/send');
  });
  it('rejects unsafe provider URLs, synchronous receipt requests and unimplemented 3CX sends', async () => {
    vi.stubEnv('HTTPSMS_BASE_URL', 'http://unsafe.example');
    await expect(sms()).rejects.toThrow('HTTPS');
    await expect(sendSms({ to: '+447700900123', message: 'Test', provider: 'threecx' })).rejects.toThrow('not implemented');
    await expect(sendSms({ to: '+447700900123', message: 'Test', requireDeliveryReceipt: true })).rejects.toThrow('receipts');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});

async function jwt(overrides: Record<string, unknown> = {}, secret = 'x'.repeat(40), algorithm = 'HS256') {
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({ iss: 'api.httpsms.com', aud: ['https://alo.example/api/hook'], sub: 'tenant1', iat: now, nbf: now - 600, exp: now + 600, ...overrides }).setProtectedHeader({ alg: algorithm }).sign(new TextEncoder().encode(secret));
}
async function valid(token: string) { return verifyHttpsmsSignature(new Request('https://alo.example/api/hook', { headers: { Authorization: `Bearer ${token}` } }), '{}'); }
describe('httpSMS Bearer JWT authentication (not a body signature)', () => {
  it('verifies the upstream HS256/audience/issuer/subject/time claims', async () => { expect(await valid(await jwt())).toBe(true); });
  it.each([{ iss: 'evil' }, { sub: 'other' }, { aud: 'other' }, { exp: 1 }, { iat: 9999999999 }, { nbf: 9999999999 }, { exp: undefined }, { iat: undefined }])('rejects bad/missing claims %j', async (claims) => { expect(await valid(await jwt(claims))).toBe(false); });
  it('rejects tampering, wrong key and wrong algorithm', async () => {
    expect(await valid('not.a.token')).toBe(false);
    expect(await valid(await jwt({}, 'z'.repeat(40)))).toBe(false);
    expect(await valid(await jwt({}, 'x'.repeat(40), 'HS384'))).toBe(false);
  });
  it('fails closed without mandatory configured audience/subject/key or header', async () => {
    expect(await verifyHttpsmsSignature(new Request('https://alo.example'), '')).toBe(false);
    const token = await jwt(); vi.stubEnv('HTTPSMS_WEBHOOK_SUBJECT', '');
    expect(await valid(token)).toBe(false);
  });
});

describe('native boundaries do not simulate service availability', () => {
  it('does not fabricate registration or a call ID', async () => {
    const account = { username: 'a', password: 'b', domain: 'example' };
    expect(await registerSip(account)).toMatchObject({ registered: false, status: 'not_configured' });
    expect(await startSipCall({ from: account, toUri: 'sip:test@example' })).toMatchObject({ callId: null, lime: false });
    expect(getLinphoneFeatures().available).toBe(false);
  });
  it('reports kernel collector and Electron IPC as unavailable, validates inputs', async () => {
    expect(await traceIpFlow('192.0.2.1')).toMatchObject({ available: false, events: [] });
    await expect(traceIpFlow('x; rm')).rejects.toThrow();
    await expect(traceIpFlow('192.0.2.1', 0)).rejects.toThrow();
    expect((await setupMainIpc()).available).toBe(false);
    await expect(invokeMain('send-paid-sms', {})).rejects.toThrow('unavailable');
  });
});
const graph = { workflow: { '1': { class_type: 'CLIPTextEncode', inputs: { text: '' } } }, inputBindings: { textPrompt: { nodeId: '1', field: 'text' } } };
describe('distinct RunningHub and local ComfyUI contracts', () => {
  it('creates a RunningHub cloud task with workflow ID and actual taskId', async () => {
    mocks.fetch.mockResolvedValue(reply({ code: 0, data: { taskId: 'task-1', taskStatus: 'RUNNING' } }));
    expect(await createRunningHubTask('123', [{ nodeId: '1', fieldName: 'text', fieldValue: 'Test' }])).toMatchObject({ taskId: 'task-1', status: 'running' });
    expect(mocks.fetch.mock.calls[0][0]).toBe('https://cloud.example/task/openapi/create');
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body)).toMatchObject({ workflowId: '123', apiKey: 'rh-key' });
  });
  it.each(['QUEUED', 'RUNNING'])('recognizes provider %s polling responses', async (status) => {
    mocks.fetch.mockResolvedValue(reply({ code: 804, msg: `APIKEY_TASK_IS_${status}` }));
    expect((await getRunningHubTask('task-1')).status).toBe(status.toLowerCase());
  });
  it('returns actual safe output URLs, never placeholders for empty output', async () => {
    mocks.fetch.mockResolvedValue(reply({ code: 0, data: [{ fileUrl: 'https://assets.example/a.mp4', fileType: 'mp4' }] }));
    expect((await getRunningHubTask('task-1')).outputs[0].fileUrl).toBe('https://assets.example/a.mp4');
    mocks.fetch.mockResolvedValue(reply({ code: 0, data: [] }));
    expect((await getRunningHubTask('task-1')).outputs).toEqual([]);
    mocks.fetch.mockResolvedValue(reply({ code: 0, data: [{ fileUrl: 'javascript:alert(1)', fileType: 'mp4' }] }));
    await expect(getRunningHubTask('task-1')).rejects.toThrow();
  });
  it('requires a configured graph/binding and an acknowledged Comfy prompt ID', async () => {
    mocks.fetch.mockResolvedValue(reply({ prompt_id: 'actual-prompt' }));
    expect(await enqueueComfyWorkflow({ textPrompt: 'Test' }, graph)).toBe('actual-prompt');
    expect(mocks.fetch.mock.calls[0][0]).toBe('http://comfy.internal:8188/prompt');
    expect(JSON.parse(mocks.fetch.mock.calls[0][1].body).prompt['1'].inputs.text).toBe('Test');
    await expect(enqueueComfyWorkflow({ audio: Buffer.from('test') }, graph)).rejects.toThrow('Audio/video');
    await expect(enqueueComfyWorkflow({ textPrompt: 'test' }, { ...graph, inputBindings: {} })).rejects.toThrow('binding');
    mocks.fetch.mockResolvedValue(reply({}));
    await expect(enqueueComfyWorkflow({ textPrompt: 'Test' }, graph)).rejects.toThrow('not accept');
  });
  it('failed history takes precedence over completed=true; completed means real descriptors', async () => {
    mocks.fetch.mockResolvedValue(reply({ id: { status: { completed: true, status_str: 'error' } } }));
    expect((await pollComfyWorkflow('id')).status).toBe('failed');
    mocks.fetch.mockResolvedValue(reply({ id: { status: { completed: true }, outputs: { '1': { videos: [{ filename: 'a.mp4', subfolder: '', type: 'output' }] } } } }));
    expect((await pollComfyWorkflow('id')).outputs[0]).toMatchObject({ filename: 'a.mp4', kind: 'video' });
  });
  it('does not present fabricated branded posters or video availability', async () => {
    await expect(makeBrandedPoster('test', {})).rejects.toThrow('configured poster workflow');
    expect((await ComfyUIProvider.health()).status).toBe('not_configured');
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
