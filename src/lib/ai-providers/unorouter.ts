import { z } from 'zod';
import type { GenerateTextOptions, GenerateTextResult } from '@/lib/ai';

// Fixed official endpoints: neither a browser request nor an environment URL
// override can redirect the API key to another host.
export const UNOROUTER_CATALOG_URL = 'https://api.unorouter.com/api/pricing/catalog';
export const UNOROUTER_CHAT_URL = 'https://api.unorouter.com/v1/chat/completions';
export class UnoRouterError extends Error {
  constructor(readonly code: string, message: string, readonly status = 503, readonly retryAfter?: number) { super(message); this.name = 'UnoRouterError'; }
}
const FreeId = z.string().min(6).max(160).regex(/^[a-zA-Z0-9_./:-]+:free$/);
const zero = (value: unknown) => value === 0 || (typeof value === 'string' && /^0(?:\.0+)?$/.test(value));
export interface UnoFreeModel { id: string; vendor: string; retainsOrTrains: boolean; consentRequired: boolean; approved: boolean }
export function unoRouterConfiguration() {
  const approved = (process.env.UNOROUTER_ALLOWED_MODELS || '').split(',').map(value => value.trim()).filter(Boolean);
  const valid = approved.length > 0 && approved.every(model => FreeId.safeParse(model).success);
  return { enabled: process.env.UNOROUTER_ENABLED === 'true', keyConfigured: !!process.env.UNOROUTER_API_KEY?.trim(), approvedModels: valid ? [...new Set(approved)] : [], defaultModel: process.env.UNOROUTER_MODEL?.trim() || (valid ? approved[0] : ''), configurationValid: valid };
}
async function boundedJson(response: Response, maxBytes: number): Promise<unknown> {
  if (Number(response.headers.get('content-length')) > maxBytes || !response.body) throw new UnoRouterError('INVALID_RESPONSE', 'Provider response was invalid.');
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let size = 0, text = '';
  try { for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maxBytes) { await reader.cancel(); throw new UnoRouterError('INVALID_RESPONSE', 'Provider response exceeded its safe limit.'); } text += decoder.decode(value, { stream: true }); } text += decoder.decode(); return JSON.parse(text); }
  catch (error) { if (error instanceof UnoRouterError) throw error; throw new UnoRouterError('INVALID_RESPONSE', 'Provider response was not valid JSON.'); }
  finally { reader.releaseLock(); }
}
/** Public catalog read. A free suffix alone is never treated as pricing evidence. */
export async function loadUnoFreeModels(): Promise<UnoFreeModel[]> {
  let response: Response;
  try { response = await fetch(UNOROUTER_CATALOG_URL, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(8000) }); }
  catch { throw new UnoRouterError('CATALOG_UNAVAILABLE', 'UnoRouter pricing catalog is unavailable. No inference was sent.'); }
  if (!response.ok) throw new UnoRouterError('CATALOG_UNAVAILABLE', 'UnoRouter pricing catalog is unavailable. No inference was sent.');
  const parsed = z.object({ models: z.array(z.unknown()).max(5000) }).safeParse(await boundedJson(response, 2_000_000));
  if (!parsed.success) throw new UnoRouterError('CATALOG_UNAVAILABLE', 'UnoRouter pricing evidence could not be verified.');
  const approved = new Set(unoRouterConfiguration().approvedModels);
  const models: UnoFreeModel[] = [];
  for (const value of parsed.data.models) {
    if (!value || typeof value !== 'object') continue;
    const model = value as Record<string, unknown>;
    if (!FreeId.safeParse(model.model_name).success || model.is_free !== true || model.online !== true || model.type !== 'text' || model.chat !== true || !Array.isArray(model.supported_endpoint_types) || !model.supported_endpoint_types.includes('openai') || !zero(model.input_price) || !zero(model.output_price) || !zero(model.fixed_price)) continue;
    const purpose = model.own_purpose && typeof model.own_purpose === 'object' ? model.own_purpose as Record<string, unknown> : {};
    models.push({ id: String(model.model_name), vendor: typeof model.vendor === 'string' ? model.vendor.slice(0, 80) : 'Provider not identified', retainsOrTrains: purpose.trains_or_retains !== false, consentRequired: purpose.consent_required !== false, approved: approved.has(String(model.model_name)) });
  }
  return models;
}
export async function generateUnoRouterFree(options: GenerateTextOptions): Promise<GenerateTextResult> {
  const config = unoRouterConfiguration(); const model = options.model?.trim() || config.defaultModel;
  if (!config.enabled || !config.keyConfigured || !config.configurationValid) throw new UnoRouterError('NOT_CONFIGURED', 'Configure UNOROUTER_ENABLED, UNOROUTER_API_KEY and UNOROUTER_ALLOWED_MODELS on the server. Paid access must stay disabled.');
  if (options.endpoint || !FreeId.safeParse(model).success || !config.approvedModels.includes(model)) throw new UnoRouterError('MODEL_BLOCKED', 'Only an explicitly approved :free model may be requested.', 400);
  if (!options.prompt.trim() || options.prompt.length > 16000 || (options.systemPrompt?.length || 0) > 4000) throw new UnoRouterError('INPUT_INVALID', 'AI input exceeded its safe limit.', 400);
  const maxTokens = options.maxTokens ?? 1024;
  if (!Number.isInteger(maxTokens) || maxTokens < 1 || maxTokens > 2048) throw new UnoRouterError('INPUT_INVALID', 'Output limit must be between 1 and 2048 tokens.', 400);
  const available = await loadUnoFreeModels();
  if (!available.some(entry => entry.id === model && entry.approved)) throw new UnoRouterError('MODEL_UNAVAILABLE', 'The approved model is not currently verified online and free. No inference was sent.');
  const timeout = options.timeoutMs ?? 30000;
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 60000) throw new UnoRouterError('INPUT_INVALID', 'Invalid provider timeout.', 400);
  const messages = [...(options.systemPrompt ? [{ role: 'system', content: options.systemPrompt }] : []), { role: 'user', content: options.prompt }];
  let response: Response;
  try { response = await fetch(UNOROUTER_CHAT_URL, { method: 'POST', redirect: 'error', signal: AbortSignal.timeout(timeout), headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.UNOROUTER_API_KEY!.trim()}` }, body: JSON.stringify({ model, messages, stream: false, max_tokens: maxTokens, temperature: options.temperature ?? 0.3 }) }); }
  catch { throw new UnoRouterError('REQUEST_FAILED', 'The free model did not respond. No paid provider was attempted.'); }
  const data = await boundedJson(response, 250_000);
  if (!response.ok) {
    const retry = Number(response.headers.get('retry-after'));
    const code = data && typeof data === 'object' && 'error' in data && data.error && typeof data.error === 'object' && 'code' in data.error ? String(data.error.code) : '';
    if (['consent_required','consent_business','own_purpose_objected'].includes(code)) throw new UnoRouterError('CONSENT_REQUIRED', 'Review this model’s provider consent settings in UnoRouter. No consent was granted automatically.', 403);
    if (response.status === 429) throw new UnoRouterError('RATE_LIMITED', 'The free model is rate limited. Wait before retrying; no paid fallback is used.', 429, Number.isFinite(retry) && retry > 0 ? Math.min(3600, Math.ceil(retry)) : 60);
    throw new UnoRouterError('REQUEST_FAILED', 'The free model request failed. No paid provider was attempted.', response.status === 401 ? 503 : 502);
  }
  const parsed = z.object({ model: z.string(), choices: z.array(z.object({ message: z.object({ content: z.string().trim().min(1).max(20000) }) })).min(1), usage: z.object({ prompt_tokens: z.number().int().nonnegative().optional(), completion_tokens: z.number().int().nonnegative().optional(), total_tokens: z.number().int().nonnegative().optional() }).optional() }).safeParse(data);
  if (!parsed.success || parsed.data.model !== model) throw new UnoRouterError('INVALID_RESPONSE', 'Provider response identity or content could not be verified.');
  return { text: parsed.data.choices[0].message.content, provider: 'unorouter', model, usage: parsed.data.usage ? { promptTokens: parsed.data.usage.prompt_tokens, completionTokens: parsed.data.usage.completion_tokens, totalTokens: parsed.data.usage.total_tokens } : undefined };
}
