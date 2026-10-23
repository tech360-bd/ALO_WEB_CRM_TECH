/**
 * ALO AI Gateway (§9).
 *
 * Every AI call in the workforce passes through here. Agents never talk to a
 * provider directly, so provider choice, safety, validation, fallback, budget
 * and telemetry stay under ALO control:
 *
 *   ALO agent -> ALO AI Gateway -> ALO model adapter -> self-hosted model
 *             -> ALO validation -> ALO tool execution -> ALO workflow -> ALO audit
 *
 * Guarantees:
 *  - Provider abstraction and ordered model selection (tier chain).
 *  - Hard timeout, bounded retry, ordered fallback, deterministic terminal runtime.
 *  - Output is schema-validated before it can reach business logic (§22).
 *  - Prompt-injection screening of untrusted context (§36).
 *  - Confidential payloads can never be routed to an external provider.
 *  - Telemetry recorded per attempt; secrets and raw prompts are never persisted.
 */
import { z } from 'zod';
import type { GatewayAttempt, GatewayRequest, GatewayResult } from './types';
import { zodFieldNames } from './zod-introspect';
import {
  detectRuntimes,
  executeOnRuntime,
  recordRuntimeOutcome,
  runtimeIsTripped,
  runtimeSupports,
  isCloudRuntime,
  syncRuntimes,
  type RuntimeDefinition,
} from './runtimes';
import { getOutputSchema } from './output-schemas';
import { runDeterministic, supportsTask } from './deterministic-engine';
import { screenForInjection, redactSecrets } from './security';
import { stableHash } from './text';

export class GatewayError extends Error {
  readonly category: string;
  readonly attempts: GatewayAttempt[];
  constructor(message: string, category: string, attempts: GatewayAttempt[]) {
    super(message);
    this.category = category;
    this.attempts = attempts;
  }
}

function describeSchema(schema: z.ZodTypeAny | undefined, key: string | undefined): string {
  if (!schema || !key) return 'a JSON object';
  // Keep the description short and stable; the authoritative contract is the Zod parse.
  const fields = zodFieldNames(schema);
  if (!fields.length) return `a JSON object for contract "${key}"`;
  return `{ ${fields.map((field) => `"${field}": …`).join(', ')} } (contract ${key})`;
}

function categorizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('SATURATED')) return 'CAPACITY';
  if (message.includes('UNCONFIGURED') || message.includes('ENDPOINT_INVALID')) return 'CONFIGURATION';
  if (message.includes('TimeoutError') || message.toLowerCase().includes('timeout') || message.includes('aborted')) return 'TIMEOUT';
  if (message.includes('AWF_RUNTIME_HTTP_4')) return 'PROVIDER_REJECTED';
  if (message.includes('AWF_RUNTIME_HTTP_5')) return 'PROVIDER_ERROR';
  if (message.includes('NON_JSON') || message.includes('EMPTY_RESPONSE')) return 'INVALID_OUTPUT';
  if (message.includes('SCHEMA_VALIDATION')) return 'SCHEMA_VALIDATION';
  if (message.includes('DETERMINISTIC_UNSUPPORTED')) return 'UNSUPPORTED_TASK';
  if (message.includes('fetch failed') || message.includes('ECONN')) return 'NETWORK';
  return 'UNKNOWN';
}

/** Order the routing chain for a request, honouring confidentiality and health. */
export async function planRoute(req: GatewayRequest, runtimes?: RuntimeDefinition[]): Promise<RuntimeDefinition[]> {
  const catalogue = (runtimes ?? detectRuntimes()).filter((runtime) => runtime.enabled);
  const usable: RuntimeDefinition[] = [];
  for (const runtime of catalogue) {
    const cloudRuntime = isCloudRuntime(runtime);
    if (cloudRuntime && process.env.PAID_AI_API_ALLOWED !== 'true') continue;
    if (req.confidential && cloudRuntime) continue;
    if (!runtimeSupports(runtime, req.task)) continue;
    if (await runtimeIsTripped(runtime.runtimeKey)) continue;
    usable.push(runtime);
  }
  // A preferred runtime is a hint, never an escape from the policy above.
  if (req.preferredRuntime) {
    const index = usable.findIndex((runtime) => runtime.runtimeKey === req.preferredRuntime);
    if (index > 0) usable.unshift(usable.splice(index, 1)[0]);
  }
  // The deterministic engine is appended as the terminal fallback whenever it
  // can serve the task and was filtered out above (e.g. tripped by a probe).
  if (!usable.some((runtime) => runtime.kind === 'DETERMINISTIC') && supportsTask(req.task)) {
    const deterministic = catalogue.find((runtime) => runtime.kind === 'DETERMINISTIC');
    if (deterministic) usable.push(deterministic);
  }
  return usable;
}

export interface GatewayOptions {
  /** Attempts per runtime before moving to the next one. */
  retriesPerRuntime?: number;
  runtimes?: RuntimeDefinition[];
  /** Verification hook: force a runtime to fail to prove fallback (§45 G). */
  failRuntimes?: string[];
}

/**
 * Execute an AI request. Always returns validated, schema-conformant data or
 * throws a categorised GatewayError — it never returns unvalidated model text.
 */
export async function aiGatewayExecute(req: GatewayRequest, options: GatewayOptions = {}): Promise<GatewayResult> {
  if (!req.task || !req.correlationId) throw new Error('AWF_GATEWAY_BAD_REQUEST: task and correlationId are required');
  const schema = req.outputSchemaKey ? getOutputSchema(req.outputSchemaKey) : undefined;
  if (req.outputSchemaKey && !schema) {
    throw new Error(`AWF_GATEWAY_UNKNOWN_CONTRACT: ${req.outputSchemaKey}`);
  }

  // Untrusted free text (lead notes, documents, inbound messages) is screened
  // before it can reach any runtime. Detected injections are neutralised, not
  // forwarded verbatim, and the finding is returned in telemetry.
  const screening = screenForInjection(req.context ?? {});
  const safeRequest: GatewayRequest = { ...req, context: screening.sanitized };

  const chain = await planRoute(safeRequest, options.runtimes);
  if (!chain.length) {
    throw new GatewayError('AWF_GATEWAY_NO_RUNTIME: no runtime can serve this task', 'NO_RUNTIME', []);
  }

  const schemaDescription = describeSchema(schema, req.outputSchemaKey);
  const attempts: GatewayAttempt[] = [];
  const retries = Math.max(1, Math.min(3, options.retriesPerRuntime ?? 1));
  const forcedFailures = new Set(options.failRuntimes ?? []);

  for (const runtime of chain) {
    for (let attempt = 0; attempt < retries; attempt += 1) {
      const started = Date.now();
      try {
        if (forcedFailures.has(runtime.runtimeKey)) {
          throw new Error('AWF_RUNTIME_FORCED_FAILURE');
        }
        const execution = await executeOnRuntime(runtime, safeRequest, schemaDescription);
        const validated = schema ? schema.safeParse(execution.data) : { success: true as const, data: execution.data };
        if (!validated.success) {
          throw new Error('AWF_SCHEMA_VALIDATION_FAILED');
        }
        attempts.push({
          runtimeKey: runtime.runtimeKey,
          provider: runtime.provider,
          model: runtime.model,
          ok: true,
          latencyMs: execution.latencyMs,
        });
        await recordRuntimeOutcome(runtime.runtimeKey, { ok: true, latencyMs: execution.latencyMs });
        return {
          data: validated.data as Record<string, unknown>,
          runtimeKey: runtime.runtimeKey,
          provider: runtime.provider,
          model: runtime.model,
          kind: runtime.kind,
          latencyMs: execution.latencyMs,
          fallbackUsed: attempts.length > 1,
          attempts,
          correlationId: req.correlationId,
          deterministic: runtime.kind === 'DETERMINISTIC',
        };
      } catch (error) {
        const latencyMs = Date.now() - started;
        const category = categorizeError(error);
        attempts.push({
          runtimeKey: runtime.runtimeKey,
          provider: runtime.provider,
          model: runtime.model,
          ok: false,
          latencyMs,
          error: redactSecrets(error instanceof Error ? error.message : 'unknown error'),
          errorCategory: category,
        });
        await recordRuntimeOutcome(runtime.runtimeKey, {
          ok: false,
          latencyMs,
          error: redactSecrets(error instanceof Error ? error.message : 'unknown error'),
        });
        // Configuration and unsupported-task errors are not retryable on the
        // same runtime; move straight to the next tier.
        if (category === 'CONFIGURATION' || category === 'UNSUPPORTED_TASK') break;
      }
    }
  }

  throw new GatewayError(
    'AWF_GATEWAY_EXHAUSTED: every permitted runtime failed',
    attempts[attempts.length - 1]?.errorCategory || 'UNKNOWN',
    attempts
  );
}

/** Ensure the runtime catalogue exists in the database before first use. */
export async function ensureGatewayReady(): Promise<void> {
  await syncRuntimes();
}

/**
 * Deterministic-only execution path used by validation, tests and the health
 * monitor. Bypasses no policy: it is the same ALO rule engine the gateway uses
 * as its terminal runtime.
 */
export function deterministicOnly(task: string, facts: Record<string, unknown>): Record<string, unknown> {
  return runDeterministic(task, facts);
}

export function requestFingerprint(req: GatewayRequest): string {
  return stableHash({ task: req.task, input: req.input, context: req.context });
}
