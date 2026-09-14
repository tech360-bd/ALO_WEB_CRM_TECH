// ============================================================
// ALO Model Router — centralized model selection (§11)
// Groq = fast/real-time (lead scoring, chat, classification)
// Local AI = private data (PII-heavy tasks, on-prem when available)
// Large = complex reasoning (SOP, visa logic, research)
// Fallback = OpenRouter/ZAI when Groq unavailable
// Never exposes GROQ_API_KEY to frontend; routing decision is logged
// ============================================================
export type ProviderName = 'groq' | 'local' | 'openrouter' | 'zai' | 'fallback';
export interface ModelRoute { provider: ProviderName; model: string; reason: string; estimatedCost?: string; }

const GROQ_FAST = process.env.GROQ_MODEL_FAST || process.env.AI_FAST_MODEL || 'llama-3.1-8b-instant';
const GROQ_LARGE = process.env.GROQ_MODEL_LARGE || process.env.AI_DEFAULT_MODEL || 'llama-3.3-70b-versatile';
const LOCAL_MODEL = process.env.LOCAL_AI_MODEL || 'local-llama';
const FALLBACK_MODEL = process.env.AI_DEFAULT_MODEL || 'glm-4-flash';

// TaskType → routing heuristics (simple, deterministic, no LLM needed)
const FAST_TASKS = new Set(['LEAD_SCORING','CHAT','CLASSIFICATION','QUICK_TRANSLATION','TAG_WRITE','FOLLOW_UP_TASK_CREATE']);
const COMPLEX_TASKS = new Set(['SOP_DRAFT','VISA_CHECK','UNIVERSITY_RESEARCH','COURSE_MATCH','MARKET_RADAR','RAG_ANSWER','ENRICHMENT']);
const PRIVATE_TASKS = new Set(['PII_REDACTION','KYC','DOCUMENT_CHECK_PRIVATE','HR_REVIEW']);

export async function routeModel(opts: { taskType?: string; department?: string; modelHint?: string; privateData?: boolean }): Promise<ModelRoute> {
  const t = (opts.taskType || '').toUpperCase();
  const hint = opts.modelHint?.toLowerCase() || '';
  if (hint) {
    // explicit hint respected
    if (hint.includes('groq') || hint.includes('llama')) return { provider: 'groq', model: opts.modelHint!, reason: 'explicit_hint_groq' };
    if (hint.includes('local')) return { provider: 'local', model: opts.modelHint!, reason: 'explicit_hint_local' };
  }
  if (opts.privateData || PRIVATE_TASKS.has(t)) {
    // Prefer local for private data; if LOCAL_AI_URL not set, fall back to Groq with audit note
    if (process.env.LOCAL_AI_URL) return { provider: 'local', model: LOCAL_MODEL, reason: 'private_data_local' };
    return { provider: 'groq', model: GROQ_FAST, reason: 'private_data_groq_fallback' };
  }
  if (COMPLEX_TASKS.has(t)) return { provider: 'groq', model: GROQ_LARGE, reason: 'complex_reasoning' };
  if (FAST_TASKS.has(t)) return { provider: 'groq', model: GROQ_FAST, reason: 'fast_realtime' };
  // default: fast groq
  return { provider: 'groq', model: GROQ_FAST, reason: 'default_fast' };
}

// backwards alias — gateway may request fallback route
export function fallbackRoute(reason = 'fallback'): ModelRoute {
  return { provider: 'fallback', model: FALLBACK_MODEL, reason };
}
