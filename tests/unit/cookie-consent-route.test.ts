/**
 * /api/cookie-consent — consent record endpoint contract tests.
 *
 * The public banner is the only caller today. These tests pin the server-side
 * rules that keep the endpoint honest: no PII accepted, origin enforced,
 * necessary storage is always recorded as granted, withdrawal is append-only,
 * and a database failure is reported as failure — never as a saved decision.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const m = vi.hoisted(() => ({
  createdRows: [] as Array<Record<string, unknown>>,
  latest: null as Record<string, unknown> | null,
  dbFail: false,
}));

vi.mock('@/lib/db', () => ({
  db: {
    websiteConsent: {
      create: async (args: { data: Record<string, unknown> }) => {
        if (m.dbFail) throw new Error('db unavailable');
        const row = { id: 'wc-1', ...args.data, createdAt: new Date('2026-11-16T00:00:00Z') };
        m.createdRows.push(row);
        return row;
      },
      findFirst: async () => (m.dbFail ? (() => { throw new Error('db unavailable'); })() : m.latest),
    },
  },
}));

const { POST, DELETE, GET } = await import('@/app/api/cookie-consent/route');

function req(url: string, init?: { method?: string; body?: unknown; origin?: string | null }) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (init?.origin !== null) headers.set('origin', init?.origin ?? 'https://alo.test');
  return new NextRequest(url, {
    method: init?.method ?? 'POST',
    headers,
    body: init?.body === undefined ? undefined : JSON.stringify(init.body),
  });
}

beforeEach(() => {
  m.createdRows = [];
  m.latest = null;
  m.dbFail = false;
});

describe('POST /api/cookie-consent', () => {
  it('records a decision with necessary always true and https-safe fields only', async () => {
    const res = await POST(req('https://alo.test/api/cookie-consent', {
      body: {
        visitorId: 'visitor-abc-1234567890',
        necessary: false, // ignored — necessary is never recordable as false
        analytics: true,
        marketing: false,
        functional: true,
        consentVersion: '2.0',
        policyVersion: '2.0',
        source: 'cookie_banner',
      },
    }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.consentId).toBeTruthy();
    const stored = m.createdRows[0];
    expect(stored.necessary).toBe(true);
    expect(stored.analytics).toBe(true);
    expect(stored.marketing).toBe(false);
    expect(stored.functional).toBe(true);
    // Never persists unexpected keys (no email/phone/name smuggled in).
    expect(Object.keys(stored)).toEqual(
      expect.arrayContaining(['id', 'visitorId', 'necessary', 'analytics', 'marketing', 'functional', 'consentVersion', 'policyVersion', 'source', 'createdAt']),
    );
    expect(JSON.stringify(stored)).not.toContain('email');
  });

  it('rejects an invalid visitorId', async () => {
    const res = await POST(req('https://alo.test/api/cookie-consent', {
      body: { visitorId: '../../etc/passwd', analytics: true },
    }));
    expect(res.status).toBe(400);
    const res2 = await POST(req('https://alo.test/api/cookie-consent', {
      body: { analytics: true },
    }));
    expect(res2.status).toBe(400);
    expect(m.createdRows).toHaveLength(0);
  });

  it('rejects cross-site submissions', async () => {
    const res = await POST(req('https://alo.test/api/cookie-consent', {
      origin: 'https://evil.example',
      body: { visitorId: 'visitor-abc-1234567890', analytics: true },
    }));
    expect(res.status).toBe(403);
    expect(m.createdRows).toHaveLength(0);
  });

  it('fails closed when the database is unavailable', async () => {
    m.dbFail = true;
    const res = await POST(req('https://alo.test/api/cookie-consent', {
      body: { visitorId: 'visitor-abc-1234567890', analytics: true },
    }));
    const json = await res.json();
    expect(res.status).toBe(503);
    expect(json.success).toBe(false);
  });
});

describe('DELETE /api/cookie-consent', () => {
  it('records withdrawal as an append-only row with all optional categories false', async () => {
    const res = await DELETE(req('https://alo.test/api/cookie-consent', {
      method: 'DELETE',
      body: { visitorId: 'visitor-abc-1234567890' },
    }));
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    const stored = m.createdRows[0];
    expect(stored.analytics).toBe(false);
    expect(stored.marketing).toBe(false);
    expect(stored.functional).toBe(false);
    expect(stored.withdrawnAt).toBeTruthy();
    expect(stored.source).toBe('cookie_banner_withdraw');
  });
});

describe('GET /api/cookie-consent', () => {
  it('returns the latest decision for the visitor token', async () => {
    m.latest = { id: 'wc-9', necessary: true, analytics: true, marketing: false, functional: true, consentVersion: '2.0', policyVersion: '2.0', source: 'cookie_banner', withdrawnAt: null, createdAt: new Date('2026-11-16T00:00:00Z') };
    const res = await GET(req('https://alo.test/api/cookie-consent?visitorId=visitor-abc-1234567890'));
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.record?.analytics).toBe(true);
  });

  it('rejects a malformed visitorId', async () => {
    const res = await GET(req('https://alo.test/api/cookie-consent?visitorId=nope'));
    expect(res.status).toBe(400);
  });
});
