import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), accessFindUnique: vi.fn(), uccFindMany: vi.fn(),
  messageFindMany: vi.fn(), messageFindFirst: vi.fn(), messageFindUnique: vi.fn(),
  messageUpdate: vi.fn(), messageUpdateMany: vi.fn(), auditCreate: vi.fn(),
}));

vi.mock('@/lib/db', () => ({
  db: {
    marketingUserAccess: { findUnique: (...args: unknown[]) => mocks.accessFindUnique(...args) },
    uccConversation: { findMany: (...args: unknown[]) => mocks.uccFindMany(...args) },
    socialInboxMessage: {
      findMany: (...args: unknown[]) => mocks.messageFindMany(...args),
      findFirst: (...args: unknown[]) => mocks.messageFindFirst(...args),
      findUnique: (...args: unknown[]) => mocks.messageFindUnique(...args),
      update: (...args: unknown[]) => mocks.messageUpdate(...args),
      updateMany: (...args: unknown[]) => mocks.messageUpdateMany(...args),
    },
    auditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  },
}));
vi.mock('@/lib/auth-middleware', () => ({
  withAuth: (handler: (request: Request, auth: Record<string, any>, context?: unknown) => Promise<Response>) =>
    (request: Request) => handler(request, mocks.auth()),
}));

import { GET, POST } from '@/app/api/marketing/social-inbox/route';

function request(body?: unknown) {
  return new Request('https://alo.test/api/marketing/social-inbox', {
    method: body === undefined ? 'GET' : 'POST',
    headers: body === undefined ? undefined : { 'content-type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

const limitedAccess = { status: 'ACTIVE', accessLevel: 'LIMITED', permissions: '[]' };
const inbound = {
  id: 'message-1', platform: 'FACEBOOK', direction: 'INBOUND', conversationId: 'fb-assigned',
  messageText: 'Hello', aiDraftReply: null, humanApproved: false, aiHandled: false,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockReturnValue({ userId: 'limited-1', userType: 'EMPLOYEE', roles: [], permissions: [], name: 'Limited User' });
  mocks.accessFindUnique.mockResolvedValue(limitedAccess);
  mocks.uccFindMany.mockResolvedValue([{ id: 'ucc-1', externalId: 'fb-assigned' }]);
  mocks.messageFindMany.mockResolvedValue([]);
  mocks.messageFindFirst.mockResolvedValue(inbound);
  mocks.messageFindUnique.mockResolvedValue({ ...inbound, aiDraftReply: 'Reviewed copy', humanApproved: false });
  mocks.messageUpdate.mockResolvedValue({ id: inbound.id, conversationId: inbound.conversationId, aiDraftReply: 'Draft copy', humanApproved: false });
  mocks.messageUpdateMany.mockResolvedValue({ count: 1 });
  mocks.auditCreate.mockResolvedValue({ id: 'audit-1' });
});

describe('marketing social inbox assignment and delivery safety', () => {
  it('scopes limited-user inbox reads to canonical UCC assignments', async () => {
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(mocks.messageFindMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ conversationId: { in: ['ucc-1', 'fb-assigned'] } }) }));
  });

  it('does not treat a send request as a delivered reply', async () => {
    const response = await POST(request({ action: 'send', platform: 'FACEBOOK', conversationId: 'fb-assigned', messageText: 'Hi' }));
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.deliveryStatus).toBe('NOT_CONFIGURED');
    expect(mocks.messageUpdate).not.toHaveBeenCalled();
    expect(mocks.messageUpdateMany).not.toHaveBeenCalled();
  });

  it('denies saving a reply draft outside the user’s assigned conversation', async () => {
    const response = await POST(request({ action: 'save_draft', platform: 'FACEBOOK', conversationId: 'fb-other', messageText: 'Hi' }));
    expect(response.status).toBe(403);
    expect(mocks.messageUpdate).not.toHaveBeenCalled();
  });

  it('saves an assigned reply as a pending draft and explicitly reports that it was not sent', async () => {
    const response = await POST(request({ action: 'save_draft', platform: 'FACEBOOK', conversationId: 'fb-assigned', messageText: 'A reviewed draft', aiDraftUsed: false, employeeId: 'admin-user' }));
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.sent).toBe(false);
    expect(body.state).toBe('DRAFT_PENDING_APPROVAL');
    expect(mocks.messageUpdate).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'message-1' }, data: expect.objectContaining({ aiDraftReply: 'A reviewed draft', humanApproved: false }) }));
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ userId: 'limited-1' }) }));
  });

  it('allows a manager to approve a draft internally without marking it sent', async () => {
    mocks.auth.mockReturnValue({ userId: 'manager-1', userType: 'MARKETING_MANAGER', roles: ['MARKETING_MANAGER'], permissions: [], name: 'Manager' });
    const response = await POST(request({ action: 'approve_draft', messageId: inbound.id }));
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.state).toBe('APPROVED_DRAFT');
    expect(body.sent).toBe(false);
    expect(mocks.messageUpdateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: inbound.id, humanApproved: false }, data: { humanApproved: true } }));
  });
});
