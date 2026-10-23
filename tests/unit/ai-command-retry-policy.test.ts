import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ session: vi.fn(), findUnique: vi.fn(), auditCreate: vi.fn(), update: vi.fn() }));

vi.mock('next-auth', () => ({ getServerSession: (...args: unknown[]) => mocks.session(...args) }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/db', () => ({
  db: {
    aiCommandAction: {
      findUnique: (...args: unknown[]) => mocks.findUnique(...args),
      update: (...args: unknown[]) => mocks.update(...args),
    },
    auditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
  },
}));

import { POST } from '@/app/api/ai-command/retry/route';

function request(actionId: string) {
  return new NextRequest('https://alo.test/api/ai-command/retry', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ actionId }),
  });
}

afterEach(() => vi.unstubAllEnvs());
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: 'admin-1', role: 'ADMIN' } });
  mocks.findUnique.mockResolvedValue({ id: 'action-1', actionType: 'EMAIL_SEND', status: 'FAILED' });
  mocks.auditCreate.mockResolvedValue({});
});

describe('AI command retry route', () => {
  it('blocks retry of an uncertain failure without changing action state', async () => {
    const response = await POST(request('action-1'));
    const body = await response.json();
    expect(response.status).toBe(409);
    expect(body.code).toBe('RETRY_REQUIRES_RECONCILIATION');
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.auditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'AI_ACTION_RETRY_BLOCKED', resourceId: 'action-1' }),
    }));
  });

  it('does not retry an action whose execution is already in progress', async () => {
    mocks.findUnique.mockResolvedValueOnce({ id: 'action-1', actionType: 'EMAIL_SEND', status: 'EXECUTING' });
    const response = await POST(request('action-1'));
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe('RETRY_REQUIRES_RECONCILIATION');
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('returns a conflict for successful or pending actions without a retry write', async () => {
    mocks.findUnique.mockResolvedValueOnce({ id: 'action-1', actionType: 'EMAIL_SEND', status: 'EXECUTED' });
    const succeeded = await POST(request('action-1'));
    expect(succeeded.status).toBe(409);
    expect((await succeeded.json()).code).toBe('ACTION_ALREADY_EXECUTED');

    mocks.findUnique.mockResolvedValueOnce({ id: 'action-1', actionType: 'EMAIL_SEND', status: 'PENDING' });
    const pending = await POST(request('action-1'));
    expect(pending.status).toBe(409);
    expect((await pending.json()).code).toBe('ACTION_NOT_RETRYABLE');
    expect(mocks.update).not.toHaveBeenCalled();
  });
});
