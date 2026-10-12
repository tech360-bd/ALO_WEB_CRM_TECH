import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { AuthContext } from '@/lib/auth-middleware';
const m = vi.hoisted(() => ({ auth: vi.fn(), db: new Proxy({}, { get() { throw new Error('Denied requests must not touch the database'); } }) }));
vi.mock('@/lib/db', () => ({ db: m.db }));
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: m.auth, logAuditAction: vi.fn(),
  withAuth: (handler: (req: Request, auth: AuthContext) => Promise<Response>) => async (req: Request) => handler(req, await m.auth()),
}));
import { GET as counselor } from '@/app/api/crm/dashboard/counselor/route';
import { GET as marketing } from '@/app/api/crm/marketing/dashboard/route';
import { GET as frontdesk } from '@/app/api/crm/frontdesk/dashboard/route';
import { GET as branch } from '@/app/api/crm/branch/dashboard/route';
import { GET as ceo } from '@/app/api/crm/ceo/dashboard/route';
import { GET as analytics } from '@/app/api/crm/analytics/route';
import { GET as reports } from '@/app/api/crm/reports/route';
import { GET as commandRead, POST as commandWrite } from '@/app/api/admin/crm/command-center/route';
import { GET as legacyRead, POST as legacyWrite } from '@/app/api/unified-communication/route';
const auth = { identityDomain: 'user', authenticationMethod: 'cookie', userId: 'u', actorUserId: 'u', userType: 'ADMIN', roles: ['ADMIN'], permissions: [] };
beforeEach(() => { vi.clearAllMocks(); vi.stubEnv('NEXTAUTH_URL', 'https://alo.test'); });
it('denies students, arbitrary staff and cross-domain administrators before legacy dashboard/command queries', async () => {
  for (const identity of [{ ...auth, userType: 'STUDENT' }, { ...auth, userType: 'STAFF', roles: [] }, { ...auth, identityDomain: 'portal' }]) {
    m.auth.mockResolvedValue(identity);
    for (const get of [counselor, marketing, frontdesk, branch, ceo, analytics, reports, commandRead]) {
      expect((await get(new NextRequest('https://alo.test/api/legacy'))).status).toBe(403);
    }
    expect((await commandWrite(new Request('https://alo.test/api/legacy', { method: 'POST' }))).status).toBe(403);
  }
});
it('command mutations require an authenticated same-origin request', async () => {
  m.auth.mockResolvedValue(auth);
  expect((await commandWrite(new Request('https://alo.test/api/legacy', { method: 'POST', headers: { origin: 'https://attacker.test' } }))).status).toBe(403);
});
it('unified-communication intake never infers identity: unauthenticated and malformed writes are rejected before any database access', async () => {
  // Anonymous sender: rejected by authentication, db proxy proves no lookup happened.
  m.auth.mockResolvedValue(NextResponse.json({ error: 'Login required' }, { status: 401 }));
  expect((await legacyWrite(new NextRequest('https://alo.test/api/unified-communication', { method: 'POST', body: JSON.stringify({ phone: '+8801700000000', message: 'hi' }) }))).status).toBe(401);
  // Authenticated but without an accessible threadId: no contact/ID matching, no registration — 400 before db.
  m.auth.mockResolvedValue(auth);
  expect((await legacyWrite(new NextRequest('https://alo.test/api/unified-communication', { method: 'POST', body: JSON.stringify({ phone: '+8801700000000', message: 'hi' }) }))).status).toBe(400);
  const info = await (await legacyRead()).json();
  expect(info).toMatchObject({ success: true });
  expect(JSON.stringify(info)).not.toMatch(/automaticIdentityMatching":true|automaticRegistration":true/);
});
it('command entry point preserves unauthenticated responses', async () => {
  m.auth.mockResolvedValue(NextResponse.json({ error: 'Login required' }, { status: 401 }));
  expect((await commandRead(new Request('https://alo.test'))).status).toBe(401);
});
