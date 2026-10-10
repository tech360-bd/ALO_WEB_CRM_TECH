import { beforeEach, describe, expect, it, vi } from 'vitest';

const harness = vi.hoisted(() => {
  const auth: any = { userId: 'maker-1', email: 'maker@example.test', name: 'Maker', userType: 'HR_MANAGER', roles: ['HR_MANAGER'], permissions: [], sessionId: 'session-1', actorUserId: 'maker-1', actorEmail: 'maker@example.test', actorName: 'Maker' };
  const state: any = { tx: null, transactionCalls: 0, auditCalls: 0, accessAllowed: true };
  const db: any = {
    $transaction: vi.fn(async (callback: (tx: any) => Promise<unknown>) => {
      state.transactionCalls += 1;
      try { return await callback(state.tx); } catch (error) { state.rolledBack = true; throw error; }
    }),
    employeePayroll: { findUnique: vi.fn(), findFirst: vi.fn() },
  };
  return { auth, state, db };
});

vi.mock('@/lib/db', () => ({ db: harness.db }));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: any) => (request: Request) => handler(request, harness.auth),
}));
vi.mock('@/lib/access-control/central-security-engine', () => ({
  validateRequestAccess: vi.fn(async () => ({ allowed: harness.state.accessAllowed })),
  canApproveAction: vi.fn(() => ({ allowed: true })),
  logSecurityAudit: vi.fn(async () => { harness.state.auditCalls += 1; }),
}));

import { POST } from '@/app/api/admin/payroll/route';

const request = (body: Record<string, unknown>) => new Request('http://localhost/api/admin/payroll', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});
const goodSalary = (employeeId: string) => ({ employeeId, basicSalary: 60000, grossSalary: 100000, taxDeduction: 10000, pfDeduction: 5000, housingAllow: 20000, transportAllow: 10000, medicalAllow: 10000, otherAllow: 0 });

beforeEach(() => {
  harness.state.transactionCalls = 0;
  harness.state.auditCalls = 0;
  harness.state.rolledBack = false;
  harness.state.accessAllowed = true;
  harness.auth.userId = 'maker-1';
  harness.auth.roles = ['HR_MANAGER'];
  harness.db.$transaction.mockClear();
  harness.db.employeePayroll.findUnique.mockReset();
  harness.db.employeePayroll.findFirst.mockReset();
});

describe('admin payroll transaction and state boundaries', () => {
  it('rolls back a partial item failure caused by a missing salary before any run write', async () => {
    const created: string[] = [];
    harness.state.tx = {
      employeePayroll: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn(() => { created.push('run'); return Promise.resolve({ id: 'run-1' }); }),
      },
      employee: { findMany: vi.fn().mockResolvedValue([{ id: 'emp-1', name: 'One' }, { id: 'emp-2', name: 'Two' }]) },
      employeeSalary: { findFirst: vi.fn().mockResolvedValueOnce(goodSalary('emp-1')).mockResolvedValueOnce(null) },
      employeePayrollItem: { create: vi.fn(() => { created.push('item'); return Promise.resolve({}); }) },
    };

    const response = await POST(request({ action: 'prepare_draft', monthYear: '2026-09' }));
    expect(response.status).toBe(422);
    expect(harness.state.rolledBack).toBe(true);
    expect(created).toEqual([]);
  });

  it('rejects a duplicate payroll period inside the transaction', async () => {
    harness.state.tx = {
      employeePayroll: { findFirst: vi.fn().mockResolvedValue({ id: 'existing-run' }), create: vi.fn() },
      employee: { findMany: vi.fn() }, employeeSalary: { findFirst: vi.fn() }, employeePayrollItem: { create: vi.fn() },
    };
    const response = await POST(request({ action: 'prepare_draft', monthYear: '2026-09' }));
    expect(response.status).toBe(409);
    expect(harness.state.tx.employeePayroll.create).not.toHaveBeenCalled();
  });

  it('enforces create permission before opening a transaction', async () => {
    harness.state.accessAllowed = false;
    const response = await POST(request({ action: 'prepare_draft', monthYear: '2026-09' }));
    expect(response.status).toBe(403);
    expect(harness.db.$transaction).not.toHaveBeenCalled();
  });

  it('does not mark approval as paid, and permits paidAt only in the payment action', async () => {
    harness.auth.userId = 'checker-1';
    harness.auth.roles = ['FINANCE'];
    harness.db.employeePayroll.findUnique.mockResolvedValue({ id: 'run-1', status: 'draft', preparedBy: 'maker-1' });
    const updates: any[] = [];
    harness.state.tx = {
      employeePayroll: {
        updateMany: vi.fn(async ({ data }: any) => { updates.push(data); return { count: 1 }; }),
        findUnique: vi.fn(async () => ({ id: 'run-1', status: 'approved' })),
      },
    };
    const approve = await POST(request({ action: 'approve_payroll', payrollId: 'run-1' }));
    expect(approve.status).toBe(200);
    expect(updates[0]).toMatchObject({ status: 'approved', approvedBy: 'checker-1' });
    expect(updates[0]).not.toHaveProperty('paidAt');

    harness.db.employeePayroll.findUnique.mockResolvedValue({ id: 'run-1', status: 'approved', preparedBy: 'maker-1' });
    harness.state.tx.employeePayroll.findUnique.mockResolvedValue({ id: 'run-1', status: 'paid' });
    const pay = await POST(request({ action: 'pay_payroll', payrollId: 'run-1' }));
    expect(pay.status).toBe(200);
    expect(updates[1]).toMatchObject({ status: 'paid' });
    expect(updates[1].paidAt).toBeInstanceOf(Date);
  });
});
