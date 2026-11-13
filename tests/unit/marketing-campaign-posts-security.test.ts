import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  accessFindUnique: vi.fn(),
  logoFindFirst: vi.fn(),
  postFindUnique: vi.fn(),
  postFindMany: vi.fn(),
  postCreate: vi.fn(),
  postUpdateMany: vi.fn(),
  auditCreate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    marketingUserAccess: { findUnique: (...args: unknown[]) => mocks.accessFindUnique(...args) },
    brandAsset: { findFirst: (...args: unknown[]) => mocks.logoFindFirst(...args) },
    campaignPost: {
      findUnique: (...args: unknown[]) => mocks.postFindUnique(...args),
      findMany: (...args: unknown[]) => mocks.postFindMany(...args),
      create: (...args: unknown[]) => mocks.postCreate(...args),
      updateMany: (...args: unknown[]) => mocks.postUpdateMany(...args),
    },
    auditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>, context?: unknown) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));

import { PATCH, POST } from '@/app/api/marketing/campaign-posts/route';

function request(body: unknown, method = 'POST') {
  return new Request('https://alo.test/api/marketing/campaign-posts', {
    method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
}

const approvedLimited = { status: 'ACTIVE', accessLevel: 'LIMITED', permissions: '[]' };
const draft = { id: 'post-1', createdBy: 'limited-1', approvalStatus: 'DRAFT', title: 'Study abroad', platform: 'FACEBOOK' };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ userId: 'limited-1', userType: 'EMPLOYEE', roles: [], permissions: [], name: 'Limited User' });
  mocks.accessFindUnique.mockResolvedValue(approvedLimited);
  mocks.logoFindFirst.mockResolvedValue({ id: 'logo-1', value: 'https://alo.test/logo.png', name: 'ALO logo' });
  mocks.postFindUnique.mockResolvedValue(draft);
  mocks.postCreate.mockResolvedValue(draft);
  mocks.postUpdateMany.mockResolvedValue({ count: 1 });
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
});

describe('marketing campaign post access and delivery claims', () => {
  it('denies a generic ADMIN with no approved marketing row', async () => {
    mocks.auth.mockReturnValue({ userId: 'admin-1', userType: 'ADMIN', roles: ['ADMIN'], permissions: [], name: 'Admin' });
    mocks.accessFindUnique.mockResolvedValue(null);
    const response = await POST(request({ title: 'Test', category: 'COURSE', platform: 'FACEBOOK', caption: 'Text' }));
    expect(response.status).toBe(403);
    expect(mocks.postCreate).not.toHaveBeenCalled();
  });

  it('creates a draft with the authenticated creator, ignoring a client-supplied identity', async () => {
    const response = await POST(request({ title: 'Study abroad', category: 'COURSE', platform: 'FACEBOOK', caption: 'Verified copy', createdBy: 'super-admin', hashtags: [] }));
    expect(response.status).toBe(201);
    expect(mocks.postCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ approvalStatus: 'DRAFT', createdBy: 'limited-1' }) }));
  });

  it('does not allow a limited user to approve a post even when the request supplies approvedBy', async () => {
    mocks.postFindUnique.mockResolvedValue({ ...draft, approvalStatus: 'PENDING_APPROVAL' });
    const response = await PATCH(request({ id: draft.id, action: 'approve', approvedBy: 'super-admin' }, 'PATCH'));
    expect(response.status).toBe(403);
    expect(mocks.postUpdateMany).not.toHaveBeenCalled();
  });

  it('refuses to mark an approved post published without provider delivery', async () => {
    mocks.auth.mockReturnValue({ userId: 'manager-1', userType: 'MARKETING_MANAGER', roles: ['MARKETING_MANAGER'], permissions: [], name: 'Manager' });
    mocks.postFindUnique.mockResolvedValue({ ...draft, approvalStatus: 'APPROVED' });
    const response = await PATCH(request({ id: draft.id, action: 'publish', publishedUrl: 'https://facebook.com/fake-post' }, 'PATCH'));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.deliveryStatus).toBe('NOT_CONFIGURED');
    expect(mocks.postUpdateMany).not.toHaveBeenCalled();
  });
});
