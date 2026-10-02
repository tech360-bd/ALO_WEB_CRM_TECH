// Legacy journal adapter (src/lib/double-entry-ledger.ts) — now a compatibility
// facade over the real ledger. These tests pin the facade contract: identical
// exported surface, correct canonical postings, legacy error semantics.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    chartOfAccount: { findMany: vi.fn(), findUnique: vi.fn(), createMany: vi.fn() },
    fiscalPeriod: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    journalEntry: { create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));
import { db } from '@/lib/db';
import {
  postJournal,
  postInvoice,
  postBill,
  postCreditMemo,
  postVendorCredit,
  computeARAging,
  GL_ACCOUNTS,
  type JournalEntry,
} from '@/lib/double-entry-ledger';

const CHART = Object.values(GL_ACCOUNTS).map((a: { code: string; name: string }) => ({
  code: a.code,
  name: a.name,
  type: 'ASSET',
  isActive: true,
  isPostable: true,
}));

const entry = (): JournalEntry => ({
  id: 'test-journal',
  actorId: 'test-actor',
  date: '2026-09-30',
  memo: 'test',
  lines: [
    { account: '1100', debit: 100, credit: 0 },
    { account: '4000', debit: 0, credit: 100 },
  ],
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(db.chartOfAccount.findMany).mockResolvedValue(CHART as never);
  vi.mocked(db.fiscalPeriod.findFirst).mockResolvedValue(null as never);
  vi.mocked(db.journalEntry.create).mockResolvedValue({ id: 'x' } as never);
});

describe('legacy facade delegates to the real ledger', () => {
  it('keeps the historical GL_ACCOUNTS surface', () => {
    expect(GL_ACCOUNTS.AR).toEqual({ code: '1100', name: 'Accounts Receivable' });
    expect(GL_ACCOUNTS.AP.code).toBe('2000');
    expect(GL_ACCOUNTS.CASH.code).toBe('1000');
    expect(GL_ACCOUNTS.REVENUE.code).toBe('4000');
    expect(GL_ACCOUNTS.EXPENSE.code).toBe('5000');
    expect(GL_ACCOUNTS.INVENTORY.code).toBe('1300');
    expect(GL_ACCOUNTS.PAYROLL_EXPENSE.code).toBe('5100');
    expect(GL_ACCOUNTS.PAYROLL_PAYABLE.code).toBe('2100');
  });

  it('postJournal persists through JournalEntry (not CrmAuditLog)', async () => {
    expect(await postJournal(entry())).toEqual({ journalId: 'test-journal' });
    expect(db.journalEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ id: 'test-journal', totalDebit: 10000, totalCredit: 10000 }) }),
    );
  });

  it('postJournal propagates database failures', async () => {
    vi.mocked(db.journalEntry.create).mockRejectedValue(new Error('insert failed'));
    await expect(postJournal(entry())).rejects.toThrow('insert failed');
  });

  it('postJournal still rejects invalid amounts, dates and unbalanced journals', async () => {
    const bad = entry(); bad.lines[0].debit = 10.001; bad.lines[1].credit = 10.001;
    await expect(postJournal(bad)).rejects.toThrow();
    await expect(postJournal({ ...entry(), date: '2026-02-30' })).rejects.toThrow(/date/);
    const unbalanced = entry(); unbalanced.lines[0].debit = 99;
    await expect(postJournal(unbalanced)).rejects.toThrow(/Unbalanced/);
  });

  it('postInvoice posts DR A/R / CR Revenue with source-level idempotency keys', async () => {
    await postInvoice('inv_1', 250, { actorId: 'fin' });
    const arg = vi.mocked(db.journalEntry.create).mock.calls[0][0];
    expect(arg.data.id).toBe('je_inv_inv_1');
    expect(arg.data.source).toBe('finance.invoice');
    expect(arg.data.sourceRefId).toBe('inv_1');
    expect(arg.data.lines.create).toEqual([
      expect.objectContaining({ accountCode: '1100', debit: 25000, credit: 0, entityType: 'Invoice' }),
      expect.objectContaining({ accountCode: '4000', debit: 0, credit: 25000, entityType: 'Invoice' }),
    ]);
  });

  it('postBill posts DR Expense (or Inventory) / CR A/P', async () => {
    await postBill('bill_1', 80, { actorId: 'fin' });
    expect(vi.mocked(db.journalEntry.create).mock.calls[0][0].data.lines.create[0])
      .toMatchObject({ accountCode: '5000', debit: 8000 });
    await postBill('bill_2', 80, { actorId: 'fin', isInventory: true });
    expect(vi.mocked(db.journalEntry.create).mock.calls[1][0].data.lines.create[0])
      .toMatchObject({ accountCode: '1300', debit: 8000 });
    expect(vi.mocked(db.journalEntry.create).mock.calls[1][0].data.lines.create[1])
      .toMatchObject({ accountCode: '2000', credit: 8000 });
  });

  it('postCreditMemo and postVendorCredit post the documented contra patterns', async () => {
    await postCreditMemo('cm_1', 30, { actorId: 'fin', invoiceId: 'inv_1' });
    const cm = vi.mocked(db.journalEntry.create).mock.calls[0][0].data;
    expect(cm.id).toBe('je_cm_cm_1');
    expect(cm.lines.create[0]).toMatchObject({ accountCode: '4000', debit: 3000 });
    expect(cm.lines.create[1]).toMatchObject({ accountCode: '1100', credit: 3000 });

    await postVendorCredit('vc_1', 20, { actorId: 'fin', billId: 'bill_1' });
    const vc = vi.mocked(db.journalEntry.create).mock.calls[1][0].data;
    expect(vc.id).toBe('je_vc_vc_1');
    expect(vc.lines.create[0]).toMatchObject({ accountCode: '2000', debit: 2000 });
    expect(vc.lines.create[1]).toMatchObject({ accountCode: '5000', credit: 2000 });
  });

  it('computeARAging delegates to the real ledger tables', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ totalDebit: 100000n, totalCredit: 25000n }] as never);
    const aging = await computeARAging();
    expect(aging).toMatchObject({ grossReceivable: 1000, credits: 250, netReceivable: 750 });
    expect(aging.note).toContain('1100');
    // Database failures propagate; never a fabricated zero balance.
    vi.mocked(db.$queryRaw).mockRejectedValue(new Error('db down'));
    await expect(computeARAging()).rejects.toThrow('db down');
  });
});
