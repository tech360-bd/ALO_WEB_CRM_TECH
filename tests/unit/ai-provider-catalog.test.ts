/**
 * Free-tier AI provider catalog — contract and enforcement tests.
 *
 * These tests exist because the catalog is the thing standing between the
 * production system and an accidental paid API call, an HTTP downgrade, or a key
 * leaking into a log. They assert the rules, not the provider list's length.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  EXCLUDED_PROVIDERS,
  FREE_PROVIDERS,
  FREE_PROVIDER_SLUGS,
  getProviderDefinition,
  isFreeProviderSlug,
} from '@/lib/ai-providers/catalog';
import {
  ProviderConfigurationError,
  assertSafeEndpoint,
  firstConfiguredFreeProvider,
  isProviderConfigured,
  listProviderStatus,
  maskKey,
  resolveFreeProvider,
  toChatCompletionsUrl,
} from '@/lib/ai-providers/resolve';

/** Every env var this suite touches, so teardown cannot leak into other files. */
const TOUCHED_ENV = [
  // Catalog keys
  'GEMINI_API_KEY',
  'CEREBRAS_API_KEY',
  'MISTRAL_API_KEY',
  'DEEPSEEK_API_KEY',
  'POLLINATIONS_API_KEY',
  'G4F_GROQ_API_KEY',
  // Native adapters, so routeModel cannot pick one behind the catalog's back
  'GROQ_API_KEY',
  'OPENROUTER_API_KEY',
  'ZAI_API_KEY',
  'LOCAL_AI_URL',
  'LOCAL_AI_MODEL',
  // Overrides and policy switches
  'ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS',
  'ALO_AI_MISTRAL_BASE_URL',
  'ALO_AI_MISTRAL_MODEL',
  'ALO_AI_G4F_GROQ_BASE_URL',
  'ALO_AI_G4F_GROQ_MODEL',
];

const saved: Record<string, string | undefined> = {};
for (const key of TOUCHED_ENV) saved[key] = process.env[key];
for (const key of TOUCHED_ENV) delete process.env[key];

afterEach(() => {
  for (const key of TOUCHED_ENV) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe('catalog integrity', () => {
  it('has a definition for every declared slug (no drift between tuple and table)', () => {
    for (const slug of FREE_PROVIDER_SLUGS) {
      expect(getProviderDefinition(slug), `missing definition for ${slug}`).toBeDefined();
    }
  });

  it('declares no slug twice', () => {
    const slugs = FREE_PROVIDERS.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('is the single source of truth — no definition exists outside the tuple', () => {
    for (const definition of FREE_PROVIDERS) {
      expect(FREE_PROVIDER_SLUGS).toContain(definition.slug);
    }
  });

  it('recognises catalogued slugs and rejects unknown ones', () => {
    expect(isFreeProviderSlug('gemini')).toBe(true);
    expect(isFreeProviderSlug('not-a-provider')).toBe(false);
  });

  it('uses lowercase kebab-case slugs, matching the repo convention', () => {
    for (const slug of FREE_PROVIDER_SLUGS) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

describe('no secrets in source (PAID_AI_API_ALLOWED=false is about more than the flag)', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/lib/ai-providers/catalog.ts'), 'utf8');

  it('never stores a key value — only the env var name that holds one', () => {
    for (const definition of FREE_PROVIDERS) {
      expect(Object.keys(definition)).not.toContain('apiKey');
      expect(definition.apiKeyEnv, `${definition.slug} must name an env var`).toMatch(/^[A-Z0-9_]+$/);
    }
  });

  it('contains no key-shaped literal', () => {
    // Shapes used by the providers in this catalog: sk-*, gsk_*, hf_*, nvidia nvapi-*,
    // ghp_*/github_pat_*, and generic 32+ char base62 tokens.
    expect(source).not.toMatch(/\bsk-[A-Za-z0-9_-]{16,}/);
    expect(source).not.toMatch(/\bgsk_[A-Za-z0-9]{16,}/);
    expect(source).not.toMatch(/\bhf_[A-Za-z0-9]{16,}/);
    expect(source).not.toMatch(/\bnvapi-[A-Za-z0-9_-]{16,}/);
    expect(source).not.toMatch(/\bghp_[A-Za-z0-9]{16,}/);
    expect(source).not.toMatch(/\bgithub_pat_[A-Za-z0-9_]{16,}/);
  });

  it('declares HTTPS or no default endpoint — never plain HTTP to the internet', () => {
    for (const definition of FREE_PROVIDERS) {
      if (definition.baseUrl === null) continue;
      expect(definition.baseUrl.startsWith('https://'), `${definition.slug} default must be https`).toBe(true);
    }
  });

  it('documents why the cookie-based and paid providers were left out', () => {
    const excluded = EXCLUDED_PROVIDERS.map((e) => e.slug);
    expect(excluded).toContain('suno');
    expect(excluded).toContain('udio');
    // The stated reason must be the credential rule, not a vague "not free".
    expect(EXCLUDED_PROVIDERS.find((e) => e.slug === 'suno')!.reason).toMatch(/cookie/i);
  });

  it('ships every declared free tier as recurring, one-time-credit or keyless — never "paid"', () => {
    for (const definition of FREE_PROVIDERS) {
      expect(['recurring', 'one-time-credit', 'keyless']).toContain(definition.freeTier);
      expect(definition.freeTierNote.trim().length).toBeGreaterThan(10);
    }
  });
});

describe('endpoint safety', () => {
  it('rejects non-http(s) schemes', () => {
    expect(() => assertSafeEndpoint('ftp://api.example.com/v1', 'x')).toThrow(ProviderConfigurationError);
  });

  it('rejects credentials embedded in the URL', () => {
    expect(() => assertSafeEndpoint('https://user:pass@api.example.com/v1', 'x')).toThrow(/must not carry credentials/);
  });

  it('rejects plain HTTP to a remote host', () => {
    expect(() => assertSafeEndpoint('http://api.example.com/v1', 'x')).toThrow(/must use HTTPS/);
  });

  it('allows plain HTTP on loopback (a same-host Ollama/vLLM server)', () => {
    expect(assertSafeEndpoint('http://127.0.0.1:11434/v1', 'x').protocol).toBe('http:');
    expect(assertSafeEndpoint('http://localhost:11434/v1', 'x').protocol).toBe('http:');
  });

  it('rejects a malformed URL instead of throwing a bare TypeError', () => {
    expect(() => assertSafeEndpoint('not a url', 'x')).toThrow(ProviderConfigurationError);
  });

  it('normalises a base, a /v1 base and a full endpoint to the same chat URL', () => {
    expect(toChatCompletionsUrl('https://api.example.com')).toBe('https://api.example.com/v1/chat/completions');
    expect(toChatCompletionsUrl('https://api.example.com/v1')).toBe('https://api.example.com/v1/chat/completions');
    expect(toChatCompletionsUrl('https://api.example.com/v1/')).toBe('https://api.example.com/v1/chat/completions');
    expect(toChatCompletionsUrl('https://api.example.com/v1/chat/completions')).toBe(
      'https://api.example.com/v1/chat/completions',
    );
  });
});

describe('resolveFreeProvider', () => {
  it('refuses an unknown provider rather than silently picking another', () => {
    expect(() => resolveFreeProvider('openai')).toThrow(/Unknown AI provider "openai"/);
  });

  it('refuses an unconfigured provider and names the env var to set', () => {
    delete process.env.GEMINI_API_KEY;
    expect(() => resolveFreeProvider('gemini')).toThrow(/Set GEMINI_API_KEY/);
  });

  it('resolves a configured provider with its catalog defaults', () => {
    process.env.GEMINI_API_KEY = 'test-key-not-real';
    const resolved = resolveFreeProvider('gemini');
    expect(resolved.baseUrl).toBe('https://generativelanguage.googleapis.com/v1beta/openai');
    expect(resolved.model).toBe('gemini-2.5-flash');
    expect(resolved.baseUrlOverridden).toBe(false);
  });

  it('honours an operator base-URL override and reports that it was used', () => {
    process.env.MISTRAL_API_KEY = 'x';
    process.env.ALO_AI_MISTRAL_BASE_URL = 'https://mistral.internal.example/v1';
    process.env.ALO_AI_MISTRAL_MODEL = 'mistral-small-latest';
    const resolved = resolveFreeProvider('mistral');
    expect(resolved.baseUrl).toBe('https://mistral.internal.example/v1');
    expect(resolved.baseUrlOverridden).toBe(true);
  });

  it('refuses a provider whose endpoint is unknown and unset', () => {
    process.env.G4F_GROQ_API_KEY = 'x';
    process.env.ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS = 'true';
    expect(() => resolveFreeProvider('g4f-groq')).toThrow(/ALO_AI_G4F_GROQ_BASE_URL/);
  });

  it('resolves a keyless provider with no key present', () => {
    delete process.env.POLLINATIONS_API_KEY;
    const resolved = resolveFreeProvider('pollinations');
    expect(resolved.apiKey).toBeNull();
    expect(resolved.model).toBe('openai');
  });

  it('blocks an unofficial proxy by default', () => {
    process.env.G4F_GROQ_API_KEY = 'x';
    delete process.env.ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS;
    expect(() => resolveFreeProvider('g4f-groq')).toThrow(/unofficial third-party proxy/);
  });

  it('allows an unofficial proxy only under an explicit opt-in', () => {
    process.env.G4F_GROQ_API_KEY = 'x';
    process.env.ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS = 'true';
    process.env.ALO_AI_G4F_GROQ_BASE_URL = 'https://g4f.example/v1';
    process.env.ALO_AI_G4F_GROQ_MODEL = 'llama-3.3-70b-versatile';
    expect(resolveFreeProvider('g4f-groq').provenance).toBe('unofficial-proxy');
  });

  it('prefers an explicit model hint, then a per-provider env model, then the catalog default', () => {
    process.env.MISTRAL_API_KEY = 'x';
    expect(resolveFreeProvider('mistral', 'mistral-large-latest').model).toBe('mistral-large-latest');
    process.env.ALO_AI_MISTRAL_MODEL = 'mistral-small-latest';
    expect(resolveFreeProvider('mistral').model).toBe('mistral-small-latest');
  });
});

describe('maskKey never leaks a credential', () => {
  it('hides short keys entirely', () => {
    expect(maskKey('short')).toBe('***');
    expect(maskKey('')).toBe('not set');
    expect(maskKey(undefined)).toBe('not set');
  });

  it('shows only a prefix and suffix of a long key', () => {
    // Deliberately NOT shaped like a real provider key: CI's secret-leak scan
    // matches `sk-[A-Za-z0-9]{32,}`, so a realistic fixture here would fail the
    // build. The masking behaviour does not depend on the prefix.
    const masked = maskKey('not-a-real-key-abcdefghijklmnopqrstuvwxyz');
    expect(masked).toBe('not-a-…wxyz');
    expect(masked).not.toContain('bcdefghijklmnop');
  });
});

describe('listProviderStatus is safe to expose to an admin UI', () => {
  it('reports configuration state without ever returning a key value', () => {
    process.env.CEREBRAS_API_KEY = 'csk-secret-value-1234567890';
    const status = listProviderStatus();
    const cerebras = status.find((s) => s.slug === 'cerebras')!;
    expect(cerebras.configured).toBe(true);
    expect(cerebras.blocker).toBeNull();
    expect(JSON.stringify(status)).not.toContain('secret-value');
  });

  it('marks an unconfigured provider with the exact remediation', () => {
    delete process.env.CEREBRAS_API_KEY;
    const cerebras = listProviderStatus().find((s) => s.slug === 'cerebras')!;
    expect(cerebras.configured).toBe(false);
    expect(cerebras.blocker).toBe('Set CEREBRAS_API_KEY');
  });

  it('marks a keyless provider as configured with no key', () => {
    delete process.env.POLLINATIONS_API_KEY;
    expect(listProviderStatus().find((s) => s.slug === 'pollinations')!.configured).toBe(true);
  });
});

describe('implicit routing never selects a provider the owner did not approve', () => {
  beforeEach(() => {
    for (const key of ['GEMINI_API_KEY', 'DEEPSEEK_API_KEY', 'POLLINATIONS_API_KEY', 'G4F_GROQ_API_KEY']) {
      delete process.env[key];
    }
    delete process.env.ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS;
  });

  it('returns null when nothing is configured, so the caller keeps its clear error', () => {
    expect(firstConfiguredFreeProvider()).toBeNull();
  });

  it('prefers a recurring free tier over a one-time credit', () => {
    process.env.DEEPSEEK_API_KEY = 'x'; // one-time-credit, but has a default model
    process.env.GEMINI_API_KEY = 'x'; // recurring
    expect(firstConfiguredFreeProvider()?.slug).toBe('gemini');
  });

  it('falls back to a one-time-credit provider when that is all there is', () => {
    process.env.DEEPSEEK_API_KEY = 'x';
    expect(firstConfiguredFreeProvider()?.slug).toBe('deepseek');
  });

  it('never implicitly routes through an unofficial proxy', () => {
    process.env.G4F_GROQ_API_KEY = 'x';
    process.env.ALO_AI_ALLOW_UNOFFICIAL_PROVIDERS = 'true';
    expect(firstConfiguredFreeProvider()).toBeNull();
  });

  it('treats a keyless provider as configured', () => {
    expect(isProviderConfigured(getProviderDefinition('pollinations')!)).toBe(true);
  });
});
