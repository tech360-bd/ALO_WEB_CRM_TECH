import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/ai-safety', () => ({ isGlobalAiPaused: vi.fn() }));
vi.mock('@/lib/crm-automation', () => ({ scoreLead: vi.fn(), autoAssignCounselor: vi.fn(), createFollowUpTask: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: {
  automationEvent: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }, crmAuditLog: { create: vi.fn() }, $transaction: vi.fn(),
} }));
import { db } from '@/lib/db';
import { isGlobalAiPaused } from '@/lib/ai-safety';
import { scoreLead } from '@/lib/crm-automation';
import { runLeadScoring } from '@/lib/automation-engine';
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(isGlobalAiPaused).mockResolvedValue(false);
  vi.mocked(db.automationEvent.findUnique).mockResolvedValue(null);
  vi.mocked(db.automationEvent.create).mockResolvedValue({ id: 'event' });
  vi.mocked(db.automationEvent.update).mockResolvedValue({});
  vi.mocked(db.crmAuditLog.create).mockResolvedValue({});
  vi.mocked(db.$transaction).mockImplementation(async callback => callback(db));
  vi.mocked(scoreLead).mockResolvedValue({ score: 50, tier: 'COLD', reasons: [] });
});
describe('workflow persistence and idempotency', () => {
  it('never executes when claim lookup fails', async () => {
    vi.mocked(db.automationEvent.findUnique).mockRejectedValue(new Error('db down'));
    await expect(runLeadScoring('lead')).rejects.toThrow('db down'); expect(scoreLead).not.toHaveBeenCalled();
  });
  it('creates unique unsuccessful claim before invoking business operation', async () => {
    expect(await runLeadScoring('lead')).toMatchObject({ success: true, automationEventId: 'event' });
    expect(db.automationEvent.create).toHaveBeenCalledWith({ data: expect.objectContaining({ idempotencyKey: 'lead_scoring:lead', success: false }) });
    expect(vi.mocked(db.automationEvent.create).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(scoreLead).mock.invocationCallOrder[0]);
    expect(db.$transaction).toHaveBeenCalled();
  });
  it('does not rerun an in-progress/failed claim or declare it completed', async () => {
    vi.mocked(db.automationEvent.findUnique).mockResolvedValue({ id: 'event', result: null, success: false });
    expect(await runLeadScoring('lead')).toMatchObject({ success: false, skipped: true }); expect(scoreLead).not.toHaveBeenCalled();
  });
  it('unique-key race never executes a second workflow', async () => {
    vi.mocked(db.automationEvent.create).mockRejectedValue(Object.assign(new Error('duplicate'), { code: 'P2002' }));
    vi.mocked(db.automationEvent.findUnique).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'event', result: null, success: false });
    expect(await runLeadScoring('lead')).toMatchObject({ success: false, skipped: true }); expect(scoreLead).not.toHaveBeenCalled();
  });
  it('operation failures persist failure rather than automation success', async () => {
    vi.mocked(scoreLead).mockRejectedValue(new Error('missing lead'));
    expect(await runLeadScoring('lead')).toMatchObject({ success: false });
    expect(db.automationEvent.update).toHaveBeenCalledWith({ where: { id: 'event' }, data: expect.objectContaining({ success: false }) });
  });
  it('outcome or audit storage failure is never returned as success', async () => {
    vi.mocked(db.crmAuditLog.create).mockRejectedValue(new Error('audit unavailable'));
    await expect(runLeadScoring('lead')).rejects.toThrow('audit unavailable');
    expect(db.automationEvent.update).not.toHaveBeenCalled();
  });
});
