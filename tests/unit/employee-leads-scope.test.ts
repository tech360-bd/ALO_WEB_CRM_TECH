import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockDb, mockAuthenticateRequest, mockCheckRateLimit } = vi.hoisted(() => {
  const fn = () => vi.fn();
  return {
    mockAuthenticateRequest: vi.fn(),
    mockCheckRateLimit: vi.fn(() => ({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 })),
    mockDb: {
      employee: { findUnique: fn(), findMany: fn() },
      marketingLead: { count: fn(), findMany: fn() },
      crmAuditLog: { create: fn() },
      $transaction: fn(),
    },
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: mockAuthenticateRequest }));
vi.mock('@/lib/rate-limiter', () => ({ checkRateLimit: mockCheckRateLimit }));

import { GET, POST } from '@/app/api/employee/leads/route';

const auth = {
  userId: 'portal-user-id',
  userType: 'EMPLOYEE',
  roles: ['COUNSELOR'],
  name: 'Test Counselor',
  actorUserId: 'portal-user-id',
  actorEmail: 'counselor@example.test',
  actorName: 'Test Counselor',
};
const employee = {
  id: 'employee-id', userId: 'portal-user-id', employeeId: 'EMP-1',
  status: 'active', branch: 'Dhaka', role: 'counselor',
};

function setAuthorizedMocks() {
  mockAuthenticateRequest.mockResolvedValue(auth);
  mockDb.employee.findUnique.mockResolvedValue(employee);
  mockDb.employee.findMany.mockResolvedValue([employee]);
  mockDb.marketingLead.count.mockResolvedValue(0);
  mockDb.marketingLead.findMany.mockResolvedValue([]);
}

describe('employee leads API scope and defaults', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setAuthorizedMocks();
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 });
  });

  it('rejects organization-wide lead reads for a counselor', async () => {
    const response = await GET(new NextRequest('https://alo.test/api/employee/leads?scope=all'));
    expect(response.status).toBe(403);
    expect(mockDb.marketingLead.findMany).not.toHaveBeenCalled();
  });

  it('filters assigned lead reads by authenticated assignment identities', async () => {
    const response = await GET(new NextRequest('https://alo.test/api/employee/leads?scope=assigned'));
    expect(response.status).toBe(200);
    expect(mockDb.marketingLead.findMany.mock.calls[0]?.[0]?.where?.counselorId?.in)
      .toEqual(expect.arrayContaining(['portal-user-id', 'employee-id', 'EMP-1']));
  });

  it('blocks cross-origin cookie-authenticated lead creation', async () => {
    const response = await POST(new NextRequest('https://alo.test/api/employee/leads', {
      method: 'POST',
      headers: { origin: 'https://attacker.test', 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test Lead', phone: '+8801712345678' }),
    }));
    expect(response.status).toBe(403);
    expect(mockAuthenticateRequest).not.toHaveBeenCalled();
  });

  it('does not invent a destination, level, intake, hot score, or consent on creation', async () => {
    const lead = { id: 'lead-1', name: 'Test Lead', phone: '+8801712345678', destination: '', level: '', intake: '', status: 'new' };
    const tx = {
      marketingLead: { create: vi.fn().mockResolvedValue(lead) },
      crmAuditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-1' }) },
    };
    mockDb.$transaction.mockImplementation(async (callback: (client: typeof tx) => unknown) => callback(tx));

    const response = await POST(new NextRequest('https://alo.test/api/employee/leads', {
      method: 'POST',
      headers: { origin: 'https://alo.test', 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test Lead', phone: '+8801712345678' }),
    }));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    const createData = tx.marketingLead.create.mock.calls[0]?.[0]?.data;
    expect(createData).toMatchObject({
      destination: '', level: '', intake: '', source: 'employee_direct_contact',
      counselorId: 'portal-user-id', status: 'new',
    });
    expect(createData).not.toHaveProperty('hotLead');
    expect(createData).not.toHaveProperty('score');
    expect(createData).not.toHaveProperty('consent');
    expect(tx.crmAuditLog.create).toHaveBeenCalledOnce();
  });
});
