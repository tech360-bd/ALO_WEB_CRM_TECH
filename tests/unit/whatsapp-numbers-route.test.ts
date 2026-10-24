import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), numberFindMany: vi.fn(), numberFindUnique: vi.fn(), numberUpdate: vi.fn(), numberCreate: vi.fn(),
  numberCreateMany: vi.fn(), numberCount: vi.fn(), employeeFindFirst: vi.fn(), numberAuditCreate: vi.fn(),
  crmAuditCreate: vi.fn(), transaction: vi.fn(),
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

import { GET, POST } from '@/app/api/whatsapp/numbers/route';

const baseNumber = {
  id: 'wa-main', phoneNumber: '01805020100', normalizedPhone: '8801805020100', displayName: 'ALO Main',
  ownerType: 'ALO_MAIN', employeeOwnerId: '', employeeOwnerName: '', branch: '', department: '',
  metaPhoneNumberId: '123456789012345', metaBusinessAccountId: '998877665544332', connectionStatus: 'connected',
  activeStatus: 'active', isDefaultSender: true, isComplaintSender: true, isFollowUpSender: true,
  isSupport247: false, purpose: 'main', createdAt: new Date(), updatedAt: new Date(),
};
const superAdmin = { userId: 'super-1', userType: 'SUPER_ADMIN', roles: ['SUPER_ADMIN'], permissions: [], authenticationMethod: 'bearer', name: 'Super Admin' };
const requestOrigin = () => new URL(process.env.NEXTAUTH_URL || 'https://alo.test').origin;
const request = (url: string, body?: unknown) => new Request(url, {
  method: body === undefined ? 'GET' : 'POST',
  headers: { ...(body === undefined ? {} : { 'content-type': 'application/json', origin: requestOrigin() }) },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue(superAdmin);
  mocks.numberFindMany.mockResolvedValue([baseNumber]);
  mocks.numberFindUnique.mockResolvedValue(baseNumber);
  mocks.numberUpdate.mockResolvedValue({ ...baseNumber, metaPhoneNumberId: '998877665544332', connectionStatus: 'disconnected' });
  mocks.numberCreate.mockResolvedValue(baseNumber);
  mocks.numberCreateMany.mockResolvedValue({ count: 0 });
  mocks.numberCount.mockResolvedValue(20);
  mocks.employeeFindFirst.mockResolvedValue({ id: 'employee-1', status: 'active' });
  mocks.numberAuditCreate.mockResolvedValue({});
  mocks.crmAuditCreate.mockResolvedValue({});
  mocks.transaction.mockImplementation((callback) => callback(tx));
});

describe('official WhatsApp number pool API', () => {
  it('does not seed on GET and never returns unmasked Meta identifiers', async () => {
    mocks.auth.mockReturnValue({ ...superAdmin, permissions: ['whatsapp.numbers.view'] });
    const response = await GET(request(`${requestOrigin()}/api/whatsapp/numbers`));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(mocks.numberCreateMany).not.toHaveBeenCalled();
    expect(body.numbers[0]).not.toHaveProperty('metaPhoneNumberId');
    expect(body.numbers[0]).not.toHaveProperty('metaBusinessAccountId');
    expect(body.numbers[0].metaPhoneNumberIdMasked).toContain('2345');
    expect(body.numbers[0].connectionStatus).toBe('configured_unverified');
    expect(body.stats.connected).toBe(0);
  });

  it('denies callers without number-view permission before reading the pool', async () => {
    mocks.auth.mockReturnValue({ ...superAdmin, roles: ['COUNSELOR'], permissions: [] });
    const response = await GET(request(`${requestOrigin()}/api/whatsapp/numbers`));
    expect(response.status).toBe(403);
    expect(mocks.numberFindMany).not.toHaveBeenCalled();
  });

  it('requires Super Admin for Meta identifiers even when an admin may assign numbers', async () => {
    mocks.auth.mockReturnValue({ ...superAdmin, roles: ['ADMIN'], permissions: ['whatsapp.numbers.assign'] });
    const response = await POST(request(`${requestOrigin()}/api/whatsapp/numbers`, {
      phoneNumber: '01805020100', metaPhoneNumberId: 'new-provider-id',
    }));
    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('keeps provider state unverified when a Super Admin changes the Meta ID and audits atomically', async () => {
    const response = await POST(request(`${requestOrigin()}/api/whatsapp/numbers`, {
      phoneNumber: '01805020100', metaPhoneNumberId: '998877665544332', reason: 'provider setup review',
    }));
    expect(response.status).toBe(200);
    expect(mocks.numberUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'wa-main' }, data: expect.objectContaining({ metaPhoneNumberId: '998877665544332', connectionStatus: 'disconnected' }),
    }));
    expect(mocks.numberAuditCreate).toHaveBeenCalledOnce();
    expect(mocks.crmAuditCreate).toHaveBeenCalledOnce();
  });

  it('allows explicit Super Admin pool initialization without setting any provider state', async () => {
    mocks.numberCreateMany.mockResolvedValue({ count: 20 });
    const response = await POST(request(`${requestOrigin()}/api/whatsapp/numbers`, { action: 'seed_official_pool' }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.result).toMatchObject({ created: 20, count: 20 });
    expect(mocks.numberCreateMany).toHaveBeenCalledWith(expect.objectContaining({ skipDuplicates: true }));
  });
});
