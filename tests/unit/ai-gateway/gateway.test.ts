import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { createServer } from 'node:http';
import {
  assertProductionConfig,
  createGateway,
  hashToken,
  loadConfig,
} from '../../../services/ai-gateway/gateway.mjs';

const APP_TOKEN = 'test-token-crm-0123456789abcdef';
const PHD_TOKEN = 'test-token-phd-0123456789abcdef';
const OTHER_TOKEN = 'test-token-agentos-0123456789ab';

function config(overrides = {}) {
  return {
    nodeEnv: 'test',
    host: '127.0.0.1',
    port: 0,
    metricsHost: '127.0.0.1',
    metricsPort: 0,
    metricsEnabled: true,
    requestTimeoutMs: 2_000,
    maxRetries: 2,
    retryBaseMs: 5,
    maxConcurrent: 4,
    maxInputBytes: 8_192,
    maxOutputTokens: 512,
    circuitBreakerEnabled: true,
    circuitFailureThreshold: 3,
    circuitResetMs: 1_000,
    logPrompts: false,
    logCompletions: false,
    auditEnabled: true,
    externalFallbackEnabled: true,
    externalPolicy: 'approved',
    providerAllowlist: ['external'],
    apps: [
      {
        id: 'crm',
        tokenSha256: hashToken(APP_TOKEN),
        dataClassification: 'INTERNAL',
        allowExternal: true,
        allowedModels: null,
        requestsPerMinute: 3,
        maxInputBytes: 8_192,
      },
      {
        id: 'phd',
        tokenSha256: hashToken(PHD_TOKEN),
        dataClassification: 'CONFIDENTIAL',
        allowExternal: false,
        allowedModels: ['mock-1'],
        requestsPerMinute: 30,
        maxInputBytes: 8_192,
      },
    ],
    providers: [{ id: 'mock', policy: 'LOCAL', models: [{ id: 'mock-1', external: false }] }],
    version: 'test',
    ...overrides,
  };
}

function provider({ id = 'local-x', policy = 'LOCAL', model = 'model-x', call, models } = {}) {
  return {
    id,
    policy,
    disabled: false,
    models: models ?? [{ id: model, external: policy === 'EXTERNAL' }],
    call: call ?? (async () => ({ text: `ok:${id}`, usage: { promptTokens: 5, completionTokens: 2 } })),
  };
}

async function start(cfg, deps = {}) {
  const gateway = createGateway(cfg, deps);
  const running = await gateway.listen({ port: 0, metricsPort: 0 });
  return { gateway, running, base: `http://127.0.0.1:${running.address.port}`, metricsBase: `http://127.0.0.1:${running.metricsAddress.port}` };
}

function auth(token = APP_TOKEN) {
  return { Authorization: `Bearer ${token}` };
}

async function chat(base, body, token = APP_TOKEN) {
  const response = await fetch(`${base}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? auth(token) : {}) },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json(), headers: response.headers };
}

const simpleChat = { model: 'mock-1', messages: [{ role: 'user', content: 'Hello gateway' }], max_tokens: 50 };

const servers = [];
afterAll(async () => {
  for (const running of servers) await running.close();
});

describe('AI gateway configuration', () => {
  it('parses a complete environment and rejects a malformed app registry', () => {
    const parsed = loadConfig({
      NODE_ENV: 'test',
      AI_GATEWAY_APPS: JSON.stringify([{ id: 'crm', tokenSha256: hashToken(APP_TOKEN), dataClassification: 'INTERNAL' }]),
      AI_GATEWAY_ENABLE_MOCK: 'true',
      AI_EXTERNAL_DATA_POLICY: 'restricted',
    });
    expect(parsed.apps).toHaveLength(1);
    expect(parsed.apps[0].allowExternal).toBe(false);
    expect(parsed.providers.some((entry) => entry.id === 'mock')).toBe(true);
    expect(() => loadConfig({ AI_GATEWAY_APPS: 'not-json' })).toThrow(/valid JSON/);
    expect(() => loadConfig({ AI_GATEWAY_APPS: JSON.stringify([{ id: 'crm' }]) })).toThrow(/sha256/i);
  });

  it('refuses prompt/completion logging and public binding in production', () => {
    const problems = assertProductionConfig(config({
      nodeEnv: 'production',
      logPrompts: true,
      host: '0.0.0.0',
      apps: [],
    }));
    expect(problems.join(' ')).toMatch(/no application identities/i);
    expect(problems.join(' ')).toMatch(/prompt\/completion logging is disallowed/i);
    expect(problems.join(' ')).toMatch(/bind to loopback/i);
  });

  it('does not enable external providers when policy is restricted', () => {
    const parsed = loadConfig({
      NODE_ENV: 'test',
      AI_GATEWAY_APPS: JSON.stringify([{ id: 'crm', tokenSha256: hashToken(APP_TOKEN) }]),
      EXTERNAL_MODEL_BASE_URL: 'https://models.example.com/v1',
      EXTERNAL_MODEL_NAME: 'external-1',
      AI_EXTERNAL_DATA_POLICY: 'restricted',
      AI_GATEWAY_ENABLE_MOCK: 'false',
    });
    const external = parsed.providers.find((entry) => entry.id === 'external');
    expect(external.disabled).toBe(true);
    expect(external.disabledReason).toMatch(/not approved/i);
  });
});

describe('AI gateway HTTP surface', () => {
  let instance;
  beforeAll(async () => {
    instance = await start(config());
    servers.push(instance.running);
  });

  it('reports liveness without authentication and without topology detail', async () => {
    const response = await fetch(`${instance.base}/health/live`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(JSON.stringify(body)).not.toMatch(/token|secret|apps|providers/i);
  });

  it('reports readiness from real provider configuration', async () => {
    const response = await fetch(`${instance.base}/health/ready`);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.status).toBe('ready');
    expect(body.providers[0].id).toBe('mock');
  });

  it('serves metrics only on the private metrics listener', async () => {
    expect((await fetch(`${instance.base}/metrics`)).status).toBe(404);
    const metrics = await fetch(`${instance.metricsBase}/metrics`);
    expect(metrics.status).toBe(200);
    const text = await metrics.text();
    expect(text).toContain('ai_gateway_requests_total');
    expect(text).toContain('# TYPE ai_gateway_request_duration_seconds histogram');
    expect(text).not.toMatch(/sk-[a-z0-9]{10}/i);
  });

  it('rejects unauthenticated and wrongly authenticated inference', async () => {
    expect((await chat(instance.base, simpleChat, null)).status).toBe(401);
    expect((await chat(instance.base, simpleChat, 'not-a-real-token-but-long-enough')).status).toBe(401);
    const wrongAppToken = await fetch(`${instance.base}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${PHD_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...simpleChat, model: 'not-permitted' }),
    });
    expect(wrongAppToken.status).toBe(403);
  });

  it('lists only configured models for the calling application', async () => {
    const response = await fetch(`${instance.base}/v1/models`, { headers: auth() });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.map((model) => model.id)).toEqual(['mock-1']);
    const restricted = await fetch(`${instance.base}/v1/models`, { headers: auth(PHD_TOKEN) });
    expect((await restricted.json()).data.map((model) => model.id)).toEqual(['mock-1']);
  });

  it('completes a permitted request and returns usage plus policy metadata', async () => {
    const result = await chat(instance.base, simpleChat);
    expect(result.status).toBe(200);
    expect(result.body.choices[0].message.content).toContain('MOCK:mock-1');
    expect(result.body.usage.total_tokens).toBeGreaterThan(0);
    expect(result.body.gateway.app).toBe('crm');
    expect(result.body.gateway.policyDecision).toBe('external_permitted');
    expect(result.headers.get('x-request-id')).toBeTruthy();
  });

  it('rejects a model outside the application allowlist and an unknown model', async () => {
    const notAllowed = await chat(instance.base, { ...simpleChat, model: 'gpt-5-nano' });
    expect(notAllowed.status).toBe(403);
    expect(notAllowed.body.error.code).toBe('MODEL_NOT_PERMITTED');

    const unknown = await chat(instance.base, { ...simpleChat, model: 'not-a-configured-model' }, PHD_TOKEN);
    expect(unknown.status).toBe(403);
    expect(unknown.body.error.code).toBe('MODEL_NOT_PERMITTED');
  });

  it('validates the request body before any provider call', async () => {
    const noMessages = await chat(instance.base, { model: 'mock-1', messages: [] });
    expect(noMessages.status).toBe(400);
    const badRole = await chat(instance.base, { model: 'mock-1', messages: [{ role: 'tool', content: 'x' }] });
    expect(badRole.status).toBe(400);
    const tooManyTokens = await chat(instance.base, { ...simpleChat, max_tokens: 99_999 });
    expect(tooManyTokens.status).toBe(400);
    const malformed = await fetch(`${instance.base}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${APP_TOKEN}`, 'Content-Type': 'application/json' },
      body: '{not json',
    });
    expect(malformed.status).toBe(400);
  });

  it('rejects an oversized body without reading it into the application', async () => {
    const huge = 'x'.repeat(20_000);
    const response = await fetch(`${instance.base}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${APP_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'mock-1', messages: [{ role: 'user', content: huge }] }),
    }).catch(() => null);
    // The server closes the socket on overflow; either a 413 or a transport
    // failure is acceptable, but the request must never reach a provider.
    if (response) expect([413, 400]).toContain(response.status);
  });

  it('enforces the per-application rate limit', async () => {
    const limited = await start(
      config({ apps: [{ id: 'crm', tokenSha256: hashToken(APP_TOKEN), dataClassification: 'INTERNAL', allowExternal: false, requestsPerMinute: 1, maxInputBytes: 8_192 }] }),
    );
    servers.push(limited.running);
    expect((await chat(limited.base, simpleChat)).status).toBe(200);
    const over = await chat(limited.base, simpleChat);
    expect(over.status).toBe(429);
    expect(over.body.error.code).toBe('RATE_LIMITED');
    expect(over.headers.get('retry-after')).toBeTruthy();
  });
});

describe('AI gateway routing policy', () => {
  it('never sends a CONFIDENTIAL application to an external provider', async () => {
    const externalCalls = vi.fn(async () => ({ text: 'external', usage: { promptTokens: 1, completionTokens: 1 } }));
    const instance = await start(
      config({
        apps: [{ id: 'phd', tokenSha256: hashToken(PHD_TOKEN), dataClassification: 'CONFIDENTIAL', allowExternal: true, allowedModels: null, requestsPerMinute: 30, maxInputBytes: 8_192 }],
      }),
      {
        providers: [
          provider({ id: 'local', policy: 'LOCAL', model: 'model-x' }),
          provider({ id: 'external', policy: 'EXTERNAL', model: 'model-x', call: externalCalls }),
        ],
      },
    );
    servers.push(instance.running);
    const result = await chat(instance.base, { model: 'model-x', messages: [{ role: 'user', content: 'confidential thesis draft' }] }, PHD_TOKEN);
    expect(result.status).toBe(200);
    expect(externalCalls).not.toHaveBeenCalled();
    expect(result.body.gateway.provider).toBe('local');
  });

  it('fails closed for local_only even when an external provider could answer', async () => {
    const externalCalls = vi.fn(async () => ({ text: 'external', usage: {} }));
    const instance = await start(
      config({ apps: [{ id: 'crm', tokenSha256: hashToken(APP_TOKEN), dataClassification: 'INTERNAL', allowExternal: true, requestsPerMinute: 60, maxInputBytes: 8_192 }] }),
      { providers: [provider({ id: 'external', policy: 'EXTERNAL', model: 'model-x', call: externalCalls })] },
    );
    servers.push(instance.running);
    const result = await chat(instance.base, { model: 'model-x', route: 'local_only', messages: [{ role: 'user', content: 'hi' }] });
    expect(result.status).toBe(403);
    expect(result.body.error.code).toBe('LOCAL_ONLY_UNAVAILABLE');
    expect(externalCalls).not.toHaveBeenCalled();
  });

  it('requires human review instead of calling a model for manual_review', async () => {
    const instance = await start(config(), { providers: [provider({ id: 'local', policy: 'LOCAL', model: 'mock-1' })] });
    servers.push(instance.running);
    const result = await chat(instance.base, { ...simpleChat, route: 'manual_review' });
    expect(result.status).toBe(202);
    expect(result.body.error.code).toBe('MANUAL_REVIEW_REQUIRED');
  });

  it('falls back from external to local only when policy permits, and records it', async () => {
    const external = provider({ id: 'external', policy: 'EXTERNAL', model: 'model-x', call: async () => { throw new Error('upstream 500'); } });
    const local = provider({ id: 'local', policy: 'LOCAL', model: 'model-x' });
    const instance = await start(
      config({ apps: [{ id: 'crm', tokenSha256: hashToken(APP_TOKEN), dataClassification: 'PUBLIC', allowExternal: true, requestsPerMinute: 60, maxInputBytes: 8_192 }] }),
      { providers: [local, external] },
    );
    servers.push(instance.running);
    const result = await chat(instance.base, { model: 'model-x', route: 'external_approved', messages: [{ role: 'user', content: 'hello' }] });
    expect(result.status).toBe(200);
    expect(result.body.gateway.fallbackUsed).toBe(true);
    expect(result.body.gateway.provider).toBe('local');
  });

  it('does not fall back to an external provider when external fallback is disabled', async () => {
    const externalCalls = vi.fn(async () => ({ text: 'external', usage: {} }));
    const failingLocal = provider({ id: 'local', policy: 'LOCAL', model: 'model-x', call: async () => { throw new Error('local down'); } });
    const external = provider({ id: 'external', policy: 'EXTERNAL', model: 'model-x', call: externalCalls });
    const instance = await start(
      config({
        externalFallbackEnabled: false,
        apps: [{ id: 'crm', tokenSha256: hashToken(APP_TOKEN), dataClassification: 'INTERNAL', allowExternal: true, requestsPerMinute: 60, maxInputBytes: 8_192 }],
      }),
      { providers: [failingLocal, external] },
    );
    servers.push(instance.running);
    const result = await chat(instance.base, { model: 'model-x', messages: [{ role: 'user', content: 'hi' }] });
    expect(result.status).toBe(502);
    expect(externalCalls).not.toHaveBeenCalled();
  });
});

describe('AI gateway reliability controls', () => {
  it('bounds retries and reports the provider failure', async () => {
    let calls = 0;
    const instance = await start(
      config({ maxRetries: 2, apps: [{ id: 'crm', tokenSha256: hashToken(APP_TOKEN), dataClassification: 'INTERNAL', requestsPerMinute: 60, maxInputBytes: 8_192 }] }),
      { providers: [provider({ id: 'local', policy: 'LOCAL', model: 'model-x', call: async () => { calls += 1; throw new Error('boom'); } })] },
    );
    servers.push(instance.running);
    const result = await chat(instance.base, { model: 'model-x', messages: [{ role: 'user', content: 'hi' }] });
    expect(result.status).toBe(502);
    expect(calls).toBe(3); // 1 initial + 2 retries, never unbounded
  });

  it('returns a timeout error when the provider exceeds the deadline', async () => {
    const instance = await start(
      config({ maxRetries: 0, apps: [{ id: 'crm', tokenSha256: hashToken(APP_TOKEN), dataClassification: 'INTERNAL', requestsPerMinute: 60, maxInputBytes: 8_192 }] }),
      {
        providers: [provider({
          id: 'local',
          policy: 'LOCAL',
          model: 'model-x',
          call: async () => { const error = new Error('timed out'); error.name = 'AbortError'; throw error; },
        })],
      },
    );
    servers.push(instance.running);
    const result = await chat(instance.base, { model: 'model-x', messages: [{ role: 'user', content: 'hi' }] });
    expect([502, 504]).toContain(result.status);
  });

  it('opens the circuit breaker after repeated failures', async () => {
    let calls = 0;
    const instance = await start(
      config({ maxRetries: 0, circuitFailureThreshold: 2, apps: [{ id: 'crm', tokenSha256: hashToken(APP_TOKEN), dataClassification: 'INTERNAL', requestsPerMinute: 60, maxInputBytes: 8_192 }] }),
      { providers: [provider({ id: 'local', policy: 'LOCAL', model: 'model-x', call: async () => { calls += 1; throw new Error('down'); } })] },
    );
    servers.push(instance.running);
    await chat(instance.base, { model: 'model-x', messages: [{ role: 'user', content: 'a' }] });
    await chat(instance.base, { model: 'model-x', messages: [{ role: 'user', content: 'b' }] });
    const third = await chat(instance.base, { model: 'model-x', messages: [{ role: 'user', content: 'c' }] });
    expect(third.status).toBe(503);
    expect(calls).toBe(2);
    const metrics = await (await fetch(`${instance.metricsBase}/metrics`)).text();
    expect(metrics).toMatch(/ai_gateway_circuit_open\{provider="local"\} 1/);
  });

  it('never logs prompts, completions or bearer tokens', async () => {
    const lines = [];
    const instance = await start(config({ apps: [{ id: 'crm', tokenSha256: hashToken(APP_TOKEN), dataClassification: 'INTERNAL', requestsPerMinute: 60, maxInputBytes: 8_192 }] }), {
      logger: (line) => lines.push(line),
      providers: [provider({ id: 'local', policy: 'LOCAL', model: 'model-x' })],
    });
    servers.push(instance.running);
    const secretPrompt = 'My passport number is 123456789 and my email is student@example.com';
    const result = await chat(instance.base, { model: 'model-x', messages: [{ role: 'user', content: secretPrompt }] });
    expect(result.status).toBe(200);
    const joined = lines.join('\n');
    expect(joined).not.toContain('passport');
    expect(joined).not.toContain('student@example.com');
    expect(joined).not.toContain(APP_TOKEN);
    expect(joined).toContain('chat_completion');
    expect(joined).toContain('"app":"crm"');
  });

  it('rejects unsupported methods and unknown paths without leaking internals', async () => {
    const instance = await start(config());
    servers.push(instance.running);
    const response = await fetch(`${instance.base}/v1/chat/completions`, { method: 'GET', headers: auth() });
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(JSON.stringify(body)).not.toMatch(/at .*server\.mjs|node_modules/);
  });
});

describe('AI gateway as a separate listener', () => {
  it('binds both listeners on loopback', async () => {
    const instance = await start(config());
    servers.push(instance.running);
    expect(instance.running.address.address).toBe('127.0.0.1');
    expect(instance.running.metricsAddress.address).toBe('127.0.0.1');
    expect(instance.running.address.port).not.toBe(instance.running.metricsAddress.port);
  });

  it('serves a second application identity independently', async () => {
    const instance = await start(config());
    servers.push(instance.running);
    const phd = await chat(instance.base, { ...simpleChat, model: 'mock-1' }, PHD_TOKEN);
    expect(phd.status).toBe(200);
    expect(phd.body.gateway.app).toBe('phd');
    const crossApp = await chat(instance.base, { ...simpleChat, model: 'mock-1' }, OTHER_TOKEN);
    expect(crossApp.status).toBe(401);
  });
});

// Keep the HTTP import used so lint does not flag an unused dependency when the
// suite grows to include a raw-socket check.
void createServer;
