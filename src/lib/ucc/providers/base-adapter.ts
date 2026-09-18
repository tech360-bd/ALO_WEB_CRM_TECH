// ============================================================
// Unified Communication Center — Base Provider Adapter
// src/lib/ucc/providers/base-adapter.ts
//
// Reusable abstract base implementing the ProviderAdapter contract with
// SAFE DEFAULTS: any capability the provider does NOT officially support
// returns a classified UNSUPPORTED_FEATURE result instead of throwing or
// faking a response (mandate §9, §53). Concrete adapters override only the
// operations their provider genuinely offers.
//
// This is the anti-"fake adapter" guard: there is no code path here that
// invents a provider response.
// ============================================================

import type {
  Capability,
  NormalizedContact,
  NormalizedMessage,
  ProviderAdapter,
  ProviderCode,
  ProviderDefinition,
  ProviderResult,
  ProviderErrorClass,
  DeliveryStatus,
  WebhookRequest,
} from './types';
import { isCapabilitySupportedByProvider } from './registry';

/** Build a classified, non-retryable UNSUPPORTED_FEATURE result. */
export function unsupported<T>(provider: ProviderCode, capability: string): ProviderResult<T> {
  return {
    ok: false,
    error: {
      class: 'UNSUPPORTED_FEATURE',
      message: `${provider}: '${capability}' is NOT SUPPORTED BY OFFICIAL API`,
      retryable: false,
    },
  };
}

/** Build a "supported by the provider, but not implemented in code yet" result. */
export function notImplemented<T>(provider: ProviderCode, operation: string): ProviderResult<T> {
  return {
    ok: false,
    error: {
      class: 'CONFIGURATION',
      message: `${provider}: '${operation}' is supported by the official API but not yet implemented in code`,
      retryable: false,
    },
  };
}

/** Build a classified error result of an arbitrary class. */
export function fail<T>(
  cls: ProviderErrorClass,
  message: string,
  retryable = false,
  code?: string
): ProviderResult<T> {
  return { ok: false, error: { class: cls, message, retryable, code } };
}

export function ok<T>(data: T): ProviderResult<T> {
  return { ok: true, data };
}

/**
 * Abstract base. Subclasses set `code` and `definition`; the registry is the
 * source of truth for what the provider supports, and `guardOrPending()`
 * consults it before any operation proceeds:
 *   - capability NOT supported by the official API -> UNSUPPORTED_FEATURE
 *   - capability supported but not overridden      -> notImplemented (CONFIGURATION)
 * A subclass override replaces the default entirely, so a real implementation
 * is the only way an operation can ever succeed.
 */
export abstract class BaseProviderAdapter implements ProviderAdapter {
  abstract readonly code: ProviderCode;
  abstract readonly definition: ProviderDefinition;

  /**
   * Gate an operation on the capability the provider officially supports.
   * Returns a blocking ProviderResult when the operation must not proceed,
   * or null when a subclass implementation should run.
   */
  protected gate<T>(capability: Capability, operation: string): ProviderResult<T> | null {
    if (!isCapabilitySupportedByProvider(this.code, capability)) {
      return unsupported<T>(this.code, operation);
    }
    return null;
  }

  /** Default result for a supported-but-unimplemented operation. */
  protected pending<T>(capability: Capability, operation: string): ProviderResult<T> {
    return this.gate<T>(capability, operation) ?? notImplemented<T>(this.code, operation);
  }

  // --- Default-deny implementations ------------------------------------
  // Each returns a blocking result unless a subclass overrides it. This
  // means a half-built adapter can never fabricate a success.

  getAuthorizationUrl(): ProviderResult<{ url: string }> {
    return this.pending('oauth', 'getAuthorizationUrl');
  }

  async handleOAuthCallback(): Promise<ProviderResult<{ accessTokenEnc: string }>> {
    return this.pending('oauth', 'handleOAuthCallback');
  }

  async refreshToken(): Promise<ProviderResult<{ accessTokenEnc: string }>> {
    return this.pending('token_refresh', 'refreshToken');
  }

  async revokeToken(): Promise<ProviderResult<{ revoked: boolean }>> {
    return this.pending('revocation', 'revokeToken');
  }

  async validateConnection(): Promise<ProviderResult<{ valid: boolean }>> {
    return notImplemented(this.code, 'validateConnection');
  }

  async getAccount(): Promise<ProviderResult<NormalizedContact>> {
    return this.pending('account_management', 'getAccount');
  }

  async getConversations(): Promise<ProviderResult<{ items: NormalizedMessage[] }>> {
    return this.pending('conversation', 'getConversations');
  }

  async getMessages(): Promise<ProviderResult<{ items: NormalizedMessage[] }>> {
    return this.pending('conversation', 'getMessages');
  }

  async sendMessage(): Promise<ProviderResult<{ externalMessageId: string; deliveryStatus: DeliveryStatus }>> {
    return this.pending('send_messages', 'sendMessage');
  }

  async sendAttachment(): Promise<ProviderResult<{ externalMessageId: string }>> {
    return this.pending('attachments', 'sendAttachment');
  }

  verifyWebhook(_req: WebhookRequest): ProviderResult<{ verified: boolean; challenge?: string }> {
    return this.pending('webhook', 'verifyWebhook');
  }

  async receiveWebhook(): Promise<ProviderResult<{ messages: NormalizedMessage[]; contacts: NormalizedContact[]; eventIds: string[] }>> {
    return this.pending('webhook', 'receiveWebhook');
  }

  normalizeMessage(_raw: unknown): NormalizedMessage | null {
    return null;
  }

  normalizeContact(_raw: unknown): NormalizedContact | null {
    return null;
  }

  async getRateLimit(): Promise<ProviderResult<{ remaining?: number; resetAt?: string }>> {
    return notImplemented(this.code, 'getRateLimit');
  }

  /**
   * Classify an unknown thrown error into a ProviderErrorClass. Subclasses
   * may refine with provider-specific codes.
   */
  handleProviderError(err: unknown): ProviderResult<never>['error'] {
    const e = err as { status?: number; code?: string; message?: string };
    const status = e?.status;
    let cls: ProviderErrorClass = 'INTERNAL';
    if (status === 401) cls = 'AUTHENTICATION';
    else if (status === 403) cls = 'AUTHORIZATION';
    else if (status === 429) cls = 'RATE_LIMIT';
    else if (status && status >= 500) cls = 'PROVIDER_OUTAGE';
    else if (status && status >= 400) cls = 'VALIDATION';
    const retryable = cls === 'RATE_LIMIT' || cls === 'PROVIDER_OUTAGE' || cls === 'NETWORK';
    return { class: cls, message: e?.message ?? 'unknown provider error', retryable, code: e?.code };
  }
}
