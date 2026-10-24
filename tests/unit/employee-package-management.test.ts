import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), package: vi.fn(), employee: vi.fn(), transaction: vi.fn(), create: vi.fn(), update: vi.fn(), assignment: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
vi.mock('@/lib/db', () => ({ db: { permissionPackage: { findUnique: m.package }, employee: { findUnique: m.employee }, $transaction: m.transaction } }));
import { GET, POST, PATCH } from '@/app/api/employee-access/permission-packages/route';
const permission = { featureKey: 'student', action: 'view', scopeType: 'BRANCH', scopeId: 'Dhaka' };
const body = { name: 'Branch counselor', permissions: [permission], reason: 'Limit staff to assigned branch' };
const assignment = { operation: 'assign', employeeId: 'employee', packageId: 'pkg', startsAt: '2026-10-24T10:00:00.000Z', expiresAt: '2026-11-24T10:00:00.000Z', reason: 'Approved branch coverage' };
const request = (input: unknown, method = 'POST') => new NextRequest('https://alo.test/api/employee-access/permission-packages', { method, body: JSON.stringify(input), headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ userId: 'master', actorUserId: 'master', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'] });
  m.employee.mockResolvedValue({ id: 'employee', userId: 'staff', status: 'active' }); m.package.mockResolvedValue({ id: 'pkg' }); m.create.mockResolvedValue({ id: 'saved' }); m.update.mockResolvedValue({ id: 'saved' }); m.assignment.mockResolvedValue({ id: 'old', isActive: true });
  m.transaction.mockImplementation(async callback => callback({ permissionPackage: { create: m.create, update: m.update }, employeePermissionPackageAssignment: { create: m.create, update: m.update, findUnique: m.assignment } }));
});
describe('audited package administration', () => {
  it.each(['EMPLOYEE','ADMIN','HR_MANAGER','STUDENT','PARTNER'])('blocks %s from package reads and writes', async role => {
    m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'staff', userType: role, roles: [role] });
    expect((await GET(request(body))).status).toBe(403); expect((await POST(request(body))).status).toBe(403); expect((await PATCH(request(assignment, 'PATCH'))).status).toBe(403); expect(m.transaction).not.toHaveBeenCalled();
  });
  it('blocks acting-as master sessions', async () => { m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'master', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'] }); expect((await POST(request(body))).status).toBe(403); });
  it.each([{ ...permission, scopeId: '' }, { ...permission, action: '*' }, { ...permission, scopeType: 'UNRESTRICTED' }])('rejects malformed permission scope or action', async entry => { expect((await POST(request({ ...body, permissions: [entry] }))).status).toBe(400); });
  it('rejects duplicate grant entries', async () => { expect((await POST(request({ ...body, permissions: [permission, permission] }))).status).toBe(400); });
  it('creates and audits a package in the same transaction', async () => { expect((await POST(request(body))).status).toBe(201); expect(m.audit).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), 'PERMISSION_PACKAGE_CREATED', 'PermissionPackage', 'saved', expect.objectContaining({ reason: body.reason }), expect.any(Request)); });
  it('rejects employee self-grants', async () => { m.employee.mockResolvedValue({ id: 'employee', userId: 'master', status: 'active' }); expect((await PATCH(request(assignment, 'PATCH'))).status).toBe(403); });
  it('rejects expiry before start', async () => { expect((await PATCH(request({ ...assignment, expiresAt: '2026-10-01T00:00:00Z' }, 'PATCH'))).status).toBe(400); });
  it('assigns a real active employee and audits', async () => { expect((await PATCH(request(assignment, 'PATCH'))).status).toBe(200); expect(m.audit.mock.calls[0][2]).toBe('PERMISSION_PACKAGE_ASSIGNED'); });
  it('retains revoked assignment history', async () => { expect((await PATCH(request({ operation: 'revoke', assignmentId: 'old', reason: 'Employee transfer approved' }, 'PATCH'))).status).toBe(200); expect(m.update).toHaveBeenCalledWith({ where: { id: 'old' }, data: { status: 'revoked', isActive: false } }); });
  it('fails safely if audit persistence fails', async () => { m.audit.mockRejectedValue(new Error('private database error')); const response = await POST(request(body)); expect(response.status).toBe(503); expect(await response.text()).not.toContain('private database error'); });
});
