import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockDb, mockAuthenticateRequest, mockLogAuditAction } = vi.hoisted(() => {
  const method = () => vi.fn();
  return {
    mockAuthenticateRequest: vi.fn(),
    mockLogAuditAction: vi.fn(),
    mockDb: {
      employee: { findUnique: method() },
      employeeProfile: { findUnique: method() },
      employeeDocument: { findMany: method() },
      employeeAttendance: { findMany: method() },
      employeeLeave: { findMany: method() },
      employeePayroll: { findMany: method() },
      employeeDevice: { findMany: method() },
      employeeAgreement: { findMany: method() },
      employeeAgreementAcceptance: { findMany: method() },
      portalNotification: { findMany: method() },
      employeePermissionRequest: { findMany: method() },
      employeeLoginLog: { findMany: method() },
    },
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: mockAuthenticateRequest,
  logAuditAction: mockLogAuditAction,
}));

import { GET } from '@/app/api/employee-access/employee-dashboard/route';

const auth = { userId: 'user-1', userType: 'EMPLOYEE', roles: ['COUNSELOR'], actorUserId: 'user-1' };
const employee = { id: 'employee-row-1', userId: 'user-1', employeeId: 'ALO-EMP-2030001', status: 'active' };

function resetMocks() {
  vi.clearAllMocks();
  mockAuthenticateRequest.mockResolvedValue(auth);
  mockDb.employee.findUnique.mockResolvedValue(employee);
  mockDb.employeeProfile.findUnique.mockResolvedValue({ userId: employee.userId });
  mockDb.employeeDocument.findMany.mockResolvedValue([]);
  mockDb.employeeAttendance.findMany.mockResolvedValue([]);
  mockDb.employeeLeave.findMany.mockResolvedValue([]);
  mockDb.employeePayroll.findMany.mockResolvedValue([]);
  mockDb.employeeDevice.findMany.mockResolvedValue([]);
  mockDb.employeeAgreement.findMany.mockResolvedValue([]);
  mockDb.employeeAgreementAcceptance.findMany.mockResolvedValue([]);
  mockDb.portalNotification.findMany.mockResolvedValue([]);
  mockDb.employeePermissionRequest.findMany.mockResolvedValue([]);
  mockDb.employeeLoginLog.findMany.mockResolvedValue([]);
  mockLogAuditAction.mockResolvedValue(undefined);
}

describe('employee self-service access control', () => {
  beforeEach(resetMocks);

  it.each([
    ['no Employee record', null],
    ['inactive Employee record', { ...employee, status: 'terminated' }],
  ])('denies an authenticated caller with %s before reading HR records', async (_caseName, employeeRecord) => {
    mockDb.employee.findUnique.mockResolvedValue(employeeRecord);

    const response = await GET(new NextRequest('https://alo.test/api/employee-access/employee-dashboard'));

    expect(response.status).toBe(403);
    expect(mockDb.employeeDocument.findMany).not.toHaveBeenCalled();
    expect(mockDb.employeePayroll.findMany).not.toHaveBeenCalled();
    expect(mockDb.employeeAgreement.findMany).not.toHaveBeenCalled();
    expect(mockLogAuditAction).not.toHaveBeenCalled();
  });

  it('scopes every employee-owned read to the authenticated employee ID aliases', async () => {
    const response = await GET(new NextRequest('https://alo.test/api/employee-access/employee-dashboard'));

    expect(response.status).toBe(200);
    const scope = { in: [employee.id, employee.userId, employee.employeeId] };
    expect(mockDb.employeeDocument.findMany.mock.calls[0]?.[0]?.where.employeeId).toEqual(scope);
    expect(mockDb.employeeAttendance.findMany.mock.calls[0]?.[0]?.where.employeeId).toEqual(scope);
    expect(mockDb.employeeLeave.findMany.mock.calls[0]?.[0]?.where.employeeId).toEqual(scope);
    expect(mockDb.employeePayroll.findMany.mock.calls[0]?.[0]?.where.employeeId).toEqual(scope);
    expect(mockDb.employeeDevice.findMany.mock.calls[0]?.[0]?.where.employeeId).toEqual(scope);
    expect(mockDb.employeeAgreementAcceptance.findMany.mock.calls[0]?.[0]?.where.employeeId).toEqual(scope);
    expect(mockDb.employeePermissionRequest.findMany.mock.calls[0]?.[0]?.where.employeeId).toEqual(scope);
    expect(mockDb.employeeLoginLog.findMany.mock.calls[0]?.[0]?.where.OR).toEqual([
      { employeeId: scope }, { userId: employee.userId },
    ]);
  });

  it('does not expose agreement content or file URLs and only selects this employee’s acceptances', async () => {
    await GET(new NextRequest('https://alo.test/api/employee-access/employee-dashboard'));

    const args = mockDb.employeeAgreement.findMany.mock.calls[0]?.[0];
    expect(args.where).toEqual({ status: 'active' });
    expect(args.select).not.toHaveProperty('content');
    expect(args.select).not.toHaveProperty('fileUrl');
    expect(args.select.acceptances.where.employeeId).toEqual({ in: [employee.id, employee.userId, employee.employeeId] });
  });

  it('audits access to the sensitive self-service dashboard without logging private values', async () => {
    await GET(new NextRequest('https://alo.test/api/employee-access/employee-dashboard'));

    expect(mockLogAuditAction).toHaveBeenCalledWith(auth, 'EMPLOYEE_PRIVATE_SELF_SERVICE_VIEWED', 'Employee', employee.id, {
      categories: expect.arrayContaining(['documents', 'payroll']),
      selfService: true,
    });
  });
});
