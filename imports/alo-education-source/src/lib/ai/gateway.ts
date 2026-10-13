/**
 * ALO Education — AI Gateway
 * Task ID: 7-ai-gateway
 * Task ID: 2-fix-gateway
 *
 * Central gateway for ALL AI requests.
 * Architecture: Agent → AI Gateway → Model Router → Provider Adapter → Groq/Local/Fallback
 *
 * Features:
 * 1. Rate limiting (Groq free tier): max 30 req/min, max 5 concurrent
 * 2. Queue with priority: critical > high > normal > low
 * 3. Retry with exponential backoff (max 3 retries, 429 handling)
 * 4. Circuit breaker: 5 consecutive failures → open 60s → half-open
 * 5. Fallback chain: Groq → fallback model → error
 * 6. Timeout: 30s default, 60s for complex tasks
 * 7. Token tracking per request (estimated since SDK doesn't return token counts)
 * 8. Request logging (no secrets)
 */

import ZAI from 'z-ai-web-dev-sdk';
import type {
  AiGatewayRequest,
  AiGatewayResponse,
  ProviderType,
  RequestPriority,
} from './types';
import { priorityWeight } from './types';
import { aiRateLimiter } from './rate-limiter';
import { groqCircuitBreaker } from './circuit-breaker';
import { modelRouter, type ResolvedRoute } from './model-router';

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_TIMEOUT_MS = 30_000;
const COMPLEX_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1_000;

/** Task types that warrant the longer timeout */
const COMPLEX_TASK_TYPES = new Set([
  'complex_reasoning',
  'document_check',
  'visa_advice',
  'course_matching',
]);

// ============================================================
// QUEUE
// ============================================================

interface QueuedRequest {
  id: string;
  priority: RequestPriority;
  weight: number;
  resolve: (response: AiGatewayResponse) => void;
  reject: (error: Error) => void;
  request: AiGatewayRequest;
}

let queueIdCounter = 0;
const queue: QueuedRequest[] = [];
let processing = false;

// ============================================================
// GATEWAY CLASS
// ============================================================

class AiGateway {
  /** Cached ZAI instance */
  private zaiInstance: ZAI | null = null;
  private zaiInitPromise: Promise<ZAI> | null = null;

  /**
   * Submit a request to the AI gateway.
   * If the rate limiter allows, the request is executed immediately;
   * otherwise it is queued and processed in priority order.
   */
  async chat(request: AiGatewayRequest): Promise<AiGatewayResponse> {
    const priority = request.priority ?? 'normal';

    // Try immediate execution first
    try {
      const snapshot = aiRateLimiter.snapshot();
      if (snapshot.concurrent < snapshot.maxConcurrent) {
        return await aiRateLimiter.withRateLimit(() =>
          this.executeWithRetry(request)
        );
      }
    } catch (err) {
      // Rate limited — fall through to queue
      const is429 =
        err instanceof Error &&
        (err.message.includes('Rate limit') || err.message.includes('Concurrency'));
      if (!is429) throw err;
    }

    // Enqueue
    return this.enqueue(request, priority);
  }

  // ----------------------------------------------------------
  // Queue management
  // ----------------------------------------------------------

  private enqueue(
    request: AiGatewayRequest,
    priority: RequestPriority
  ): Promise<AiGatewayResponse> {
    return new Promise((resolve, reject) => {
      queueIdCounter += 1;
      const weight = priorityWeight(priority);
      const entry: QueuedRequest = {
        id: `q-${queueIdCounter}`,
        priority,
        weight,
        resolve,
        reject,
        request,
      };

      // Insert sorted by weight descending (highest priority first)
      const idx = queue.findIndex((e) => e.weight < weight);
      if (idx === -1) queue.push(entry);
      else queue.splice(idx, 0, entry);

      console.log(
        `[AiGateway] Queued ${entry.id} (priority=${priority}, queueDepth=${queue.length})`
      );

      this.drainQueue();
    });
  }

  private drainQueue(): void {
    if (processing) return;
    if (queue.length === 0) return;

    const snapshot = aiRateLimiter.snapshot();
    if (snapshot.concurrent >= snapshot.maxConcurrent) return;

    processing = true;
    const entry = queue.shift()!;

    aiRateLimiter
      .withRateLimit(() => this.executeWithRetry(entry.request))
      .then(entry.resolve)
      .catch((err) => entry.reject(err instanceof Error ? err : new Error(String(err))))
      .finally(() => {
        processing = false;
        // Process next in queue
        if (queue.length > 0) {
          setImmediate(() => this.drainQueue());
        }
      });
  }

  // ----------------------------------------------------------
  // Execution with retry & circuit breaker
  // ----------------------------------------------------------

  private async executeWithRetry(request: AiGatewayRequest): Promise<AiGatewayResponse> {
    const route = modelRouter.resolve(request.provider, request.model);

    let lastError: Error | null = null;

    // Build the chain of providers to try
    const chain: Array<{ provider: ProviderType; model: string }> = [
      { provider: route.provider, model: route.model },
    ];
    if (route.fallbackProvider && route.fallbackModel) {
      chain.push({ provider: route.fallbackProvider, model: route.fallbackModel });
    }

    for (const target of chain) {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const response = await this.executeSingle(request, target, route);
          return response;
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err));
          const msg = lastError.message;

          // If circuit is open for this provider, try next provider immediately
          if (
            target.provider === 'groq' &&
            groqCircuitBreaker.getState() === 'OPEN'
          ) {
            console.log(`[AiGateway] Circuit OPEN for groq, trying next provider`);
            break; // break retry loop, go to next provider
          }

          // If 429, respect Retry-After or use exponential backoff
          if (msg.includes('429') || msg.includes('rate limit')) {
            if (attempt < MAX_RETRIES) {
              const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
              console.log(
                `[AiGateway] 429 received, retry ${attempt + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`
              );
              await this.sleep(delay);
              continue;
            }
          }

          // Non-retryable or final retry → break
          if (attempt === MAX_RETRIES) break;

          // Other errors: exponential backoff
          const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
          console.log(
            `[AiGateway] Error on attempt ${attempt + 1}: ${msg}. Retrying after ${delay}ms`
          );
          await this.sleep(delay);
        }
      }
    }

    // All providers + retries exhausted
    const errorMsg = lastError ? lastError.message : 'All providers failed';
    console.error(`[AiGateway] All attempts failed: ${errorMsg}`);

    return {
      success: false,
      content: null,
      error: errorMsg,
      provider: chain[chain.length - 1].provider,
      model: chain[chain.length - 1].model,
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: 0,
    };
  }

  // ----------------------------------------------------------
  // Single provider execution
  // ----------------------------------------------------------

  private async executeSingle(
    request: AiGatewayRequest,
    target: { provider: ProviderType; model: string },
    route: ResolvedRoute
  ): Promise<AiGatewayResponse> {
    if (target.provider === 'groq') {
      return groqCircuitBreaker.execute(() => this.callGroq(request, target.model));
    }

    // Local / fallback — not yet implemented, return error
    return {
      success: false,
      content: null,
      error: `Provider '${target.provider}' is not configured`,
      provider: target.provider,
      model: target.model,
      tokensIn: 0,
      tokensOut: 0,
      latencyMs: 0,
    };
  }

  // ----------------------------------------------------------
  // z-ai-web-dev-sdk call
  // ----------------------------------------------------------

  /**
   * Lazily create and cache the ZAI SDK instance.
   * The SDK handles API key management internally.
   */
  private async getZAI(): Promise<ZAI> {
    if (this.zaiInstance) return this.zaiInstance;
    if (this.zaiInitPromise) return this.zaiInitPromise;

    this.zaiInitPromise = ZAI.create().then((zai) => {
      this.zaiInstance = zai;
      this.zaiInitPromise = null;
      return zai;
    });

    return this.zaiInitPromise;
  }

  private async callGroq(
    request: AiGatewayRequest,
    model: string
  ): Promise<AiGatewayResponse> {
    // Use longer timeout if the message count suggests complexity
    const timeoutMs =
      request.messages.length > 6 ? COMPLEX_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;

    // Convert messages: SDK uses 'assistant' role for system prompts
    const sdkMessages = request.messages.map((m) => ({
      role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant',
      content: m.content,
    }));

    // Pre-calculate estimated input token count (chars / 4)
    const totalInputChars = request.messages.reduce(
      (sum, m) => sum + m.content.length,
      0
    );
    const estimatedTokensIn = Math.ceil(totalInputChars / 4);

    const start = Date.now();

    // Timeout wrapper using Promise.race
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`SDK timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    try {
      console.log(
        `[AiGateway] → SDK ${model} | msgs=${request.messages.length} | ` +
          `agent=${request.agentId ?? '-'} | task=${request.taskId ?? '-'}`
      );

      const zai = await this.getZAI();

      const completion = await Promise.race([
        zai.chat.completions.create({
          model,
          messages: sdkMessages,
          thinking: { type: 'disabled' },
        }),
        timeoutPromise,
      ]);

      const content = completion.choices?.[0]?.message?.content ?? null;
      const estimatedTokensOut = content ? Math.ceil(content.length / 4) : 0;
      const latencyMs = Date.now() - start;

      console.log(
        `[AiGateway] ← SDK ${model} | ${latencyMs}ms | ` +
          `tokens≈${estimatedTokensIn}+${estimatedTokensOut} (estimated) | contentLen=${content?.length ?? 0}`
      );

      return {
        success: true,
        content,
        error: null,
        provider: 'groq',
        model,
        tokensIn: estimatedTokensIn,
        tokensOut: estimatedTokensOut,
        latencyMs,
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[AiGateway] SDK error: ${msg}`);

      // Map errors for circuit breaker / retry compatibility
      if (msg.includes('timeout')) {
        throw new Error(`Groq timeout after ${timeoutMs}ms`);
      }
      if (msg.includes('429') || msg.includes('rate limit')) {
        throw new Error(`Groq 429: ${msg}`);
      }
      throw err;
    }
  }

  // ----------------------------------------------------------
  // Utilities
  // ----------------------------------------------------------

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Monitoring snapshot */
  getSnapshot() {
    return {
      queueDepth: queue.length,
      rateLimiter: aiRateLimiter.snapshot(),
      circuitBreaker: groqCircuitBreaker.getSnapshot(),
    };
  }
}

/** Singleton AI gateway instance */
export const aiGateway = new AiGateway();
