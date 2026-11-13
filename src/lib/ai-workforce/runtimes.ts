/**
 * ALO AI Workforce — model runtime registry, capacity management and health.
 *
 * Infrastructure is DETECTED, never assumed (§10/§11). Nothing here hard-codes
 * GPU availability: a runtime is only considered available when its endpoint is
 * actually configured and answers a probe. The terminal runtime is the ALO
 * deterministic engine, which always exists, so the workforce can never be
 * blocked by a missing model server or a missing paid API key.
 *
 * Tier order (ascending) is the routing chain:
 *   1  alo-local-primary      self-hosted OpenAI-compatible runtime (Ollama / llama.cpp / vLLM)
 *   2  alo-local-secondary    second self-hosted runtime
 *   3  alo-optional-cloud     OPTIONAL, disabled unless explicitly enabled, never for confidential data
 *   9  alo-deterministic-v1   ALO deterministic reasoning engine (always available)
 */
import { db } from '@/lib/db';
import type { GatewayRequest, HealthStatus, ModelRuntimeKind } from './types';
import { runDeterministic, supportsTask } from './deterministic-engine';

export interface RuntimeDefinition {
  runtimeKey: string;
  name: string;
  provider: string;
  model: string;
  endpoint: string;
  tier: number;
  kind: ModelRuntimeKind;
  contextTokens: number;
  maxConcurrency: number;
  requiresApiKey: boolean;
  isPaidService: boolean;
  enabled: boolean;
  notes: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const CLOUD_PROVIDER_NAMES = new Set(['groq', 'openrouter', 'zai', 'openai', 'anthropic', 'google', 'gemini', 'azure-openai']);

function isPrivateIpv4(host: string): boolean {
  const parts = host.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return a === 10 || a === 127 || a === 192 && b === 168 || a === 172 && b >= 16 && b <= 31 || a === 169 && b === 254;
}

function isTrustedLocalEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return false;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
    if (host === 'localhost' || host.endsWith('.localhost') || host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true;
    if (isPrivateIpv4(host)) return true;
    if (host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.lan') || host.endsWith('.cluster.local')) return true;
    // Single-label HTTP hosts such as `ollama` are conventional internal
    // service names in a private container network; public DNS names are not.
    return url.protocol === 'http:' && !host.includes('.') && !host.includes(':');
  } catch {
    return false;
  }
}

/**
 * Determine billing exposure from provider identity and endpoint, not only the
 * caller-supplied `kind`/`isPaidService` flags. Unknown public endpoints fail
 * closed as cloud runtimes.
 */
export function isCloudRuntime(runtime: Pick<RuntimeDefinition, 'kind' | 'isPaidService' | 'provider' | 'endpoint'>): boolean {
  if (runtime.kind === 'DETERMINISTIC') return false;
  if (runtime.isPaidService || runtime.kind === 'OPTIONAL_CLOUD_LLM') return true;
  if (CLOUD_PROVIDER_NAMES.has(runtime.provider.toLowerCase())) return true;
  return !isTrustedLocalEndpoint(runtime.endpoint);
}

function envFlag(name: string): boolean {
  const value = process.env[name];
  return value === '1' || value === 'true' || value === 'TRUE';
}

/**
 * Build the runtime catalogue from the actual environment.
 * A cloud runtime is only ever included when an operator explicitly opted in
 * AND supplied a key; it is never required for any workflow.
 */
export function detectRuntimes(): RuntimeDefinition[] {
  const runtimes: RuntimeDefinition[] = [];

  if (process.env.ALO_LOCAL_AI_URL || process.env.LOCAL_AI_URL) {
    runtimes.push({
      runtimeKey: 'alo-local-primary',
      name: 'ALO self-hosted primary runtime',
      provider: 'local-openai',
      model: process.env.ALO_LOCAL_AI_MODEL || process.env.LOCAL_AI_MODEL || '',
      endpoint: process.env.ALO_LOCAL_AI_URL || process.env.LOCAL_AI_URL || '',
      tier: 1,
      kind: 'LOCAL_LLM',
      contextTokens: Number(process.env.ALO_LOCAL_AI_CONTEXT || 8192) || 8192,
      maxConcurrency: Number(process.env.ALO_LOCAL_AI_CONCURRENCY || 2) || 2,
      requiresApiKey: false,
      isPaidService: false,
      enabled: true,
      notes: 'Self-hosted OpenAI-compatible endpoint (Ollama / llama.cpp / vLLM). Open-source weights, ALO-operated.',
    });
  }

  if (process.env.ALO_LOCAL_AI_FALLBACK_URL) {
    runtimes.push({
      runtimeKey: 'alo-local-secondary',
      name: 'ALO self-hosted secondary runtime',
      provider: 'local-openai',
      model: process.env.ALO_LOCAL_AI_FALLBACK_MODEL || '',
      endpoint: process.env.ALO_LOCAL_AI_FALLBACK_URL,
      tier: 2,
      kind: 'LOCAL_LLM',
      contextTokens: Number(process.env.ALO_LOCAL_AI_FALLBACK_CONTEXT || 4096) || 4096,
      maxConcurrency: Number(process.env.ALO_LOCAL_AI_FALLBACK_CONCURRENCY || 2) || 2,
      requiresApiKey: false,
      isPaidService: false,
      enabled: true,
      notes: 'Second self-hosted runtime used when the primary is saturated or unhealthy.',
    });
  }

  // Optional, opt-in only. Absence of this runtime must never fail a workflow.
  if (envFlag('ALO_ENABLE_OPTIONAL_CLOUD_AI') && process.env.PAID_AI_API_ALLOWED === 'true' && (process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY)) {
    const useGroq = Boolean(process.env.GROQ_API_KEY);
    runtimes.push({
      runtimeKey: 'alo-optional-cloud',
      name: 'Optional external runtime (opt-in)',
      provider: useGroq ? 'groq' : 'openrouter',
      model: useGroq
        ? process.env.GROQ_MODEL_LARGE || 'llama-3.3-70b-versatile'
        : process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct',
      endpoint: useGroq
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://openrouter.ai/api/v1/chat/completions',
      tier: 3,
      kind: 'OPTIONAL_CLOUD_LLM',
      contextTokens: 32_768,
      maxConcurrency: 2,
      requiresApiKey: true,
      isPaidService: true,
      enabled: true,
      notes: 'Optional augmentation only. Never used for confidential payloads and never required by a workflow.',
    });
  }

  runtimes.push({
    runtimeKey: 'alo-deterministic-v1',
    name: 'ALO deterministic reasoning engine',
    provider: 'alo',
    model: 'alo-rules-v1',
    endpoint: '',
    tier: 9,
    kind: 'DETERMINISTIC',
    contextTokens: 1_000_000,
    maxConcurrency: 32,
    requiresApiKey: false,
    isPaidService: false,
    enabled: true,
    notes: 'ALO-owned rule engine. Always available; guarantees core workflows run with no external AI dependency.',
  });

  return runtimes.sort((a, b) => a.tier - b.tier);
}

/** Persist the detected catalogue so the dashboard reads real rows, not constants. */
export async function syncRuntimes(): Promise<RuntimeDefinition[]> {
  const detected = detectRuntimes();
  const keys = detected.map((runtime) => runtime.runtimeKey);
  for (const runtime of detected) {
    await db.awfModelRuntime.upsert({
      where: { runtimeKey: runtime.runtimeKey },
      create: {
        runtimeKey: runtime.runtimeKey,
        name: runtime.name,
        provider: runtime.provider,
        model: runtime.model,
        endpoint: runtime.endpoint,
        tier: runtime.tier,
        kind: runtime.kind,
        contextTokens: runtime.contextTokens,
        maxConcurrency: runtime.maxConcurrency,
        requiresApiKey: runtime.requiresApiKey,
        isPaidService: runtime.isPaidService,
        enabled: runtime.enabled,
        status: runtime.kind === 'DETERMINISTIC' ? 'HEALTHY' : 'UNKNOWN',
        notes: runtime.notes,
      },
      update: {
        name: runtime.name,
        provider: runtime.provider,
        model: runtime.model,
        endpoint: runtime.endpoint,
        tier: runtime.tier,
        kind: runtime.kind,
        contextTokens: runtime.contextTokens,
        maxConcurrency: runtime.maxConcurrency,
        requiresApiKey: runtime.requiresApiKey,
        isPaidService: runtime.isPaidService,
        notes: runtime.notes,
      },
    });
  }
  // Runtimes that disappeared from the environment are marked DISABLED, never deleted,
  // so historical runs keep a resolvable runtime reference.
  await db.awfModelRuntime.updateMany({
    where: { runtimeKey: { notIn: keys } },
    data: { enabled: false, status: 'DISABLED' },
  });
  return detected;
}

// ───────────────────────────── capacity ─────────────────────────────

const inflight = new Map<string, number>();

export function queueDepth(runtimeKey: string): number {
  return inflight.get(runtimeKey) || 0;
}

export function hasCapacity(runtime: RuntimeDefinition): boolean {
  return queueDepth(runtime.runtimeKey) < runtime.maxConcurrency;
}

function acquire(runtimeKey: string): void {
  inflight.set(runtimeKey, (inflight.get(runtimeKey) || 0) + 1);
}

function release(runtimeKey: string): void {
  inflight.set(runtimeKey, Math.max(0, (inflight.get(runtimeKey) || 1) - 1));
}

// ───────────────────────────── adapters ─────────────────────────────

export interface RuntimeExecution {
  data: Record<string, unknown>;
  latencyMs: number;
}

function buildMessages(req: GatewayRequest, schemaDescription: string) {
  const system = [
    'You are an execution runtime for the ALO Education AI Workforce.',
    'You do not define policy, permissions or workflows; ALO owns those.',
    'Use ONLY the facts in CONTEXT. Never invent universities, courses, fees, deadlines or student data.',
    'Reply with a single RFC 8259 JSON object and nothing else. No prose, no markdown fences.',
    `Required JSON shape: ${schemaDescription}`,
    req.instructions,
  ].join('\n');
  const user = JSON.stringify({ task: req.task, input: req.input, context: req.context ?? {} });
  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}

function extractJsonObject(raw: string): Record<string, unknown> | null {
  const candidates: string[] = [raw.trim()];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const first = raw.indexOf('{');
  const last = raw.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(raw.slice(first, last + 1));
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      /* try the next extraction strategy */
    }
  }
  return null;
}

async function executeLocalLlm(
  runtime: RuntimeDefinition,
  req: GatewayRequest,
  schemaDescription: string
): Promise<RuntimeExecution> {
  if (isCloudRuntime(runtime) && process.env.PAID_AI_API_ALLOWED !== 'true') {
    throw new Error('AWF_CLOUD_AI_DISABLED: owner approval requires PAID_AI_API_ALLOWED=true');
  }
  if (req.confidential && isCloudRuntime(runtime)) {
    throw new Error('AWF_CONFIDENTIAL_CLOUD_BLOCKED: confidential requests require a trusted local runtime');
  }
  if (!runtime.endpoint) throw new Error('AWF_RUNTIME_UNCONFIGURED: endpoint missing');
  if (!runtime.model) throw new Error('AWF_RUNTIME_UNCONFIGURED: model missing');
  const url = new URL(runtime.endpoint);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('AWF_RUNTIME_ENDPOINT_INVALID');
  }
  if (!url.pathname.endsWith('/chat/completions')) {
    const base = url.pathname.replace(/\/$/, '');
    url.pathname = `${base}${base.endsWith('/v1') ? '' : '/v1'}/chat/completions`;
  }
  const apiKey = runtime.provider === 'groq' ? process.env.GROQ_API_KEY : runtime.provider === 'openrouter' ? process.env.OPENROUTER_API_KEY : process.env.ALO_LOCAL_AI_API_KEY;
  const started = Date.now();
  const response = await fetch(url, {
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(req.timeoutMs ?? DEFAULT_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model: runtime.model,
      messages: buildMessages(req, schemaDescription),
      temperature: 0,
      max_tokens: req.maxTokens ?? 2048,
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) throw new Error(`AWF_RUNTIME_HTTP_${response.status}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload?.choices?.[0]?.message?.content;
  if (!content) throw new Error('AWF_RUNTIME_EMPTY_RESPONSE');
  const parsed = extractJsonObject(content);
  if (!parsed) throw new Error('AWF_RUNTIME_NON_JSON_RESPONSE');
  return { data: parsed, latencyMs: Date.now() - started };
}

function executeDeterministic(req: GatewayRequest): RuntimeExecution {
  const started = Date.now();
  const facts = { ...(req.context ?? {}), ...(req.input ?? {}) };
  const data = runDeterministic(req.task, facts);
  return { data, latencyMs: Date.now() - started };
}

/** Run one request on one runtime, enforcing capacity limits. */
export async function executeOnRuntime(
  runtime: RuntimeDefinition,
  req: GatewayRequest,
  schemaDescription: string
): Promise<RuntimeExecution> {
  if (runtime.kind !== 'DETERMINISTIC' && isCloudRuntime(runtime) && process.env.PAID_AI_API_ALLOWED !== 'true') {
    throw new Error('AWF_CLOUD_AI_DISABLED: owner approval requires PAID_AI_API_ALLOWED=true');
  }
  if (runtime.kind !== 'DETERMINISTIC' && req.confidential && isCloudRuntime(runtime)) {
    throw new Error('AWF_CONFIDENTIAL_CLOUD_BLOCKED: confidential requests require a trusted local runtime');
  }
  if (!hasCapacity(runtime)) throw new Error('AWF_RUNTIME_SATURATED');
  acquire(runtime.runtimeKey);
  try {
    if (runtime.kind === 'DETERMINISTIC') return executeDeterministic(req);
    return await executeLocalLlm(runtime, req, schemaDescription);
  } finally {
    release(runtime.runtimeKey);
  }
}

/** A runtime can only serve a task it is actually able to answer. */
export function runtimeSupports(runtime: RuntimeDefinition, task: string): boolean {
  if (runtime.kind === 'DETERMINISTIC') return supportsTask(task);
  return true;
}

// ───────────────────────────── health ─────────────────────────────

export async function recordRuntimeOutcome(
  runtimeKey: string,
  outcome: { ok: boolean; latencyMs: number; error?: string }
): Promise<void> {
  const row = await db.awfModelRuntime.findUnique({ where: { runtimeKey } });
  if (!row) return;
  const successCount = row.successCount + (outcome.ok ? 1 : 0);
  const failureCount = row.failureCount + (outcome.ok ? 0 : 1);
  const consecutiveFailures = outcome.ok ? 0 : row.consecutiveFailures + 1;
  const totalRuns = successCount + failureCount;
  const avgLatencyMs = totalRuns ? Math.round((row.avgLatencyMs * (totalRuns - 1) + outcome.latencyMs) / totalRuns) : outcome.latencyMs;
  let status: HealthStatus = 'HEALTHY';
  if (!row.enabled) status = 'DISABLED';
  else if (consecutiveFailures >= 3) status = 'OFFLINE';
  else if (consecutiveFailures > 0) status = 'DEGRADED';
  await db.awfModelRuntime.update({
    where: { runtimeKey },
    data: {
      successCount,
      failureCount,
      consecutiveFailures,
      avgLatencyMs,
      lastLatencyMs: outcome.latencyMs,
      lastCheckedAt: new Date(),
      lastError: outcome.ok ? '' : String(outcome.error || '').slice(0, 400),
      status,
      queueDepth: queueDepth(runtimeKey),
    },
  });
}

/** Circuit breaker: an OFFLINE runtime is skipped until it is probed healthy again. */
export async function runtimeIsTripped(runtimeKey: string): Promise<boolean> {
  const row = await db.awfModelRuntime.findUnique({ where: { runtimeKey }, select: { status: true, enabled: true } });
  if (!row) return false;
  return !row.enabled || row.status === 'OFFLINE' || row.status === 'BLOCKED' || row.status === 'DISABLED';
}

/** Actively probe a runtime. Deterministic engine is self-verifying. */
export async function probeRuntime(runtime: RuntimeDefinition): Promise<{ status: HealthStatus; latencyMs: number; error?: string }> {
  if (runtime.kind === 'DETERMINISTIC') {
    const started = Date.now();
    runDeterministic('qa.validate', { payload: { ok: true }, requiredFields: ['ok'] });
    return { status: 'HEALTHY', latencyMs: Date.now() - started };
  }
  try {
    const result = await executeOnRuntime(
      runtime,
      {
        task: 'qa.validate',
        instructions: 'Health probe. Echo the required shape.',
        input: { payload: { ok: true }, requiredFields: ['ok'] },
        correlationId: 'health-probe',
        timeoutMs: 8_000,
        maxTokens: 256,
      },
      '{ "passed": boolean, "missingFields": string[], "contradictions": string[], "unsafeFlags": string[], "score": number, "confidence": "HIGH"|"MEDIUM"|"LOW" }'
    );
    return { status: 'HEALTHY', latencyMs: result.latencyMs };
  } catch (error) {
    return { status: 'OFFLINE', latencyMs: 0, error: error instanceof Error ? error.message : 'probe failed' };
  }
}
