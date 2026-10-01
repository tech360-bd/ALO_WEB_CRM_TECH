import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/db', () => ({ db: { crmAuditLog: { create: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() } } }));
import { db } from '@/lib/db';
import { postJournal, computeARAging, type JournalEntry } from '@/lib/double-entry-ledger';
const entry = (): JournalEntry => ({ id: 'test-journal', actorId: 'test-actor', date: '2026-09-30', memo: 'test', lines: [
  { account: '1100', accountName: 'AR', debit: 100, credit: 0 }, { account: '4000', accountName: 'Revenue', debit: 0, credit: 100 },
] });
beforeEach(() => { vi.resetAllMocks(); vi.mocked(db.crmAuditLog.create).mockResolvedValue({ id: 'test-journal' }); vi.mocked(db.crmAuditLog.findFirst).mockResolvedValue(null); });
describe('legacy journal adapter integrity, not full ledger certification', () => {
  it('returns identifier only after a real persistence call', async () => {
    expect(await postJournal(entry())).toEqual({ journalId: 'test-journal' });
    expect(db.crmAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: 'test-journal', targetId: 'test-journal' }) }));
  });
  it('propagates failed writes', async () => {
    vi.mocked(db.crmAuditLog.create).mockRejectedValue(new Error('insert failed'));
    await expect(postJournal(entry())).rejects.toThrow('insert failed');
  });
  it('rejects historical journal identifier replay', async () => {
    vi.mocked(db.crmAuditLog.findFirst).mockResolvedValue({ id: 'old-random-audit-id' });
    await expect(postJournal(entry())).rejects.toThrow(/already posted/); expect(db.crmAuditLog.create).not.toHaveBeenCalled();
  });
  it.each([NaN, Infinity, -10, 0, 10.001])('rejects invalid amount %s', async amount => {
    const data = entry(); data.lines[0].debit = amount; data.lines[1].credit = amount;
    await expect(postJournal(data)).rejects.toThrow(); expect(db.crmAuditLog.create).not.toHaveBeenCalled();
  });
  it.each(['2026-02-30', 'not-a-date', '2026-9-1'])('rejects invalid date %s', async date => { await expect(postJournal({ ...entry(), date })).rejects.toThrow(/date/); });
  it('rejects unbalanced and empty journals', async () => {
    const data = entry(); data.lines[0].debit = 99;
    await expect(postJournal(data)).rejects.toThrow(/Unbalanced/);
    await expect(postJournal({ ...entry(), lines: [] })).rejects.toThrow();
  });
  it('does not truncate at 5000 or mix Payment amounts with journals', async () => {
    const data = entry();
    vi.mocked(db.crmAuditLog.findMany).mockResolvedValue(Array.from({ length: 5001 }, () => ({ afterData: JSON.stringify(data) })));
    expect(await computeARAging()).toMatchObject({ grossReceivable: 500100, netReceivable: 500100, unappliedCredits: null });
    expect(vi.mocked(db.crmAuditLog.findMany).mock.calls[0][0]).not.toHaveProperty('take');
  });
  it('corrupt rows and database outage never become zero balances', async () => {
    vi.mocked(db.crmAuditLog.findMany).mockResolvedValue([{ afterData: '{broken' }]);
    await expect(computeARAging()).rejects.toThrow();
    vi.mocked(db.crmAuditLog.findMany).mockRejectedValue(new Error('db down'));
    await expect(computeARAging()).rejects.toThrow('db down');
  });
});
