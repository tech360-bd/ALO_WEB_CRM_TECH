// ============================================================
// Unified Communication Center — Honest Status Engine
// src/lib/ucc/providers/status.ts
//
// Computes provider/account status ONLY from evidence. Implements the
// master mandate's cardinal rule (§83, §117):
//
//   CODE COMPLETE != CONFIGURED != OAUTH VERIFIED != WEBHOOK VERIFIED
//   != LIVE MESSAGE VERIFIED
//
// MODEL: a connection progresses through a linear chain of gates
//   configuration -> credentials -> provider approval -> oauth ->
//   webhook -> live message test.
// `computeIntegrationStatus` returns the FIRST unmet gate (the honest
// "what is blocking / what is next" label), or LIVE_TEST_VERIFIED only when
// EVERY gate is satisfied with real evidence. A *_VERIFIED overall status is
// therefore structurally unreachable without live evidence — there is no
// code path that returns it from configuration alone.
//
// Per-axis labels (OAUTH_VERIFIED, WEBHOOK_VERIFIED, ...) are computed by the
// dedicated axis functions for the readiness matrix (§82); they are never
// promoted to the overall headline on their own.
// ============================================================

import type {
  IntegrationStatus,
  ProviderCode,
  VerificationEvidence,
} from './types';
import { getProvider, isCapabilityImplemented } from './registry';

/**
 * The observable, non-secret facts about a connection that the status
 * engine is allowed to reason over. Secret material is never an input.
 */
export interface ConnectionFacts {
  provider: ProviderCode;
  /** Server-side env/config for this provider is present (client id, etc.). */
  configurationPresent: boolean;
  /** Encrypted credentials are stored for a connected account. */
  credentialsPresent: boolean;
  /** An OAuth authorization completed and a token was stored. */
  oauthCompleted: boolean;
  /** A webhook endpoint has been registered with the provider. */
  webhookConfigured: boolean;
  /** The provider gates production use behind app/business approval. */
  providerApprovalRequired: boolean;
  /** Provider approval has been granted. */
  providerApproved: boolean;
  /** True when the provider's official API cannot do what's being asked. */
  notSupported: boolean;
  /** Last known hard error class, if any. */
  hasError?: boolean;
}

/** Evidence bundle keyed by the interaction kind. */
export interface EvidenceBundle {
  oauth?: VerificationEvidence;
  webhook?: VerificationEvidence;
  apiRequest?: VerificationEvidence;
  liveMessage?: VerificationEvidence;
}

/** Does this provider's official API support webhooks at all? */
function providerSupportsWebhook(provider: ProviderCode): boolean {
  const def = getProvider(provider);
  return def.capabilities.some(
    (c) => c.capability === 'webhook' && c.provider !== 'NOT_SUPPORTED' && c.provider !== 'NO'
  );
}

/**
 * Per-axis OAuth status for the readiness matrix.
 * OAUTH_VERIFIED is returned ONLY when OAuth evidence exists.
 */
export function computeOAuthStatus(
  facts: ConnectionFacts,
  evidence: EvidenceBundle
): 'OAUTH_REQUIRED' | 'OAUTH_CONFIGURED' | 'OAUTH_VERIFIED' {
  if (!facts.oauthCompleted) return 'OAUTH_REQUIRED';
  return evidence.oauth ? 'OAUTH_VERIFIED' : 'OAUTH_CONFIGURED';
}

/**
 * Per-axis webhook status for the readiness matrix.
 * WEBHOOK_VERIFIED is returned ONLY when webhook evidence exists.
 */
export function computeWebhookStatus(
  facts: ConnectionFacts,
  evidence: EvidenceBundle
): 'NOT_SUPPORTED' | 'WEBHOOK_REQUIRED' | 'WEBHOOK_CONFIGURED' | 'WEBHOOK_VERIFIED' {
  if (!providerSupportsWebhook(facts.provider)) return 'NOT_SUPPORTED';
  if (!facts.webhookConfigured) return 'WEBHOOK_REQUIRED';
  return evidence.webhook ? 'WEBHOOK_VERIFIED' : 'WEBHOOK_CONFIGURED';
}

/**
 * Per-axis live-test status. LIVE_TEST_VERIFIED requires live-message evidence.
 */
export function computeLiveTestStatus(
  evidence: EvidenceBundle
): 'LIVE_TEST_PENDING' | 'LIVE_TEST_VERIFIED' {
  return evidence.liveMessage ? 'LIVE_TEST_VERIFIED' : 'LIVE_TEST_PENDING';
}

/**
 * Compute the single overall status for a connection from facts + evidence.
 * This is the ONLY sanctioned way to derive an overall status. It walks the
 * gate chain and returns the first unmet gate; only a fully-evidenced chain
 * yields LIVE_TEST_VERIFIED.
 */
export function computeIntegrationStatus(
  facts: ConnectionFacts,
  evidence: EvidenceBundle = {}
): IntegrationStatus {
  // Gate 0 — hard failure / unsupported override everything.
  if (facts.hasError) return 'ERROR';
  if (facts.notSupported) return 'NOT_SUPPORTED';

  // Gate 1 — provider approval gate.
  if (facts.providerApprovalRequired && !facts.providerApproved) {
    return 'PROVIDER_APPROVAL_REQUIRED';
  }

  // Gate 2 — server-side configuration.
  if (!facts.configurationPresent) return 'CONFIGURATION_REQUIRED';

  // Gate 3 — encrypted credentials for a connected account.
  if (!facts.credentialsPresent) return 'CREDENTIALS_REQUIRED';

  // Gate 4 — OAuth.
  if (!facts.oauthCompleted) return 'OAUTH_REQUIRED';
  if (!evidence.oauth) return 'OAUTH_CONFIGURED';

  // Gate 5 — Webhook (only for providers whose official API supports it).
  if (providerSupportsWebhook(facts.provider)) {
    if (!facts.webhookConfigured) return 'WEBHOOK_REQUIRED';
    if (!evidence.webhook) return 'WEBHOOK_CONFIGURED';
  }

  // Gate 6 — live message test. The final, highest bar.
  return evidence.liveMessage ? 'LIVE_TEST_VERIFIED' : 'LIVE_TEST_PENDING';
}

/**
 * Precedence rank for sorting/comparison. Lower = more blocking. Used by
 * reporting to order providers by how far from live they are.
 */
const STATUS_RANK: Record<IntegrationStatus, number> = {
  ERROR: 0,
  BLOCKED: 1,
  NOT_SUPPORTED: 2,
  PROVIDER_APPROVAL_REQUIRED: 3,
  PROVIDER_APPROVAL_PENDING: 4,
  CONFIGURATION_REQUIRED: 5,
  CREDENTIALS_REQUIRED: 6,
  OAUTH_REQUIRED: 7,
  OAUTH_CONFIGURED: 8,
  WEBHOOK_REQUIRED: 9,
  WEBHOOK_CONFIGURED: 10,
  NOT_STARTED: 11,
  CODE_COMPLETE: 12,
  PROVIDER_APPROVED: 13,
  OAUTH_VERIFIED: 14,
  WEBHOOK_VERIFIED: 15,
  IMPLEMENTED_BUT_UNVERIFIED: 16,
  PARTIALLY_SUPPORTED: 17,
  LIVE_TEST_PENDING: 18,
  LIVE_TEST_VERIFIED: 19,
};

export function statusRank(status: IntegrationStatus): number {
  return STATUS_RANK[status];
}

/**
 * The colour a UI badge may render (§47): GREEN only for genuinely verified
 * states, never for "code exists" or "configured".
 */
export function statusColour(
  status: IntegrationStatus
): 'GREEN' | 'YELLOW' | 'RED' | 'GRAY' {
  switch (status) {
    case 'LIVE_TEST_VERIFIED':
    case 'OAUTH_VERIFIED':
    case 'WEBHOOK_VERIFIED':
      return 'GREEN';
    case 'ERROR':
    case 'BLOCKED':
      return 'RED';
    case 'NOT_STARTED':
      return 'GRAY';
    default:
      return 'YELLOW';
  }
}

/**
 * Whether a headline status may be shown as a green "connected" badge.
 * Guards §8 / §47: never green without real verification.
 */
export function mayShowAsConnected(status: IntegrationStatus): boolean {
  return (
    status === 'LIVE_TEST_VERIFIED' ||
    status === 'OAUTH_VERIFIED' ||
    status === 'WEBHOOK_VERIFIED'
  );
}

/**
 * Per-capability implementation summary for the readiness screen (§82) and
 * capability matrix (§53). Reports CODE STATE only — never live verification.
 */
export function providerImplementationSummary(code: ProviderCode) {
  const def = getProvider(code);
  const implemented = def.capabilities.filter(
    (c) => c.implementation === 'IMPLEMENTED' || c.implementation === 'PARTIAL'
  );
  const anyImplemented = implemented.length > 0;
  return {
    code,
    name: def.name,
    // The most a code-only summary can ever honestly claim:
    headline: (anyImplemented ? 'CODE_COMPLETE' : 'NOT_STARTED') as IntegrationStatus,
    implementedCount: implemented.length,
    totalCapabilities: def.capabilities.length,
    approvalRequired: def.approvalRequired,
  };
}

/** Re-exported so the status layer and callers share one definition. */
export { isCapabilityImplemented };
