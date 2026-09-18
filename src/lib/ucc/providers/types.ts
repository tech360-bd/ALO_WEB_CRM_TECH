// ============================================================
// Unified Communication Center — Canonical Provider Architecture
// src/lib/ucc/providers/types.ts
//
// Single source of truth for the provider-adapter contract, the
// capability vocabulary, and the HONEST status vocabulary required by
// the master mandate (§6, §9, §53, §109).
//
// Design rules enforced here:
//  - SOFTWARE IMPLEMENTATION != PROVIDER CONFIGURATION != LIVE VERIFICATION.
//    These are three independent axes and are never collapsed into one
//    field (mandate §117).
//  - A capability an official API does not offer is NOT_SUPPORTED, never
//    silently "NO IMPLEMENTATION" (mandate §5, §53).
//  - Nothing in this module may hold a secret. Tokens live only in the
//    encrypted ConnectedAccount columns via src/lib/token-encryption.ts.
// ============================================================

/**
 * Provider codes. Keep aligned with docs/integrations/PROVIDER-MATRIX.md.
 * `meta` is the umbrella OAuth app that fronts facebook / instagram /
 * whatsapp / messenger; the leaf codes are the addressable channels.
 */
export type ProviderCode =
  | 'email'
  | 'whatsapp'
  | 'facebook'
  | 'messenger'
  | 'instagram'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'google_business'
  | 'telegram'
  | 'x';

/**
 * A discrete capability a provider may or may not offer through its
 * OFFICIAL API. The capability registry declares the provider's stance;
 * the adapter declares whether WE have implemented it.
 */
export type Capability =
  | 'oauth'
  | 'token_refresh'
  | 'webhook'
  | 'signature_validation'
  | 'receive_messages'
  | 'send_messages'
  | 'attachments'
  | 'conversation'
  | 'comments'
  | 'account_management'
  | 'revocation'
  | 'publishing'
  | 'advertising'
  | 'analytics'
  | 'live_test';

/**
 * The provider's own stance on a capability, independent of our code.
 * NOT_SUPPORTED means the official API does not offer it — this must
 * never be rewritten to imply a missing implementation (mandate §53).
 */
export type ProviderSupport = 'YES' | 'NO' | 'PARTIAL' | 'NOT_SUPPORTED';

/**
 * Implementation status of a capability in OUR codebase.
 * Distinct from ProviderSupport: a capability can be NOT_SUPPORTED by the
 * provider while our adapter is correctly IMPLEMENTED (it declines the call).
 */
export type ImplementationStatus =
  | 'IMPLEMENTED'
  | 'PARTIAL'
  | 'NOT_IMPLEMENTED'
  | 'NOT_APPLICABLE';

/**
 * The honest, evidence-driven status vocabulary (mandate §6, §109).
 * These are the ONLY labels the UI/reporting layer may surface.
 *
 * Ordering matters: `statusRank` below encodes the precedence used when
 * computing a single overall status from many signals.
 */
export type IntegrationStatus =
  | 'NOT_STARTED'
  | 'CODE_COMPLETE'
  | 'CONFIGURATION_REQUIRED'
  | 'CREDENTIALS_REQUIRED'
  | 'OAUTH_REQUIRED'
  | 'OAUTH_CONFIGURED'
  | 'OAUTH_VERIFIED'
  | 'WEBHOOK_REQUIRED'
  | 'WEBHOOK_CONFIGURED'
  | 'WEBHOOK_VERIFIED'
  | 'PROVIDER_APPROVAL_REQUIRED'
  | 'PROVIDER_APPROVAL_PENDING'
  | 'PROVIDER_APPROVED'
  | 'LIVE_TEST_PENDING'
  | 'LIVE_TEST_VERIFIED'
  | 'PARTIALLY_SUPPORTED'
  | 'NOT_SUPPORTED'
  | 'IMPLEMENTED_BUT_UNVERIFIED'
  | 'BLOCKED'
  | 'ERROR';

/** Forbidden labels — the UI must never show these without real evidence. */
export const FORBIDDEN_STATUS_LABELS = ['CONNECTED', 'LIVE', 'ACTIVE'] as const;

/**
 * Evidence that a status claim is backed by a real provider interaction.
 * A status of *_VERIFIED is only legitimate when the matching evidence
 * record exists (mandate §84, §91).
 */
export interface VerificationEvidence {
  /** ISO timestamp of the verified interaction. */
  verifiedAt: string;
  /** What was actually exercised. */
  kind: 'oauth' | 'webhook' | 'api_request' | 'live_message' | 'account';
  /** Connected-account or asset id the evidence belongs to. */
  accountId?: string;
  /** Provider-side identifier (webhook event id, message id). Never a secret. */
  providerRef?: string;
  /** HTTP status of the provider response, where applicable. */
  httpStatus?: number;
  /** Employee who ran the verification. */
  testerEmployeeId?: string;
  /** SANDBOX or PRODUCTION — never blur the two (mandate §68). */
  environment: 'SANDBOX' | 'PRODUCTION';
}

/** Per-capability declaration combining provider stance + our implementation. */
export interface CapabilityDeclaration {
  capability: Capability;
  /** The official API's stance. */
  provider: ProviderSupport;
  /** Our codebase's stance. */
  implementation: ImplementationStatus;
  /** Free-text note; required when provider=NOT_SUPPORTED to explain (§53). */
  note?: string;
}

/** The full, static, data-driven description of one provider. */
export interface ProviderDefinition {
  code: ProviderCode;
  name: string;
  /** Human-facing category. */
  category: 'messaging' | 'social' | 'video' | 'local' | 'email' | 'professional';
  /** Current official API version string, e.g. Meta Graph `v21.0`. */
  apiVersion: string;
  /** Official developer portal URL. */
  portalUrl: string;
  /** Whether the provider gates production use behind app/business review. */
  approvalRequired: boolean;
  /** Short description of the approval gate, if any. */
  approvalNote?: string;
  capabilities: CapabilityDeclaration[];
}

/**
 * The runtime connection record's PUBLIC projection. Secret material is
 * never included — only masked/derived fields (mandate §11).
 */
export interface ConnectedAccountView {
  id: string;
  provider: ProviderCode;
  accountName: string;
  /** Provider-side account/asset id (page id, phone number id, channel id). */
  externalAccountId?: string;
  accountType?: string;
  ownerEmployeeId?: string;
  department?: string;
  /** Granted scopes — safe to show. */
  scopes: string[];
  tokenStatus: 'ABSENT' | 'PRESENT' | 'EXPIRING_SOON' | 'EXPIRED' | 'REVOKED';
  /** Masked, e.g. `••••••••1234`. Never the token. */
  tokenMasked?: string;
  tokenExpiresAt?: string | null;
  webhookStatus: 'UNCONFIGURED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'ERROR';
  providerApprovalStatus: 'NOT_REQUIRED' | 'REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
  lastSuccessfulApiRequestAt?: string | null;
  lastWebhookEventAt?: string | null;
  errorCount: number;
  lastError?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Direction of a normalized message (mandate §15). */
export type MessageDirection = 'INBOUND' | 'OUTBOUND' | 'INTERNAL';

/** Message types; INTERNAL_NOTE must never leave the system (mandate §21). */
export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'VIDEO'
  | 'AUDIO'
  | 'VOICE'
  | 'DOCUMENT'
  | 'LOCATION'
  | 'CONTACT'
  | 'TEMPLATE'
  | 'INTERNAL_NOTE';

/** Delivery lifecycle for an outbound message. */
export type DeliveryStatus =
  | 'QUEUED'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED'
  | 'NOT_APPLICABLE';

/** Provider-agnostic normalized message (mandate §15). */
export interface NormalizedMessage {
  provider: ProviderCode;
  connectedAccountId: string;
  externalMessageId: string;
  externalConversationId?: string;
  externalContactId?: string;
  direction: MessageDirection;
  type: MessageType;
  text?: string;
  attachmentUrls?: string[];
  replyToExternalId?: string;
  timestamp: string;
  deliveryStatus: DeliveryStatus;
  providerMetadata?: Record<string, unknown>;
}

/** Provider-agnostic normalized contact (mandate §17). */
export interface NormalizedContact {
  provider: ProviderCode;
  externalContactId: string;
  displayName?: string;
  /** Only populate fields the provider actually returns. */
  email?: string;
  phone?: string;
  avatarUrl?: string;
  providerMetadata?: Record<string, unknown>;
}

/** Result of an adapter call that can fail in a classified way (mandate §38). */
export type ProviderErrorClass =
  | 'AUTHENTICATION'
  | 'AUTHORIZATION'
  | 'RATE_LIMIT'
  | 'VALIDATION'
  | 'WEBHOOK'
  | 'NETWORK'
  | 'PROVIDER_OUTAGE'
  | 'UNSUPPORTED_FEATURE'
  | 'CONFIGURATION'
  | 'INTERNAL';

export interface ProviderResult<T> {
  ok: boolean;
  data?: T;
  error?: {
    class: ProviderErrorClass;
    code?: string;
    message: string;
    /** True when a retry is safe (429 / timeout / transient 5xx). */
    retryable: boolean;
  };
}

/**
 * The common provider interface (mandate §9). Every adapter implements only
 * the capabilities its provider officially supports; unsupported operations
 * must return a UNSUPPORTED_FEATURE result rather than throwing or faking.
 */
export interface ProviderAdapter {
  readonly code: ProviderCode;
  readonly definition: ProviderDefinition;

  // --- OAuth lifecycle -------------------------------------------------
  getAuthorizationUrl(state: { redirectUri: string; scopes: string[]; csrf: string }): ProviderResult<{ url: string }>;
  handleOAuthCallback(params: { code: string; state: string }): Promise<ProviderResult<{ accessTokenEnc: string; refreshTokenEnc?: string; expiresAt?: string; externalAccountId?: string }>>;
  refreshToken(refreshTokenEnc: string): Promise<ProviderResult<{ accessTokenEnc: string; refreshTokenEnc?: string; expiresAt?: string }>>;
  revokeToken(tokenEnc: string): Promise<ProviderResult<{ revoked: boolean }>>;

  // --- Connection ------------------------------------------------------
  validateConnection(accessTokenEnc: string): Promise<ProviderResult<{ valid: boolean; externalAccountId?: string; accountName?: string }>>;
  getAccount(accessTokenEnc: string): Promise<ProviderResult<NormalizedContact>>;

  // --- Messaging -------------------------------------------------------
  getConversations(accessTokenEnc: string, cursor?: string): Promise<ProviderResult<{ items: NormalizedMessage[]; nextCursor?: string }>>;
  getMessages(accessTokenEnc: string, conversationId: string, cursor?: string): Promise<ProviderResult<{ items: NormalizedMessage[]; nextCursor?: string }>>;
  sendMessage(accessTokenEnc: string, to: string, message: NormalizedMessage): Promise<ProviderResult<{ externalMessageId: string; deliveryStatus: DeliveryStatus }>>;
  sendAttachment(accessTokenEnc: string, to: string, attachment: { mimeType: string; urlOrBuffer: string }): Promise<ProviderResult<{ externalMessageId: string }>>;

  // --- Webhooks --------------------------------------------------------
  verifyWebhook(request: WebhookRequest): ProviderResult<{ verified: boolean; challenge?: string }>;
  receiveWebhook(request: WebhookRequest): Promise<ProviderResult<{ messages: NormalizedMessage[]; contacts: NormalizedContact[]; eventIds: string[] }>>;

  // --- Normalization ---------------------------------------------------
  normalizeMessage(raw: unknown): NormalizedMessage | null;
  normalizeContact(raw: unknown): NormalizedContact | null;

  // --- Operational -----------------------------------------------------
  getRateLimit(accessTokenEnc: string): Promise<ProviderResult<{ remaining?: number; resetAt?: string }>>;
  handleProviderError(err: unknown): ProviderResult<never>['error'];
}

/** Minimal, framework-agnostic view of an inbound webhook request. */
export interface WebhookRequest {
  method: 'GET' | 'POST';
  url: string;
  headers: Record<string, string>;
  /** Raw body — signature checks MUST use the raw bytes, not parsed JSON. */
  rawBody: string;
  query: Record<string, string>;
}
