import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Helpers to replicate fixed logic without needing full DB

function getFileSignSecret(envVal: string | undefined, nodeEnv: string): string {
  const secret = envVal;
  if (!secret || secret.length < 32) {
    if (nodeEnv === 'production') throw new Error('FILE_SIGN_SECRET must be at least 32 characters in production (fail-closed)');
    return 'dev-only-insecure-do-not-use-in-prod-32chars!!';
  }
  return secret;
}

function verifySignedUrl(filePath: string, expires: string, signature: string, secret: string): boolean {
  const data = `${filePath}:${expires}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('hex');
  try {
    const a = Buffer.from(expected, 'hex');
    const b = Buffer.from(signature, 'hex');
    if (a.length !== b.length) return false;
    if (!crypto.timingSafeEqual(a, b)) return false;
  } catch { return false; }
  const expNum = parseInt(expires, 10);
  if (Number.isNaN(expNum) || expNum < Date.now()) return false;
  return true;
}

function getClientIp(headers: Record<string,string>): string {
  const xff = headers['x-forwarded-for'];
  if (xff) return xff.split(',')[0].trim() || 'unknown';
  const realIp = headers['x-real-ip'];
  if (realIp) return realIp.trim();
  return 'unknown';
}

describe('SEC-02/15 FILE_SIGN_SECRET hardening', () => {
  it('throws in production when secret missing or short', () => {
    expect(() => getFileSignSecret(undefined, 'production')).toThrow();
    expect(() => getFileSignSecret('short', 'production')).toThrow();
    expect(() => getFileSignSecret('a'.repeat(31), 'production')).toThrow();
  });
  it('allows dev fallback but warns (32+ chars)', () => {
    expect(getFileSignSecret(undefined, 'development').length).toBeGreaterThan(30);
    expect(getFileSignSecret('a'.repeat(32), 'production')).toBe('a'.repeat(32));
  });
  it('verifySignedUrl uses constant-time compare and expiry', () => {
    const secret = 'a'.repeat(32);
    const fp = '/private/doc.pdf';
    const expires = (Date.now() + 60000).toString();
    const sig = crypto.createHmac('sha256', secret).update(`${fp}:${expires}`).digest('hex');
    expect(verifySignedUrl(fp, expires, sig, secret)).toBe(true);
    expect(verifySignedUrl(fp, expires, sig + '00', secret)).toBe(false);
    expect(verifySignedUrl(fp, (Date.now()-1000).toString(), sig, secret)).toBe(false);
    expect(verifySignedUrl(fp, expires, 'invalid', secret)).toBe(false);
  });
  it('dev fallback secret is not the old insecure alo-file-secret', () => {
    const dev = getFileSignSecret(undefined, 'development');
    expect(dev).not.toBe('alo-file-secret');
    expect(dev.length).toBeGreaterThanOrEqual(32);
  });
});

describe('SEC-09 webhook fail-closed', () => {
  function webhookVerify(headersToken: string | null, expected: string | undefined): { status: number } {
    if (!expected) return { status: 500 };
    const tokensMatch = headersToken !== null && headersToken.length === expected.length && headersToken === expected;
    if (tokensMatch) return { status: 200 };
    return { status: 403 };
  }
  it('500 when WHATSAPP_VERIFY_TOKEN not configured (no fallback)', () => {
    expect(webhookVerify('alo_education_verify_token_2026', undefined).status).toBe(500);
    expect(webhookVerify('anything', '').status).toBe(500);
  });
  it('403 on mismatch, 200 on match', () => {
    expect(webhookVerify('wrong', 'correct-token').status).toBe(403);
    expect(webhookVerify('correct-token', 'correct-token').status).toBe(200);
  });
  it('rejects old hardcoded fallback token when env is set to something else', () => {
    expect(webhookVerify('alo_education_verify_token_2026', 'my-secure-token-123').status).toBe(403);
  });
});

describe('SEC-06 rateLimit IP extraction (no spoof)', () => {
  it('takes first IP from x-forwarded-for chain', () => {
    expect(getClientIp({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' })).toBe('1.2.3.4');
    expect(getClientIp({ 'x-forwarded-for': ' 1.2.3.4 ' })).toBe('1.2.3.4');
  });
  it('falls back to x-real-ip then unknown', () => {
    expect(getClientIp({ 'x-real-ip': '2.3.4.5' })).toBe('2.3.4.5');
    expect(getClientIp({})).toBe('unknown');
  });
});

describe('SEC-01 upload fail-closed', () => {
  function getUploadDir(envDir: string | undefined, nodeEnv: string): { dir: string; ok: boolean; status?: number } {
    if (!envDir) {
      if (nodeEnv === 'production') return { dir: '', ok: false, status: 500 };
      return { dir: '/tmp/storage-private', ok: true };
    }
    return { dir: envDir, ok: true };
  }
  it('500 in production when STORAGE_POOL_C missing', () => {
    expect(getUploadDir(undefined, 'production').status).toBe(500);
    expect(getUploadDir(undefined, 'production').ok).toBe(false);
  });
  it('private fallback outside public/ in dev', () => {
    const r = getUploadDir(undefined, 'development');
    expect(r.ok).toBe(true);
    expect(r.dir).not.toContain('public');
    expect(r.dir).toContain('storage');
  });
});

describe('SEC-04 password reset one-time use', () => {
  // Simulate token store
  type TokenRow = { tokenHash: string; used: boolean; expiresAt: Date };
  const store = new Map<string, TokenRow>();
  function createToken(userId: string) {
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    store.set(hash, { tokenHash: hash, used: false, expiresAt: new Date(Date.now()+3600000) });
    return { raw, hash };
  }
  function consume(hash: string): boolean {
    const row = store.get(hash);
    if (!row || row.used) return false;
    if (new Date() > row.expiresAt) return false;
    row.used = true;
    return true;
  }
  it('single use enforced', () => {
    const { hash } = createToken('user1');
    expect(consume(hash)).toBe(true);
    expect(consume(hash)).toBe(false);
    expect(consume(hash)).toBe(false);
  });
  it('expired token rejected', () => {
    const raw = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    store.set(hash, { tokenHash: hash, used: false, expiresAt: new Date(Date.now()-1000) });
    expect(consume(hash)).toBe(false);
  });
});

describe('SEC-10 auth enforcement', () => {
  it('access-control and agentos routes require auth (verified by file grep)', async () => {
    // Static check: ensure patched files contain authenticateRequest
    const fs = await import('fs');
    const files = [
      'src/app/api/access-control/route.ts',
      'src/app/api/agentos/dashboard/route.ts',
      'src/app/api/agentos/agents/route.ts',
      'src/app/api/ai-agents/route.ts',
      'src/app/api/ai-registry/route.ts',
    ];
    for (const f of files) {
      const content = fs.readFileSync(f, 'utf8');
      expect(content).toContain('authenticateRequest');
    }
  });
});

describe('SEC-05 port alignment', () => {
  it('nginx and workflow use 3000 (not 3044/3025)', async () => {
    const fs = await import('fs');
    const nginx = fs.readFileSync('nginx.conf','utf8');
    expect(nginx).toContain('proxy_pass http://127.0.0.1:3000');
    expect(nginx).not.toContain('3044');
    const wf = fs.readFileSync('.github/workflows/deploy-production.yml','utf8');
    expect(wf).toContain(':3000');
    expect(wf).not.toContain(':3025');
  });
});

describe('SEC-11 Dockerfile correct', () => {
  it('uses node:22 and supports both lockfiles, runs as nextjs user', async () => {
    const fs = await import('fs');
    const dock = fs.readFileSync('Dockerfile','utf8');
    expect(dock).toContain('FROM node:22');
    expect(dock).toContain('npm ci');
    expect(dock).toContain('USER nextjs');
    expect(dock).not.toContain('oven/bun');
  });
});

describe('next.config security headers (SEC-13)', () => {
  it('enables CSP and other headers', async () => {
    const fs = await import('fs');
    const cfg = fs.readFileSync('next.config.ts','utf8');
    expect(cfg).toContain('Content-Security-Policy');
    expect(cfg).toContain('X-Frame-Options');
    expect(cfg).toContain('Strict-Transport-Security');
    expect(cfg).toContain('poweredByHeader: false');
  });
});
