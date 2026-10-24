import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ employee: vi.fn(), payroll: vi.fn(), audit: vi.fn(), auth: { userId: 'staff', actorUserId: 'staff', userType: 'EMPLOYEE' } }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: handler => request => handler(request, m.auth) }));
vi.mock('@/lib/db', () => ({ db: { employee: { findUnique: m.employee }, employeePayroll: { findMany: m.payroll }, portalAuditLog: { create: m.audit } } }));
import { GET } from '@/app/api/employee/salary/route';
const request = (query = '') => new Request(`https://alo.test/api/employee/salary${query}`);
beforeEach(() => {
  vi.resetAllMocks(); m.auth.userType = 'EMPLOYEE';
  m.employee.mockResolvedValue({ id: 'employee-db-id', employeeId: 'EMP-1', name: '<script>alert(1)</script>', status: 'active' });
  m.payroll.mockResolvedValue([{ id: 'payroll-1', period: '2026-10', grossSalary: 1000, netSalary: 900, status: 'approved', paidAt: null }]);
});
describe('employee approved-only salary access', () => {
  it('scopes all reads to the authenticated employee and excludes draft payroll', async () => {
    expect((await GET(request('?employeeId=someone-else&status=draft'))).status).toBe(200);
    expect(m.payroll).toHaveBeenCalledWith(expect.objectContaining({ where: { employeeId: 'employee-db-id', status: { in: ['approved', 'paid'] } }, take: 24 }));
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'SALARY_VIEWED', actorUserId: 'staff' }) }));
  });
  it.each(['STUDENT', 'PARTNER'])('rejects %s before reading payroll', async type => { m.auth.userType = type; expect((await GET(request())).status).toBe(403); expect(m.payroll).not.toHaveBeenCalled(); });
  it('returns no fictional payroll when no approved records exist', async () => {
    m.payroll.mockResolvedValue([]); expect(await (await GET(request())).json()).toEqual({ success: true, breakdown: [], payslips: [] });
  });
  it('cannot download another employee or unapproved payroll', async () => {
    m.payroll.mockResolvedValue([]); expect((await GET(request('?download=foreign-or-draft'))).status).toBe(404);
    expect(m.payroll).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'foreign-or-draft', employeeId: 'employee-db-id', status: { in: ['approved', 'paid'] } } }));
  });
  it('escapes HTML and audits an authorized payslip download', async () => {
    const response = await GET(request('?download=payroll-1'));
    expect(response.headers.get('content-disposition')).toContain('attachment');
    const html = await response.text(); expect(html).toContain('&lt;script&gt;'); expect(html).not.toContain('<script>');
    expect(m.audit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'SALARY_DOWNLOADED' }) }));
  });
  it('fails closed when sensitive salary access cannot be audited', async () => {
    m.audit.mockRejectedValue(new Error('private database details')); const response = await GET(request()); expect(response.status).toBe(503); expect(await response.text()).not.toContain('private database details');
  });
});
