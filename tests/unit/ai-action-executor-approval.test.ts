import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  claim: vi.fn(),
  actionUpdate: vi.fn(),
  auditCreate: vi.fn(),
  txAuditCreate: vi.fn(),
}));

const tx = {
  aiCommandAction: { updateMany: mocks.claim },
  auditLog: { create: mocks.txAuditCreate },
};

vi.mock('@/lib/db', () => ({
  db: {
    aiCommandAction: {
      findUnique: (...args: unknown[]) => mocks.findUnique(...args),
      create: (...args: unknown[]) => mocks.create(...args),
      update: (...args: unknown[]) => mocks.actionUpdate(...args),
    },
    auditLog: { create: (...args: unknown[]) => mocks.auditCreate(...args) },
    $transaction: (callback: (client: typeof tx) => unknown) => callback(tx),
  },
}));
vi.mock('@/lib/ai-safety', () => ({ isGlobalAiPaused: vi.fn(async () => false) }));

import { approveAndExecute, executeAiAction, retryFailedAction } from '@/lib/ai-action-executor';

const pendingAction = {
  id: 'action-1',
  actionType: 'NOTE_CREATE',
  targetType: 'Application',
  targetId: 'application-1',
  requestedBy: 'requester-1',
  aiAgentId: null,
  trigger: null,
  actor: 'USER',
  idempotencyKey: 'action-key-1',
  payload: JSON.stringify({ note: 'Internal follow-up note' }),
  riskLevel: 'LOW',
  retryCount: 0,
  status: 'PENDING',
  result: null,
  executedAt: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.findUnique.mockResolvedValue({ ...pendingAction });
  mocks.create.mockResolvedValue({ id: 'created-action' });
  mocks.claim.mockResolvedValue({ count: 1 });
  mocks.txAuditCreate.mockResolvedValue({});
  mocks.actionUpdate.mockResolvedValue({});
  mocks.auditCreate.mockResolvedValue({});
});

describe('approveAndExecute compare-and-set approval lifecycle', () => {
  it('atomically records approval and executes once with the stored payload and requester', async () => {
    const executor = vi.fn(async (payload: Record<string, unknown>) => ({ result: payload.note }));
    const result = await approveAndExecute('action-1', 'approver-1', executor);

    expect(result.status).toBe('EXECUTED');
    expect(executor).toHaveBeenCalledTimes(1);
    expect(executor).toHaveBeenCalledWith({ note: 'Internal follow-up note' });
    expect(mocks.claim).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'action-1', status: 'PENDING', executedAt: null },
      data: expect.objectContaining({ approvedBy: 'approver-1', status: 'EXECUTING' }),
    }));
    expect(mocks.txAuditCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: 'approver-1', action: 'AI_ACTION', resourceId: 'action-1' }),
    }));
    expect(mocks.claim).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'action-1', status: 'EXECUTING', executedAt: null },
      data: expect.objectContaining({ status: 'EXECUTED' }),
    }));
    expect(mocks.txAuditCreate).toHaveBeenCalledTimes(2);
  });

  it('does not invoke the callback if another worker already claimed execution', async () => {
    mocks.claim.mockResolvedValueOnce({ count: 0 });
    mocks.findUnique
      .mockResolvedValueOnce({ ...pendingAction })
      .mockResolvedValueOnce({ ...pendingAction, status: 'EXECUTING' });
    const executor = vi.fn(async () => ({}));

    const result = await approveAndExecute('action-1', 'approver-1', executor);

    expect(result.status).toBe('EXECUTING');
    expect(executor).not.toHaveBeenCalled();
    expect(mocks.actionUpdate).not.toHaveBeenCalled();
  });

  it('never re-approves a rejected action', async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction, status: 'REJECTED' });
    const executor = vi.fn(async () => ({}));

    const result = await approveAndExecute('action-1', 'approver-1', executor);

    expect(result.status).toBe('REJECTED');
    expect(executor).not.toHaveBeenCalled();
    expect(mocks.claim).not.toHaveBeenCalled();
  });

  it('does not run side effects when the approval audit cannot be committed', async () => {
    mocks.txAuditCreate.mockRejectedValueOnce(new Error('audit unavailable'));
    const executor = vi.fn(async () => ({}));

    const result = await approveAndExecute('action-1', 'approver-1', executor);

    expect(result.status).toBe('FAILED');
    expect(executor).not.toHaveBeenCalled();
    expect(mocks.actionUpdate).not.toHaveBeenCalled();
  });

  it('returns a cached result for an already executed action', async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction, status: 'EXECUTED', result: JSON.stringify({ ok: true }) });
    const executor = vi.fn(async () => ({}));

    const result = await approveAndExecute('action-1', 'approver-1', executor);

    expect(result.status).toBe('CACHED');
    expect(result.result).toEqual({ ok: true });
    expect(executor).not.toHaveBeenCalled();
    expect(mocks.claim).not.toHaveBeenCalled();
  });
});


describe('AI action auto-execution claim and idempotency identity', () => {
  it('claims a low-risk action and records its completion before returning success', async () => {
    mocks.findUnique.mockResolvedValueOnce(null);
    mocks.create.mockResolvedValueOnce({ id: 'auto-action-1' });
    mocks.claim.mockResolvedValue({ count: 1 });
    const executor = vi.fn(async () => ({ queued: true }));
    const result = await executeAiAction({
      actionType: 'FOLLOW_UP_TASK_CREATE', targetType: 'Student', targetId: 'student-1',
      requestedBy: 'requester-1', idempotencyKey: 'auto-key-1', payload: { title: 'Follow up' },
      autoApprove: true, executor,
    });
    expect(result.status).toBe('EXECUTED');
    expect(executor).toHaveBeenCalledTimes(1);
    expect(mocks.claim).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: { id: 'auto-action-1', status: 'PENDING', executedAt: null },
      data: { status: 'EXECUTING' },
    }));
    expect(mocks.claim).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: { id: 'auto-action-1', status: 'EXECUTING', executedAt: null },
      data: expect.objectContaining({ status: 'EXECUTED' }),
    }));
    expect(mocks.txAuditCreate).toHaveBeenCalledTimes(2);
  });

  it('rejects reuse of an idempotency key for a different actor or payload', async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction, payload: JSON.stringify({ note: 'different payload' }) });
    const executor = vi.fn(async () => ({}));
    const result = await executeAiAction({
      actionType: pendingAction.actionType, targetType: pendingAction.targetType, targetId: pendingAction.targetId,
      requestedBy: pendingAction.requestedBy, idempotencyKey: pendingAction.idempotencyKey,
      payload: { note: 'original payload' }, autoApprove: true, executor,
    });
    expect(result.status).toBe('FAILED');
    expect(result.error).toMatch(/IDEMPOTENCY_KEY_REUSED/);
    expect(executor).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
});

describe('AI action failure replay safety', () => {
  it('does not rerun an executor when the same idempotency key has a failed action', async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction, actionType: 'FOLLOW_UP_TASK_CREATE', targetType: 'Student', targetId: 'student-1', payload: JSON.stringify({ title: 'Follow up' }), status: 'FAILED', lastError: 'provider timed out', retryCount: 1 });
    const executor = vi.fn(async () => ({ created: true }));
    const result = await executeAiAction({
      actionType: 'FOLLOW_UP_TASK_CREATE', targetType: 'Student', targetId: 'student-1',
      requestedBy: 'requester-1', idempotencyKey: 'action-key-1', payload: { title: 'Follow up' },
      autoApprove: true, executor,
    });
    expect(result.status).toBe('FAILED');
    expect(result.error).toMatch(/reconcile/i);
    expect(executor).not.toHaveBeenCalled();
    expect(mocks.actionUpdate).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('keeps retryFailedAction read-only when the previous execution failed', async () => {
    mocks.findUnique.mockResolvedValueOnce({ ...pendingAction, status: 'FAILED', lastError: 'timeout', retryCount: 1 });
    const result = await retryFailedAction('action-1');
    expect(result.status).toBe('FAILED');
    expect(result.error).toMatch(/automatic retry is disabled/i);
    expect(mocks.actionUpdate).not.toHaveBeenCalled();
    expect(mocks.auditCreate).not.toHaveBeenCalled();
  });
});
