import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import http from 'node:http';
import { GatewayNotConfiguredError, gatewayChat, gatewayStatus, isGatewayEnabled } from '@/lib/phd/ai/gateway';

/**
 * These tests exercise the PhD module's gateway client against a real HTTP
 * server, so the request/response contract is verified end to end without any
 * provider credential and without touching applicant data.
 */

interface Captured {
  authorization?: string;
  body?: Record<string, unknown>;
}

const captured: Captured[] = [];
let server: http.Server;
let base = '';
let mode: 'ok' | 'error' | 'empty' | 'slow' = 'ok';

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      if (req.url === '/v1/chat/completions' && req.method === 'POST') {
        let parsed: Record<string, unknown> = {};
        try { parsed = JSON.parse(raw); } catch { parsed = {}; }
        captured.push({ authorization: req.headers.authorization, body: parsed });
        if (mode === 'slow') {
          setTimeout(() => { res.writeHead(504); res.end('{}'); }, 5_000);
          return;
        }
        if (mode === 'error') {
          res.writeHead(503, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: { code: 'NO_PROVIDER', message: 'No healthy provider is available.' } }));
          return;
        }
        if (mode === 'empty') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: '' } }] }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          model: 'local-model',
          choices: [{ index: 0, message: { role: 'assistant', content: '{"ok":true}' } }],
          usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 },
          gateway: { provider: 'mock', policyDecision: 'local_only', fallbackUsed: false, requestId: 'req-test-1' },
        }));
        return;
      }
      res.writeHead(404);
      res.end('{}');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address();
  if (address && typeof address === 'object') base = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  delete process.env.PHD_AI_GATEWAY_ENABLED;
  delete process.env.AI_GATEWAY_BASE_URL;
  delete process.env.PHD_AI_GATEWAY_TOKEN;
});

describe('PhD AI gateway client', () => {
  it('reports itself disabled when the flag or credentials are absent', () => {
    delete process.env.PHD_AI_GATEWAY_ENABLED;
    delete process.env.AI_GATEWAY_BASE_URL;
    delete process.env.PHD_AI_GATEWAY_TOKEN;
    expect(isGatewayEnabled()).toBe(false);
    expect(gatewayStatus()).toEqual({ enabled: false, model: '' });

    process.env.PHD_AI_GATEWAY_ENABLED = 'true';
    expect(isGatewayEnabled()).toBe(false); // no URL/token yet
    process.env.AI_GATEWAY_BASE_URL = base;
    process.env.PHD_AI_GATEWAY_TOKEN = 'test-gateway-token-0123456789';
    expect(isGatewayEnabled()).toBe(true);

    delete process.env.PHD_AI_GATEWAY_TOKEN;
    expect(isGatewayEnabled()).toBe(false);
  });

  it('refuses to call anything when not configured', async () => {
    delete process.env.PHD_AI_GATEWAY_ENABLED;
    await expect(gatewayChat({ messages: [{ role: 'user', content: 'hello' }] })).rejects.toBeInstanceOf(GatewayNotConfiguredError);
  });

  it('sends a confidential, local-only request and returns the parsed result', async () => {
    process.env.PHD_AI_GATEWAY_ENABLED = 'true';
    process.env.AI_GATEWAY_BASE_URL = base;
    process.env.PHD_AI_GATEWAY_TOKEN = 'test-gateway-token-0123456789';
    mode = 'ok';
    captured.length = 0;

    const result = await gatewayChat({
      messages: [{ role: 'user', content: 'Draft the methodology section.' }],
      maxTokens: 400,
      userKey: 'user-hash-123',
      route: 'local_only',
    });

    expect(result.text).toBe('{"ok":true}');
    expect(result.provider).toBe('mock');
    expect(result.policyDecision).toBe('local_only');
    expect(result.requestId).toBe('req-test-1');
    expect(result.usage.totalTokens).toBe(16);
    expect(captured).toHaveLength(1);
    expect(captured[0].authorization).toBe('Bearer test-gateway-token-0123456789');
    expect(captured[0].body).toMatchObject({
      route: 'local_only',
      data_classification: 'CONFIDENTIAL',
      max_tokens: 400,
      user: 'user-hash-123',
    });
  });

  it('surfaces a gateway policy error without retrying around it', async () => {
    mode = 'error';
    captured.length = 0;
    await expect(gatewayChat({ messages: [{ role: 'user', content: 'x' }] })).rejects.toMatchObject({
      code: 'NO_PROVIDER',
      status: 503,
    });
    expect(captured).toHaveLength(1); // exactly one attempt; no hidden fallback
  });

  it('treats an empty completion as a contract error, not success', async () => {
    mode = 'empty';
    await expect(gatewayChat({ messages: [{ role: 'user', content: 'x' }] })).rejects.toMatchObject({ code: 'GATEWAY_CONTRACT' });
  });

  it('times out rather than hanging forever', async () => {
    mode = 'slow';
    process.env.PHD_AI_GATEWAY_TIMEOUT_MS = '150';
    await expect(gatewayChat({ messages: [{ role: 'user', content: 'x' }] })).rejects.toMatchObject({
      code: 'GATEWAY_TIMEOUT',
      status: 504,
    });
    delete process.env.PHD_AI_GATEWAY_TIMEOUT_MS;
  });

  it('never includes the token in error messages', async () => {
    mode = 'error';
    const failure = await gatewayChat({ messages: [{ role: 'user', content: 'x' }] }).catch((error: Error) => error);
    expect(String(failure)).not.toContain('test-gateway-token');
  });
});
