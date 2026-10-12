import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockDb, mockAuthenticateRequest } = vi.hoisted(() => {
  const method = () => vi.fn();
  return {
    mockAuthenticateRequest: vi.fn(),
    mockDb: {
      employee: { findUnique: method(), findMany: method(), count: method() },
      marketingLead: { count: method(), findMany: method() },
      student: { count: method(), findMany: method() },
      application: { count: method(), findMany: method() },
      visaCase: { count: method(), findMany: method() },
      counselorTask: { count: method() },
      portalNotification: { count: method() },
      hrmNotification: { count: method() },
      communicationThread: { count: method(), aggregate: method() },
      slaEvent: { count: method() },
      appointment: { count: method() },
      employeeHRProfile: { count: method() },
      leaveRequest: { count: method() },
      employeeAttendance: { count: method() },
      marketingCampaign: { count: method(), findMany: method() },
      employeePayroll: { count: method() },
      employeeCommission: { count: method() },
      portalStudentProfile: { count: method() },
      portalAuditLog: { create: method() },
    },
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: mockAuthenticateRequest }));
vi.mock('@/lib/ucc/document-access', () => ({ canViewUccB2B: () => false }));

import { GET } from '@/app/api/employee/dashboard/route';

const employee = {
  id: 'employee-db-id',
  userId: 'portal-user-id',
  employeeId: 'EMP-42',
  status: 'active',
  role: 'counselor',
  branch: 'Dhaka',
  destinationFocus: '[]',
};
const counselorAuth = {
  userId: 'portal-user-id',
  userType: 'EMPLOYEE',
  roles: ['COUNSELOR'],
  actorUserId: 'portal-user-id',
  actorEmail: 'counselor@example.test',
  actorName: 'Test Counselor',
};

function mockZeroCounts() {
  for (const model of Object.values(mockDb)) {
    for (const fn of Object.values(model)) {
      if (typeof fn === 'function' && 'mockResolvedValue' in fn) {
        (fn as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      }
    }
  }
  mockDb.employee.findUnique.mockResolvedValue(employee);
  mockDb.employee.findMany.mockResolvedValue([employee]);
  mockDb.marketingLead.findMany.mockResolvedValue([]);
  mockDb.student.findMany.mockResolvedValue([]);
  mockDb.application.findMany.mockResolvedValue([]);
  mockDb.visaCase.findMany.mockResolvedValue([]);
  mockDb.marketingCampaign.findMany.mockResolvedValue([]);
  mockDb.communicationThread.aggregate.mockResolvedValue({ _sum: { unreadCount: 0 } });
  mockDb.portalAuditLog.create.mockResolvedValue({ id: 'audit-1' });
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, any>>;
}

describe('employee dashboard authorization and data scope', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZeroCounts();
  });

  afterEach(() => vi.restoreAllMocks());

  it('rejects a client-selected role the authenticated employee does not hold', async () => {
    mockAuthenticateRequest.mockResolvedValue(counselorAuth);

    const response = await GET(new NextRequest('https://alo.test/api/employee/dashboard?role=SUPER_ADMIN'));

    expect(response.status).toBe(403);
    expect(mockDb.marketingLead.count).not.toHaveBeenCalled();
    expect(mockDb.student.findMany).not.toHaveBeenCalled();
  });

  it('uses only the authenticated counselor assignment IDs for lead, student, and application reads', async () => {
    mockAuthenticateRequest.mockResolvedValue(counselorAuth);

    const response = await GET(new NextRequest('https://alo.test/api/employee/dashboard?role=COUNSELOR'));
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    for (const call of mockDb.marketingLead.count.mock.calls) {
      expect(call[0]?.where?.counselorId?.in).toEqual(expect.arrayContaining(['portal-user-id', 'employee-db-id', 'EMP-42']));
    }
    expect(mockDb.marketingLead.findMany.mock.calls[0]?.[0]?.where?.counselorId?.in)
      .toEqual(expect.arrayContaining(['portal-user-id', 'employee-db-id', 'EMP-42']));
    expect(mockDb.student.findMany.mock.calls[0]?.[0]?.where?.counselorId?.in)
      .toEqual(expect.arrayContaining(['portal-user-id', 'employee-db-id', 'EMP-42']));
    expect(mockDb.application.count.mock.calls.every(([args]) => args?.where?.AND)).toBe(true);
    expect(body.metrics).not.toHaveProperty('socialInquiriesToday');
    expect(body.metrics).not.toHaveProperty('topChannel');
    expect(body.metrics).not.toHaveProperty('interviewsScheduled', 4);
    expect(body.metrics.unreadMessages).toBe(0);
    expect(mockDb.communicationThread.aggregate.mock.calls[0]?.[0]?.where?.assignedToId?.in)
      .toEqual(expect.arrayContaining(['portal-user-id', 'employee-db-id', 'EMP-42']));
    expect(body.metrics).not.toHaveProperty('totalLeadsGenerated');
  });

  it('does not return employee data when the account has no active Employee record', async () => {
    mockAuthenticateRequest.mockResolvedValue(counselorAuth);
    mockDb.employee.findUnique.mockResolvedValue({ ...employee, status: 'terminated' });

    const response = await GET(new NextRequest('https://alo.test/api/employee/dashboard?role=COUNSELOR'));

    expect(response.status).toBe(403);
    expect(mockDb.marketingLead.count).not.toHaveBeenCalled();
    expect(mockDb.portalAuditLog.create).not.toHaveBeenCalled();
  });

  it('requires an assigned branch before returning branch or HR metrics', async () => {
    mockAuthenticateRequest.mockResolvedValue({ ...counselorAuth, roles: ['BRANCH_MANAGER'] });
    mockDb.employee.findUnique.mockResolvedValue({ ...employee, role: 'branch_manager', branch: '' });

    const response = await GET(new NextRequest('https://alo.test/api/employee/dashboard?role=BRANCH_MANAGER'));

    expect(response.status).toBe(403);
    expect(mockDb.marketingLead.count).not.toHaveBeenCalled();
  });

  it('requires an assigned destination scope before returning country-manager metrics', async () => {
    mockAuthenticateRequest.mockResolvedValue({ ...counselorAuth, roles: ['COUNTRY_MANAGER'] });
    mockDb.employee.findUnique.mockResolvedValue({ ...employee, role: 'country_manager', destinationFocus: '[]' });

    const response = await GET(new NextRequest('https://alo.test/api/employee/dashboard?role=COUNTRY_MANAGER'));

    expect(response.status).toBe(403);
    expect(mockDb.marketingLead.count).not.toHaveBeenCalled();
  });
});
