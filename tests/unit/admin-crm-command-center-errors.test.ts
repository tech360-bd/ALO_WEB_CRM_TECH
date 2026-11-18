import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  groupBy: vi.fn(),
  audit: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: new Proxy({}, {
    get: () => ({ findMany: m.findMany, count: m.count, groupBy: m.groupBy }),
  }),
}));
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: m.auth,
  logAuditAction: m.audit,
}));

import { GET, POST } from '@/app/api/admin/crm/command-center/route';

const request = (module = 'leads') => new Request(`https://alo.test/api/admin/crm/command-center?module=${module}`);

beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({
    identityDomain: 'user', userId: 'admin-1', actorUserId: 'admin-1',
    userType: 'ADMIN', roles: ['ADMIN'], permissions: [],
  });
  m.findMany.mockResolvedValue([]);
  m.count.mockResolvedValue(0);
  m.groupBy.mockResolvedValue([]);
  m.audit.mockResolvedValue(undefined);
  vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
});

describe('legacy admin CRM command center database errors', () => {
  it('returns an unavailable response instead of reporting a failed read as empty data', async () => {
    m.findMany.mockRejectedValue(new Error('mysql://secret credentials and SQL details'));

    const response = await GET(request());
    const text = await response.text();

    expect(response.status).toBe(503);
    expect(text).not.toContain('mysql://');
    expect(JSON.parse(text)).toEqual({
      success: false,
      error: 'CRM command center data is temporarily unavailable.',
    });
  });

  it('continues to return genuine empty results when database reads succeed', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, module: 'leads', data: [], total: 0 });
  });

  it('does not execute a command or claim success if its audit write fails', async () => {
    m.audit.mockRejectedValue(new Error('audit store unavailable'));
    const response = await POST(new Request('https://alo.test/api/admin/crm/command-center', {
      method: 'POST',
      headers: { origin: 'https://alo.test', 'content-type': 'application/json' },
      body: JSON.stringify({ action: 'unknown_action', module: 'test', data: {} }),
    }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ success: false, error: 'CRM command could not be completed.' });
  });
});
