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
      portalAuditLog: { create: fn() },
      $transaction: fn(),
    },
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: mockAuthenticateRequest }));
vi.mock('@/lib/rate-limiter', () => ({ checkRateLimit: mockCheckRateLimit }));

import { GET, POST } from '@/app/api/employee/leads/route';

const auth = {
  identityDomain: 'user', authenticationMethod: 'cookie', permissions: ['s8', 's9'],
  userId: 'user-id',
  userType: 'EMPLOYEE',
  roles: ['COUNSELOR'],
  name: 'Test Counselor',
  actorUserId: 'user-id',
  actorEmail: 'counselor@example.test',
  actorName: 'Test Counselor',
};
const employee = {
  id: 'employee-id', userId: 'user-id', employeeId: 'EMP-1',
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
    vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
    setAuthorizedMocks();
    mockCheckRateLimit.mockReturnValue({ allowed: true, remaining: 4, resetAt: Date.now() + 60_000 });
  });

  it('rejects organization-wide lead reads for a counselor', async () => {
    const response = await GET(new NextRequest('https://alo.test/api/employee/leads?scope=all'));
    expect(response.status).toBe(403);
    expect(mockDb.marketingLead.findMany).not.toHaveBeenCalled();
  });

  it('filters created lead reads only by the verified User FK', async () => {
    const response = await GET(new NextRequest('https://alo.test/api/employee/leads?scope=created'));
    expect(response.status).toBe(200);
    expect(mockDb.marketingLead.findMany.mock.calls[0]?.[0]?.where).toEqual({ createdById: 'user-id' });
    expect(mockDb.employee.findUnique).not.toHaveBeenCalled();
  });

  it('blocks cross-origin cookie-authenticated lead creation', async () => {
    const response = await POST(new NextRequest('https://alo.test/api/employee/leads', {
      method: 'POST',
      headers: { origin: 'https://attacker.test', 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Test Lead', phone: '+8801712345678' }),
    }));
    expect(response.status).toBe(403);
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it('does not invent a destination, level, intake, hot score, or consent on creation', async () => {
    const lead = { id: 'lead-1', name: 'Test Lead', phone: '+8801712345678', destination: '', level: '', intake: '', status: 'new' };
    const tx = {
      marketingLead: { create: vi.fn().mockResolvedValue(lead) },
      portalAuditLog: { create: vi.fn().mockResolvedValue({ id: 'audit-1' }) },
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
      createdById: 'user-id', status: 'new', consent: false,
    });
    expect(createData).not.toHaveProperty('hotLead');
    expect(createData).not.toHaveProperty('score');
    expect(createData).not.toHaveProperty('counselorId');
    expect(tx.portalAuditLog.create).toHaveBeenCalledOnce();
  });
});

it('denies PortalUser IDs even if an Employee row has matching IDs', async () => {
  mockAuthenticateRequest.mockResolvedValue({ ...auth, identityDomain: 'portal' });
  mockDb.employee.findUnique.mockClear();
  const response = await GET(new NextRequest('https://alo.test/api/employee/leads'));
  expect(response.status).toBe(403);
  expect(mockDb.employee.findUnique).not.toHaveBeenCalled();
});
it('reports assigned/team mapping unavailable instead of widening results', async () => {
  setAuthorizedMocks(); mockDb.marketingLead.findMany.mockClear();
  for (const scope of ['assigned', 'team']) {
    expect((await GET(new NextRequest(`https://alo.test/api/employee/leads?scope=${scope}`))).status).toBe(409);
  }
  expect(mockDb.marketingLead.findMany).not.toHaveBeenCalled();
});
