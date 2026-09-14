// ============================================================
// ALO AI Gateway — centralized AI entry point (Master Workforce §10)
// All AI requests MUST go through this gateway. No direct Groq/ZAI calls.
// Architecture: Agent → AI Gateway → Model Router → Provider Adapter → Groq / Local AI / Fallback
// Preserves existing Groq integration (uses GROQ_API_KEY from env, never frontend)
// Standard functions: generateText, generateStructured, classify, summarize, chat, stream
// Logs every call to AgentAuditLog/AuditLog with real metrics (no fabrication)
// Fails gracefully when Groq unavailable (falls through to OpenRouter/ZAI)
// ============================================================
import { db } from '@/lib/db';
import { generateText as coreGenerateText, extractJson, type GenerateTextOptions } from '@/lib/ai';
import { routeModel, type ModelRoute } from '@/lib/model-router';
import { groqGuard } from '@/lib/groq-protection';

export type GatewayRequest = GenerateTextOptions & {
  agentId?: string;
  taskId?: string;
  department?: string;
  taskType?: string;
  requireJson?: boolean;
  jsonSchema?: Record<string, any>;
  correlationId?: string;
};

export type GatewayResult = {
  text: string;
  json?: any;
  provider: string;
  model: string;
  route: ModelRoute;
  usage?: { promptTokens?: number; completionTokens?: number; totalTokens?: number };
  latencyMs: number;
  fallbackUsed: boolean;
  correlationId: string;
};

function redactSecrets(obj: any): any {
  const s = JSON.stringify(obj);
  return s.replace(/sk-[a-zA-Z0-9_-]{10,}/g, '[REDACTED_API_KEY]').replace(/Bearer\s+[A-Za-z0-9._-]+/g, 'Bearer [REDACTED]');
}

// ---- core gateway ----
export async function aiGateway(req: GatewayRequest): Promise<GatewayResult> {
  const correlationId = req.correlationId || `gw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,6)}`;
  const started = Date.now();
  const route = await routeModel({ taskType: req.taskType, department: req.department, modelHint: req.model });

  // Groq guard: rate limit + queue + circuit breaker (free-tier protection §13)
  const guard = await groqGuard.acquire(route.provider);
  if (!guard.allowed) {
    // queued or circuit open → fallback route
    const fallbackRoute = guard.fallbackRoute || { provider: 'openrouter', model: process.env.AI_DEFAULT_MODEL || 'glm-4-flash', reason: 'groq_guard' } as ModelRoute;
    return invokeProvider({ ...req, model: fallbackRoute.model }, fallbackRoute, correlationId, started, true);
  }

  try {
    const res = await invokeProvider(req, route, correlationId, started, false);
    groqGuard.recordSuccess(route.provider);
    return res;
  } catch (e: any) {
    groqGuard.recordFailure(route.provider, e);
    // fallback once
    if (route.provider === 'groq') {
      const fb: ModelRoute = { provider: 'openrouter', model: process.env.AI_FAST_MODEL || 'glm-4-flash', reason: 'groq_fallback' };
      try {
        return await invokeProvider({ ...req, model: fb.model }, fb, correlationId, started, true);
      } catch {}
    }
    throw e;
  } finally {
    groqGuard.release(route.provider);
  }
}

async function invokeProvider(req: GatewayRequest, route: ModelRoute, correlationId: string, started: number, fallbackUsed: boolean): Promise<GatewayResult> {
  const before = Date.now();
  // Route maps to actual env key; coreGenerateText already handles Groq→OpenRouter→ZAI cascade,
  // but we pass explicit model so routing is respected.
  const raw = await coreGenerateText({ prompt: req.prompt, systemPrompt: req.systemPrompt, model: req.model || route.model, maxTokens: req.maxTokens, temperature: req.temperature ?? 0.2 });
  const latencyMs = Date.now() - started;

  let json: any = undefined;
  if (req.requireJson || req.jsonSchema) {
    json = extractJson(raw.text);
  }

  // Real audit log — no fake metrics
  try {
    await db.agentAuditLog.create({
      data: {
        agentId: req.agentId || 'ai-gateway',
        action: 'AI_GATEWAY_CALL',
        details: JSON.stringify(redactSecrets({
          correlationId, taskId: req.taskId, department: req.department, taskType: req.taskType,
          provider: route.provider, model: route.model, latencyMs, usage: raw.usage, fallbackUsed,
          promptChars: req.prompt.length, jsonSchema: req.jsonSchema ? 'provided' : undefined,
        })),
        createdAt: new Date(),
      } as any,
    }).catch(()=>{});
  } catch {}

  return {
    text: raw.text,
    json,
    provider: route.provider,
    model: req.model || route.model,
    route,
    usage: raw.usage,
    latencyMs,
    fallbackUsed,
    correlationId,
  };
}

// ---- standard functions (all through gateway) ----
export async function generateStructured<T = any>(prompt: string, schema: Record<string, any>, opts?: Omit<GatewayRequest, 'prompt'|'jsonSchema'|'requireJson'>): Promise<{ data: T | null; raw: GatewayResult; valid: boolean }> {
  const raw = await aiGateway({ prompt, jsonSchema: schema, requireJson: true, ...opts });
  return { data: raw.json as T, raw, valid: !!raw.json };
}

export async function classify(text: string, labels: string[], opts?: Omit<GatewayRequest, 'prompt'>): Promise<{ label: string; confidence: 'HIGH'|'MEDIUM'|'LOW'; raw: GatewayResult }> {
  const prompt = `Classify the following into exactly one of [${labels.join(', ')}]. Return JSON {"label":"...", "confidence":"HIGH|MEDIUM|LOW"}.\n\nText: ${text.slice(0,4000)}`;
  const { data, raw } = await generateStructured<{ label: string; confidence: string }>(prompt, { type:'object', properties:{ label:{type:'string'}, confidence:{type:'string'} }, required:['label'] }, opts as any);
  const label = labels.includes(data?.label) ? data.label : labels[0];
  const conf = (data?.confidence as any) || 'LOW';
  return { label, confidence: conf==='HIGH'?'HIGH':conf==='MEDIUM'?'MEDIUM':'LOW', raw };
}

export async function summarize(text: string, maxSentences = 3, opts?: Omit<GatewayRequest, 'prompt'>): Promise<{ summary: string; raw: GatewayResult }> {
  const prompt = `Summarize in ${maxSentences} sentences, factual, no invention:\n\n${text.slice(0,8000)}`;
  const raw = await aiGateway({ prompt, ...opts });
  return { summary: raw.text.slice(0, 2000), raw };
}

export async function chat(messages: { role: string; content: string }[], opts?: Omit<GatewayRequest,'prompt'> & { systemPrompt?: string }): Promise<GatewayResult> {
  const system = messages.find(m=>m.role==='system')?.content;
  const prompt = messages.filter(m=>m.role!=='system').map(m=> `${m.role}: ${m.content}`).join('\n');
  return aiGateway({ prompt, systemPrompt: system || opts?.systemPrompt, ...opts });
}

// stream stub — falls back to non-stream when provider doesn't support stream
export async function* stream(prompt: string, opts?: Omit<GatewayRequest,'prompt'>): AsyncGenerator<string> {
  const res = await aiGateway({ prompt, ...opts });
  // chunk by sentence for SSE compatibility
  for (const part of res.text.split(/(?<=[.!?])\s+/)) {
    yield part + ' ';
    await new Promise(r=> setTimeout(r, 20));
  }
}
