import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), access: vi.fn(), target: vi.fn(), list: vi.fn(), transaction: vi.fn(), create: vi.fn(), update: vi.fn(), previous: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/employee-access-engine', () => ({ canAccessFeatureEngine: m.access }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
vi.mock('@/lib/db', () => ({ db: { employee: { findUnique: m.target }, featureAccessRule: { findMany: m.list }, $transaction: m.transaction } }));
import { GET, POST } from '@/app/api/employee-access/feature-access/route';
const input = { ownerType: 'EMPLOYEE', ownerId: 'emp', featureKey: 'employee.fields.salary.view', isEnabled: false, requiresApproval: false, limitValue: 0, reason: 'Revoke salary visibility' };
const req = (body: unknown = input) => new NextRequest('https://alo.test/api/employee-access/feature-access', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue({ userId: 'master', actorUserId: 'master', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'] });
  m.access.mockResolvedValue(true); m.target.mockResolvedValue({ id: 'emp' }); m.list.mockResolvedValue([]);
  m.transaction.mockImplementation(async callback => callback({ featureAccessRule: { create: m.create, update: m.update, findUnique: m.previous } }));
  m.create.mockResolvedValue({ id: 'rule', ...input }); m.update.mockResolvedValue({ id: 'rule', ...input });
});
describe('employee feature rule persistence and authorization', () => {
  it('keeps unauthenticated errors', async () => { m.auth.mockResolvedValue(NextResponse.json({}, { status: 401 })); expect((await POST(req())).status).toBe(401); });
  it.each(['ADMIN', 'HR_MANAGER', 'EMPLOYEE', 'STUDENT', 'PARTNER'])('cannot grant a permission as %s', async userType => {
    m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'staff', userType, roles: [userType] });
    expect((await POST(req())).status).toBe(403); expect(m.transaction).not.toHaveBeenCalled();
  });
  it('cannot grant permissions while acting as an employee', async () => {
    m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'master', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'], actingAsSessionId: 'acting' });
    expect((await POST(req())).status).toBe(403);
  });
  it('does not list other employees rules without management access', async () => {
    m.access.mockResolvedValue(false); expect((await GET(new NextRequest('https://alo.test/api/employee-access/feature-access'))).status).toBe(403); expect(m.list).not.toHaveBeenCalled();
  });
  it.each([{ ...input, allowedRoles: ['ADMIN'] }, { ...input, limitValue: -1 }, { ...input, reason: '' }])('rejects unsupported fields or invalid values', async body => {
    expect((await POST(req(body))).status).toBe(400); expect(m.transaction).not.toHaveBeenCalled();
  });
  it('requires a real employee record', async () => { m.target.mockResolvedValue(null); expect((await POST(req())).status).toBe(404); });
  it('persists only schema fields and audits in the same transaction', async () => {
    expect((await POST(req())).status).toBe(201);
    expect(m.create).toHaveBeenCalledWith({ data: { ownerType: 'EMPLOYEE', ownerId: 'emp', featureKey: input.featureKey, isEnabled: false, requiresApproval: false, limitValue: 0, createdBy: 'master', updatedBy: 'master' } });
    expect(m.audit).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'PERMISSION_REVOKED', 'FeatureAccessRule', 'rule', expect.objectContaining({ reason: input.reason }), expect.any(Request));
  });
  it('updates existing employee rules while preserving old values in audit', async () => {
    m.previous.mockResolvedValue({ id: 'rule', ownerType: 'EMPLOYEE', isEnabled: true });
    expect((await POST(req({ ...input, id: 'rule' }))).status).toBe(200); expect(m.update).toHaveBeenCalled(); expect(m.create).not.toHaveBeenCalled();
  });
  it('never reports success if audit fails', async () => { m.audit.mockRejectedValue(new Error('private-storage-details')); const response = await POST(req()); expect(response.status).toBe(503); expect(await response.text()).not.toContain('private-storage-details'); });
});
