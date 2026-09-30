// ALO Education AI gateway. Provider selection is authoritative; adapters never
// silently change it. This gateway is not yet used by every legacy AI caller.
import { randomUUID } from 'node:crypto';
import Ajv from 'ajv';
import { db } from '@/lib/db';
import { generateText as coreGenerateText, extractJson, type GenerateTextOptions, type GenerateTextResult } from '@/lib/ai';
import { routeModel, requiresLocalAI, type ModelRoute } from '@/lib/model-router';
import { getDepartmentModelConfig, validateModelAssignment } from '@/lib/department-model-config';
import { groqGuard } from '@/lib/groq-protection';

export type GatewayRequest = Omit<GenerateTextOptions, 'provider' | 'endpoint'> & {
  agentId?: string;
  taskId?: string;
  department?: string;
  taskType?: string;
  privateData?: boolean;
  requireJson?: boolean;
  jsonSchema?: Record<string, unknown>;
  correlationId?: string;
};
export type GatewayResult = {
  text: string;
  json?: unknown;
  provider: string;
  model: string;
  route: ModelRoute;
  usage?: GenerateTextResult['usage'];
  latencyMs: number;
  fallbackUsed: boolean;
  correlationId: string;
};
const ajv = new Ajv({ strict: true, allErrors: false });

export async function aiGateway(req: GatewayRequest): Promise<GatewayResult> {
  const correlationId = req.correlationId || randomUUID();
  const started = Date.now();
  // Reject invalid schemas before disclosing any prompt to a provider.
  const validate = req.jsonSchema ? ajv.compile(req.jsonSchema) : undefined;
  const config = req.department ? getDepartmentModelConfig(req.department) : null;
  if (req.department && !config) throw new Error(`Department ${req.department} is not configured for AI (IDLE)`);
  const privateData = requiresLocalAI(req.taskType, req.privateData) ||
    config?.primary.privacy === 'CONFIDENTIAL' || config?.primary.privacy === 'RESTRICTED';
  let route: ModelRoute;
  if (config) {
    const assignment = validateModelAssignment(config, undefined, req.model);
    if (!assignment.ok) throw new Error(assignment.reason);
    if (privateData && config.primary.provider !== 'local') throw new Error('Private AI request blocks external department provider');
    route = { provider: config.primary.provider, model: config.primary.model, reason: `department:${config.departmentSlug}` };
  } else {
    route = await routeModel({ taskType: req.taskType, modelHint: req.model, privateData });
  }

  // Only a specifically approved provider/model pair may be used as fallback.
  // Generic calls and private calls have no cross-provider fallback policy.
  const fallback = !privateData && config?.primary.allowFallback ? config.primary.fallback : undefined;
  const routes = [route];
  if (fallback && config) {
    const assignment = validateModelAssignment(config, fallback.provider, fallback.model);
    if (!assignment.ok) throw new Error(assignment.reason);
    routes.push({ provider: fallback.provider, model: fallback.model, reason: fallback.reason });
  }

  for (const [index, candidate] of routes.entries()) {
    if (candidate.provider === 'fallback') throw new Error('A concrete AI provider must be configured');
    const metadata = { correlationId, agentId: req.agentId, taskId: req.taskId, department: req.department, taskType: req.taskType, provider: candidate.provider, model: candidate.model, fallbackUsed: index > 0 };
    // CrmAuditLog has no AgentDefinition FK. Do not invent an agent id for
    // user-initiated calls or pass AiEmployee ids into AgentAuditLog.
    const audit = (action: string, details: Record<string, unknown>) => db.crmAuditLog.create({ data: {
      action, targetCollection: 'AIGateway', targetId: correlationId,
      afterData: JSON.stringify({ ...metadata, ...details }),
    } });
    await audit('AI_GATEWAY_REQUESTED', { promptChars: req.prompt.length });
    const guard = await groqGuard.acquire(candidate.provider);
    if (!guard.allowed) {
      await audit('AI_GATEWAY_BLOCKED', { reason: 'PROVIDER_LIMIT' });
      if (index < routes.length - 1) continue;
      throw new Error('AI provider limit reached; no permitted fallback');
    }
    let raw: GenerateTextResult;
    try {
      raw = await coreGenerateText({
        prompt: req.prompt, systemPrompt: req.systemPrompt, provider: candidate.provider, model: candidate.model,
        endpoint: index === 0 ? config?.primary.endpoint : undefined,
        maxTokens: config ? Math.min(req.maxTokens ?? config.primary.maxTokens, config.primary.maxTokens) : req.maxTokens,
        temperature: config?.primary.temperature ?? req.temperature,
        timeoutMs: config?.primary.timeoutMs ?? req.timeoutMs,
      });
      groqGuard.recordSuccess(candidate.provider);
    } catch (error) {
      groqGuard.recordFailure(candidate.provider, error);
      await audit('AI_GATEWAY_FAILED', { reason: 'PROVIDER_REQUEST_FAILED' });
      if (index < routes.length - 1) continue;
      throw new Error('AI provider request failed; no permitted fallback');
    } finally {
      groqGuard.release(candidate.provider);
    }
    if (raw.provider !== candidate.provider || raw.model !== candidate.model) {
      await audit('AI_GATEWAY_FAILED', { reason: 'PROVIDER_IDENTITY_MISMATCH' });
      throw new Error('AI provider identity mismatch');
    }
    const json = req.requireJson || validate ? extractJson<unknown>(raw.text) : undefined;
    if (((req.requireJson || validate) && json == null) || (validate && !validate(json))) {
      await audit('AI_GATEWAY_FAILED', { reason: 'INVALID_STRUCTURED_OUTPUT' });
      throw new Error('AI output does not match the required JSON schema');
    }
    const latencyMs = Date.now() - started;
    await audit('AI_GATEWAY_COMPLETED', { latencyMs, usage: raw.usage });
    return { text: raw.text, json, provider: raw.provider, model: raw.model, route: candidate, usage: raw.usage, latencyMs, fallbackUsed: index > 0, correlationId };
  }
  throw new Error('No permitted AI provider completed the request');
}

export async function generateStructured<T = unknown>(prompt: string, schema: Record<string, unknown>, opts?: Omit<GatewayRequest, 'prompt' | 'jsonSchema' | 'requireJson'>): Promise<{ data: T; raw: GatewayResult; valid: true }> {
  const raw = await aiGateway({ ...opts, prompt, jsonSchema: schema, requireJson: true });
  const validate = ajv.compile<T>(schema);
  if (!validate(raw.json)) throw new Error('Invalid structured AI output');
  return { data: raw.json, raw, valid: true };
}

export async function classify(text: string, labels: string[], opts?: Omit<GatewayRequest, 'prompt'>): Promise<{ label: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW'; raw: GatewayResult }> {
  if (!labels.length || labels.some(label => !label.trim())) throw new Error('Classification labels are required');
  const prompt = `Classify into exactly one of ${JSON.stringify(labels)}. Return JSON with label and confidence (HIGH, MEDIUM, LOW).\n\nText: ${text.slice(0, 4000)}`;
  const { data, raw } = await generateStructured<{ label: string; confidence: 'HIGH' | 'MEDIUM' | 'LOW' }>(prompt, {
    type: 'object', properties: { label: { type: 'string', enum: labels }, confidence: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] } }, required: ['label', 'confidence'], additionalProperties: false,
  }, opts);
  return { ...data, raw };
}

export async function summarize(text: string, maxSentences = 3, opts?: Omit<GatewayRequest, 'prompt'>): Promise<{ summary: string; raw: GatewayResult }> {
  const raw = await aiGateway({ ...opts, prompt: `Summarize in ${maxSentences} sentences, factual, no invention:\n\n${text.slice(0, 8000)}` });
  return { summary: raw.text, raw };
}
export async function chat(messages: { role: string; content: string }[], opts?: Omit<GatewayRequest, 'prompt'>): Promise<GatewayResult> {
  const systemPrompt = messages.find(m => m.role === 'system')?.content || opts?.systemPrompt;
  const prompt = messages.filter(m => m.role !== 'system').map(m => `${m.role}: ${m.content}`).join('\n');
  return aiGateway({ ...opts, prompt, systemPrompt });
}

/** Buffered compatibility API; not provider-native streaming. No artificial delay. */
export async function* stream(prompt: string, opts?: Omit<GatewayRequest, 'prompt'>): AsyncGenerator<string> {
  yield (await aiGateway({ ...opts, prompt })).text;
}
