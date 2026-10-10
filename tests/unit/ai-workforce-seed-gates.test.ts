import { describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ approve: vi.fn(), deploy: vi.fn(), test: vi.fn(), versionUpdate: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  awfAgent: { update: vi.fn() }, awfTool: { findUnique: vi.fn() }, awfSkill: { findUnique: vi.fn() },
  awfToolGrant: { upsert: vi.fn() }, awfSkillGrant: { upsert: vi.fn() },
  awfTestCase: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
  awfAgentVersion: { findFirst: vi.fn(), update: mocks.versionUpdate },
} }));
vi.mock('@/lib/ai-workforce/runtimes', () => ({ syncRuntimes: vi.fn().mockResolvedValue([]) }));
vi.mock('@/lib/ai-workforce/tools/registry', () => ({ listToolDefinitions: () => [], syncToolRegistry: vi.fn().mockResolvedValue(0) }));
vi.mock('@/lib/ai-workforce/skills/registry', () => ({ getSkillDefinition: () => ({ requiredTools: [] }), listSkillDefinitions: () => [], syncSkillRegistry: vi.fn().mockResolvedValue(0) }));
vi.mock('@/lib/ai-workforce/tools/handlers', () => ({}));
vi.mock('@/lib/ai-workforce/skills/catalog', () => ({}));
vi.mock('@/lib/ai-workforce/lifecycle', () => ({
  createAgent: vi.fn().mockResolvedValue({ id: 'agent' }),
  createAgentVersion: vi.fn().mockResolvedValue({ id: 'version', state: 'DRAFT' }),
  upsertDepartment: vi.fn().mockResolvedValue({ id: 'department' }),
  validateVersion: vi.fn().mockResolvedValue({ passed: true }),
  approveVersion: mocks.approve, deployVersion: mocks.deploy, testVersion: mocks.test,
}));
vi.mock('@/lib/ai-workforce/workflow-engine', () => ({ upsertWorkflow: vi.fn() }));
vi.mock('@/lib/ai-workforce/knowledge', () => ({ ingestKnowledge: vi.fn() }));
import { seedAiWorkforce } from '@/lib/ai-workforce/seed';

describe('workforce installation test gate', () => {
  it('does not forge TESTED or deploy any agent when verification was skipped', async () => {
    const result = await seedAiWorkforce({ userId: 'admin', role: 'SUPER_ADMIN' }, { runTests: false });
    expect(result.agents).toBe(11);
    expect(result.deployed).toBe(0);
    expect(result.failures).toHaveLength(11);
    expect(result.failures.every(failure => failure.stage === 'TEST')).toBe(true);
    expect(mocks.test).not.toHaveBeenCalled();
    expect(mocks.approve).not.toHaveBeenCalled();
    expect(mocks.deploy).not.toHaveBeenCalled();
    expect(mocks.versionUpdate).not.toHaveBeenCalled();
  });
});
