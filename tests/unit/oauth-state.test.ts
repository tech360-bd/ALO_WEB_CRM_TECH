import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  createOAuthState,
  OAUTH_STATE_TTL_MS,
  safeReturnTo,
  verifyOAuthState,
} from '@/lib/social/oauth-state';

const SECRET = 'a'.repeat(48);
const savedEnv = { ...process.env };

beforeEach(() => {
  process.env.NODE_ENV = 'test';
  process.env.NEXTAUTH_SECRET = SECRET;
  delete process.env.AUTH_SECRET;
});

afterEach(() => {
  process.env = { ...savedEnv };
});

describe('safeReturnTo', () => {
  it('accepts a same-origin absolute path', () => {
    expect(safeReturnTo('/admin/marketing', '/fallback')).toBe('/admin/marketing');
    expect(safeReturnTo('/crm/integrations?tab=facebook', '/fallback')).toBe('/crm/integrations?tab=facebook');
  });

  it.each([
    ['https://evil.example/phish', 'absolute external URL'],
    ['//evil.example/phish', 'protocol-relative URL'],
    ['/\\evil.example/phish', 'backslash protocol-relative URL'],
    ['http://evil.example', 'plain http external URL'],
    ['javascript:alert(1)', 'javascript scheme'],
    ['/\t/evil.example', 'embedded control character'],
    ['', 'empty string'],
    ['   ', 'whitespace only'],
    ['admin/marketing', 'relative path without leading slash'],
  ])('rejects %s (%s) and falls back', (candidate, _label) => {
    expect(safeReturnTo(candidate, '/fallback')).toBe('/fallback');
  });

  it('rejects an over-long path', () => {
    expect(safeReturnTo(`/${'a'.repeat(600)}`, '/fallback')).toBe('/fallback');
  });
});

describe('createOAuthState / verifyOAuthState', () => {
  it('round-trips a signed state and preserves returnTo', () => {
    const state = createOAuthState('facebook', '/admin/marketing');
    const result = verifyOAuthState(state, 'facebook');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.returnTo).toBe('/admin/marketing');
    expect(result.payload.provider).toBe('facebook');
    expect(typeof result.payload.nonce).toBe('string');
  });

  it('produces a different state on every call, so states cannot be reused', () => {
    const a = createOAuthState('facebook', '/admin/marketing');
    const b = createOAuthState('facebook', '/admin/marketing');
    expect(a).not.toBe(b);
  });

  it('sanitizes a malicious returnTo at creation time', () => {
    const state = createOAuthState('facebook', 'https://evil.example/phish');
    const result = verifyOAuthState(state, 'facebook');
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.payload.returnTo).toBe('');
  });

  it('rejects a state whose payload was tampered with', () => {
    const state = createOAuthState('facebook', '/admin/marketing');
    const [payloadB64, signature] = state.split('.');
    // Swap the payload for an attacker-chosen one while keeping the real signature.
    const forgedPayload = Buffer.from(
      JSON.stringify({ returnTo: 'https://evil.example', ts: Date.now(), nonce: 'x', provider: 'facebook' }),
      'utf8',
    ).toString('base64url');
    expect(verifyOAuthState(`${forgedPayload}.${signature}`, 'facebook')).toEqual({
      ok: false,
      reason: 'bad-signature',
    });
    expect(payloadB64).not.toBe(forgedPayload);
  });

  it('rejects a state whose signature was tampered with', () => {
    const state = createOAuthState('facebook', '/admin/marketing');
    const [payloadB64, signature] = state.split('.');
    const flipped = (signature[0] === 'a' ? 'b' : 'a') + signature.slice(1);
    expect(verifyOAuthState(`${payloadB64}.${flipped}`, 'facebook')).toEqual({
      ok: false,
      reason: 'bad-signature',
    });
  });

  it('rejects a state signed with a different secret', () => {
    const state = createOAuthState('facebook', '/admin/marketing');
    process.env.NEXTAUTH_SECRET = 'b'.repeat(48);
    expect(verifyOAuthState(state, 'facebook')).toEqual({ ok: false, reason: 'bad-signature' });
  });

  it('rejects a state issued for a different provider', () => {
    const state = createOAuthState('google', '/admin/marketing');
    expect(verifyOAuthState(state, 'facebook')).toEqual({ ok: false, reason: 'provider-mismatch' });
  });

  it('rejects an expired state', () => {
    const state = createOAuthState('facebook', '/admin/marketing');
    const future = Date.now() + OAUTH_STATE_TTL_MS + 1000;
    expect(verifyOAuthState(state, 'facebook', OAUTH_STATE_TTL_MS, future)).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it('rejects a state timestamped in the future beyond clock skew tolerance', () => {
    const state = createOAuthState('facebook', '/admin/marketing');
    const past = Date.now() - 10 * 60 * 1000;
    expect(verifyOAuthState(state, 'facebook', OAUTH_STATE_TTL_MS, past)).toEqual({
      ok: false,
      reason: 'expired',
    });
  });

  it.each([
    [null, 'missing'],
    [undefined, 'undefined'],
    ['', 'empty'],
    ['not-a-state', 'no separator'],
    ['.abc', 'empty payload'],
    ['abc.', 'empty signature'],
    ['!!!.@@@', 'unparseable payload'],
  ])('rejects a %s state (%s)', (state) => {
    const result = verifyOAuthState(state as string | null, 'facebook');
    expect(result.ok).toBe(false);
  });

  it('refuses to sign without a secret, in every environment', () => {
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.AUTH_SECRET;
    expect(() => createOAuthState('facebook', '/admin/marketing')).toThrow(/NEXTAUTH_SECRET/);

    // A short secret is no better than no secret.
    process.env.NEXTAUTH_SECRET = 'too-short';
    expect(() => createOAuthState('facebook', '/admin/marketing')).toThrow(/at least 32 characters/);

    // And the same in production — there is no development fallback to weaken it.
    process.env.NODE_ENV = 'production';
    expect(() => createOAuthState('facebook', '/admin/marketing')).toThrow(/at least 32 characters/);
  });

  it('accepts AUTH_SECRET as an alias for NEXTAUTH_SECRET', () => {
    delete process.env.NEXTAUTH_SECRET;
    process.env.AUTH_SECRET = SECRET;
    const state = createOAuthState('facebook', '/admin/marketing');
    expect(verifyOAuthState(state, 'facebook').ok).toBe(true);
  });
});
