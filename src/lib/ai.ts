// AI wrapper supporting multi-provider fallback (Groq, OpenRouter, ZAI/GLM).
import ZAI from 'z-ai-web-dev-sdk';

export interface GenerateTextOptions {
  prompt: string;
  model?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateTextResult {
  text: string;
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
}

export interface VideoGenerationResult {
  url: string;
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
  const client = await getZaiClient();
  if (!client) {
    throw new Error('ZAI is not configured or could not be initialized. Set ZAI_API_KEY.');
  }
  return client;
}

export async function generateText(options: GenerateTextOptions): Promise<GenerateTextResult> {
  // 1. Groq API Provider
  if (process.env.GROQ_API_KEY) {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: options.prompt });

      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: options.model || process.env.AI_DEFAULT_MODEL || 'llama-3.3-70b-versatile',
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens,
        }),
      });

      const data = await res.json();
      if (res.ok && data.choices?.[0]?.message?.content) {
        return {
          text: data.choices[0].message.content,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          } : undefined,
        };
      }
    } catch (err) {
      console.warn('Groq API error, attempting fallback:', err);
    }
  }

  // 2. OpenRouter Provider
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: options.prompt });

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        },
        body: JSON.stringify({
          model: options.model || process.env.AI_DEFAULT_MODEL || 'meta-llama/llama-3.3-70b-instruct',
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens,
        }),
      });

      const data = await res.json();
      if (res.ok && data.choices?.[0]?.message?.content) {
        return {
          text: data.choices[0].message.content,
          usage: data.usage ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          } : undefined,
        };
      }
    } catch (err) {
      console.warn('OpenRouter API error, attempting fallback:', err);
    }
  }

  // 3. ZAI / GLM Provider
  if (process.env.ZAI_API_KEY) {
    const zai = await getZai();
    if (zai) {
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
      if (options.systemPrompt) {
        messages.push({ role: 'system', content: options.systemPrompt });
      }
      messages.push({ role: 'user', content: options.prompt });

      const result = await zai.chat.completions.create({
        model: options.model || 'glm-4-flash',
        messages,
        temperature: options.temperature,
        max_tokens: options.maxTokens,
      });

      const text = result.choices?.[0]?.message?.content || '';
      return {
        text,
        usage: result.usage as { promptTokens?: number; completionTokens?: number; totalTokens?: number } | undefined,
      };
    }
  }

  // Never return a fabricated answer when no provider is configured. Callers can
  // catch this explicit error and present a recoverable configuration message.
  throw new Error(
    'No AI provider is configured. Set GROQ_API_KEY, OPENROUTER_API_KEY, or ZAI_API_KEY.'
  );
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
    const result = await (zai as unknown as { video: { generations: { create: (args: { prompt: string }) => Promise<{ url?: string; data?: Array<{ url?: string }> }> } } }).video.generations.create({
      prompt: options.prompt,
    });
    const url = result.url || result.data?.[0]?.url || '';
    return { url };
  }
  throw new Error('Video generation is not configured. Set ZAI_API_KEY.');
}

export default ZAI;
