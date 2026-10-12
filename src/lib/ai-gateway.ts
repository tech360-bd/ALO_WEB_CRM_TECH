/**
 * ALO Education — AI Gateway
 *
 * Centralized AI request handler that all agents use.
 * Architecture: Agent → AI Gateway → Model Router → z-ai-web-dev-sdk → Result
 *
 * Features:
 *  - Model Router (delegates to z-ai-web-dev-sdk)
 *  - Rate limiting (in-memory, per-agent, sliding window)
 *  - Priority queue with concurrency control (max 5 concurrent)
 *  - Timeout, retry with exponential backoff
 *  - 429 handling / circuit breaker
 *  - Fallback support
 *  - Metrics tracking
 *  - Audit logging to AiWorkforceAudit via Prisma
 *
 * Server-only module — do NOT import on the client.
 */

import { getZai, aiChat, extractJson } from '@/lib/ai';
import { db } from '@/lib/db';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Message = { role: string; content: string };

export type GatewayPriority = 'critical' | 'high' | 'normal' | 'low';

export type GatewayFunction =
  | 'generateText'
  | 'generateStructured'
  | 'classify'
  | 'summarize'
  | 'chat'
  | 'stream';

export interface GatewayRequest {
  id: string;
  agentId?: string;
  taskId?: string;
  fn: GatewayFunction;
  priority: GatewayPriority;
  messages: Message[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  outputSchema?: Record<string, unknown>; // Zod-ish schema for structured output
  createdAt: number;
  resolve: (value: GatewayResponse) => void;
  reject: (reason: Error) => void;
}

export interface GatewayResponse {
  content: string;
  parsed?: unknown;
  tokens?: number;
  model: string;
  latencyMs: number;
  retries: number;
  fromFallback: boolean;
}

export interface GatewayMetrics {
  totalRequests: number;
  successCount: number;
  failureCount: number;
  totalTokens: number;
  avgLatency: number;
  queueLength: number;
  circuitBreakerOpen: boolean;
}
export interface GatewayConfig {
  maxConcurrent: number;
  timeoutMs: number;
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetMs: number;
  defaultModel: string;
  fallbackModels: string[];
}

// ---------------------------------------------------------------------------
// Priority weight map (lower = processed sooner)
// ---------------------------------------------------------------------------

const PRIORITY_WEIGHT: Record<GatewayPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

// ---------------------------------------------------------------------------
// AI Gateway
// ---------------------------------------------------------------------------

class AIGateway {
  private config: GatewayConfig;
  private queue: GatewayRequest[] = [];
  private activeCount = 0;
  private processing = false;

  // Metrics
  private metrics = {
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    totalTokens: 0,
    totalLatencyMs: 0,
  latencySamples: 0,
  };

  // Rate limiting: agentId → { timestamps[] }
  private rateLimitMap = new Map<string, number[]>();

  // Circuit breaker state
  private circuitBreakerFailures = 0;
  private circuitBreakerOpen = false;
  private circuitBreakerOpenAt = 0;

  // -----------------------------------------------------------------------
  // Constructor
  // -----------------------------------------------------------------------

  constructor(config?: Partial<GatewayConfig>) {
    this.config = {
      maxConcurrent: 5,
      timeoutMs: 60_000,
      maxRetries: 3,
      baseDelayMs: 500,
      maxDelayMs: 10_000,
      rateLimitWindowMs: 60_000,
      rateLimitMaxRequests: 30,
      circuitBreakerThreshold: 5,
      circuitBreakerResetMs: 30_000,
      defaultModel: 'deepseek-chat',
      fallbackModels: ['llama-3.3-70b-versatile', 'gemma2-9b-it'],
      ...config,
    };
  }

  // -----------------------------------------------------------------------
  // Public API — the six core functions
  // -----------------------------------------------------------------------

  /** Generate free-form text from a prompt. */
  async generateText(
    prompt: string,
    options?: {
      agentId?: string;
      taskId?: string;
      priority?: GatewayPriority;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<GatewayResponse> {
    return this.enqueue({
      fn: 'generateText',
      messages: [{ role: 'user', content: prompt }],
      ...options,
    });
  }

  /** Generate structured JSON output conforming to an output schema. */
  async generateStructured<T = unknown>(
    prompt: string,
    outputSchema: Record<string, unknown>,
    options?: {
      agentId?: string;
      taskId?: string;
      priority?: GatewayPriority;
      systemPrompt?: string;
      temperature?: number;
    },
  ): Promise<GatewayResponse & { parsed: T }> {
    const sysPrompt =
      (options?.systemPrompt ?? '') +
      '\n\nYou MUST respond with valid JSON that conforms to this schema:\n' +
      JSON.stringify(outputSchema, null, 2);
    const response = await this.enqueue({
      fn: 'generateStructured',
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: sysPrompt,
      jsonMode: true,
      ...options,
    });
    const parsed = extractJson<T>(response.content);
    return { ...response, parsed: parsed as T };
  }

  /** Classify input into categories. */
  async classify(
    input: string,
    categories: string[],
    options?: {
      agentId?: string;
      taskId?: string;
      priority?: GatewayPriority;
    },
  ): Promise<GatewayResponse & { parsed: { category: string; confidence: number; reasoning: string } }> {
    const prompt = [
      `Classify the following text into exactly one of these categories: ${categories.join(', ')}.`,
      '',
      'Respond with a JSON object:',
      '{"category": "<chosen category>", "confidence": <0.0-1.0>, "reasoning": "<brief explanation>"}',
      '',
      'Text to classify:',
      input,
    ].join('\n');

    const response = await this.enqueue({
      fn: 'classify',
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: 'You are a precise text classifier. Always respond with valid JSON only.',
      jsonMode: true,
      temperature: 0.1,
      ...options,
    });
    const parsed = extractJson(response.content);
    return {
      ...response,
      parsed: (parsed ?? { category: 'unknown', confidence: 0, reasoning: 'Failed to parse' }) as {
        category: string;
        confidence: number;
        reasoning: string;
      },
    };
  }

  /** Summarize text. */
  async summarize(
    text: string,
    options?: {
      agentId?: string;
      taskId?: string;
      priority?: GatewayPriority;
      maxLength?: number;
      style?: string;
    },
  ): Promise<GatewayResponse> {
    const prompt = [
      `Summarize the following text${options?.style ? ` in ${options.style} style` : ''}.`,
      options?.maxLength ? `Keep it under ${options.maxLength} words.` : '',
      '',
      '---',
      text,
      '---',
    ].join('\n');

    return this.enqueue({
      fn: 'summarize',
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: 'You are a concise summarizer. Provide clear, accurate summaries.',
      temperature: 0.3,
      ...options,
    });
  }

  /** Multi-turn chat completion. */
  async chat(
    messages: Message[],
    options?: {
      agentId?: string;
      taskId?: string;
      priority?: GatewayPriority;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<GatewayResponse> {
    return this.enqueue({
      fn: 'chat',
      messages,
      ...options,
    });
  }

  /** Streaming chat — returns an async generator of content chunks. */
  async *stream(
    messages: Message[],
    options?: {
      agentId?: string;
      taskId?: string;
      priority?: GatewayPriority;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
    },
  ): AsyncGenerator<string, void, unknown> {
    // Rate limit check (best-effort for streams)
    const agentId = options?.agentId;
    if (agentId) {
      this.checkRateLimit(agentId);
    }

    // Circuit breaker check
    if (this.isCircuitBreakerOpen()) {
      throw new Error('AI Gateway: Circuit breaker is open — service temporarily unavailable.');
    }

    const startTime = Date.now();
    this.metrics.totalRequests++;

    const allMessages = options?.systemPrompt
      ? [{ role: 'system' as const, content: options.systemPrompt }, ...messages]
      : messages;

    const zai = await getZai();
    let fullContent = '';
    let success = false;
    let retries = 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        const stream = await zai.chat.completions.create({
          messages: allMessages as any,
          thinking: { type: 'disabled' },
          temperature: options?.temperature,
          max_tokens: options?.maxTokens,
          stream: true,
        });

        for await (const chunk of stream as AsyncIterable<any>) {
          const delta = chunk.choices?.[0]?.delta?.content ?? '';
          if (delta) {
            fullContent += delta;
            yield delta;
          }
        }

        success = true;
        this.circuitBreakerFailures = 0;
        break;
      } catch (err: any) {
        lastError = err;
        const is429 = err?.status === 429 || err?.message?.includes('429');

        if (is429) {
          this.handleRateLimitError();
        }

        if (attempt < this.config.maxRetries) {
          retries++;
          const delay = this.calculateBackoff(attempt);
          await this.sleep(delay);
        }
      }
    }

    const latencyMs = Date.now() - startTime;

    if (success) {
      this.metrics.successCount++;
      this.recordLatency(latencyMs);
    } else {
      this.metrics.failureCount++;
      this.recordCircuitBreakerFailure();
    }

    // Audit log (fire-and-forget)
    this.auditLog({
      agentId,
      taskId: options?.taskId,
      event: 'AI_STREAM_COMPLETED',
      action: 'stream',
      result: success ? 'SUCCESS' : 'FAILED',
      error: lastError?.message,
      latencyMs,
    });

    if (!success && lastError) {
      throw lastError;
    }
  }

  // -----------------------------------------------------------------------
  // Queue management
  // -----------------------------------------------------------------------

  private async enqueue(opts: {
    fn: GatewayFunction;
    messages: Message[];
    agentId?: string;
    taskId?: string;
    priority?: GatewayPriority;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    outputSchema?: Record<string, unknown>;
  }): Promise<GatewayResponse> {
    // Rate limit check
    if (opts.agentId) {
      this.checkRateLimit(opts.agentId);
    }

    // Circuit breaker check
    if (this.isCircuitBreakerOpen()) {
      throw new Error('AI Gateway: Circuit breaker is open — service temporarily unavailable.');
    }

    return new Promise<GatewayResponse>((resolve, reject) => {
      const request: GatewayRequest = {
        id: this.generateId(),
        fn: opts.fn,
        priority: opts.priority ?? 'normal',
        messages: opts.messages,
        systemPrompt: opts.systemPrompt,
        temperature: opts.temperature,
        maxTokens: opts.maxTokens,
        jsonMode: opts.jsonMode,
        outputSchema: opts.outputSchema,
        agentId: opts.agentId,
        taskId: opts.taskId,
        createdAt: Date.now(),
        resolve,
        reject,
      };

      this.queue.push(request);
      this.sortQueue();
      this.metrics.totalRequests++;

      this.drainQueue();
    });
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
  }

  private async drainQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.queue.length > 0 && this.activeCount < this.config.maxConcurrent) {
        const request = this.queue.shift();
        if (!request) break;

        this.activeCount++;
        this.processRequest(request)
          .catch(() => {/* errors handled inside processRequest */})
          .finally(() => {
            this.activeCount--;
            // Continue draining after slot freed
            this.drainQueue();
          });
      }
    } finally {
      this.processing = false;
    }
  }

  // -----------------------------------------------------------------------
  // Request processing with retry, backoff, fallback, timeout
  // -----------------------------------------------------------------------

  private async processRequest(request: GatewayRequest): Promise<void> {
    const startTime = Date.now();
    let lastError: Error | null = null;
    let retries = 0;
    let fromFallback = false;
    let resultContent = '';
    let model = this.config.defaultModel;

    const modelsToTry = [this.config.defaultModel, ...this.config.fallbackModels];

    for (const currentModel of modelsToTry) {
      model = currentModel;
      fromFallback = currentModel !== this.config.defaultModel;

      for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
        try {
          resultContent = await this.executeWithTimeout(
            this.callModel(request, currentModel),
            this.config.timeoutMs,
          );

          // Success — reset circuit breaker
          this.circuitBreakerFailures = 0;
          lastError = null;

          const latencyMs = Date.now() - startTime;
          const tokens = this.estimateTokens(resultContent);

          const response: GatewayResponse = {
            content: resultContent,
            tokens,
            model,
            latencyMs,
            retries,
            fromFallback,
          };

          // Update metrics
          this.metrics.successCount++;
          this.metrics.totalTokens += tokens;
          this.recordLatency(latencyMs);

          // Audit log
          this.auditLog({
            agentId: request.agentId,
            taskId: request.taskId,
            event: 'AI_REQUEST_COMPLETED',
            action: request.fn,
            tool: model,
            input: this.redact(this.truncate(JSON.stringify(request.messages), 2000)),
            output: this.redact(this.truncate(resultContent, 2000)),
            result: 'SUCCESS',
            provider: 'z-ai-web-dev-sdk',
            model,
            tokenUsage: tokens,
            latencyMs,
          });

          request.resolve(response);
          return;

        } catch (err: any) {
          lastError = err as Error;
          const isTimeout = err?.message?.includes('timeout') || err?.message?.includes('TIMEOUT');
          const is429 = err?.status === 429 || err?.message?.includes('429');

          if (is429) {
            this.handleRateLimitError();
          }

          // If timeout or 429, retry with backoff
          if (attempt < this.config.maxRetries && (isTimeout || is429 || this.isRetryable(err))) {
            retries++;
            const delay = this.calculateBackoff(attempt);
            await this.sleep(delay);
            continue;
          }

          // Non-retryable error on this model — try next model
          break;
        }
      }

      // If we got content on this model but it failed, try fallback
      if (lastError) {
        this.recordCircuitBreakerFailure();
        if (this.isCircuitBreakerOpen()) {
          break;
        }
      }
    }

    // All models exhausted — fail the request
    const latencyMs = Date.now() - startTime;
    this.metrics.failureCount++;

    const errorMsg = lastError?.message ?? 'All models failed';

    this.auditLog({
      agentId: request.agentId,
      taskId: request.taskId,
      event: 'AI_REQUEST_FAILED',
      action: request.fn,
      tool: model,
      result: 'FAILED',
      error: errorMsg,
      provider: 'z-ai-web-dev-sdk',
      model,
      latencyMs,
    });

    request.reject(lastError ?? new Error('AI Gateway: All models and retries exhausted.'));
  }

  /** Actually call the model via z-ai-web-dev-sdk. */
  private async callModel(request: GatewayRequest, model: string): Promise<string> {
    const zai = await getZai();

    const allMessages = request.systemPrompt
      ? [{ role: 'system' as const, content: request.systemPrompt }, ...request.messages]
      : request.messages;

    const completion = await zai.chat.completions.create({
      model,
      messages: allMessages as any,
      thinking: { type: 'disabled' },
      temperature: request.temperature,
      max_tokens: request.maxTokens,
      response_format: request.jsonMode ? { type: 'json_object' } : undefined,
    } as any);

    return completion.choices?.[0]?.message?.content ?? '';
  }

  // -----------------------------------------------------------------------
  // Timeout wrapper
  // -----------------------------------------------------------------------

  private async executeWithTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(`AI Gateway: Request timed out after ${ms}ms`)), ms);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // -----------------------------------------------------------------------
  // Rate limiting (sliding window, per-agent)
  // -----------------------------------------------------------------------

  private checkRateLimit(agentId: string): void {
    const now = Date.now();
    const windowStart = now - this.config.rateLimitWindowMs;

    let timestamps = this.rateLimitMap.get(agentId) ?? [];
    // Prune old entries
    timestamps = timestamps.filter((ts) => ts > windowStart);

    if (timestamps.length >= this.config.rateLimitMaxRequests) {
      const oldestInWindow = timestamps[0];
      const waitMs = this.config.rateLimitWindowMs - (now - oldestInWindow);
      throw new Error(
        `AI Gateway: Rate limit exceeded for agent ${agentId}. ` +
        `Limit: ${this.config.rateLimitMaxRequests} requests per ${this.config.rateLimitWindowMs}ms. ` +
        `Retry after ${Math.ceil(waitMs)}ms.`
      );
    }

    timestamps.push(now);
    this.rateLimitMap.set(agentId, timestamps);
  }

  /** Called when a 429 is received from upstream. */
  private handleRateLimitError(): void {
    // Don't immediately trip circuit breaker on a single 429,
    // but record it as a signal.
    // The retry loop will handle the backoff.
  }

  // -----------------------------------------------------------------------
  // Circuit breaker
  // -----------------------------------------------------------------------

  private recordCircuitBreakerFailure(): void {
    this.circuitBreakerFailures++;
    if (this.circuitBreakerFailures >= this.config.circuitBreakerThreshold) {
      this.circuitBreakerOpen = true;
      this.circuitBreakerOpenAt = Date.now();
    }
  }

  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreakerOpen) return false;
    if (Date.now() - this.circuitBreakerOpenAt >= this.config.circuitBreakerResetMs) {
      this.circuitBreakerOpen = false;
      this.circuitBreakerFailures = 0;
      return false;
    }
    return true;
  }

  // -----------------------------------------------------------------------
  // Exponential backoff
  // -----------------------------------------------------------------------

  private calculateBackoff(attempt: number): number {
    const jitter = Math.random() * 0.3; // 0–30% jitter
    const delay = Math.min(
      this.config.baseDelayMs * Math.pow(2, attempt) * (1 + jitter),
      this.config.maxDelayMs,
    );
    return Math.floor(delay);
  }

  // -----------------------------------------------------------------------
  // Metrics
  // -----------------------------------------------------------------------

  private recordLatency(latencyMs: number): void {
    this.metrics.totalLatencyMs += latencyMs;
    this.metrics.latencySamples++;
  }

  getMetrics(): GatewayMetrics {
    return {
      totalRequests: this.metrics.totalRequests,
      successCount: this.metrics.successCount,
      failureCount: this.metrics.failureCount,
      totalTokens: this.metrics.totalTokens,
      avgLatency:
        this.metrics.latencySamples > 0
          ? Math.round(this.metrics.totalLatencyMs / this.metrics.latencySamples)
          : 0,
      queueLength: this.queue.length,
      circuitBreakerOpen: this.circuitBreakerOpen,
    };
  }

  resetMetrics(): void {
    this.metrics = {
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      totalTokens: 0,
      totalLatencyMs: 0,
      latencySamples: 0,
    };
    this.circuitBreakerFailures = 0;
    this.circuitBreakerOpen = false;
  }

  // -----------------------------------------------------------------------
  // Audit logging to AiWorkforceAudit
  // -----------------------------------------------------------------------

  private async auditLog(params: {
    agentId?: string;
    taskId?: string;
    event: string;
    action?: string;
    tool?: string;
    input?: string;
    output?: string;
    result?: string;
    error?: string;
    provider?: string;
    model?: string;
    tokenUsage?: number;
    latencyMs?: number;
  }): Promise<void> {
    try {
      await db.aiWorkforceAudit.create({
        data: {
          agentId: params.agentId,
          taskId: params.taskId,
          event: params.event,
          action: params.action,
          tool: params.tool,
          input: params.input,
          output: params.output,
          result: params.result,
          error: params.error,
          provider: params.provider,
          model: params.model,
          tokenUsage: params.tokenUsage ?? 0,
          latency: params.latencyMs ?? 0,
        },
      });
    } catch {
      // Audit logging should never crash the gateway.
      // Silently swallow DB errors.
    }
  }

  // -----------------------------------------------------------------------
  // Utility helpers
  // -----------------------------------------------------------------------

  private isRetryable(err: any): boolean {
    if (!err) return false;
    const status = err?.status ?? err?.statusCode;
    // Retry on 5xx, network errors, timeouts
    if (status >= 500) return true;
    if (err?.code === 'ECONNRESET' || err?.code === 'ECONNREFUSED' || err?.code === 'ETIMEDOUT') return true;
    if (err?.message?.includes('network') || err?.message?.includes('fetch')) return true;
    return false;
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English, ~2 for CJK-heavy.
    // Use a simple heuristic: count characters and divide by 3.5.
    return Math.ceil(text.length / 3.5);
  }

  private truncate(str: string, maxLen: number): string {
    if (!str) return str;
    return str.length > maxLen ? str.slice(0, maxLen) + '...[truncated]' : str;
  }

  /** Simple PII redaction — mask emails and phone numbers. */
  private redact(str: string): string {
    if (!str) return str;
    return str
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[REDACTED_PHONE]')
      .replace(/\b(?:\d[ -]*?){13,16}\b/g, '[REDACTED_CARD]');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private generateId(): string {
    return `gw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}

// ---------------------------------------------------------------------------
// Singleton export
// ---------------------------------------------------------------------------

export const aiGateway = new AIGateway();
export default aiGateway;
