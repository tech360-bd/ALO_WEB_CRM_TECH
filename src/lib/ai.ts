// AI wrapper supporting multi-provider fallback (Groq, OpenRouter, ZAI/GLM),
// plus any OpenAI-compatible free tier catalogued in src/lib/ai-providers.
import ZAI from 'z-ai-web-dev-sdk';
import { generateUnoRouterFree } from '@/lib/ai-providers/unorouter';
import { z } from 'zod';
import { getProviderDefinition } from '@/lib/ai-providers/catalog';
import { assertCloudInferenceAllowed, resolveFreeProvider, toChatCompletionsUrl } from '@/lib/ai-providers/resolve';

/** Providers with a hand-written adapter below. */
export type NativeTextProvider = 'groq' | 'openrouter' | 'zai' | 'local';

/**
 * Any catalogued provider slug can also be requested. Resolution, explicit
 * cloud-approval enforcement and endpoint validation happen in resolveFreeProvider, so an
 * unknown or unconfigured slug throws instead of silently reaching a paid API.
 */
export type TextProvider = NativeTextProvider | string;

export interface GenerateTextOptions {
  prompt: string;
  /** An explicit provider disables all implicit fallback. */
  provider?: TextProvider;
  endpoint?: string;
  timeoutMs?: number;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateTextResult {
  text: string;
  provider: TextProvider;
  model: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface GenerateImageOptions {
  prompt: string;
  size?: '1024x1024' | '768x1344' | '864x1152' | '1344x768' | '1152x864' | '1440x720' | '720x1440';
}

export interface GenerateImageResult {
  url: string;
}

export interface VideoGenerationOptions {
  prompt: string;
  /**
   * Maximum length the caller has approved for this asset, in seconds.
   *
   * It is forwarded to the provider when the provider supports length control and
   * echoed back in the result so the caller can verify the asset it received
   * really is short enough. The provider integration does not report a rendered
   * duration, so the result also carries `durationUnknown` — the caller must treat
   * that as unverified rather than assume compliance.
   */
  maxSeconds?: number;
}

export interface VideoGenerationResult {
  url: string;
  /** Length the provider was asked for, if known. */
  durationSeconds?: number;
  /** True when the provider returned no duration metadata for the asset. */
  durationUnknown?: boolean;
}

let zaiInstance: ZAI | null = null;

async function getZaiClient(): Promise<ZAI | null> {
  if (!process.env.ZAI_API_KEY) return null;
  if (!zaiInstance) {
    try {
      zaiInstance = await ZAI.create();
    } catch {
      return null;
    }
  }
  return zaiInstance;
}

/** Return a configured ZAI client or fail explicitly; never return a fake client. */
export async function getZai(): Promise<ZAI> {
  assertCloudInferenceAllowed('zai');
  const client = await getZaiClient();
  if (!client) {
    throw new Error('ZAI is not configured or could not be initialized. Set ZAI_API_KEY.');
  }
  return client;
}

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().trim().min(1) }) })).min(1),
  usage: z.object({ prompt_tokens: z.number().nonnegative().optional(), completion_tokens: z.number().nonnegative().optional(), total_tokens: z.number().nonnegative().optional() }).optional(),
});

/** One provider, one request. Private/local requests never transit a cloud fallback. */
async function requestText(provider: TextProvider, options: GenerateTextOptions): Promise<GenerateTextResult> {
  if (provider === 'unorouter') return generateUnoRouterFree(options);
  if (provider !== 'local') assertCloudInferenceAllowed(provider);
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
  if (options.systemPrompt) messages.push({ role: 'system', content: options.systemPrompt });
  messages.push({ role: 'user', content: options.prompt });
  const timeoutMs = options.timeoutMs ?? 30_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 120_000) throw new Error('Invalid AI timeout');
  const defaults = {
    groq: { key: process.env.GROQ_API_KEY, url: 'https://api.groq.com/openai/v1/chat/completions', model: process.env.AI_DEFAULT_MODEL || 'llama-3.3-70b-versatile' },
    openrouter: { key: process.env.OPENROUTER_API_KEY, url: 'https://openrouter.ai/api/v1/chat/completions', model: process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.3-70b-instruct' },
    local: { key: process.env.LOCAL_AI_API_KEY, url: process.env.LOCAL_AI_URL, model: process.env.LOCAL_AI_MODEL },
    zai: { key: process.env.ZAI_API_KEY, url: '', model: 'glm-4-flash' },
  };
  const isNative = provider in defaults;

  // Catalogued free-tier providers are resolved into the same { key, url, model }
  // shape as the native adapters, so they flow through the identical request,
  // validation and response-parsing code below rather than a second copy of it.
  // resolveFreeProvider enforces explicit cloud approval, HTTPS, and no-credentials-in-URL,
  // and throws for an unknown, unconfigured or blocked slug.
  const resolvedCatalog = isNative ? null : resolveFreeProvider(provider, options.model);
  const config = isNative
    ? defaults[provider as NativeTextProvider]
    : { key: resolvedCatalog!.apiKey ?? '', url: toChatCompletionsUrl(resolvedCatalog!.baseUrl), model: resolvedCatalog!.model };

  // Keyless catalogued providers (e.g. Pollinations' free tier) legitimately have
  // no key; every other external provider must.
  const keyOptional = resolvedCatalog ? getProviderDefinition(provider)?.keyOptional === true : provider === 'local';

  const model = options.model || config.model;
  if (!model) throw new Error(`AI provider ${provider} requires a configured model`);
  if (!keyOptional && !config.key) throw new Error(`AI provider ${provider} is not configured`);
  if (provider === 'zai') {
    const client = await getZai();
    // The SDK has no AbortSignal support. Bound caller wait; the underlying SDK
    // request cannot be cancelled (unlike the HTTP adapters below).
    let timer: ReturnType<typeof setTimeout> | undefined;
    const result: unknown = await Promise.race([
      client.chat.completions.create({ model, messages, temperature: options.temperature, max_tokens: options.maxTokens }),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('ZAI request timed out')), timeoutMs); }),
    ]).finally(() => { if (timer) clearTimeout(timer); });
    const parsed = completionSchema.parse(result);
    return { text: parsed.choices[0].message.content, provider, model, usage: parsed.usage ? { promptTokens: parsed.usage.prompt_tokens, completionTokens: parsed.usage.completion_tokens, totalTokens: parsed.usage.total_tokens } : undefined };
  }
  const endpoint = options.endpoint || config.url;
  if (!endpoint) throw new Error(`AI provider ${provider} endpoint is not configured`);
  const url = new URL(endpoint);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid AI endpoint');
  // Catalog-resolved endpoints were already validated by resolveFreeProvider
  // (HTTPS, or plain HTTP only on loopback for a same-host server). The original
  // rule is kept for the native external adapters.
  if (isNative && provider !== 'local' && url.protocol !== 'https:') throw new Error('External AI requires HTTPS');
  // LOCAL_AI_URL is a trusted server configuration, never a browser-supplied URL.
  // Accept a base URL, /v1 base, or full OpenAI-compatible chat endpoint (Ollama supports /v1).
  if (!url.pathname.endsWith('/chat/completions')) {
    url.pathname = url.pathname.replace(/\/$/, '') + (url.pathname.replace(/\/$/, '').endsWith('/v1') ? '/chat/completions' : '/v1/chat/completions');
  }
  const response = await fetch(url, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(timeoutMs),
    headers: { 'Content-Type': 'application/json', ...(config.key ? { Authorization: `Bearer ${config.key}` } : {}) },
    body: JSON.stringify({ model, messages, temperature: options.temperature ?? 0.7, max_tokens: options.maxTokens }),
  });
  if (!response.ok) throw new Error(`AI provider ${provider} returned HTTP ${response.status}`);
  const parsed = completionSchema.parse(await response.json());
  return { text: parsed.choices[0].message.content, provider, model, usage: parsed.usage ? { promptTokens: parsed.usage.prompt_tokens, completionTokens: parsed.usage.completion_tokens, totalTokens: parsed.usage.total_tokens } : undefined };
}

export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  if (options.provider) return requestText(options.provider, options);
  const providers: TextProvider[] = [];
  if (process.env.LOCAL_AI_URL) return requestText('local', options); // no implicit cloud fallback from local
  if (process.env.GROQ_API_KEY) providers.push('groq');
  if (process.env.OPENROUTER_API_KEY) providers.push('openrouter');
  if (process.env.ZAI_API_KEY) providers.push('zai');
  for (const provider of providers) {
    try {
      return await requestText(provider, options);
    } catch {
      console.warn(`[AI] ${provider} request failed; attempting next explicitly configured provider`);
    }
  }
  throw new Error(providers.length ? 'All configured AI providers failed' : 'No AI provider is configured. Set LOCAL_AI_URL and LOCAL_AI_MODEL, or a cloud provider key.');
}

/**
 * Compatibility helper used by chat-oriented routes. It delegates to the same
 * provider fallback chain so every AI entry point has consistent behaviour.
 */
export async function aiChat(
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; model?: string; maxTokens?: number }
): Promise<string> {
  const systemMessage = messages.find((message) => message.role === 'system');
  const prompt = messages
    .filter((message) => message.role !== 'system')
    .map((message) => `${message.role}: ${message.content}`)
    .join('\\n');

  const result = await generateText({
    prompt,
    systemPrompt: systemMessage?.content,
    model: options?.model,
    maxTokens: options?.maxTokens,
    temperature: options?.temperature,
  });
  return result.text;
}

/** Safely extract a JSON object or array from a model response. */
export function extractJson<T = any>(raw: string): T | null {
  if (!raw) return null;
  const candidates = [
    raw.trim(),
    ...(raw.match(/```(?:json)?\\s*([\\s\\S]*?)```/i)?.slice(1) ?? []),
  ];

  const firstObject = raw.indexOf('{');
  const lastObject = raw.lastIndexOf('}');
  if (firstObject !== -1 && lastObject > firstObject) {
    candidates.push(raw.slice(firstObject, lastObject + 1));
  }
  const firstArray = raw.indexOf('[');
  const lastArray = raw.lastIndexOf(']');
  if (firstArray !== -1 && lastArray > firstArray) {
    candidates.push(raw.slice(firstArray, lastArray + 1));
  }

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as T;
    } catch {
      // Try the next extraction strategy.
    }
  }
  return null;
}

export async function generateImage(options: GenerateImageOptions): Promise<GenerateImageResult> {
  const zai = await getZai();
  if (zai) {
    const result = await zai.images.generations.create({
      prompt: options.prompt,
      size: options.size,
    });
    const url = (result as { data?: Array<{ url?: string; base64?: string }> }).data?.[0]?.url
      || ((result as { data?: Array<{ base64?: string }> }).data?.[0]?.base64 ? `data:image/png;base64,${(result as { data: Array<{ base64: string }> }).data[0].base64}` : '');
    return { url };
  }
  throw new Error('Image generation is not configured. Set ZAI_API_KEY.');
}

export async function generateVideo(options: VideoGenerationOptions): Promise<VideoGenerationResult> {
  const zai = await getZai();
  if (zai) {
    const args: { prompt: string; duration?: number } = { prompt: options.prompt };
    // Some providers accept a target duration. We only ever ask for a value the
    // caller has already approved, never a default of our own.
    if (options.maxSeconds && options.maxSeconds > 0) args.duration = options.maxSeconds;

    const result = await (zai as unknown as {
      video: {
        generations: {
          create: (input: { prompt: string; duration?: number }) => Promise<{
            url?: string;
            data?: Array<{ url?: string }>;
            duration?: number;
            durationSeconds?: number;
          }>;
        };
      };
    }).video.generations.create(args);

    const url = result.url || result.data?.[0]?.url || '';
    const reportedDuration = result.durationSeconds ?? result.duration;
    return {
      url,
      durationSeconds: typeof reportedDuration === 'number' ? reportedDuration : options.maxSeconds,
      // No duration came back from the provider: the caller must know the length
      // was never verified rather than assume it is within the approved limit.
      durationUnknown: typeof reportedDuration !== 'number',
    };
  }
  throw new Error('Video generation is not configured. Set ZAI_API_KEY.');
}

export default ZAI;
