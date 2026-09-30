import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ db: { automationEvent: { groupBy: vi.fn() } } }));
import { db } from '@/lib/db';
import { measureAutomation, type AutomationBucket } from '@/lib/automation-measurement';
import { getAutomationSnapshot } from '@/lib/automation-analytics';
import { getAutomationStats } from '@/lib/crm-automation';
import { getUnifiedAutomationStats } from '@/lib/automation-engine';
const bucket = (mode: string, success: boolean, count: number, category = 'ELIGIBLE_ROUTINE'): AutomationBucket => ({ workflow: 'test', category, mode, success, count });
const sample = [bucket('AUTOMATED', true, 2), bucket('AUTOMATED', false, 1), bucket('AI_ASSISTED', true, 1), bucket('PENDING_APPROVAL', false, 1), bucket('HUMAN', true, 3, 'HUMAN_REQUIRED'), bucket('ESCALATED', false, 1, 'HUMAN_REQUIRED')];
beforeEach(() => { vi.resetAllMocks(); vi.mocked(db.automationEvent.groupBy).mockResolvedValue(sample.map(({ count, ...row }) => ({ ...row, _count: { _all: count } }))); });
describe('canonical automation measurement', () => {
  it('excludes human-required work from eligibility, includes failed/assisted/pending eligible work', () => {
    expect(measureAutomation(sample)).toMatchObject({ eligible: 5, automated: 2, assisted: 1, automationRate: 40, humanRate: 33.33, total: 9, hasData: true });
  });
  it('does not call empty data 100% human or a measured target', async () => {
    vi.mocked(db.automationEvent.groupBy).mockResolvedValue([]);
    expect(await getAutomationSnapshot()).toMatchObject({ hasData: false, verdict: 'NO_DATA', humanRate: 0 });
  });
  it('all three existing entrypoints use the same rate', async () => {
    const [snapshot, crm, unified] = await Promise.all([getAutomationSnapshot(), getAutomationStats(), getUnifiedAutomationStats()]);
    expect([snapshot.automationRate, crm.automationPercentage, unified.automationRate]).toEqual([40, 40, 40]);
    expect(unified.byWorkflow[0].automated).toBe(2);
  });
  it('database outage is an error, never an empty successful result', async () => {
    vi.mocked(db.automationEvent.groupBy).mockRejectedValue(new Error('db down'));
    for (const read of [getAutomationSnapshot, getAutomationStats, getUnifiedAutomationStats]) await expect(read()).rejects.toThrow('db down');
  });
  it.each([0, -1, 366, 1.5, NaN])('rejects invalid period %s', async days => { await expect(getAutomationSnapshot(days)).rejects.toThrow(/periodDays/); });
});
