/**
 * Shared ALO AI Gateway (standalone network service).
 *
 * Why a separate service: the three products already contain provider SDKs and
 * retry logic in their own processes. Moving provider credentials, quotas,
 * data-egress policy and audit into one authenticated service makes that logic
 * reviewable and testable in one place, without rebuilding the applications.
 *
 * Design constraints enforced here:
 *  - fail closed: no app registry or no healthy provider => readiness false;
 *  - local-only routes can never fall back to an external provider;
 *  - external egress requires BOTH the application flag and the deployment
 *    policy, and is refused for CONFIDENTIAL / RESTRICTED data;
 *  - prompts, completions, tokens and document text are never logged;
 *  - retries and timeouts are bounded; a circuit breaker protects providers;
 *  - metrics use bounded labels and are served only on the metrics listener.
 */
import http from 'node:http';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';

export const GATEWAY_VERSION = '1.0.0';

export class GatewayError extends Error {
  constructor(status, code, message, extra = {}) {
    super(message);
    this.name = 'GatewayError';
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

const DATA_CLASS_ORDER = { PUBLIC: 0, INTERNAL: 1, CONFIDENTIAL: 2, RESTRICTED: 3 };
const ROUTES = new Set(['policy_default', 'local_only', 'external_approved', 'quality', 'cost_controlled', 'manual_review']);

export function hashToken(token) {
  return createHash('sha256').update(String(token), 'utf8').digest('hex');
}

function asBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (/^(1|true|yes|on)$/i.test(String(value))) return true;
  if (/^(0|false|no|off)$/i.test(String(value))) return false;
  return fallback;
}

function asInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function parseApps(raw) {
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GatewayError(500, 'CONFIG_INVALID', 'AI_GATEWAY_APPS must be valid JSON.');
  }
  if (!Array.isArray(parsed)) throw new GatewayError(500, 'CONFIG_INVALID', 'AI_GATEWAY_APPS must be an array.');
  return parsed.map((entry) => {
    if (!entry || typeof entry !== 'object') throw new GatewayError(500, 'CONFIG_INVALID', 'Each gateway app must be an object.');
    if (!/^[a-z0-9][a-z0-9_-]{2,39}$/.test(String(entry.id ?? ''))) {
      throw new GatewayError(500, 'CONFIG_INVALID', 'Gateway app ids must be 3-40 characters of [a-z0-9_-].');
    }
    if (!/^[a-f0-9]{64}$/.test(String(entry.tokenSha256 ?? ''))) {
      throw new GatewayError(500, 'CONFIG_INVALID', `App ${entry.id} needs a sha256 token hash (64 lowercase hex characters).`);
    }
    const classification = String(entry.dataClassification ?? 'INTERNAL').toUpperCase();
    if (!(classification in DATA_CLASS_ORDER)) {
      throw new GatewayError(500, 'CONFIG_INVALID', `App ${entry.id} has an unknown dataClassification.`);
    }
    return {
      id: String(entry.id),
      tokenSha256: String(entry.tokenSha256),
      dataClassification: classification,
      allowExternal: asBool(entry.allowExternal, false),
      allowedModels: Array.isArray(entry.allowedModels) && entry.allowedModels.length ? entry.allowedModels.map(String) : null,
      requestsPerMinute: asInt(entry.requestsPerMinute, 60, 1, 10_000),
      maxInputBytes: asInt(entry.maxInputBytes, 1_048_576, 1024, 8_388_608),
      monthlyBudgetMinor: Number.isFinite(Number(entry.monthlyBudgetMinor)) ? Number(entry.monthlyBudgetMinor) : null,
    };
  });
}

export function loadConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV || 'development';
  const externalPolicy = String(env.AI_EXTERNAL_DATA_POLICY || 'restricted').toLowerCase();
  const providerAllowlist = String(env.AI_PROVIDER_ALLOWLIST || '')
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const providers = [];
  const mockEnabled = asBool(env.AI_GATEWAY_ENABLE_MOCK, nodeEnv !== 'production');
  if (mockEnabled) {
    providers.push({
      id: 'mock',
      policy: 'LOCAL',
      models: [{ id: env.AI_GATEWAY_MOCK_MODEL || 'mock-1', external: false }],
    });
  }
  if (env.LOCAL_MODEL_BASE_URL && env.LOCAL_MODEL_NAME) {
    providers.push({
      id: 'local',
      policy: 'LOCAL',
      baseUrl: env.LOCAL_MODEL_BASE_URL,
      apiKey: env.LOCAL_MODEL_API_KEY || '',
      timeoutMs: asInt(env.LOCAL_MODEL_REQUEST_TIMEOUT_MS, 120_000, 1_000, 300_000),
      models: [{ id: env.LOCAL_MODEL_NAME, external: false }],
    });
  }
  if (env.EXTERNAL_MODEL_BASE_URL && env.EXTERNAL_MODEL_NAME) {
    if (externalPolicy !== 'approved' || (providerAllowlist.length && !providerAllowlist.includes('external'))) {
      providers.push({
        id: 'external',
        policy: 'EXTERNAL',
        baseUrl: env.EXTERNAL_MODEL_BASE_URL,
        apiKey: env.EXTERNAL_MODEL_API_KEY || '',
        timeoutMs: asInt(env.EXTERNAL_MODEL_REQUEST_TIMEOUT_MS, 60_000, 1_000, 300_000),
        models: [{ id: env.EXTERNAL_MODEL_NAME, external: true }],
        disabledReason: 'External provider configured but not approved by AI_EXTERNAL_DATA_POLICY / AI_PROVIDER_ALLOWLIST.',
        disabled: true,
      });
    } else {
      providers.push({
        id: 'external',
        policy: 'EXTERNAL',
        baseUrl: env.EXTERNAL_MODEL_BASE_URL,
        apiKey: env.EXTERNAL_MODEL_API_KEY || '',
        timeoutMs: asInt(env.EXTERNAL_MODEL_REQUEST_TIMEOUT_MS, 60_000, 1_000, 300_000),
        models: [{ id: env.EXTERNAL_MODEL_NAME, external: true }],
      });
    }
  }

  return {
    nodeEnv,
    host: env.AI_GATEWAY_HOST || '127.0.0.1',
    port: asInt(env.AI_GATEWAY_PORT, 3180, 1, 65_535),
    metricsHost: env.AI_GATEWAY_METRICS_HOST || '127.0.0.1',
    metricsPort: asInt(env.AI_GATEWAY_METRICS_PORT, 9180, 1, 65_535),
    metricsEnabled: asBool(env.AI_GATEWAY_METRICS_ENABLED, true),
    requestTimeoutMs: asInt(env.AI_GATEWAY_REQUEST_TIMEOUT_MS, 120_000, 1_000, 300_000),
    maxRetries: asInt(env.AI_GATEWAY_MAX_RETRIES, 2, 0, 4),
    retryBaseMs: asInt(env.AI_GATEWAY_RETRY_BASE_MS, 120, 10, 5_000),
    maxConcurrent: asInt(env.AI_GATEWAY_MAX_CONCURRENT_REQUESTS, 8, 1, 128),
    maxInputBytes: asInt(env.AI_GATEWAY_MAX_INPUT_BYTES, 1_048_576, 1024, 8_388_608),
    maxOutputTokens: asInt(env.AI_GATEWAY_MAX_OUTPUT_TOKENS, 4096, 1, 32_768),
    circuitBreakerEnabled: asBool(env.AI_GATEWAY_CIRCUIT_BREAKER_ENABLED, true),
    circuitFailureThreshold: asInt(env.AI_GATEWAY_CIRCUIT_FAILURE_THRESHOLD, 5, 1, 100),
    circuitResetMs: asInt(env.AI_GATEWAY_CIRCUIT_RESET_MS, 30_000, 1_000, 600_000),
    logPrompts: asBool(env.AI_GATEWAY_LOG_PROMPTS, false),
    logCompletions: asBool(env.AI_GATEWAY_LOG_COMPLETIONS, false),
    auditEnabled: asBool(env.AI_GATEWAY_AUDIT_ENABLED, true),
    externalFallbackEnabled: asBool(env.AI_GATEWAY_EXTERNAL_FALLBACK_ENABLED, false),
    externalPolicy,
    providerAllowlist,
    apps: parseApps(env.AI_GATEWAY_APPS),
    providers,
    version: GATEWAY_VERSION,
  };
}

export function assertProductionConfig(config) {
  const problems = [];
  if (!config.apps.length) problems.push('No application identities are configured (AI_GATEWAY_APPS).');
  if (config.nodeEnv === 'production' && !config.providers.some((provider) => !provider.disabled && !provider.disabledReason)) {
    problems.push('No usable model provider is configured.');
  }
  if (config.logPrompts || config.logCompletions) {
    problems.push('Prompt/completion logging is disallowed: set AI_GATEWAY_LOG_PROMPTS=false and AI_GATEWAY_LOG_COMPLETIONS=false.');
  }
  if (config.nodeEnv === 'production' && config.host !== '127.0.0.1' && config.host !== '::1') {
    problems.push('In production the gateway must bind to loopback and be exposed only through the approved reverse proxy.');
  }
  return problems;
}

function estimateTokens(text) {
  return Math.max(1, Math.ceil(String(text).length / 4));
}

function redact(text) {
  return String(text)
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email]')
    .replace(/\b(?:\+?\d[\d\s-]{7,}\d)\b/g, '[number]')
    .slice(0, 500);
}

function makeMockProvider(definition) {
  return {
    id: definition.id,
    policy: definition.policy,
    models: definition.models,
    disabled: false,
    async call({ messages, model }) {
      const last = [...messages].reverse().find((message) => message.role === 'user');
      const prompt = last?.content ?? '';
      const text = `MOCK:${model}:${prompt.slice(0, 200)}`;
      return { text, usage: { promptTokens: estimateTokens(prompt), completionTokens: estimateTokens(text) } };
    },
  };
}

function makeOpenAiCompatibleProvider(definition, deps) {
  const fetchImpl = deps.fetchImpl ?? globalThis.fetch;
  return {
    id: definition.id,
    policy: definition.policy,
    models: definition.models,
    disabled: Boolean(definition.disabled),
    disabledReason: definition.disabledReason,
    async call({ messages, model, maxTokens, temperature, signal }) {
      if (definition.disabled) throw new GatewayError(503, 'PROVIDER_DISABLED', definition.disabledReason || 'Provider disabled by policy.');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), definition.timeoutMs ?? 60_000);
      signal?.addEventListener('abort', () => controller.abort(), { once: true });
      try {
        const response = await fetchImpl(`${definition.baseUrl.replace(/\/$/, '')}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(definition.apiKey ? { Authorization: `Bearer ${definition.apiKey}` } : {}),
          },
          body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
          signal: controller.signal,
        });
        if (!response.ok) {
          const status = response.status;
          throw new GatewayError(status === 429 ? 429 : 502, 'PROVIDER_ERROR', `Provider returned HTTP ${status}.`);
        }
        const payload = await response.json();
        const text = payload?.choices?.[0]?.message?.content;
        if (typeof text !== 'string') throw new GatewayError(502, 'PROVIDER_CONTRACT', 'Provider response did not contain message content.');
        return {
          text,
          usage: {
            promptTokens: payload?.usage?.prompt_tokens ?? estimateTokens(messages.map((message) => message.content).join(' ')),
            completionTokens: payload?.usage?.completion_tokens ?? estimateTokens(text),
          },
        };
      } catch (error) {
        if (error?.name === 'AbortError') throw new GatewayError(504, 'PROVIDER_TIMEOUT', 'Provider timed out.');
        throw error;
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

export function buildProviders(config, deps = {}) {
  return config.providers.map((definition) =>
    definition.id === 'mock'
      ? makeMockProvider(definition)
      : makeOpenAiCompatibleProvider(definition, deps),
  );
}

function secureEqual(actualHex, expectedHex) {
  // Compare the two SHA-256 digests as raw bytes (both sides hex-encoded).
  const a = Buffer.from(String(actualHex), 'hex');
  const b = Buffer.from(String(expectedHex), 'hex');
  if (!a.length || a.length !== 32) return false;
  if (a.length !== b.length) {
    // still perform a comparison to reduce timing signal
    const padded = Buffer.alloc(b.length);
    a.copy(padded);
    timingSafeEqual(padded, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

function jsonBody(res, status, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Length': Buffer.byteLength(body),
    ...extraHeaders,
  });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new GatewayError(413, 'BODY_TOO_LARGE', 'Request body exceeds the configured limit.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', () => reject(new GatewayError(400, 'BODY_READ_ERROR', 'Request body could not be read.')));
  });
}

function validateChatRequest(body, config) {
  if (!body || typeof body !== 'object') throw new GatewayError(400, 'INVALID_BODY', 'A JSON object body is required.');
  if (typeof body.model !== 'string' || !body.model.trim()) throw new GatewayError(400, 'INVALID_MODEL', 'model is required.');
  if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 200) {
    throw new GatewayError(400, 'INVALID_MESSAGES', 'messages must be a non-empty array (max 200).');
  }
  let characters = 0;
  const messages = body.messages.map((message) => {
    if (!message || typeof message !== 'object') throw new GatewayError(400, 'INVALID_MESSAGES', 'Each message must be an object.');
    if (!['system', 'user', 'assistant'].includes(message.role)) throw new GatewayError(400, 'INVALID_MESSAGES', 'Message role must be system, user or assistant.');
    if (typeof message.content !== 'string') throw new GatewayError(400, 'INVALID_MESSAGES', 'Message content must be a string.');
    characters += message.content.length;
    return { role: message.role, content: message.content };
  });
  if (characters > config.maxInputBytes) throw new GatewayError(413, 'INPUT_TOO_LARGE', 'Prompt exceeds the configured input limit.');
  const defaultTokens = Math.min(1024, config.maxOutputTokens);
  const maxTokens = body.max_tokens === undefined ? defaultTokens : Number(body.max_tokens);
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > config.maxOutputTokens) {
    throw new GatewayError(400, 'INVALID_MAX_TOKENS', `max_tokens must be an integer between 1 and ${config.maxOutputTokens}.`);
  }
  const route = body.route ? String(body.route) : 'policy_default';
  if (!ROUTES.has(route)) throw new GatewayError(400, 'INVALID_ROUTE', 'Unknown routing policy.');
  const requestedClass = body.data_classification ? String(body.data_classification).toUpperCase() : null;
  if (requestedClass && !(requestedClass in DATA_CLASS_ORDER)) throw new GatewayError(400, 'INVALID_CLASSIFICATION', 'Unknown data_classification.');
  return { model: body.model.trim(), messages, maxTokens, route, requestedClass, temperature: typeof body.temperature === 'number' ? body.temperature : 0.2, user: body.user ? String(body.user).slice(0, 80) : '' };
}

function classifyRoute(app, request, model, config, availableProviders) {
  const effectiveClass = request.requestedClass &&
    DATA_CLASS_ORDER[request.requestedClass] > DATA_CLASS_ORDER[app.dataClassification]
    ? request.requestedClass
    : app.dataClassification;
  if (request.route === 'manual_review') {
    throw new GatewayError(202, 'MANUAL_REVIEW_REQUIRED', 'This request requires human review before any model call is made.');
  }
  const localCapable = availableProviders.some((provider) => provider.policy === 'LOCAL' && !provider.disabled && provider.models.some((entry) => entry.id === model));
  const externalCapable = availableProviders.some((provider) => provider.policy === 'EXTERNAL' && !provider.disabled && provider.models.some((entry) => entry.id === model));
  if (!localCapable && !externalCapable) throw new GatewayError(403, 'MODEL_NOT_PERMITTED', 'The requested model is not available under any permitted provider.');
  if (request.route === 'local_only' && !localCapable) {
    throw new GatewayError(403, 'LOCAL_ONLY_UNAVAILABLE', 'A local-only request cannot use an external provider.');
  }
  const externalAllowed =
    app.allowExternal &&
    config.externalPolicy === 'approved' &&
    DATA_CLASS_ORDER[effectiveClass] < DATA_CLASS_ORDER.CONFIDENTIAL;
  const wantsExternal = request.route === 'external_approved' || (request.route === 'policy_default' && !localCapable);
  if (wantsExternal && !externalAllowed) {
    throw new GatewayError(403, 'EXTERNAL_NOT_ALLOWED', 'External processing is not permitted for this application or data classification.');
  }
  if (request.route === 'external_approved' && !externalCapable) {
    throw new GatewayError(403, 'EXTERNAL_UNAVAILABLE', 'No approved external provider serves the requested model.');
  }
  return { effectiveClass, localCapable, externalCapable, externalAllowed };
}

export function createGateway(config, deps = {}) {
  const logger = deps.logger ?? ((line) => process.stdout.write(`${line}\n`));
  const now = deps.now ?? (() => Date.now());
  const providers = deps.providers ?? buildProviders(config, deps);
  const metrics = {
    requests: new Map(),
    durations: [],
    inflight: 0,
    denials: new Map(),
    rateLimited: new Map(),
    tokens: new Map(),
    retries: 0,
    fallbacks: 0,
  };
  const rate = new Map();
  const circuits = new Map();
  const startedAt = now();

  const bump = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);
  const audit = (event) => {
    if (!config.auditEnabled) return;
    logger(JSON.stringify({ ts: new Date(now()).toISOString(), service: 'ai-gateway', ...event }));
  };

  function authenticate(header) {
    const value = String(header || '');
    const match = /^Bearer\s+(.+)$/i.exec(value);
    if (!match) throw new GatewayError(401, 'UNAUTHENTICATED', 'A bearer token is required.');
    const token = match[1].trim();
    if (token.length < 20 || token.length > 200) throw new GatewayError(401, 'UNAUTHENTICATED', 'Invalid credentials.');
    const candidateHash = hashToken(token);
    const app = config.apps.find((entry) => secureEqual(candidateHash, entry.tokenSha256));
    if (!app) throw new GatewayError(401, 'UNAUTHENTICATED', 'Invalid credentials.');
    return app;
  }

  function enforceRate(app, userKey) {
    const windowStart = Math.floor(now() / 60_000);
    const key = `${app.id}:${userKey || '-'}`;
    const entry = rate.get(key);
    if (!entry || entry.windowStart !== windowStart) {
      rate.set(key, { windowStart, count: 1 });
      return;
    }
    entry.count += 1;
    if (entry.count > app.requestsPerMinute) {
      bump(metrics.rateLimited, app.id);
      throw new GatewayError(429, 'RATE_LIMITED', 'Request rate limit exceeded for this application.', { retryAfter: 60 - Math.floor((now() % 60_000) / 1000) });
    }
  }

  function circuitFor(providerId) {
    if (!circuits.has(providerId)) circuits.set(providerId, { failures: 0, openedAt: 0 });
    return circuits.get(providerId);
  }

  function isCircuitOpen(providerId) {
    const circuit = circuitFor(providerId);
    if (!config.circuitBreakerEnabled) return false;
    if (!circuit.openedAt) return false;
    if (now() - circuit.openedAt >= config.circuitResetMs) {
      circuit.openedAt = 0; // half-open: allow one probe
      return false;
    }
    return true;
  }

  function recordProviderFailure(providerId) {
    const circuit = circuitFor(providerId);
    circuit.failures += 1;
    if (config.circuitBreakerEnabled && circuit.failures >= config.circuitFailureThreshold) {
      circuit.openedAt = now();
      circuit.failures = 0;
      audit({ event: 'circuit_open', provider: providerId });
    }
  }

  function recordProviderSuccess(providerId) {
    const circuit = circuitFor(providerId);
    circuit.failures = 0;
    circuit.openedAt = 0;
  }

  function candidateProviders(model, policy) {
    return providers.filter((provider) => {
      if (provider.disabled) return false;
      if (!provider.models.some((entry) => entry.id === model)) return false;
      if (provider.policy === 'EXTERNAL' && policy !== 'external_allowed') return false;
      return true;
    });
  }

  async function callProvider(provider, params) {
    let attempt = 0;
    const maxAttempts = 1 + config.maxRetries;
    let lastError;
    while (attempt < maxAttempts) {
      attempt += 1;
      if (isCircuitOpen(provider.id)) throw new GatewayError(503, 'CIRCUIT_OPEN', 'The provider is temporarily unavailable.');
      try {
        const result = await provider.call(params);
        recordProviderSuccess(provider.id);
        return { ...result, attempts: attempt, providerId: provider.id, policy: provider.policy };
      } catch (error) {
        lastError = error;
        recordProviderFailure(provider.id);
        const retryable = error instanceof GatewayError ? [429, 502, 503, 504].includes(error.status) : true;
        if (!retryable || attempt >= maxAttempts) break;
        metrics.retries += 1;
        const backoff = config.retryBaseMs * 2 ** (attempt - 1) + Math.floor(Math.random() * config.retryBaseMs);
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
    if (lastError instanceof GatewayError) throw lastError;
    throw new GatewayError(502, 'PROVIDER_ERROR', 'The provider call failed.', { cause: redact(lastError?.message ?? '') });
  }

  async function handleChat(req, res) {
    const requestId = randomUUID();
    const started = now();
    metrics.inflight += 1;
    let app;
    try {
      app = authenticate(req.headers.authorization);
      const raw = await readBody(req, Math.min(config.maxInputBytes + 4096, app.maxInputBytes + 4096));
      let body;
      try {
        body = JSON.parse(raw);
      } catch {
        throw new GatewayError(400, 'INVALID_JSON', 'Request body must be valid JSON.');
      }
      const request = validateChatRequest(body, config);
      if (app.allowedModels && !app.allowedModels.includes(request.model)) {
        bump(metrics.denials, 'model_not_allowed');
        throw new GatewayError(403, 'MODEL_NOT_PERMITTED', 'This application is not permitted to use the requested model.');
      }
      const policy = classifyRoute(app, request, request.model, config, providers);
      enforceRate(app, request.user);

      if (metrics.inflight > config.maxConcurrent) {
        throw new GatewayError(503, 'OVERLOADED', 'The gateway is at its concurrency limit.', { retryAfter: 1 });
      }

      const allowedPolicy = policy.externalAllowed ? 'external_allowed' : 'local_only';
      let candidates = candidateProviders(request.model, allowedPolicy);
      if (!candidates.length) throw new GatewayError(503, 'NO_PROVIDER', 'No healthy provider is available for this model and policy.');
      // external_approved prefers the approved external provider and may fall
      // back to local; every other route prefers the local provider.
      const preferExternal = request.route === 'external_approved';
      candidates = candidates.sort((a, b) => {
        const rank = (candidate) => (candidate.policy === 'EXTERNAL' ? (preferExternal ? 0 : 1) : preferExternal ? 1 : 0);
        return rank(a) - rank(b);
      });

      let result;
      let fallbackUsed = false;
      let lastError;
      for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        // Never cross from a local-only decision to an external provider.
        if (candidate.policy === 'EXTERNAL' && (!policy.externalAllowed || !config.externalFallbackEnabled)) {
          if (index > 0) continue;
        }
        try {
          result = await callProvider(candidate, {
            model: request.model,
            messages: request.messages,
            maxTokens: request.maxTokens,
            temperature: request.temperature,
            requestId,
          });
          fallbackUsed = index > 0;
          if (fallbackUsed) metrics.fallbacks += 1;
          break;
        } catch (error) {
          lastError = error;
        }
      }
      if (!result) throw lastError ?? new GatewayError(502, 'PROVIDER_ERROR', 'No provider completed the request.');

      const usage = {
        prompt_tokens: result.usage?.promptTokens ?? estimateTokens(request.messages.map((message) => message.content).join(' ')),
        completion_tokens: result.usage?.completionTokens ?? estimateTokens(result.text),
        total_tokens: 0,
      };
      usage.total_tokens = usage.prompt_tokens + usage.completion_tokens;

      bump(metrics.requests, `${app.id}|${request.model}|success`);
      bump(metrics.tokens, `${app.id}|${request.model}|input`, usage.prompt_tokens);
      bump(metrics.tokens, `${app.id}|${request.model}|output`, usage.completion_tokens);
      metrics.durations.push({ ms: now() - started, app: app.id, model: request.model, outcome: 'success' });

      audit({
        event: 'chat_completion',
        requestId,
        app: app.id,
        provider: result.providerId,
        model: request.model,
        route: request.route,
        dataClassification: policy.effectiveClass,
        fallbackUsed,
        attempts: result.attempts,
        status: 200,
        latencyMs: now() - started,
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
      });

      jsonBody(res, 200, {
        id: `chatcmpl_${requestId}`,
        object: 'chat.completion',
        created: Math.floor(now() / 1000),
        model: request.model,
        choices: [{ index: 0, message: { role: 'assistant', content: result.text }, finish_reason: 'stop' }],
        usage,
        gateway: {
          app: app.id,
          provider: result.providerId,
          route: request.route,
          dataClassification: policy.effectiveClass,
          fallbackUsed,
          policyDecision: policy.externalAllowed ? 'external_permitted' : 'local_only',
          requestId,
        },
      }, { 'X-Request-Id': requestId });
    } catch (error) {
      const gatewayError = error instanceof GatewayError ? error : new GatewayError(500, 'INTERNAL', 'The gateway could not complete the request.');
      if (gatewayError.status !== 202) {
        bump(metrics.requests, `${app?.id ?? 'unauthenticated'}|-|${gatewayError.status >= 500 ? 'error' : 'rejected'}`);
        if (gatewayError.code === 'EXTERNAL_NOT_ALLOWED' || gatewayError.code === 'LOCAL_ONLY_UNAVAILABLE') bump(metrics.denials, gatewayError.code.toLowerCase());
        metrics.durations.push({ ms: now() - started, app: app?.id ?? 'unauthenticated', model: '-', outcome: `status_${gatewayError.status}` });
      }
      audit({
        event: 'request_rejected',
        requestId,
        app: app?.id ?? 'unauthenticated',
        code: gatewayError.code,
        status: gatewayError.status,
        latencyMs: now() - started,
      });
      jsonBody(res, gatewayError.status, {
        error: { code: gatewayError.code, message: gatewayError.message, requestId },
        ...(gatewayError.extra.retryAfter ? {} : {}),
      }, {
        'X-Request-Id': requestId,
        ...(gatewayError.extra.retryAfter ? { 'Retry-After': String(gatewayError.extra.retryAfter) } : {}),
      });
    } finally {
      metrics.inflight = Math.max(0, metrics.inflight - 1);
    }
  }

  function modelsPayload() {
    const seen = new Map();
    for (const provider of providers) {
      if (provider.disabled) continue;
      for (const model of provider.models) {
        const existing = seen.get(model.id) ?? { id: model.id, object: 'model', providers: [], external: model.external, available: true };
        existing.providers.push(provider.id);
        seen.set(model.id, existing);
      }
    }
    return { object: 'list', data: [...seen.values()] };
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://gateway.local');
    const path = url.pathname;
    try {
      if (req.method === 'GET' && (path === '/health/live' || path === '/healthz')) {
        return jsonBody(res, 200, { status: 'ok', version: config.version, uptimeSeconds: Math.floor((now() - startedAt) / 1000) });
      }
      if (req.method === 'GET' && path === '/health/ready') {
        const problems = assertProductionConfig(config);
        const usable = providers.filter((provider) => !provider.disabled);
        if (!usable.length) problems.push('No usable provider is configured.');
        if (problems.length) return jsonBody(res, 503, { status: 'not_ready', problems });
        return jsonBody(res, 200, { status: 'ready', providers: usable.map((provider) => ({ id: provider.id, policy: provider.policy, models: provider.models.map((model) => model.id) })) });
      }
      if (req.method === 'GET' && path === '/v1/models') {
        const app = authenticate(req.headers.authorization);
        const payload = modelsPayload();
        if (app.allowedModels) payload.data = payload.data.filter((model) => app.allowedModels.includes(model.id));
        return jsonBody(res, 200, payload);
      }
      if (req.method === 'POST' && path === '/v1/chat/completions') return await handleChat(req, res);
      if (path === '/metrics') {
        // Metrics are served only by the private metrics listener.
        return jsonBody(res, 404, { error: { code: 'NOT_FOUND', message: 'Not found.' } });
      }
      return jsonBody(res, 404, { error: { code: 'NOT_FOUND', message: 'Not found.' } });
    } catch (error) {
      const gatewayError = error instanceof GatewayError ? error : new GatewayError(500, 'INTERNAL', 'Unexpected gateway error.');
      return jsonBody(res, gatewayError.status, { error: { code: gatewayError.code, message: gatewayError.message } });
    }
  }

  function metricsText() {
    const lines = [];
    const push = (line) => lines.push(line);
    push('# HELP ai_gateway_requests_total Total inference requests by application, model and outcome.');
    push('# TYPE ai_gateway_requests_total counter');
    for (const [key, value] of metrics.requests) {
      const [app, model, outcome] = key.split('|');
      push(`ai_gateway_requests_total{app="${app}",model="${model}",outcome="${outcome}"} ${value}`);
    }
    push('# HELP ai_gateway_policy_denials_total Policy denials by reason.');
    push('# TYPE ai_gateway_policy_denials_total counter');
    for (const [reason, value] of metrics.denials) push(`ai_gateway_policy_denials_total{reason="${reason}"} ${value}`);
    push('# HELP ai_gateway_rate_limited_total Rate-limited requests by application.');
    push('# TYPE ai_gateway_rate_limited_total counter');
    for (const [app, value] of metrics.rateLimited) push(`ai_gateway_rate_limited_total{app="${app}"} ${value}`);
    push('# HELP ai_gateway_tokens_total Estimated tokens by application, model and direction.');
    push('# TYPE ai_gateway_tokens_total counter');
    for (const [key, value] of metrics.tokens) {
      const [app, model, kind] = key.split('|');
      push(`ai_gateway_tokens_total{app="${app}",model="${model}",kind="${kind}"} ${value}`);
    }
    push('# HELP ai_gateway_inflight_requests In-flight requests.');
    push('# TYPE ai_gateway_inflight_requests gauge');
    push(`ai_gateway_inflight_requests ${metrics.inflight}`);
    push('# HELP ai_gateway_retries_total Provider retries performed.');
    push('# TYPE ai_gateway_retries_total counter');
    push(`ai_gateway_retries_total ${metrics.retries}`);
    push('# HELP ai_gateway_fallbacks_total Requests completed by a fallback provider.');
    push('# TYPE ai_gateway_fallbacks_total counter');
    push(`ai_gateway_fallbacks_total ${metrics.fallbacks}`);
    push('# HELP ai_gateway_circuit_open Circuit breaker state per provider (1=open).');
    push('# TYPE ai_gateway_circuit_open gauge');
    for (const [providerId, circuit] of circuits) push(`ai_gateway_circuit_open{provider="${providerId}"} ${circuit.openedAt ? 1 : 0}`);
    push('# HELP ai_gateway_request_duration_seconds Request latency histogram.');
    push('# TYPE ai_gateway_request_duration_seconds histogram');
    const buckets = [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 30];
    for (const bucket of buckets) {
      const count = metrics.durations.filter((entry) => entry.ms / 1000 <= bucket).length;
      push(`ai_gateway_request_duration_seconds_bucket{le="${bucket}"} ${count}`);
    }
    push(`ai_gateway_request_duration_seconds_count ${metrics.durations.length}`);
    const totalMs = metrics.durations.reduce((sum, entry) => sum + entry.ms, 0);
    push(`ai_gateway_request_duration_seconds_sum ${(totalMs / 1000).toFixed(3)}`);
    return `${lines.join('\n')}\n`;
  }

  function metricsHandler(req, res) {
    if (req.method !== 'GET') return jsonBody(res, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'GET only.' } });
    const body = metricsText();
    res.writeHead(200, { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(body);
  }

  async function listen({ host = config.host, port = config.port, metricsHost = config.metricsHost, metricsPort = config.metricsPort } = {}) {
    const problems = assertProductionConfig(config);
    if (problems.length && config.nodeEnv === 'production') {
      throw new GatewayError(500, 'CONFIG_INVALID', `Gateway refused to start: ${problems.join(' ')}`);
    }
    const server = http.createServer((req, res) => { handle(req, res); });
    const metricsServer = config.metricsEnabled ? http.createServer(metricsHandler) : null;
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, host, () => resolve());
    });
    if (metricsServer) {
      await new Promise((resolve, reject) => {
        metricsServer.once('error', reject);
        metricsServer.listen(metricsPort, metricsHost, () => resolve());
      });
    }
    return {
      server,
      metricsServer,
      address: server.address(),
      metricsAddress: metricsServer?.address() ?? null,
      close: async () => {
        await new Promise((resolve) => server.close(resolve));
        if (metricsServer) await new Promise((resolve) => metricsServer.close(resolve));
      },
    };
  }

  return { handle, metricsHandler, metricsText, listen, state: { providers, metrics, circuits, config } };
}
