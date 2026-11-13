import type { ZodSchema } from 'zod';
import { generateText } from '@/lib/ai';
import { PHD_AI_SYSTEM_RULES, extractJsonObject } from './safety';
import { gatewayChat, isGatewayEnabled } from './gateway';

export class AiNotConfiguredError extends Error {
  constructor() {
    super(
      'No AI provider is configured in this environment. Set LOCAL_AI_URL/AI_FAST_MODEL, or GROQ_API_KEY, OPENROUTER_API_KEY or ZAI_API_KEY. The deterministic parts of the workspace are unaffected.',
    );
    this.name = 'AiNotConfiguredError';
  }
}

export interface StructuredGenerationOptions<T> {
  /** One-paragraph statement of the task, appended to the fixed safety rules. */
  task: string;
  prompt: string;
  schema: ZodSchema<T>;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  model?: string;
  /** Extra retry with a repair note when the first response fails validation. */
  maxAttempts?: number;
}

export interface StructuredGenerationResult<T> {
  data: T;
  provider: string;
  model: string;
  attempts: number;
  durationMs: number;
}

function isTransient(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return !/No AI provider is configured/i.test(message);
}

async function callOnce(
  options: StructuredGenerationOptions<unknown> & { prompt: string },
): Promise<{ raw: string; provider: string; model: string }> {
  const systemPrompt = `${PHD_AI_SYSTEM_RULES}\n\nTASK: ${options.task}`;
  const maxTokens = options.maxTokens ?? 1800;

  // When the shared gateway is enabled it is the only permitted path: a failure
  // is reported, never re-sent directly to a provider that bypasses its policy.
  if (isGatewayEnabled()) {
    const result = await gatewayChat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: options.prompt },
      ],
      maxTokens,
      temperature: options.temperature ?? 0.3,
      dataClassification: 'CONFIDENTIAL',
      route: 'local_only',
      model: options.model,
    });
    return { raw: result.text, provider: `gateway:${result.provider}`, model: result.model };
  }

  const result = await generateText({
    prompt: options.prompt,
    systemPrompt,
    maxTokens,
    temperature: options.temperature ?? 0.3,
    timeoutMs: options.timeoutMs ?? 30_000,
    model: options.model ?? process.env.AI_SMART_MODEL,
  });
  return { raw: result.text, provider: String(result.provider), model: result.model };
}

/**
 * Call the configured model and validate its JSON against a schema. On a schema
 * failure the model gets exactly one repair attempt that includes the validation
 * issues; if that also fails, the call throws and nothing is written.
 */
export async function generateStructured<T>(
  options: StructuredGenerationOptions<T>,
): Promise<StructuredGenerationResult<T>> {
  const started = Date.now();
  const maxAttempts = Math.min(3, Math.max(1, options.maxAttempts ?? 2));
  let prompt = options.prompt;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: { raw: string; provider: string; model: string };
    try {
      response = await callOnce({ ...options, prompt });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/No AI provider is configured/i.test(message)) throw new AiNotConfiguredError();
      if (!isTransient(error) || attempt === maxAttempts) throw error;
      lastError = error;
      continue;
    }

    try {
      const parsed = options.schema.parse(extractJsonObject(response.raw));
      return {
        data: parsed,
        provider: response.provider,
        model: response.model,
        attempts: attempt,
        durationMs: Date.now() - started,
      };
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
      const detail =
        error && typeof error === 'object' && 'issues' in error
          ? JSON.stringify((error as { issues: unknown }).issues).slice(0, 900)
          : String(error).slice(0, 400);
      prompt = `${options.prompt}\n\nYour previous reply did not satisfy the required JSON schema. Validation issues: ${detail}\nReturn only a corrected JSON object that satisfies every field.`;
    }
  }

  throw new Error(
    `The AI response could not be validated after ${maxAttempts} attempt(s). No data was saved. ${lastError instanceof Error ? lastError.message.slice(0, 300) : ''}`.trim(),
  );
}
