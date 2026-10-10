import { beforeEach, describe, expect, it, vi } from 'vitest';
const { db } = vi.hoisted(() => ({ db: { employee: { findUnique: vi.fn() }, employeePayroll: { findMany: vi.fn() } } }));
vi.mock('@/lib/db', () => ({ db }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: (req: Request, auth: unknown) => Promise<Response>) => (req: Request) => handler(req, { userId: 'own', actorUserId: 'own', roles: ['employee'], userType: 'EMPLOYEE' }) }));
import { GET } from '@/app/api/hrm/payroll/route';
beforeEach(() => vi.resetAllMocks());
describe('HRM payroll explicit employee scope', () => {
  it.each(['list', 'slip'])('denies another employee in %s view before salary query', async view => {
    db.employee.findUnique.mockResolvedValue({ userId: 'other' });
    expect((await GET(new Request(`https://example.com/api/hrm/payroll?employeeId=other&period=2026-10&view=${view}`))).status).toBe(403);
    expect(db.employeePayroll.findMany).not.toHaveBeenCalled();
  });
  it('permits own payroll list', async () => {
    db.employee.findUnique.mockResolvedValue({ userId: 'own' });
    db.employeePayroll.findMany.mockResolvedValue([]);
    expect((await GET(new Request('https://example.com/api/hrm/payroll?employeeId=own&period=2026-10'))).status).toBe(200);
  });
});
