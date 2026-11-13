import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const m = vi.hoisted(() => ({
  auth: vi.fn(),
  access: vi.fn(),
  audit: vi.fn(),
  target: vi.fn(),
  list: vi.fn(),
  previous: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth, logAuditAction: m.audit }));
vi.mock('@/lib/employee-access-engine', () => ({ canAccessFeatureEngine: m.access }));
vi.mock('@/lib/transactional-audit', () => ({ writePortalAudit: m.audit }));
vi.mock('@/lib/db', () => ({
  db: {
    employee: { findFirst: m.target },
    featureAccessRule: { findMany: m.list, findFirst: m.previous, create: m.create, update: m.update },
  },
}));

import { GET, POST } from '@/app/api/employee-access/feature-access/route';

const input = {
  employeeId: 'EMP-1',
  featureKey: 'employee.fields.salary.view',
  action: 'view',
  isEnabled: false,
  requiresApproval: false,
  limitValue: 0,
};

const req = (body: unknown = input) => new NextRequest('https://alo.test/api/employee-access/feature-access', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

const superAdmin = () => ({
  userId: 'master',
  actorUserId: 'master',
  userType: 'SUPER_ADMIN',
  roles: ['SUPER_ADMIN'],
  permissions: [],
});

beforeEach(() => {
  vi.resetAllMocks();
  m.auth.mockResolvedValue(superAdmin());
  m.access.mockResolvedValue(true);
  m.target.mockResolvedValue({ id: 'employee-db-id', userId: 'emp-user', employeeId: 'EMP-1' });
  m.list.mockResolvedValue([]);
  m.previous.mockResolvedValue(null);
  m.create.mockResolvedValue({ id: 'rule', ...input });
  m.update.mockResolvedValue({ id: 'rule', ...input });
  m.audit.mockResolvedValue(undefined);
});

describe('employee feature rule persistence and authorization', () => {
  it('keeps unauthenticated errors', async () => {
    m.auth.mockResolvedValue(NextResponse.json({}, { status: 401 }));
    expect((await POST(req())).status).toBe(401);
  });

  it.each(['ADMIN', 'HR_MANAGER', 'EMPLOYEE', 'STUDENT', 'PARTNER'])('cannot grant a permission as %s', async (userType) => {
    m.auth.mockResolvedValue({ ...superAdmin(), userType, roles: [userType] });
    expect((await POST(req())).status).toBe(403);
    expect(m.create).not.toHaveBeenCalled();
    expect(m.update).not.toHaveBeenCalled();
  });

  it('cannot grant permissions while acting as an employee', async () => {
    // Regression: an impersonation session was previously accepted because the
    // route only checked the role list, letting an acting Super Admin widen the
    // target employee's access.
    m.auth.mockResolvedValue({ ...superAdmin(), actingAsSessionId: 'acting' });
    expect((await POST(req())).status).toBe(403);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('never lists other employees rules for a non-super-admin', async () => {
    m.auth.mockResolvedValue({ ...superAdmin(), userType: 'EMPLOYEE', roles: ['EMPLOYEE'] });
    const response = await GET(new NextRequest('https://alo.test/api/employee-access/feature-access'));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.rules).toEqual([]);
    expect(body.canManageRules).toBe(false);
    expect(m.list).not.toHaveBeenCalled();
  });

  it.each([
    { ...input, featureKey: 'Not A Key!' },
    { ...input, limitValue: -1 },
    { ...input, employeeId: '' },
  ])('rejects invalid values', async (body) => {
    expect((await POST(req(body))).status).toBe(400);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('requires a real employee record', async () => {
    m.target.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(404);
    expect(m.create).not.toHaveBeenCalled();
  });

  it('persists only schema fields and audits the grant', async () => {
    const response = await POST(req());
    expect(response.status).toBe(201);
    expect(m.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        ownerType: 'employee',
        ownerId: 'employee-db-id',
        featureKey: input.featureKey,
        isEnabled: false,
        requiresApproval: false,
        limitValue: 0,
        createdBy: 'master',
        updatedBy: 'master',
      }),
    });
    expect(m.audit).toHaveBeenCalledWith(
      expect.any(Object),
      'EMPLOYEE_FEATURE_ACCESS_CREATED',
      'FeatureAccessRule',
      'rule',
      expect.any(Object),
    );
  });

  it('updates an existing employee rule instead of duplicating it', async () => {
    m.previous.mockResolvedValue({ id: 'rule' });
    expect((await POST(req())).status).toBe(200);
    expect(m.update).toHaveBeenCalled();
    expect(m.create).not.toHaveBeenCalled();
    expect(m.audit).toHaveBeenCalledWith(expect.any(Object), 'EMPLOYEE_FEATURE_ACCESS_UPDATED', 'FeatureAccessRule', 'rule', expect.any(Object));
  });

  it('never reports success if the audit write fails', async () => {
    m.audit.mockRejectedValue(new Error('private-storage-details'));
    const response = await POST(req());
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain('private-storage-details');
  });
});
