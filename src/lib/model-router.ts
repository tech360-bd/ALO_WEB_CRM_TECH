import { unoRouterConfiguration } from '@/lib/ai-providers/unorouter';
import { firstConfiguredFreeProvider } from '@/lib/ai-providers/resolve';

/**
 * Provider identifiers. The four literals below are the native adapters in
 * src/lib/ai.ts; 'fallback' is the guard's "not a real provider" marker.
 *
 * Any slug from src/lib/ai-providers/catalog.ts is also accepted — `(string & {})`
 * keeps editor autocomplete on the literals while allowing the catalogued set to
 * grow without touching this union. Slugs are validated at runtime by
 * resolveFreeProvider, which rejects unknown, unconfigured, paid or blocked ones.
 */
export type ProviderName = 'groq' | 'local' | 'openrouter' | 'zai' | 'fallback' | (string & {});
export interface ModelRoute { provider: ProviderName; model: string; reason: string; estimatedCost?: string; }

const PRIVATE_TASKS = new Set(['PII_REDACTION', 'KYC', 'DOCUMENT_CHECK_PRIVATE', 'HR_REVIEW']);
export function requiresLocalAI(taskType?: string, privateData = false): boolean {
  return privateData || PRIVATE_TASKS.has((taskType || '').toUpperCase());
}

const COMPLEX_TASKS = new Set(['SOP_DRAFT', 'VISA_CHECK', 'UNIVERSITY_RESEARCH', 'COURSE_MATCH', 'MARKET_RADAR', 'RAG_ANSWER', 'ENRICHMENT']);

export async function routeModel(opts: { taskType?: string; department?: string; modelHint?: string; privateData?: boolean; providerHint?: 'local' | 'unorouter' }): Promise<ModelRoute> {
  const task = (opts.taskType || '').toUpperCase();
  if (opts.providerHint === 'unorouter') {
    if (requiresLocalAI(task, opts.privateData)) throw new Error('Private AI requests cannot use an external provider');
    const uno = unoRouterConfiguration(); const model = opts.modelHint || uno.defaultModel;
    if (!uno.enabled || !uno.keyConfigured || !uno.configurationValid || !uno.approvedModels.includes(model)) throw new Error('UnoRouter free-only provider is not configured for this model');
    return { provider: 'unorouter', model, reason: 'explicitly_approved_free_only' };
  }
  if (opts.providerHint === 'local') {
    if (!process.env.LOCAL_AI_URL || !process.env.LOCAL_AI_MODEL || (opts.modelHint && opts.modelHint !== process.env.LOCAL_AI_MODEL)) throw new Error('Configured local AI model required');
    return { provider: 'local', model: process.env.LOCAL_AI_MODEL, reason: 'explicit_local_only' };
  }
  // Privacy is evaluated before model hints. No private-data cloud fallback.
  if (requiresLocalAI(task, opts.privateData)) {
    if (!process.env.LOCAL_AI_URL || !process.env.LOCAL_AI_MODEL) throw new Error('Private AI tasks require LOCAL_AI_URL and LOCAL_AI_MODEL');
    return { provider: 'local', model: process.env.LOCAL_AI_MODEL, reason: 'private_data_local' };
  }
  if (process.env.LOCAL_AI_URL && process.env.LOCAL_AI_MODEL) {
    return { provider: 'local', model: opts.modelHint || process.env.LOCAL_AI_MODEL, reason: 'configured_local' };
  }
  // Do not infer billing safety from key presence or an unverified free-tier
  // claim. Cloud selection requires explicit owner approval.
  if (process.env.PAID_AI_API_ALLOWED !== 'true') {
    throw new Error('Cloud AI is disabled by default; owner approval requires PAID_AI_API_ALLOWED=true');
  }
  if (process.env.GROQ_API_KEY) return {
    provider: 'groq', model: opts.modelHint || (COMPLEX_TASKS.has(task) ? process.env.GROQ_MODEL_LARGE || process.env.AI_DEFAULT_MODEL || 'llama-3.3-70b-versatile' : process.env.GROQ_MODEL_FAST || process.env.AI_FAST_MODEL || 'llama-3.1-8b-instant'), reason: 'configured_groq',
  };
  if (process.env.OPENROUTER_API_KEY) return { provider: 'openrouter', model: opts.modelHint || process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct', reason: 'configured_openrouter' };
  if (process.env.ZAI_API_KEY) return { provider: 'zai', model: opts.modelHint || 'glm-4-flash', reason: 'configured_zai' };
  // Cloud approval is required above. With that approval, prefer a configured
  // catalogued provider; the catalog's free-tier labels are descriptive, not a
  // guarantee against usage limits or billing.
  const catalogued = firstConfiguredFreeProvider();
  if (catalogued) {
    return { provider: catalogued.slug, model: opts.modelHint || catalogued.defaultModel, reason: `catalog:${catalogued.slug}` };
  }
  throw new Error('No AI provider is configured');
}

/** Compatibility hint for the guard, not permission to bypass a gateway policy. */
export function fallbackRoute(reason = 'fallback'): ModelRoute {
  return { provider: 'fallback', model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct', reason };
}
