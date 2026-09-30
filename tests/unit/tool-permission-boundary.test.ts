import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ db: {
  user: { findUnique: vi.fn() }, agentDefinition: { findUnique: vi.fn() }, agentToolExtension: { findUnique: vi.fn() },
  crmAuditLog: { create: vi.fn() }, lead: { findUnique: vi.fn() }, student: { findUnique: vi.fn() }, timelineEvent: { create: vi.fn() },
} }));
import { db } from '@/lib/db';
import { checkToolPermission, invokeTool, getTool } from '@/lib/tool-gateway';
const ctx = { agentId: 'test-agent', actorUserId: 'test-admin', department: 'test-dept' };
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(db.user.findUnique).mockResolvedValue({ status: 'ACTIVE', role: 'ADMIN' });
  vi.mocked(db.agentDefinition.findUnique).mockResolvedValue({ status: 'active', departmentId: 'test-dept', requiresApproval: false });
  vi.mocked(db.agentToolExtension.findUnique).mockResolvedValue({ status: 'ACTIVE', permission: 'EXECUTE', riskLevel: 'LOW', approvalRequired: false });
  vi.mocked(db.crmAuditLog.create).mockResolvedValue({});
});
describe('tool authorization and truthful results', () => {
  it('rejects absent server actor and non-admin', async () => {
    expect((await checkToolPermission('readCrm', { agentId: 'test-agent', humanApproved: true })).allowed).toBe(false);
    vi.mocked(db.user.findUnique).mockResolvedValue({ status: 'ACTIVE', role: 'STUDENT' });
    expect((await checkToolPermission('readCrm', ctx)).allowed).toBe(false);
  });
  it('rejects unregistered/inactive agents and unassigned tools', async () => {
    vi.mocked(db.agentDefinition.findUnique).mockResolvedValue(null);
    expect((await checkToolPermission('readCrm', ctx)).allowed).toBe(false);
    vi.mocked(db.agentDefinition.findUnique).mockResolvedValue({ status: 'active', departmentId: 'test-dept' });
    vi.mocked(db.agentToolExtension.findUnique).mockResolvedValue(null);
    expect((await checkToolPermission('readCrm', ctx)).allowed).toBe(false);
  });
  it('rejects department mismatch', async () => { expect((await checkToolPermission('readCrm', { ...ctx, department: 'other' })).allowed).toBe(false); });
  it('does not accept forged humanApproved for external sends', async () => {
    expect((await invokeTool('sendExternalMessage', { channel: 'email', to: 'test@example.com' }, { ...ctx, humanApproved: true })).ok).toBe(false);
    await expect(getTool('sendExternalMessage')!.handler({}, ctx)).rejects.toThrow(/BLOCKED/);
  });
  it('never produces no-db/ok on a timeline insert failure', async () => {
    vi.mocked(db.student.findUnique).mockResolvedValue({ id: 'student' });
    vi.mocked(db.timelineEvent.create).mockRejectedValue(new Error('db down'));
    expect(await invokeTool('writeTimeline', { targetType: 'Student', targetId: 'student', action: 'note' }, ctx)).toMatchObject({ ok: false });
  });
  it('uses actual TimelineEvent schema and requires real linked student', async () => {
    vi.mocked(db.lead.findUnique).mockResolvedValue({ id: 'lead', studentId: 'student' });
    vi.mocked(db.student.findUnique).mockResolvedValue({ id: 'student' });
    vi.mocked(db.timelineEvent.create).mockResolvedValue({ id: 'timeline-id' });
    expect(await invokeTool('writeTimeline', { targetType: 'Lead', targetId: 'lead', action: 'note' }, ctx)).toEqual({ ok: true, result: { id: 'timeline-id' } });
    expect(db.timelineEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ studentId: 'student', leadId: 'lead', stage: 'AI_NOTE', title: 'note' }) });
  });
  it('database authorization error is not interpreted as permission', async () => {
    vi.mocked(db.agentToolExtension.findUnique).mockRejectedValue(new Error('db down'));
    await expect(invokeTool('draftMessage', { content: 'test' }, ctx)).rejects.toThrow('db down');
  });
});
