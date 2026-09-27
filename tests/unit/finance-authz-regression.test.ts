/**
 * ALO Education — payroll & finance authorization regression tests.
 *
 * 2026-09-18 audit finding (SEC-F): both routes were fully unauthenticated.
 *   GET  /api/hr/payroll  → every payroll record (all employee salaries)
 *   PATCH /api/hr/payroll → set any row to APPROVED/PAID with a body-supplied
 *                           `approvedBy`, forging the approval + audit entry
 *   GET  /api/finance     → total revenue, pending/paid partner and employee
 *                           commissions, recent payments, commission records
 *
 * Real handlers, real `withAuth`. Only `@/lib/db` and `next-auth` are mocked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { dbCalls, dbMock } = vi.hoisted(() => {
  const calls: string[] = [];
  const record = (name: string) => (..._args: unknown[]) => {
    calls.push(name);
    return Promise.resolve(null);
  };
  const many = (name: string) => (..._args: unknown[]) => {
    calls.push(name);
    return Promise.resolve([]);
  };
  return {
    dbCalls: calls,
    dbMock: {
      payroll: { findMany: many('payroll.findMany'), update: record('payroll.update') },
      payment: { findMany: many('payment.findMany') },
      employeeCommission: { findMany: many('employeeCommission.findMany') },
      auditLog: { create: record('auditLog.create') },
      portalSession: { findUnique: record('portalSession.findUnique') },
      portalStudentProfile: { findFirst: record('portalStudentProfile.findFirst') },
      user: { findUnique: record('user.findUnique') },
    },
  };
});

vi.mock('@/lib/db', () => ({ db: dbMock }));
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve(null)),
  NextAuth: vi.fn(),
}));

import { GET as payrollGET, PATCH as payrollPATCH } from '@/app/api/hr/payroll/route';
import { GET as financeGET } from '@/app/api/finance/route';

const req = (init?: RequestInit) => new Request('http://localhost/api/x', init);

beforeEach(() => {
  dbCalls.length = 0;
});

describe('SEC-F /api/hr/payroll — salaries and payment approval must be staff-only', () => {
  it('rejects unauthenticated GET with 401 and never reads payroll', async () => {
    const res = await payrollGET(req() as never);
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('payroll.findMany');
  });

  it('rejects unauthenticated PATCH with 401 and never approves a payment', async () => {
    const res = await payrollPATCH(
      req({
        method: 'PATCH',
        body: JSON.stringify({ id: 'pay-1', status: 'PAID', approvedBy: 'attacker' }),
      }) as never
    );
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('payroll.update');
    expect(dbCalls).not.toContain('auditLog.create');
  });

  it('rejects a forged bearer token with 401', async () => {
    const res = await payrollGET(req({ headers: { authorization: 'Bearer forged-value' } }) as never);
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('payroll.findMany');
  });
});

describe('SEC-F /api/finance — company financials must be staff-only', () => {
  it('rejects unauthenticated GET with 401 and never reads payments', async () => {
    const res = await financeGET(req() as never, undefined as never);
    expect(res.status).toBe(401);
    expect(dbCalls).not.toContain('payment.findMany');
    expect(dbCalls).not.toContain('employeeCommission.findMany');
  });
});

describe('SEC-F no payroll/finance route may ship without an auth reference', () => {
  it('payroll and finance routes both import the auth middleware', async () => {
    const { readFileSync } = await import('node:fs');
    for (const f of ['src/app/api/hr/payroll/route.ts', 'src/app/api/finance/route.ts']) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).toMatch(/withAuth/);
      expect(src, f).not.toMatch(/approvedBy\s*[,}].*=\s*body/);
    }

    const payroll = readFileSync('src/app/api/admin/payroll/route.ts', 'utf8');
    expect(payroll).toMatch(/employeePayroll\.findUnique/);
    expect(payroll).toMatch(/preparedBy\s*\|\|\s*payrollToApprove\.reviewedBy/);
    expect(payroll).not.toMatch(/const\s*\{[^}]*makerId[^}]*\}\s*=\s*await\s*req\.json/);
  });
});
