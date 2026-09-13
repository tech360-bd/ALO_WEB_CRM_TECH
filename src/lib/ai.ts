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

async function getZai(): Promise<ZAI | null> {
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

  // Fallback response if no keys are configured
  return {
    text: `[ALO Education AI Engine]: Generated response for prompt "${options.prompt.substring(0, 60)}..."`,
  };
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
  return { url: '/placeholder-image.png' };
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
  return { url: '' };
}

export default ZAI;
