/**
 * Server-side client for the shared AI gateway.
 *
 * The gateway is opt-in per deployment. When it is not configured, the module's
 * existing provider path continues to work exactly as before — this file does
 * not remove or replace it. When it *is* configured the request goes to the
 * gateway only: a failure is surfaced to the caller and never silently re-sent
 * to a different provider, because that would bypass the gateway's data policy.
 */

export interface GatewayChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type GatewayRoute =
  | 'policy_default'
  | 'local_only'
  | 'external_approved'
  | 'quality'
  | 'cost_controlled'
  | 'manual_review';

export interface GatewayChatRequest {
  messages: GatewayChatMessage[];
  maxTokens?: number;
  temperature?: number;
  route?: GatewayRoute;
  dataClassification?: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
  model?: string;
  /** Pseudonymous per-user key for gateway rate limiting; never an email. */
  userKey?: string;
}

export interface GatewayChatResult {
  text: string;
  provider: string;
  model: string;
  requestId: string;
  policyDecision: string;
  fallbackUsed: boolean;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number };
}

export class GatewayNotConfiguredError extends Error {
  constructor() {
    super('The shared AI gateway is not configured for this deployment.');
    this.name = 'GatewayNotConfiguredError';
  }
}

export class GatewayRequestError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'GatewayRequestError';
    this.status = status;
    this.code = code;
  }
}

function baseUrl(): string | null {
  const value = (process.env.AI_GATEWAY_BASE_URL ?? process.env.AI_GATEWAY_URL ?? '').trim();
  if (!value) return null;
  return value.replace(/\/$/, '');
}

/** True when the deployment has enabled and configured the gateway for the PhD module. */
export function isGatewayEnabled(): boolean {
  const flag = (process.env.PHD_AI_GATEWAY_ENABLED ?? '').toLowerCase();
  if (flag !== 'true' && flag !== '1') return false;
  return Boolean(baseUrl() && (process.env.PHD_AI_GATEWAY_TOKEN ?? '').trim());
}

function defaultModel(): string {
  const configured =
    process.env.PHD_AI_GATEWAY_MODEL ||
    process.env.LOCAL_MODEL_NAME ||
    process.env.AI_SMART_MODEL ||
    process.env.AI_DEFAULT_MODEL ||
    '';
  return configured.trim() || 'local-model';
}

export async function gatewayChat(request: GatewayChatRequest): Promise<GatewayChatResult> {
  const url = baseUrl();
  const token = (process.env.PHD_AI_GATEWAY_TOKEN ?? '').trim();
  if (!url || !token) throw new GatewayNotConfiguredError();

  const timeoutMs = Number.parseInt(process.env.PHD_AI_GATEWAY_TIMEOUT_MS ?? '', 10);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 120_000);

  try {
    const response = await fetch(`${url}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        model: request.model ?? defaultModel(),
        messages: request.messages,
        max_tokens: request.maxTokens ?? 1200,
        temperature: request.temperature ?? 0.2,
        route: request.route ?? 'policy_default',
        // Confidential by default: the PhD workspace handles applicant documents.
        data_classification: request.dataClassification ?? 'CONFIDENTIAL',
        ...(request.userKey ? { user: request.userKey } : {}),
      }),
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => ({}))) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      gateway?: { provider?: string; policyDecision?: string; fallbackUsed?: boolean; requestId?: string };
      model?: string;
      error?: { code?: string; message?: string };
    };

    if (!response.ok) {
      throw new GatewayRequestError(
        response.status,
        payload.error?.code ?? 'GATEWAY_ERROR',
        payload.error?.message ?? `The AI gateway returned HTTP ${response.status}.`,
      );
    }

    const text = payload.choices?.[0]?.message?.content;
    if (typeof text !== 'string' || !text.length) {
      throw new GatewayRequestError(response.status, 'GATEWAY_CONTRACT', 'The AI gateway response contained no text.');
    }

    return {
      text,
      provider: payload.gateway?.provider ?? 'gateway',
      model: payload.model ?? request.model ?? defaultModel(),
      requestId: payload.gateway?.requestId ?? '',
      policyDecision: payload.gateway?.policyDecision ?? 'unknown',
      fallbackUsed: Boolean(payload.gateway?.fallbackUsed),
      usage: {
        promptTokens: payload.usage?.prompt_tokens ?? 0,
        completionTokens: payload.usage?.completion_tokens ?? 0,
        totalTokens: payload.usage?.total_tokens ?? 0,
      },
    };
  } catch (error) {
    if (error instanceof GatewayRequestError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GatewayRequestError(504, 'GATEWAY_TIMEOUT', 'The AI gateway did not respond in time. No data was saved.');
    }
    throw new GatewayRequestError(502, 'GATEWAY_UNAVAILABLE', 'The AI gateway could not be reached. No data was saved.');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A short, non-sensitive description for health/diagnostics screens.
 * Never includes the token, the base URL or any applicant data.
 */
export function gatewayStatus(): { enabled: boolean; model: string } {
  return { enabled: isGatewayEnabled(), model: isGatewayEnabled() ? defaultModel() : '' };
}
