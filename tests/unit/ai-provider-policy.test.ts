import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ db: { crmAuditLog: { create: vi.fn() } } }));
vi.mock('@/lib/groq-protection', () => ({ groqGuard: { acquire: vi.fn(), recordSuccess: vi.fn(), recordFailure: vi.fn(), release: vi.fn() } }));
import { generateText } from '@/lib/ai';
import { aiGateway, classify } from '@/lib/ai-gateway';
import { routeModel } from '@/lib/model-router';
import { db } from '@/lib/db';
import { groqGuard } from '@/lib/groq-protection';
import { DEPARTMENT_MODEL_CONFIGS, validateModelAssignment } from '@/lib/department-model-config';

const fetchMock = vi.fn<typeof fetch>();
const completion = (text = '{"keywords":["one","two","three"]}') => new Response(JSON.stringify({ choices: [{ message: { content: text } }], usage: { total_tokens: 20 } }), { status: 200 });
const originalConfig = structuredClone(DEPARTMENT_MODEL_CONFIGS.seo);
beforeEach(() => {
  vi.resetAllMocks();
  for (const key of ['LOCAL_AI_URL', 'LOCAL_AI_MODEL', 'LOCAL_AI_API_KEY', 'GROQ_API_KEY', 'OPENROUTER_API_KEY', 'ZAI_API_KEY']) vi.stubEnv(key, '');
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(db.crmAuditLog.create).mockResolvedValue({});
  vi.mocked(groqGuard.acquire).mockResolvedValue({ allowed: true });
  DEPARTMENT_MODEL_CONFIGS.seo = structuredClone(originalConfig);
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); DEPARTMENT_MODEL_CONFIGS.seo = structuredClone(originalConfig); });

describe('provider adapter and gateway policy (stubbed HTTP, not live provider verification)', () => {
  it('pins OpenRouter even when Groq is configured', async () => {
    vi.stubEnv('GROQ_API_KEY', 'dummy-groq'); vi.stubEnv('OPENROUTER_API_KEY', 'dummy-router');
    fetchMock.mockResolvedValue(completion('hello'));
    const result = await generateText({ prompt: 'hello', provider: 'openrouter', model: 'explicit-model' });
    expect(result).toMatchObject({ provider: 'openrouter', model: 'explicit-model', text: 'hello' });
    expect(String(fetchMock.mock.calls[0][0])).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it('does not cloud-fallback from local, including legacy adapter calls', async () => {
    vi.stubEnv('LOCAL_AI_URL', 'http://127.0.0.1:11434'); vi.stubEnv('LOCAL_AI_MODEL', 'private-model'); vi.stubEnv('GROQ_API_KEY', 'dummy-groq');
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(generateText({ prompt: 'private data' })).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toBe('http://127.0.0.1:11434/v1/chat/completions');
  });
  it('private routing ignores cloud availability and model hints', async () => {
    vi.stubEnv('GROQ_API_KEY', 'dummy-groq');
    await expect(routeModel({ taskType: 'KYC', modelHint: 'cloud-model' })).rejects.toThrow(/Private AI/);
    vi.stubEnv('LOCAL_AI_URL', 'http://127.0.0.1:11434'); vi.stubEnv('LOCAL_AI_MODEL', 'private-model');
    expect(await routeModel({ taskType: 'KYC', modelHint: 'cloud-model' })).toMatchObject({ provider: 'local', model: 'private-model' });
  });
  it('rejects empty completion output', async () => {
    vi.stubEnv('GROQ_API_KEY', 'dummy-groq'); fetchMock.mockResolvedValue(completion(' '));
    await expect(generateText({ provider: 'groq', prompt: 'test' })).rejects.toThrow();
  });
  it('rejects explicit provider without its own credential before any request', async () => {
    vi.stubEnv('GROQ_API_KEY', 'dummy-groq');
    await expect(generateText({ provider: 'openrouter', prompt: 'test' })).rejects.toThrow(/not configured/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('department allowFallback=false prevents actual second HTTP call on failure', async () => {
    vi.stubEnv('GROQ_API_KEY', 'dummy-groq'); vi.stubEnv('OPENROUTER_API_KEY', 'dummy-router');
    fetchMock.mockResolvedValue(new Response('private upstream error', { status: 503 }));
    await expect(aiGateway({ prompt: 'test', department: 'seo' })).rejects.toThrow(/no permitted fallback/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(db.crmAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'AI_GATEWAY_FAILED' }) }));
  });
  it('guard denial cannot bypass department policy', async () => {
    vi.mocked(groqGuard.acquire).mockResolvedValue({ allowed: false, fallbackRoute: { provider: 'openrouter', model: 'other', reason: 'rate' } });
    await expect(aiGateway({ prompt: 'test', department: 'seo' })).rejects.toThrow(/no permitted fallback/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('only uses explicit fallback pair, acquires its guard, and records actual identity', async () => {
    vi.stubEnv('GROQ_API_KEY', 'dummy-groq'); vi.stubEnv('OPENROUTER_API_KEY', 'dummy-router');
    DEPARTMENT_MODEL_CONFIGS.seo.primary.allowFallback = true;
    DEPARTMENT_MODEL_CONFIGS.seo.primary.fallback = { provider: 'openrouter', model: 'approved-model', reason: 'operator-approved' };
    fetchMock.mockResolvedValueOnce(new Response('', { status: 503 })).mockResolvedValueOnce(completion());
    const result = await aiGateway({ prompt: 'test', department: 'seo' });
    expect(result).toMatchObject({ provider: 'openrouter', model: 'approved-model', fallbackUsed: true });
    expect(groqGuard.acquire).toHaveBeenNthCalledWith(2, 'openrouter');
    const body = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(body.model).toBe('approved-model');
    const records = JSON.stringify(vi.mocked(db.crmAuditLog.create).mock.calls);
    expect(records).not.toContain('dummy-groq'); expect(records).not.toContain('dummy-router');
  });
  it('confidential cloud config remains invalid even with a local URL', async () => {
    vi.stubEnv('LOCAL_AI_URL', 'http://127.0.0.1:11434');
    DEPARTMENT_MODEL_CONFIGS.seo.primary.privacy = 'CONFIDENTIAL';
    expect(validateModelAssignment(DEPARTMENT_MODEL_CONFIGS.seo).ok).toBe(false);
    await expect(aiGateway({ prompt: 'private', department: 'seo' })).rejects.toThrow(/Privacy/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('privateData blocks external department before requesting or logging prompt', async () => {
    await expect(aiGateway({ prompt: 'sensitive', department: 'seo', privateData: true })).rejects.toThrow(/Private/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('pins department model; mismatched caller hint is rejected', async () => {
    await expect(aiGateway({ prompt: 'test', department: 'seo', model: 'wrong' })).rejects.toThrow(/not allowed/);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('requires durable request audit before external disclosure', async () => {
    vi.mocked(db.crmAuditLog.create).mockRejectedValue(new Error('db down'));
    await expect(aiGateway({ prompt: 'test', department: 'seo' })).rejects.toThrow('db down');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('validates JSON shape instead of accepting any parseable object', async () => {
    vi.stubEnv('GROQ_API_KEY', 'dummy-groq'); fetchMock.mockResolvedValue(completion('{"keywords":42}'));
    await expect(aiGateway({ prompt: 'test', department: 'seo', requireJson: true, jsonSchema: { type: 'object', properties: { keywords: { type: 'array', items: { type: 'string' } } }, required: ['keywords'] } })).rejects.toThrow(/JSON schema/);
  });
  it('classification refuses unknown labels instead of returning first label', async () => {
    vi.stubEnv('GROQ_API_KEY', 'dummy-groq'); fetchMock.mockResolvedValue(completion('{"label":"invented","confidence":"HIGH"}'));
    await expect(classify('text', ['SUPPORT', 'SALES'])).rejects.toThrow(/JSON schema/);
  });
  it('local private gateway success has truthful provider/model and no raw prompt in audit', async () => {
    vi.stubEnv('LOCAL_AI_URL', 'http://127.0.0.1:11434/v1'); vi.stubEnv('LOCAL_AI_MODEL', 'private-model');
    fetchMock.mockResolvedValue(completion('private answer'));
    const result = await aiGateway({ prompt: 'sensitive private student text', privateData: true });
    expect(result).toMatchObject({ provider: 'local', model: 'private-model', fallbackUsed: false });
    expect(JSON.stringify(vi.mocked(db.crmAuditLog.create).mock.calls)).not.toContain('sensitive private student text');
  });
});
