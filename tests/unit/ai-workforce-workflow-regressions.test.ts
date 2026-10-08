import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ workflow: vi.fn(), cached: vi.fn(), run: vi.fn(), ledger: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { awfWorkflow: { findUnique: mocks.workflow }, awfTaskLedger: { findUnique: mocks.cached } } }));
vi.mock('@/lib/ai-workforce/runner', () => ({ runAgent: mocks.run, resolveTemplate: (value: unknown) => value }));
vi.mock('@/lib/ai-workforce/automation', () => ({ recordTaskLedger: mocks.ledger }));
vi.mock('@/lib/ai-workforce/audit', () => ({ writeAudit: vi.fn() }));
vi.mock('@/lib/ai-workforce/rbac', () => ({ requireCapability: vi.fn() }));
import { runWorkflow } from '@/lib/ai-workforce/workflow-engine';

const params = { workflowSlug: 'followup', input: {}, actor: { userId: 'owner', role: 'COUNSELOR' as const }, mode: 'PRODUCTION' as const, idempotencyKey: 'same-key' };
beforeEach(() => {
  vi.clearAllMocks();
  mocks.workflow.mockResolvedValue({ id: 'workflow', slug: 'followup', status: 'ACTIVE', eligible: true, definition: JSON.stringify({ steps: [{ key: 'first', agent: 'lead' }] }) });
  mocks.cached.mockResolvedValue(null);
  mocks.run.mockResolvedValue({ status: 'COMPLETED', runCode: 'AWF-1', runId: 'run-1', output: {} });
});

describe('workflow replay scope', () => {
  it('separates the same caller key across people and workflows', async () => {
    await runWorkflow(params);
    const firstKey = mocks.run.mock.calls[0][0].idempotencyKey;
    await runWorkflow({ ...params, actor: { ...params.actor, userId: 'another-owner' } });
    expect(mocks.run.mock.calls[1][0].idempotencyKey).not.toBe(firstKey);
    mocks.workflow.mockResolvedValue({ id: 'other-workflow', slug: 'other-workflow', status: 'ACTIVE', eligible: true, definition: JSON.stringify({ steps: [{ key: 'first', agent: 'lead' }] }) });
    await runWorkflow({ ...params, workflowSlug: 'other-workflow' });
    expect(mocks.run.mock.calls[2][0].idempotencyKey).not.toBe(firstKey);
  });
  it('keeps production and simulation agent keys separate', async () => {
    await runWorkflow(params);
    const firstKey = mocks.run.mock.calls[0][0].idempotencyKey;
    await runWorkflow({ ...params, mode: 'SIMULATION' });
    expect(mocks.run.mock.calls[1][0].idempotencyKey).not.toBe(firstKey);
  });
  it('replays pending work as awaiting approval', async () => {
    mocks.cached.mockResolvedValue({ outcome: 'PENDING', durationMs: 1 });
    expect(await runWorkflow(params)).toMatchObject({ status: 'AWAITING_APPROVAL', reused: true });
    expect(mocks.run).not.toHaveBeenCalled();
  });
  it('records an approval request without counting a human decision', async () => {
    mocks.run.mockResolvedValue({ status: 'AWAITING_APPROVAL', runCode: 'AWF-1', runId: 'run-1', output: {}, humanReviewRequired: true });
    expect(await runWorkflow(params)).toMatchObject({ status: 'AWAITING_APPROVAL', automationOutcome: 'PENDING' });
    expect(mocks.ledger).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'PENDING', humanTouches: 0 }));
  });
});
