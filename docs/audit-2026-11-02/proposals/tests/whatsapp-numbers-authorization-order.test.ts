/**
 * PROPOSED TEST — section C of the Phase 0D approved decisions.
 * Not yet part of the suite. Becomes tests/unit/whatsapp-numbers-authorization-order.test.ts
 * together with patch 3001.
 *
 * Contract under test: /api/whatsapp/numbers POST must decide *authorization*
 * before it decides *validity*. An unauthorized caller must not be able to tell
 * a well-formed payload from a malformed one by reading the status code, because
 * that difference is an oracle over the validator and over deployment config.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The sender registry reads its configuration at module load. Configure one
// operator number here so the "authorized + valid" leg can reach the write path.
// This is test configuration, not a hardcoded product number: the library
// deliberately ships with no numbers in source.
vi.hoisted(() => {
  process.env.ALO_MAIN_WHATSAPP_NUMBER = '01805020100';
});

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), numberFindMany: vi.fn(), numberFindUnique: vi.fn(), numberUpdate: vi.fn(),
  numberCreate: vi.fn(), numberCreateMany: vi.fn(), numberCount: vi.fn(), employeeFindFirst: vi.fn(),
  numberAuditCreate: vi.fn(), crmAuditCreate: vi.fn(), transaction: vi.fn(),
}));

const tx = {
  whatsAppOfficialNumber: {
    update: (...args: unknown[]) => mocks.numberUpdate(...args),
    create: (...args: unknown[]) => mocks.numberCreate(...args),
  },
  whatsAppNumberAssignmentAudit: { create: (...args: unknown[]) => mocks.numberAuditCreate(...args) },
  crmAuditLog: { create: (...args: unknown[]) => mocks.crmAuditCreate(...args) },
};

vi.mock('@/lib/db', () => ({
  db: {
    whatsAppOfficialNumber: {
      findMany: (...args: unknown[]) => mocks.numberFindMany(...args),
      findUnique: (...args: unknown[]) => mocks.numberFindUnique(...args),
      update: (...args: unknown[]) => mocks.numberUpdate(...args),
      create: (...args: unknown[]) => mocks.numberCreate(...args),
      createMany: (...args: unknown[]) => mocks.numberCreateMany(...args),
      count: (...args: unknown[]) => mocks.numberCount(...args),
    },
    employee: { findFirst: (...args: unknown[]) => mocks.employeeFindFirst(...args) },
    whatsAppNumberAssignmentAudit: { create: (...args: unknown[]) => mocks.numberAuditCreate(...args) },
    crmAuditLog: { create: (...args: unknown[]) => mocks.crmAuditCreate(...args) },
    $transaction: (callback: (client: typeof tx) => unknown) => mocks.transaction(callback),
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));

import { POST } from '@/app/api/whatsapp/numbers/route';

const baseNumber = {
  id: 'wa-main', phoneNumber: '01805020100', normalizedPhone: '8801805020100', displayName: 'ALO Main',
  ownerType: 'ALO_MAIN', employeeOwnerId: '', employeeOwnerName: '', branch: '', department: '',
  metaPhoneNumberId: '998877665544332', metaBusinessAccountId: '998877665544332', connectionStatus: 'disconnected',
  activeStatus: 'active', isDefaultSender: true, isComplaintSender: true, isFollowUpSender: true,
  isSupport247: false, purpose: 'main', createdAt: new Date(), updatedAt: new Date(),
};
const superAdmin = {
  userId: 'super-1', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'], permissions: [],
  authenticationMethod: 'bearer', name: 'Super Admin',
};
// Holds the assign permission but is NOT a Super Admin: the caller that must be
// forbidden before any validation runs.
const assigningAdmin = { ...superAdmin, userId: 'admin-1', userType: 'STAFF', roles: ['ADMIN'], permissions: ['whatsapp.numbers.assign'] };
const origin = () => new URL(process.env.NEXTAUTH_URL || 'https://alo.test').origin;
const post = (body: unknown) => new Request(`${origin()}/api/whatsapp/numbers`, {
  method: 'POST',
  headers: { 'content-type': 'application/json', origin: origin() },
  body: JSON.stringify(body),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue(superAdmin);
  mocks.numberFindMany.mockResolvedValue([baseNumber]);
  mocks.numberFindUnique.mockResolvedValue(baseNumber);
  mocks.numberUpdate.mockResolvedValue({ ...baseNumber, connectionStatus: 'disconnected' });
  mocks.numberCreate.mockResolvedValue(baseNumber);
  mocks.numberCreateMany.mockResolvedValue({ count: 0 });
  mocks.numberCount.mockResolvedValue(1);
  mocks.employeeFindFirst.mockResolvedValue({ id: 'employee-1', status: 'active' });
  mocks.numberAuditCreate.mockResolvedValue({});
  mocks.crmAuditCreate.mockResolvedValue({});
  mocks.transaction.mockImplementation((callback) => callback(tx));
});

describe('POST /api/whatsapp/numbers authorisation order', () => {
  it('denies an unauthorized caller with a well-formed payload before any lookup', async () => {
    mocks.auth.mockReturnValue(assigningAdmin);
    const response = await POST(post({ phoneNumber: '01805020100', metaPhoneNumberId: 'new-provider-id' }));
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(mocks.numberFindUnique).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('denies an unauthorized caller with a malformed payload with the same 403, not a 400', async () => {
    mocks.auth.mockReturnValue(assigningAdmin);
    const response = await POST(post({ phoneNumber: 'not-a-phone', metaPhoneNumberId: 'new-provider-id' }));
    expect(response.status).toBe(403);
    expect(mocks.numberFindUnique).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('answers 400 for an authorized caller whose payload is invalid', async () => {
    mocks.auth.mockReturnValue(superAdmin);
    const response = await POST(post({ phoneNumber: 'not-a-phone' }));
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('answers 400 for an authorized caller using a number absent from the deployment configuration', async () => {
    mocks.auth.mockReturnValue(superAdmin);
    // 01712345678 is structurally valid but not configured for this deployment.
    const response = await POST(post({ phoneNumber: '01712345678' }));
    expect(response.status).toBe(400);
    expect(response.status).not.toBe(200);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('allows an authorized caller with a configured number and audits atomically', async () => {
    mocks.auth.mockReturnValue(superAdmin);
    const response = await POST(post({ phoneNumber: '01805020100', metaPhoneNumberId: '998877665544332', reason: 'provider setup review' }));
    expect(response.status).toBe(200);
    expect(mocks.numberUpdate).toHaveBeenCalledOnce();
    expect(mocks.numberAuditCreate).toHaveBeenCalledOnce();
  });

  it('keeps the explicit pool-initialisation action Super-Admin-only and unchanged', async () => {
    mocks.auth.mockReturnValue(assigningAdmin);
    const denied = await POST(post({ action: 'seed_official_pool' }));
    expect(denied.status).toBe(403);
    expect(mocks.numberCreateMany).not.toHaveBeenCalled();
  });
});
