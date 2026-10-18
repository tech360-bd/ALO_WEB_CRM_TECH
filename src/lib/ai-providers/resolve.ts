/**
 * Free-provider resolution — turns a catalog entry plus environment variables
 * into something src/lib/ai.ts can call, and refuses anything it should not.
 *
 * This module is the enforcement point for three project rules that would
 * otherwise only exist as prose:
 *
 *   PAID_AI_API_ALLOWED=false          → only catalogued free tiers resolve
 *   OWNER_APPROVAL_REQUIRED_FOR_PAID_API → a paid slug is refused with a message
 *                                          that names the approval path
 *   never expose credentials           → keys are read here and returned only to
 *                                          the caller that makes the request;
 *                                          display goes through maskKey()
 */

import { FREE_PROVIDERS, getProviderDefinition, type FreeProviderDefinition, type ProviderProvenance } from './catalog';

export class ProviderConfigurationError extends Error {
  constructor(message: string, readonly slug: string) {
    super(message);
    this.name = 'ProviderConfigurationError';
  }
}

export interface ResolvedProvider {
  slug: string;
  name: string;
  /** Absolute base URL. The caller appends `/chat/completions` if absent. */
  baseUrl: string;
  /** The API key, or null for keyless providers. Never logged. */
  apiKey: string | null;
  model: string;
  provenance: ProviderProvenance;
  freeTier: FreeProviderDefinition['freeTier'];
  /** True when the base URL came from an operator override rather than the catalog. */
  baseUrlOverridden: boolean;
}

/** Slugs whose free tier is a one-time grant that will eventually exhaust. */
export function isOneTimeCredit(slug: string): boolean {
  return getProviderDefinition(slug)?.freeTier === 'one-time-credit';
}

/**
 * Unofficial proxies are recorded in the catalog but blocked unless the operator
 * explicitly opts in, because they typically breach the upstream provider's
 * terms and can disappear or log prompts without notice.
 */
function unofficialProxiesAllowed(): boolean {
  return process.env.ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS === 'true';
}

/**
 * A provider is "configured" when it has a key, or is keyless. This is what the
 * onboarding UI should show as connected.
 */
export function isProviderConfigured(definition: FreeProviderDefinition): boolean {
  if (definition.keyOptional) return true;
  return Boolean(process.env[definition.apiKeyEnv]?.trim());
}

/**
 * Validates and resolves a provider for use.
 *
 * Throws `ProviderConfigurationError` with an operator-actionable message rather
 * than returning a partially-configured object, because a silent fallback to a
 * different provider is exactly how a paid API gets used by accident.
 */
export function resolveFreeProvider(slug: string, modelHint?: string): ResolvedProvider {
  const definition = getProviderDefinition(slug);
  if (!definition) {
    throw new ProviderConfigurationError(
      `Unknown AI provider "${slug}". Add it to src/lib/ai-providers/catalog.ts with its free-tier details before use.`,
      slug,
    );
  }

  if (definition.provenance === 'unofficial-proxy' && !unofficialProxiesAllowed()) {
    throw new ProviderConfigurationError(
      `Provider "${slug}" is an unofficial third-party proxy and is blocked by default. ` +
        `It may breach the upstream provider's terms. Set ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS=true only after review.`,
      slug,
    );
  }

  const baseUrl = process.env[definition.baseUrlEnv]?.trim() || definition.baseUrl;
  if (!baseUrl) {
    throw new ProviderConfigurationError(
      `Provider "${slug}" has no default endpoint. Set ${definition.baseUrlEnv} to its OpenAI-compatible base URL.`,
      slug,
    );
  }

  const apiKey = process.env[definition.apiKeyEnv]?.trim() || null;
  if (!definition.keyOptional && !apiKey) {
    throw new ProviderConfigurationError(
      `Provider "${slug}" is not configured. Set ${definition.apiKeyEnv}. Its free tier: ${definition.freeTierNote}`,
      slug,
    );
  }

  assertSafeEndpoint(baseUrl, slug);

  const model = modelHint?.trim() || process.env[`${envPrefix(definition)}_MODEL`]?.trim() || definition.defaultModel;
  if (!model) {
    throw new ProviderConfigurationError(
      `Provider "${slug}" has no default model. Pass one explicitly or set ${envPrefix(definition)}_MODEL.`,
      slug,
    );
  }

  return {
    slug,
    name: definition.name,
    baseUrl,
    apiKey,
    model,
    provenance: definition.provenance,
    freeTier: definition.freeTier,
    baseUrlOverridden: Boolean(process.env[definition.baseUrlEnv]?.trim()),
  };
}

/**
 * The endpoint rules src/lib/ai.ts already applies to its four native providers,
 * restated here so catalogued providers are held to the same bar:
 *
 *  - https only, except loopback (a local Ollama/vLLM on the same host is http)
 *  - no credentials embedded in the URL — a key in a URL lands in access logs,
 *    proxy logs and error messages
 *  - no redirect-following surprises: a normal absolute http(s) URL only
 */
export function assertSafeEndpoint(rawUrl: string, slug: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new ProviderConfigurationError(`Provider "${slug}" has a malformed base URL.`, slug);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ProviderConfigurationError(`Provider "${slug}" must use http or https.`, slug);
  }
  if (url.username || url.password) {
    throw new ProviderConfigurationError(
      `Provider "${slug}" must not carry credentials in its URL; use ${getProviderDefinition(slug)?.apiKeyEnv} instead.`,
      slug,
    );
  }
  const isLoopback = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  if (url.protocol !== 'https:' && !isLoopback) {
    throw new ProviderConfigurationError(`Provider "${slug}" must use HTTPS (plain HTTP is allowed only on loopback).`, slug);
  }
  return url;
}

/**
 * Normalizes a base URL into the chat-completions endpoint, accepting a bare
 * host, a `/v1` base, or an already-complete endpoint. Mirrors the behaviour in
 * src/lib/ai.ts so both paths behave identically.
 */
export function toChatCompletionsUrl(baseUrl: string): string {
  const url = new URL(baseUrl);
  if (url.pathname.endsWith('/chat/completions')) return url.toString();
  const trimmed = url.pathname.replace(/\/$/, '');
  url.pathname = trimmed.endsWith('/v1') ? `${trimmed}/chat/completions` : `${trimmed}/v1/chat/completions`;
  return url.toString();
}

function envPrefix(definition: FreeProviderDefinition): string {
  return definition.baseUrlEnv.replace(/_BASE_URL$/, '');
}

/** Safe for logs, UI and API responses. Never returns the full key. */
export function maskKey(key: string | null | undefined): string {
  if (!key) return 'not set';
  if (key.length < 12) return '***';
  return `${key.slice(0, 6)}…${key.slice(-4)}`;
}

export interface ProviderStatus {
  slug: string;
  name: string;
  freeTier: FreeProviderDefinition['freeTier'];
  freeTierNote: string;
  provenance: ProviderProvenance;
  configured: boolean;
  apiKeyEnv: string;
  /** Masked, for display only. */
  apiKeyMasked: string;
  baseUrl: string | null;
  defaultModel: string | null;
  /** Why the provider cannot be used yet, or null when it is ready. */
  blocker: string | null;
  signupUrl?: string;
}

/**
 * The best catalogued provider to auto-route to when no native adapter is
 * configured. Selection rules, in order:
 *
 *  1. official provenance only — an unofficial proxy is never chosen implicitly,
 *     because doing so would route production traffic through a third party the
 *     owner never explicitly approved
 *  2. an explicit key is required — a keyless endpoint is never chosen implicitly
 *     either. It is free, but with no key there is no quota attribution, no way to
 *     audit usage, and no notice when the endpoint changes. Such a provider must
 *     be requested by name.
 *  3. a recurring free tier ranks above a one-time credit, which will exhaust
 *  4. must have a usable endpoint and a default model, so it cannot fail at call time
 *
 * Returns null when nothing usable is configured, which the caller turns into the
 * existing "No AI provider is configured" error.
 */
export function firstConfiguredFreeProvider(): { slug: string; defaultModel: string } | null {
  const rank = (tier: FreeProviderDefinition['freeTier']) => (tier === 'recurring' ? 0 : 1);
  const candidates = FREE_PROVIDERS.filter(
    (definition) =>
      definition.provenance === 'official' &&
      definition.freeTier !== 'keyless' &&
      isProviderConfigured(definition) &&
      Boolean(definition.defaultModel) &&
      Boolean(process.env[definition.baseUrlEnv]?.trim() || definition.baseUrl),
  ).sort((a, b) => rank(a.freeTier) - rank(b.freeTier));
  const winner = candidates[0];
  return winner?.defaultModel ? { slug: winner.slug, defaultModel: winner.defaultModel } : null;
}

/**
 * The full picture for an admin UI: every catalogued provider, whether it is
 * configured, and exactly what is missing. No secret values are included.
 */
export function listProviderStatus(): ProviderStatus[] {
  return FREE_PROVIDERS.map((definition) => {
    const configured = isProviderConfigured(definition);
    let blocker: string | null = null;
    if (!configured) blocker = `Set ${definition.apiKeyEnv}`;
    else if (definition.provenance === 'unofficial-proxy' && !unofficialProxiesAllowed()) {
      blocker = 'Unofficial proxy — blocked until ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS=true';
    } else if (!process.env[definition.baseUrlEnv]?.trim() && !definition.baseUrl) {
      blocker = `Set ${definition.baseUrlEnv}`;
    }
    return {
      slug: definition.slug,
      name: definition.name,
      freeTier: definition.freeTier,
      freeTierNote: definition.freeTierNote,
      provenance: definition.provenance,
      configured,
      apiKeyEnv: definition.apiKeyEnv,
      apiKeyMasked: maskKey(process.env[definition.apiKeyEnv]),
      baseUrl: process.env[definition.baseUrlEnv]?.trim() || definition.baseUrl,
      defaultModel: definition.defaultModel,
      blocker,
      signupUrl: definition.signupUrl,
    };
  });
}
