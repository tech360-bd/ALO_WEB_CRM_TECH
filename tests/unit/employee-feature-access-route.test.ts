import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { mockDb, mockAuthenticateRequest, mockLogAuditAction, mockCanAccessFeature } = vi.hoisted(() => {
  const method = () => vi.fn();
  return {
    mockAuthenticateRequest: vi.fn(),
    mockLogAuditAction: vi.fn(),
    mockCanAccessFeature: vi.fn(),
    mockDb: {
      employee: { findFirst: method() },
      featureAccessRule: { findMany: method(), findFirst: method(), create: method(), update: method() },
    },
  };
});

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: mockAuthenticateRequest,
  logAuditAction: mockLogAuditAction,
}));
vi.mock('@/lib/employee-access-engine', () => ({ canAccessFeatureEngine: mockCanAccessFeature }));

import { GET, POST } from '@/app/api/employee-access/feature-access/route';

const superAuth = { userId: 'admin-1', userType: 'ADMIN', roles: ['SUPER_ADMIN'], actorUserId: 'admin-1' };
const employee = { id: 'employee-1', userId: 'user-1', employeeId: 'ALO-EMP-2026001' };

function resetMocks() {
  vi.clearAllMocks();
  mockAuthenticateRequest.mockResolvedValue(superAuth);
  mockLogAuditAction.mockResolvedValue(undefined);
  mockCanAccessFeature.mockResolvedValue(true);
  mockDb.employee.findFirst.mockResolvedValue(employee);
  mockDb.featureAccessRule.findMany.mockResolvedValue([]);
  mockDb.featureAccessRule.findFirst.mockResolvedValue(null);
  mockDb.featureAccessRule.create.mockResolvedValue({ id: 'rule-1', ownerType: 'employee', ownerId: employee.id });
  mockDb.featureAccessRule.update.mockResolvedValue({ id: 'rule-1', ownerType: 'employee', ownerId: employee.id });
}

const request = (body: unknown) => new NextRequest('https://alo.test/api/employee-access/feature-access', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
});

describe('employee-specific feature access rules', () => {
  beforeEach(resetMocks);

  it('prevents non-Super-Admins from enumerating rule configuration', async () => {
    mockAuthenticateRequest.mockResolvedValue({ ...superAuth, roles: ['COUNSELOR'] });

    const response = await GET(new NextRequest('https://alo.test/api/employee-access/feature-access'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.rules).toEqual([]);
    expect(body.canManageRules).toBe(false);
    expect(mockDb.featureAccessRule.findMany).not.toHaveBeenCalled();
  });

  it('denies rule writes to non-Super-Admins before database mutation', async () => {
    mockAuthenticateRequest.mockResolvedValue({ ...superAuth, roles: ['COUNSELOR'] });

    const response = await POST(request({ employeeId: employee.userId, featureKey: 'student', action: 'view' }));

    expect(response.status).toBe(403);
    expect(mockDb.featureAccessRule.create).not.toHaveBeenCalled();
    expect(mockDb.featureAccessRule.update).not.toHaveBeenCalled();
  });

  it('persists schema-valid employee grants and records an audit event', async () => {
    const response = await POST(request({
      employeeId: employee.userId,
      featureKey: 'employee.profile.private',
      action: 'edit',
      isEnabled: true,
      requiresApproval: false,
      limitValue: 0,
    }));

    expect(response.status).toBe(201);
    expect(mockDb.employee.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { OR: [{ id: employee.userId }, { userId: employee.userId }, { employeeId: employee.userId }] },
    }));
    expect(mockDb.featureAccessRule.create).toHaveBeenCalledWith({
      data: {
        ownerType: 'employee', ownerId: employee.id, featureKey: 'employee.profile.private.edit',
        isEnabled: true, limitValue: 0, requiresApproval: false, createdBy: superAuth.userId, updatedBy: superAuth.userId,
      },
    });
    expect(mockLogAuditAction).toHaveBeenCalledWith(superAuth, 'EMPLOYEE_FEATURE_ACCESS_CREATED', 'FeatureAccessRule', 'rule-1', expect.objectContaining({
      employeeId: employee.id, featureKey: 'employee.profile.private', action: 'edit',
    }));
  });

  it('upserts an existing rule without creating a duplicate', async () => {
    mockDb.featureAccessRule.findFirst.mockResolvedValue({ id: 'existing-rule' });

    const response = await POST(request({ employeeId: employee.id, featureKey: 'student', action: 'view', isEnabled: false }));

    expect(response.status).toBe(200);
    expect(mockDb.featureAccessRule.create).not.toHaveBeenCalled();
    expect(mockDb.featureAccessRule.update).toHaveBeenCalledWith({
      where: { id: 'existing-rule' },
      data: { isEnabled: false, limitValue: 0, requiresApproval: false, updatedBy: superAuth.userId },
    });
    expect(mockLogAuditAction).toHaveBeenCalledWith(superAuth, 'EMPLOYEE_FEATURE_ACCESS_UPDATED', 'FeatureAccessRule', 'rule-1', expect.any(Object));
  });

  it('validates requested limit before touching access records', async () => {
    const response = await POST(request({ employeeId: employee.id, featureKey: 'student', limitValue: -1 }));

    expect(response.status).toBe(400);
    expect(mockDb.employee.findFirst).not.toHaveBeenCalled();
    expect(mockDb.featureAccessRule.create).not.toHaveBeenCalled();
  });
});
