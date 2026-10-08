import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/agent-orchestrator', () => ({ runOrchestrated: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  user: { findUnique: vi.fn() }, agentApprovalQueue: { findUnique: vi.fn(), updateMany: vi.fn(), findMany: vi.fn(), count: vi.fn() },
  agentAuditLog: { create: vi.fn() }, $transaction: vi.fn(),
} }));
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { runOrchestrated } from '@/lib/agent-orchestrator';
import { POST as approvalPOST, GET as approvalGET } from '@/app/api/workforce/approval/route';
import { POST as orchestratePOST } from '@/app/api/workforce/orchestrate/route';
const req = (body: unknown) => new Request('http://localhost/api/workforce/approval', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'admin' } });
  vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'admin', email: 'admin@example.com', name: 'Admin', role: 'ADMIN', permissions: '[]', status: 'ACTIVE', emailVerified: true });
  vi.mocked(db.$transaction).mockImplementation(async callback => callback(db));
  vi.mocked(db.agentApprovalQueue.findUnique).mockResolvedValue({ id: 'approval', agentId: 'agent', status: 'pending' });
  vi.mocked(db.agentApprovalQueue.updateMany).mockResolvedValue({ count: 1 });
  vi.mocked(db.agentAuditLog.create).mockResolvedValue({});
});
describe('real auth middleware on workforce routes', () => {
  it('denies unauthenticated and student approval/orchestration requests', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    expect((await approvalPOST(req({}))).status).toBe(401);
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'student' } });
    vi.mocked(db.user.findUnique).mockResolvedValue({ id: 'student', role: 'STUDENT', status: 'ACTIVE', emailVerified: true, permissions: '[]' });
    expect((await approvalPOST(req({ id: 'approval', decision: 'APPROVE' }))).status).toBe(403);
    expect((await approvalGET(new Request('http://localhost/api/workforce/approval'))).status).toBe(403);
    expect((await orchestratePOST(req({ workflow: 'lead_scoring', actionType: 'LEAD_SCORING', department: 'dept' }))).status).toBe(403);
    expect(db.agentApprovalQueue.updateMany).not.toHaveBeenCalled(); expect(runOrchestrated).not.toHaveBeenCalled();
  });
  it('rejects invalid decisions rather than treating them as escalations', async () => {
    expect((await approvalPOST(req({ id: 'approval', decision: 'TYPO' }))).status).toBe(400);
    expect(db.$transaction).not.toHaveBeenCalled();
  });
  it('records agent-level decision using authenticated actor but never runs a task', async () => {
    const response = await approvalPOST(req({ id: 'approval', decision: 'APPROVE' }));
    expect(response.status).toBe(200); expect(await response.json()).toMatchObject({ decisionRecorded: true, executed: false });
    expect(db.agentApprovalQueue.updateMany).toHaveBeenCalledWith({ where: { id: 'approval', status: 'pending' }, data: expect.objectContaining({ approvedById: 'admin', status: 'approved' }) });
    expect(db.agentAuditLog.create).toHaveBeenCalled(); expect(runOrchestrated).not.toHaveBeenCalled();
  });
  it('repeated and concurrently decided approvals return conflict', async () => {
    vi.mocked(db.agentApprovalQueue.findUnique).mockResolvedValue({ id: 'approval', status: 'approved' });
    expect((await approvalPOST(req({ id: 'approval', decision: 'APPROVE' }))).status).toBe(409);
    vi.mocked(db.agentApprovalQueue.findUnique).mockResolvedValue({ id: 'approval', status: 'pending' });
    vi.mocked(db.agentApprovalQueue.updateMany).mockResolvedValue({ count: 0 });
    expect((await approvalPOST(req({ id: 'approval', decision: 'APPROVE' }))).status).toBe(409);
    expect(db.agentAuditLog.create).not.toHaveBeenCalled();
  });
  it('storage failure does not become successful approval or disclose exception details', async () => {
    vi.mocked(db.agentAuditLog.create).mockRejectedValue(new Error('private-db-details'));
    const response = await approvalPOST(req({ id: 'approval', decision: 'APPROVE' }));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('private-db-details');
  });
  it('malformed pagination returns 400 before database read', async () => {
    expect((await approvalGET(new Request('http://localhost/api/workforce/approval?page=-1'))).status).toBe(400);
    expect(db.agentApprovalQueue.findMany).not.toHaveBeenCalled();
  });
  it('cannot submit actor/provider/tool authority in workflow request', async () => {
    expect((await orchestratePOST(req({ workflow: 'lead_scoring', actionType: 'LEAD_SCORING', department: 'dept', actor: 'forged', humanApproved: true }))).status).toBe(400);
    expect(runOrchestrated).not.toHaveBeenCalled();
  });
  it('reports unsupported dispatch as unsuccessful, not completed', async () => {
    vi.mocked(runOrchestrated).mockResolvedValue({ status: 'UNSUPPORTED', steps: [], latencyMs: 0, correlationId: 'test', classification: { class: 'AI_AUTOMATABLE', reason: 'test', ruleId: 'test', confidence: 'HIGH' } });
    const response = await orchestratePOST(req({ workflow: 'other', actionType: 'OTHER', department: 'dept' }));
    expect(response.status).toBe(422); expect(await response.json()).toMatchObject({ success: false });
  });
});
