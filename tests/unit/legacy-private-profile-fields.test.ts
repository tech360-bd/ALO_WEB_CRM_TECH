import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), access: vi.fn(), private: vi.fn(), field: vi.fn(), employee: vi.fn(), user: vi.fn(), education: vi.fn(), emergency: vi.fn(), salary: vi.fn(), documents: vi.fn(), transaction: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/access-control/central-security-engine', () => ({ validateRequestAccess: m.access, canViewField: m.field }));
vi.mock('@/lib/employee-access-engine', () => ({ canViewEmployeePrivateProfileEngine: m.private }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
vi.mock('@/lib/db', () => ({ db: { employee: { findFirst: m.employee }, portalUser: { findUnique: m.user }, employeeEducation: { findMany: m.education }, employeeEmergencyContact: { findMany: m.emergency }, employeeSalary: { findMany: m.salary }, employeeDocument: { findMany: m.documents }, $transaction: m.transaction } }));
import { GET, POST, PATCH } from '@/app/api/employee-access/profile/route';
const request = (body?: unknown) => new NextRequest('https://alo.test/api/employee-access/profile?employeeId=emp', body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {});
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'staff', userType: 'EMPLOYEE', roles: ['EMPLOYEE'] }); m.private.mockResolvedValue(true); m.field.mockResolvedValue(false); m.access.mockResolvedValue({ allowed: true }); m.employee.mockResolvedValue({ id: 'emp', userId: 'staff', branch: 'Dhaka', department: 'HR' });
  m.user.mockResolvedValue({ id: 'staff', userType: 'EMPLOYEE', employeeProfile: { id: 'profile', userId: 'staff', employeeId: 'ALO-1', salary: 'unapproved-secret', bankAccount: 'private-bank', bankName: 'private-bank', bankRouting: 'private-routing', nidNumber: 'private-nid' }, status: 'active', emailVerified: true, firstLoginRequired: false, passwordHash: 'isolated-test-hash' });
  for (const fn of [m.education, m.emergency, m.salary, m.documents]) fn.mockResolvedValue([]);
  m.transaction.mockImplementation(async callback => callback({}));
});
describe('legacy private profile identity and field boundaries', () => {
  it('never returns raw salary through the employee own-profile endpoint', async () => { m.field.mockResolvedValue(true); const response = await GET(request()); expect(response.status).toBe(200); const body = await response.json(); expect(body.profile.salary).toBeNull(); expect(body.salary).toEqual([]); expect(m.salary).not.toHaveBeenCalled(); });
  it('queries related rows with the actual employee key, never the portal account key', async () => { await GET(request()); expect(m.education).toHaveBeenCalledWith({ where: { employeeId: 'emp' } }); expect(m.emergency).toHaveBeenCalledWith({ where: { employeeId: 'emp' } }); });
  it('private profile access alone does not grant bank or NID fields', async () => { const response = await GET(request()); const body = await response.text(); expect(body).not.toContain('private-bank'); expect(body).not.toContain('private-nid'); });
  it('rejects unauthorized profiles before reading personal tables', async () => { m.private.mockResolvedValue(false); expect((await GET(request())).status).toBe(403); expect(m.education).not.toHaveBeenCalled(); });
  it('does not mask database failure as an empty education history', async () => { m.education.mockRejectedValue(new Error('sensitive database error')); const response = await GET(request()); expect(response.status).toBe(503); expect(await response.text()).not.toContain('sensitive database error'); });
  it('fails closed when profile audit cannot persist', async () => { m.audit.mockRejectedValue(new Error('audit unavailable')); expect((await GET(request())).status).toBe(503); });
  it.each(['ACTIVE','SUSPENDED','TERMINATED','INACTIVE','REJECTED'])('an employee ID alias cannot bypass self lifecycle approval: %s', async status => { expect((await PATCH(request({ employeeId: 'emp', status, reason: 'Attempted self approval' }))).status).toBe(403); expect(m.transaction).not.toHaveBeenCalled(); });
  it('will not reactivate an unactivated employee account', async () => { m.auth.mockResolvedValue({ userId: 'master', actorUserId: 'master', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'] }); m.user.mockResolvedValue({ userType: 'EMPLOYEE', firstLoginRequired: true, emailVerified: false, status: 'pending' }); expect((await PATCH(request({ employeeId: 'emp', status: 'active', reason: 'Review requested by manager' }))).status).toBe(409); });
  it('does not apply employee lifecycle changes to Student accounts', async () => { m.user.mockResolvedValue({ userType: 'STUDENT' }); expect((await PATCH(request({ employeeId: 'emp', status: 'inactive', reason: 'Incorrect target selected' }))).status).toBe(404); });
  it.each([{ fullName: 'Person', role: 'SUPER_ADMIN' }, { salary: 999 }, { dob: '2026-02-31' }, { nidNumber: '1'.repeat(21) }, { education: Array(26).fill({ degree: 'Degree', institution: 'Institute' }) }, { emergencyContact: { name: 'Person', phone: 42 } }])('rejects unvalidated profile or employment payloads', async body => { expect((await POST(request(body))).status).toBe(400); });
});
