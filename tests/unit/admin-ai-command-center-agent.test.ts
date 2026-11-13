import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  generateText: vi.fn(),
  isGlobalAiPaused: vi.fn(),
  auditCreate: vi.fn(),
  listProviderStatus: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));
vi.mock('@/lib/ai', () => ({ generateText: (...args: unknown[]) => mocks.generateText(...args) }));
vi.mock('@/lib/ai-safety', () => ({ isGlobalAiPaused: () => mocks.isGlobalAiPaused() }));
vi.mock('@/lib/ai-providers/catalog', () => ({ FREE_PROVIDERS: [{ slug: 'groq' }] }));
vi.mock('@/lib/ai-providers/resolve', () => ({ listProviderStatus: () => mocks.listProviderStatus() }));
vi.mock('@/lib/request-origin', () => ({ mutationOriginAllowed: () => true }));
vi.mock('@/lib/db', () => ({ db: { portalAuditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) } } }));

import { GET, POST } from '@/app/api/admin/ai-command-center/assistant/route';

const origin = 'https://alo.test';
const admin = { userId: 'user-1', actorUserId: 'user-1', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'], actingAsSessionId: undefined };
const configuredCloudProvider = {
  slug: 'groq', name: 'Groq', configured: true, freeTier: 'claimed-free', freeTierVerified: false,
  provenance: 'official', blocker: null, apiKeyEnv: 'GROQ_API_KEY', apiKeyMasked: 'secret-fragment',
};
const postRequest = (provider: string, messages: unknown, confirmNonConfidential?: boolean) => new Request(`${origin}/api/admin/ai-command-center/assistant`, {
  method: 'POST', headers: { origin, 'content-type': 'application/json' },
  body: JSON.stringify({ provider, messages, ...(confirmNonConfidential === undefined ? {} : { confirmNonConfidential }) }),
});

beforeEach(() => {
  vi.resetAllMocks();
  delete process.env.LOCAL_AI_URL;
  delete process.env.LOCAL_AI_MODEL;
  delete process.env.PAID_AI_API_ALLOWED;
  mocks.auth.mockReturnValue(admin);
  mocks.generateText.mockResolvedValue({ text: 'A human-reviewed draft.', provider: 'local', model: 'test-model', usage: { totalTokens: 8 } });
  mocks.isGlobalAiPaused.mockResolvedValue(false);
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
  mocks.listProviderStatus.mockReturnValue([configuredCloudProvider]);
});

describe('Super Admin AI Command Center assistant', () => {
  it('requires an explicit Super Admin identity even though the generic auth wrapper has admin bypasses', async () => {
    mocks.auth.mockReturnValue({ ...admin, userType: 'ADMIN', roles: ['ADMIN'] });
    expect((await GET(new Request(`${origin}/api/admin/ai-command-center/assistant`))).status).toBe(403);
    expect((await POST(postRequest('groq', [{ role: 'user', content: 'hello' }]))).status).toBe(403);
    mocks.auth.mockReturnValue({ ...admin, actingAsSessionId: 'acting-as-1' });
    expect((await GET(new Request(`${origin}/api/admin/ai-command-center/assistant`))).status).toBe(403);
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('does not expose key material and reports cloud providers blocked until owner approval', async () => {
    const response = await GET(new Request(`${origin}/api/admin/ai-command-center/assistant`));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.providers.find((provider: { slug: string }) => provider.slug === 'groq')).toMatchObject({
      configured: true, available: false, freeTierVerified: false,
    });
    expect(JSON.stringify(body)).not.toContain('secret-fragment');
    expect(JSON.stringify(body)).not.toContain('GROQ_API_KEY');
  });

  it('blocks inference when the global AI pause is active', async () => {
    process.env.LOCAL_AI_URL = 'http://127.0.0.1:11434';
    process.env.LOCAL_AI_MODEL = 'local-test-model';
    mocks.isGlobalAiPaused.mockResolvedValue(true);
    const response = await POST(postRequest('local', [{ role: 'user', content: 'Draft a checklist.' }]));
    expect(response.status).toBe(503);
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('does not treat a remote endpoint named LOCAL_AI_URL as private local inference', async () => {
    process.env.LOCAL_AI_URL = 'https://remote.example/v1';
    process.env.LOCAL_AI_MODEL = 'remote-model';
    const response = await POST(postRequest('local', [{ role: 'user', content: 'Draft a checklist.' }]));
    expect(response.status).toBe(409);
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('fails closed when no local provider is configured and cloud inference is not approved', async () => {
    const response = await POST(postRequest('local', [{ role: 'user', content: 'Draft a checklist.' }]));
    expect(response.status).toBe(409);
    expect(mocks.generateText).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });

  it('rejects an unapproved cloud request without contacting the provider', async () => {
    const response = await POST(postRequest('groq', [{ role: 'user', content: 'Draft a checklist.' }]));
    expect(response.status).toBe(403);
    expect(mocks.generateText).not.toHaveBeenCalled();
  });

  it('requires explicit no-confidential-data confirmation before sending approved cloud requests', async () => {
    process.env.PAID_AI_API_ALLOWED = 'true';
    mocks.generateText.mockResolvedValue({ text: 'A human-reviewed draft.', provider: 'groq', model: 'test-model' });

    const messages = [{ role: 'user', content: 'A generic policy question.' }];
    expect((await POST(postRequest('groq', messages))).status).toBe(400);
    expect(mocks.generateText).not.toHaveBeenCalled();

    const response = await POST(postRequest('groq', messages, true));
    expect(response.status).toBe(200);
    expect(mocks.generateText).toHaveBeenCalledWith(expect.objectContaining({ provider: 'groq' }));
  });

  it('runs a configured local text request and stores metadata only in the audit log', async () => {
    process.env.LOCAL_AI_URL = 'http://127.0.0.1:11434';
    process.env.LOCAL_AI_MODEL = 'local-test-model';
    const response = await POST(postRequest('local', [{ role: 'user', content: 'Draft a checklist.' }]));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.reply).toBe('A human-reviewed draft.');
    expect(mocks.generateText).toHaveBeenCalledWith(expect.objectContaining({ provider: 'local', maxTokens: 700 }));
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: 'ADMIN_AI_ASSISTANT_QUERY',
        metadata: expect.stringContaining('"provider":"local"'),
      }),
    });
    expect(JSON.stringify(mocks.auditCreate.mock.calls)).not.toContain('Draft a checklist.');
  });
});
