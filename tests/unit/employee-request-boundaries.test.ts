import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ session: vi.fn(), employee: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  portalSession: { findUnique: m.session },
  employee: { findFirst: m.employee },
} }));
import { authenticateRequest, withAuth } from '@/lib/auth-middleware';

const portalUser = (userType = 'EMPLOYEE', role = 'counselor', permissions: string[] = []) => ({
  id: 'staff', email: 'staff@example.test', name: 'Staff', userType,
  status: 'active', emailVerified: true, partnerProfile: null,
  roles: [{ role: { name: role, permissions: permissions.map(id => ({ granted: true, permission: { id } })) } }],
});
const baseSession = (user = portalUser()) => ({
  id: 'base', userId: user.id, user, token: 'secret', revokedAt: null,
  expiresAt: new Date(Date.now() + 3600000), deviceName: 'Browser',
});
const request = (path = '/api/employee/tasks', init: RequestInit = {}) => new Request(`https://alo.test${path}`, {
  ...init, headers: { cookie: 'alo_portal_session=secret', ...init.headers },
});

beforeEach(() => {
  vi.resetAllMocks();
  m.session.mockResolvedValue(baseSession());
  m.employee.mockResolvedValue({ status: 'active' });
});

describe('employee request security boundaries', () => {
  it.each(['/api/employee/tasks', '/api/whatsapp/send', '/api/ai-command/execute', '/api/crm/students'])('deactivation blocks %s with an otherwise valid portal session', async path => {
    m.employee.mockResolvedValue({ status: 'SUSPENDED' });
    expect((await authenticateRequest(request(path)) as NextResponse).status).toBe(403);
  });
  it.each(['STUDENT', 'PARTNER'])('rejects %s on employee APIs', async type => {
    m.session.mockResolvedValue(baseSession(portalUser(type)));
    expect((await authenticateRequest(request()) as NextResponse).status).toBe(403);
  });
  it('rejects cross-origin employee mutations', async () => {
    expect((await authenticateRequest(request('/api/employee/tasks', { method: 'POST', headers: { origin: 'https://evil.test' } })) as NextResponse).status).toBe(403);
  });
  it('lets an active employee reach downstream permission checks', async () => {
    expect(await authenticateRequest(request())).toMatchObject({ userId: 'staff', actorUserId: 'staff' });
  });
  it('ADMIN cannot bypass an explicit salary permission', async () => {
    m.session.mockResolvedValue(baseSession(portalUser('ADMIN', 'admin')));
    const handler = vi.fn(async () => NextResponse.json({ success: true }));
    const response = await withAuth(handler, { requirePermissions: ['employee.fields.salary.view'] })(request());
    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
  it('ADMIN with the explicit permission can proceed', async () => {
    m.session.mockResolvedValue(baseSession(portalUser('ADMIN', 'admin', ['employee.fields.salary.view'])));
    const response = await withAuth(async () => NextResponse.json({ success: true }), { requirePermissions: ['employee.fields.salary.view'] })(request());
    expect(response.status).toBe(200);
  });
  it('allows the exact stop endpoint to clear an expired Acting-As cookie', async () => {
    m.session.mockImplementation(async ({ where }) => where.token
      ? baseSession(portalUser('SUPER_ADMIN', 'super_admin')) : null);
    expect(await authenticateRequest(request('/api/portal-auth/acting-as/stop', { method: 'POST', headers: { cookie: 'alo_portal_session=secret; alo_acting_as_session=expired' } })))
      .toMatchObject({ userId: 'staff', userType: 'SUPER_ADMIN' });
  });
  it.each(['expired', 'revoked', 'missing', 'foreign'])('an %s Acting-As session never falls back to Super Admin authority', async kind => {
    const base = baseSession(portalUser('SUPER_ADMIN', 'super_admin'));
    m.session.mockImplementation(async ({ where }) => {
      if (where.token) return base;
      if (kind === 'missing') return null;
      return { id: 'acting', userId: kind === 'foreign' ? 'other' : 'staff', deviceName: 'ALO_ACTING_AS:employee',
        revokedAt: kind === 'revoked' ? new Date() : null,
        expiresAt: new Date(Date.now() + (kind === 'expired' ? -60000 : 60000)) };
    });
    const response = await authenticateRequest(request('/api/employee/tasks', { headers: { cookie: 'alo_portal_session=secret; alo_acting_as_session=acting' } }));
    expect((response as NextResponse).status).toBe(403);
  });
});
