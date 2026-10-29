import { afterEach, describe, expect, it, vi } from 'vitest';
import { publicMutationOriginAllowed } from '@/lib/request-origin';

afterEach(() => vi.unstubAllEnvs());

describe('publicMutationOriginAllowed', () => {
  it('accepts the same origin in a local or preview environment even if NEXTAUTH_URL is configured', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXTAUTH_URL', 'https://alo.example');
    const req = new Request('https://preview.example/api/lead-forms', {
      method: 'POST',
      headers: { origin: 'https://preview.example', 'sec-fetch-site': 'same-origin' },
    });
    expect(publicMutationOriginAllowed(req)).toBe(true);
  });

  it('rejects cross-site fetches regardless of origin value', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const req = new Request('https://preview.example/api/lead-forms', {
      method: 'POST',
      headers: { origin: 'https://preview.example', 'sec-fetch-site': 'cross-site' },
    });
    expect(publicMutationOriginAllowed(req)).toBe(false);
  });

  it('requires the configured canonical origin in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXTAUTH_URL', 'https://alo.example');
    const allowed = new Request('https://internal.service/api/lead-forms', {
      method: 'POST',
      headers: { origin: 'https://alo.example' },
    });
    const rejected = new Request('https://internal.service/api/lead-forms', {
      method: 'POST',
      headers: { origin: 'https://attacker.example' },
    });
    expect(publicMutationOriginAllowed(allowed)).toBe(true);
    expect(publicMutationOriginAllowed(rejected)).toBe(false);
  });

  it('fails closed in production when no canonical public URL is configured', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXTAUTH_URL', '');
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    const req = new Request('https://alo.example/api/lead-forms', { method: 'POST' });
    expect(publicMutationOriginAllowed(req)).toBe(false);
  });
});
