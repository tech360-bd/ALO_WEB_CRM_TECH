import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  db: {
    awfAgent: { findUnique: vi.fn() },
    awfAgentVersion: { findUnique: vi.fn(), findFirst: vi.fn() },
    awfRun: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    awfRunStep: { create: vi.fn() },
    awfToolCall: { count: vi.fn() },
  },
  permitted: vi.fn(), skill: vi.fn(), ledger: vi.fn(), audit: vi.fn(),
}));
vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/ai-workforce/gateway', () => ({ aiGatewayExecute: vi.fn(), GatewayError: class extends Error {} }));
vi.mock('@/lib/ai-workforce/skills/registry', () => ({ executeSkill: mocks.skill, getSkillDefinition: () => ({}) }));
vi.mock('@/lib/ai-workforce/tools/registry', () => ({ executeTool: vi.fn() }));
vi.mock('@/lib/ai-workforce/tools/handlers', () => ({}));
vi.mock('@/lib/ai-workforce/skills/catalog', () => ({}));
vi.mock('@/lib/ai-workforce/audit', () => ({ writeAudit: mocks.audit }));
vi.mock('@/lib/ai-workforce/rbac', () => ({ canInvokeAgent: mocks.permitted }));
vi.mock('@/lib/ai-workforce/memory', () => ({ parseMemoryPolicy: () => ({}), readMemory: vi.fn().mockResolvedValue(null), writeMemory: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/ai-workforce/automation', () => ({ recordTaskLedger: mocks.ledger }));

import { runAgent } from '@/lib/ai-workforce/runner';
import type { RunAgentParams } from '@/lib/ai-workforce/runner';

const params: RunAgentParams = { agentSlug: 'lead', input: {}, actor: { userId: 'owner', role: 'COUNSELOR' }, mode: 'PRODUCTION', idempotencyKey: 'same-key' };
const cached = { id: 'run', runCode: 'AWF-1', actorUserId: 'owner', agentId: 'agent', mode: 'PRODUCTION', status: 'COMPLETED', output: '{"score":80}', automationCategory: 'ELIGIBLE_ROUTINE', automationMode: 'AUTOMATED', runtimeKey: 'alo-deterministic', fallbackChain: '["alo-deterministic"]', fallbackUsed: false };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.permitted.mockReturnValue(true);
  mocks.db.awfAgent.findUnique.mockResolvedValue({ id: 'agent', slug: 'lead', allowedRoles: '["COUNSELOR"]', status: 'ACTIVE', activeVersionId: 'version' });
  mocks.db.awfAgentVersion.findUnique.mockResolvedValue({ id: 'version', versionNo: 1, state: 'DEPLOYED', config: JSON.stringify({ pipeline: [{ key: 'qualify', skill: 'qualify' }] }) });
  mocks.db.awfRun.findUnique.mockResolvedValue(null);
  mocks.db.awfRun.create.mockResolvedValue({ id: 'new-run', runCode: 'AWF-NEW' });
  mocks.db.awfToolCall.count.mockResolvedValue(0);
  mocks.skill.mockResolvedValue({ ok: true, output: { score: 80 }, substantive: true });
});

describe('agent run replay admission', () => {
  it('checks current permissions before returning a cached result', async () => {
    mocks.permitted.mockReturnValue(false);
    mocks.db.awfRun.findUnique.mockResolvedValue(cached);
    await expect(runAgent(params)).rejects.toThrow('AWF_AGENT_FORBIDDEN');
    expect(mocks.db.awfRun.findUnique).not.toHaveBeenCalled();
  });
  it.each([
    { actorUserId: 'another-user' }, { agentId: 'another-agent' }, { mode: 'SIMULATION' },
  ])('rejects a key belonging to another execution scope: %j', async (change) => {
    mocks.db.awfRun.findUnique.mockResolvedValue({ ...cached, ...change });
    await expect(runAgent(params)).rejects.toThrow('AWF_IDEMPOTENCY_CONFLICT');
    expect(mocks.skill).not.toHaveBeenCalled();
    expect(mocks.db.awfRun.create).not.toHaveBeenCalled();
  });
  it('does not report an in-flight run as a completed result', async () => {
    mocks.db.awfRun.findUnique.mockResolvedValue({ ...cached, status: 'RUNNING' });
    await expect(runAgent(params)).rejects.toThrow('AWF_RUN_IN_PROGRESS');
    expect(mocks.db.awfRun.create).not.toHaveBeenCalled();
  });
  it('reuses the owner result without inventing a fallback', async () => {
    mocks.db.awfRun.findUnique.mockResolvedValue(cached);
    const result = await runAgent(params);
    expect(result).toMatchObject({ reused: true, output: { score: 80 }, fallbackUsed: false });
    expect(mocks.skill).not.toHaveBeenCalled();
  });
  it('does not allow cached runs to bypass a paused production agent', async () => {
    mocks.db.awfAgent.findUnique.mockResolvedValue({ id: 'agent', slug: 'lead', allowedRoles: '[]', status: 'PAUSED' });
    mocks.db.awfRun.findUnique.mockResolvedValue(cached);
    await expect(runAgent(params)).rejects.toThrow('AWF_AGENT_NOT_ACTIVE');
  });
});

describe('pending approval evidence', () => {
  it('records pending work without claiming a human approved or intervened', async () => {
    mocks.skill.mockResolvedValue({ ok: true, output: { draft: 'Review required' }, substantive: true, humanReviewRequired: true });
    const result = await runAgent(params);
    expect(result.status).toBe('AWAITING_APPROVAL');
    expect(mocks.ledger).toHaveBeenCalledWith(expect.objectContaining({ outcome: 'PENDING', humanTouches: 0 }));
    expect(mocks.db.awfRun.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ humanIntervened: false, approvalRequired: true }) }));
  });
});
