import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ guard: vi.fn(), can: vi.fn(), find: vi.fn(), detail: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { awfRun: { findUnique: m.find } } }));
vi.mock('@/app/api/ai-workforce/_guard', () => ({ guard: m.guard, isGuardFailure: (value: any) => !value.actor }));
vi.mock('@/lib/ai-workforce/rbac', () => ({ can: m.can }));
vi.mock('@/lib/ai-workforce/telemetry', () => ({ runDetail: m.detail }));
import { GET } from '@/app/api/ai-workforce/runs/[runCode]/route';
const request = () => GET(new Request('https://alo.test/api/ai-workforce/runs/test'), { params: Promise.resolve({ runCode: 'test' }) });
beforeEach(() => { vi.resetAllMocks(); m.guard.mockResolvedValue({ actor: { userId: 'actor', role: 'EMPLOYEE' } }); m.can.mockReturnValue(false); m.find.mockResolvedValue({ actorUserId: 'actor', trigger: 'API' }); m.detail.mockResolvedValue({ agent: '', input: {}, output: 'Authorized trace' }); });
describe('workforce run detail ownership', () => {
  it('does not expose encrypted owner chat through the legacy trace API even to read-all roles', async () => { m.can.mockReturnValue(true); m.find.mockResolvedValue({ actorUserId: 'actor', trigger: 'OWNER_CHAT' }); expect((await request()).status).toBe(404); expect(m.detail).not.toHaveBeenCalled(); });
  it('denies other users before fetching trace contents, including agent-less runs', async () => { m.find.mockResolvedValue({ actorUserId: 'another', trigger: 'API' }); expect((await request()).status).toBe(404); expect(m.detail).not.toHaveBeenCalled(); });
  it('returns the current user’s ordinary run', async () => { expect((await request()).status).toBe(200); expect(m.detail).toHaveBeenCalledTimes(1); });
  it('preserves authorized read-all for ordinary workforce runs', async () => { m.can.mockReturnValue(true); m.find.mockResolvedValue({ actorUserId: 'another', trigger: 'API' }); expect((await request()).status).toBe(200); });
  it('does not load a nonexistent run trace', async () => { m.find.mockResolvedValue(null); expect((await request()).status).toBe(404); expect(m.detail).not.toHaveBeenCalled(); });
});
