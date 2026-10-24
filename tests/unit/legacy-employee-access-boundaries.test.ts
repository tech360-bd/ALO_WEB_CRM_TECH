import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ auth: vi.fn(), private: vi.fn(), field: vi.fn(), access: vi.fn(), employee: vi.fn(), profile: vi.fn(), documents: vi.fn(), salary: vi.fn(), transaction: vi.fn(), audit: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth, withAuth: (handler: Function) => async (req: Request, context: unknown) => handler(req, await m.auth(), context) }));
vi.mock('@/lib/access-control', () => ({ canViewEmployeePrivateProfile: m.private, FEATURE_DEFINITIONS: [] }));
vi.mock('@/lib/access-control/central-security-engine', () => ({ canViewField: m.field, validateRequestAccess: m.access }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
vi.mock('@/lib/db', () => ({ db: { employee: { findUnique: m.employee }, employeeProfile: { findUnique: m.profile }, employeeDocument: { findMany: m.documents }, employeeSalary: { findFirst: m.salary }, $transaction: m.transaction } }));
import { PATCH as permissionChange, GET as permissions } from '@/app/api/access-control/route';
import { GET as employee } from '@/app/api/employees/[id]/route';
const req = () => new NextRequest('https://alo.test/api/access-control', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: '{}' });
beforeEach(() => {
  vi.resetAllMocks(); m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'staff', userType: 'HR_MANAGER', roles: ['HR_MANAGER'] });
  m.private.mockResolvedValue(false); m.field.mockResolvedValue(false); m.employee.mockResolvedValue({ id: 'emp', userId: 'other', name: 'Person', employeeId: 'ALO-1', branch: 'Dhaka', role: 'EMPLOYEE', privateInternalField: 'never exposed' });
  m.profile.mockResolvedValue({ salary: 'secret salary', bankName: 'secret bank', bankAccount: 'secret account', bankRouting: 'secret routing', nidNumber: 'secret nid', department: 'Admission' }); m.documents.mockResolvedValue([]); m.salary.mockResolvedValue({ id: 'salary', salaryAmount: 999, bankAccount: 'secret account' });
  m.transaction.mockImplementation(async callback => callback({}));
});
describe('legacy employee and permission route bypass prevention', () => {
  it.each(['ADMIN','HR_MANAGER','BRANCH_MANAGER','EMPLOYEE'])('does not allow legacy %s permission administration', async role => {
    m.auth.mockResolvedValue({ userId: 'staff', actorUserId: 'staff', userType: role, roles: [role] });
    expect((await permissionChange(req())).status).toBe(403); expect((await permissions(req())).status).toBe(403); expect(m.transaction).not.toHaveBeenCalled();
  });
  it('denies private profile before reading sensitive tables', async () => {
    expect((await employee(req(), { params: Promise.resolve({ id: 'emp' }) })).status).toBe(403); expect(m.profile).not.toHaveBeenCalled(); expect(m.salary).not.toHaveBeenCalled();
  });
  it('private-profile grant alone does not expose salary, bank, NID or arbitrary employee fields', async () => {
    m.private.mockResolvedValue(true);
    const response = await employee(req(), { params: Promise.resolve({ id: 'emp' }) }); expect(response.status).toBe(200);
    const body = await response.text(); expect(body).not.toContain('secret'); expect(body).not.toContain('privateInternalField'); expect(m.salary).not.toHaveBeenCalled(); expect(m.audit.mock.calls[0][2]).toBe('PROFILE_VIEWED');
  });
  it('own profile never returns draft salary calculations through the legacy endpoint', async () => {
    m.private.mockResolvedValue(true); m.field.mockResolvedValue(true); m.employee.mockResolvedValue({ id: 'emp', userId: 'staff' });
    const response = await employee(req(), { params: Promise.resolve({ id: 'emp' }) });
    expect((await response.json()).employee.profile.salary).toBeNull(); expect(m.salary).not.toHaveBeenCalled();
  });
  it('legacy grant endpoint rejects cross-origin even for master', async () => {
    m.auth.mockResolvedValue({ userId: 'master', actorUserId: 'master', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'] });
    const request = new NextRequest('https://alo.test/api/access-control', { method: 'PATCH', headers: { origin: 'https://other.test' }, body: '{}' });
    expect((await permissionChange(request)).status).toBe(403);
  });
});
