import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  updateMany: vi.fn(),
  auditCreate: vi.fn(),
  approveAndExecute: vi.fn(),
  leadFindFirst: vi.fn(),
  leadCreate: vi.fn(),
}));

const tx = {
  aiCommandAction: { updateMany: mocks.updateMany },
  auditLog: { create: mocks.auditCreate },
};

vi.mock('next-auth', () => ({ getServerSession: (...args: unknown[]) => mocks.session(...args) }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/ai-safety', () => ({ isGlobalAiPaused: vi.fn(async () => false) }));
vi.mock('@/lib/ai-action-executor', () => ({ approveAndExecute: (...args: unknown[]) => mocks.approveAndExecute(...args) }));
vi.mock('@/lib/db', () => ({
  db: {
    aiCommandAction: {
      findUnique: (...args: unknown[]) => mocks.findUnique(...args),
      create: (...args: unknown[]) => mocks.create(...args),
    },
    lead: {
      findFirst: (...args: unknown[]) => mocks.leadFindFirst(...args),
      create: (...args: unknown[]) => mocks.leadCreate(...args),
    },
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  },
}));

import { PATCH, POST } from '@/app/api/ai-command/execute/route';

const origin = 'https://alo.test';
const admin = { user: { id: 'admin-1', role: 'ADMIN' } };
const pendingAction = {
  id: 'action-1',
  actionType: 'CREATE_LEAD',
  targetType: 'Lead',
  targetId: null,
  requestedBy: 'admin-1',
  aiAgentId: null,
  trigger: 'USER_REQUEST',
  actor: 'USER',
  idempotencyKey: 'request-0001',
  payload: JSON.stringify({ name: 'New Applicant', phone: '+8801700000000' }),
  riskLevel: 'LOW',
  riskFlags: '[]',
  status: 'PENDING',
};

function request(body: unknown, method: 'POST' | 'PATCH' = 'POST') {
  return new NextRequest(`${origin}/api/ai-command/execute`, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue(admin);
  mocks.findUnique.mockResolvedValue(null);
  mocks.create.mockResolvedValue({ ...pendingAction });
  mocks.updateMany.mockResolvedValue({ count: 1 });
  mocks.auditCreate.mockResolvedValue({});
  mocks.leadFindFirst.mockResolvedValue(null);
  mocks.leadCreate.mockResolvedValue({ id: 'lead-db-1', leadId: 'ALO-AI-action-1' });
  mocks.approveAndExecute.mockImplementation(async (_id: string, _approver: string, callback: (payload: Record<string, unknown>) => Promise<unknown>) => {
    const result = await callback({ name: 'New Applicant', phone: '+8801700000000' });
    return { actionId: 'action-1', status: 'EXECUTED', riskLevel: 'LOW', result };
  });
});

describe('/api/ai-command/execute action integrity contract', () => {
  it('requires a stable idempotency key and supported action before any write', async () => {
    const missing = await POST(request({ actionType: 'CREATE_LEAD', targetType: 'Lead', payload: {} }));
    expect(missing.status).toBe(400);
    const unsupported = await POST(request({ actionType: 'UNKNOWN', targetType: 'Lead', idempotencyKey: 'request-0001', payload: {} }));
    expect(unsupported.status).toBe(400);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('stores only session actor/provenance and does not trust client actor or AI-agent fields', async () => {
    await POST(request({
      actionType: 'CREATE_LEAD', targetType: 'Lead', idempotencyKey: 'request-0001',
      requestedBy: 'attacker', approvedBy: 'attacker', actor: 'AI', aiAgentId: 'fake-agent', trigger: 'SYSTEM',
      autoApprove: 'true', payload: { name: 'New Applicant', phone: '+8801700000000' },
    }));
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      requestedBy: 'admin-1', approvedBy: null, aiAgentId: null, actor: 'USER', trigger: 'USER_REQUEST', status: 'PENDING',
    }) });
    expect(mocks.approveAndExecute).not.toHaveBeenCalled();
  });

  it('rejects an idempotency key reused for a different payload or authenticated actor', async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction });
    const mismatch = await POST(request({ actionType: 'CREATE_LEAD', targetType: 'Lead', idempotencyKey: 'request-0001', payload: { name: 'Other Applicant', phone: '+8801700000000' } }));
    expect(mismatch.status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();

    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction, requestedBy: 'someone-else' });
    const actorMismatch = await POST(request({ actionType: 'CREATE_LEAD', targetType: 'Lead', idempotencyKey: 'request-0001', payload: { name: 'New Applicant', phone: '+8801700000000' } }));
    expect(actorMismatch.status).toBe(409);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('returns the existing action for an identical same-key replay', async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction });
    const response = await POST(request({ actionType: 'CREATE_LEAD', targetType: 'Lead', idempotencyKey: 'request-0001', payload: { phone: '+8801700000000', name: 'New Applicant' } }));
    expect(response.status).toBe(200);
    expect(mocks.create).not.toHaveBeenCalled();
    expect(mocks.approveAndExecute).not.toHaveBeenCalled();
  });

  it('auto-approves only a literal true for a valid low-risk lead, and executor receives the authenticated actor', async () => {
    mocks.create.mockResolvedValueOnce({ ...pendingAction, status: 'APPROVED' });
    mocks.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...pendingAction, status: 'EXECUTED' });
    const response = await POST(request({
      actionType: 'CREATE_LEAD', targetType: 'Lead', idempotencyKey: 'request-0001', autoApprove: true,
      payload: { name: 'New Applicant', phone: '+8801700000000' },
    }));
    expect(response.status).toBe(200);
    expect(mocks.approveAndExecute).toHaveBeenCalledWith('action-1', 'admin-1', expect.any(Function));
    expect(mocks.leadCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ fullName: 'New Applicant', phone: '+8801700000000', leadId: 'ALO-AI-action-1' }) });
  });

  it('records rejection as REJECTED with transactional audit and cannot re-approve it', async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction, status: 'PENDING' });
    const response = await PATCH(request({ id: 'action-1', decision: 'REJECTED', approvedBy: 'attacker' }, 'PATCH'));
    expect(response.status).toBe(200);
    expect(mocks.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'action-1', status: 'PENDING', executedAt: null },
      data: expect.objectContaining({ status: 'REJECTED' }),
    }));
    expect(mocks.auditCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'admin-1', action: 'AI_ACTION_REJECTED' }) });

    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction, status: 'REJECTED' });
    const reapprove = await PATCH(request({ id: 'action-1', decision: 'APPROVED' }, 'PATCH'));
    expect(reapprove.status).toBe(409);
    expect(mocks.approveAndExecute).not.toHaveBeenCalled();
  });
});
