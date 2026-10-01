// ALO Education legacy journal adapter. Persists in CrmAuditLog; this is not a
// complete accounting ledger (currency, periods, reversals and allocation remain).
import { db } from '@/lib/db';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export type JournalEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  memo: string;
  lines: { account: string; accountName: string; debit: number; credit: number; entityId?: string; entityType?: string }[];
  actorId: string;
};

// Canonical chart (mirrors SlowBooks 1100 A/R, 2000 A/P, 1300 Inventory, 4000 Revenue, 5000 Expense)
export const GL_ACCOUNTS = {
  AR: { code: '1100', name: 'Accounts Receivable' },
  AP: { code: '2000', name: 'Accounts Payable' },
  CASH: { code: '1000', name: 'Cash' },
  REVENUE: { code: '4000', name: 'Revenue — Commissions' },
  EXPENSE: { code: '5000', name: 'Expense' },
  INVENTORY: { code: '1300', name: 'Inventory Asset' },
  PAYROLL_EXPENSE: { code: '5100', name: 'Payroll Expense' },
  PAYROLL_PAYABLE: { code: '2100', name: 'Payroll Payable' },
} as const;

function cents(amount: number): number {
  const value = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(value) || Math.abs(value / 100 - amount) > 1e-9) {
    throw new Error('Journal amounts must be finite non-negative two-decimal amounts');
  }
  return value;
}
const linesSchema = z.array(z.object({
  account: z.string().trim().min(1), accountName: z.string().trim().min(1),
  debit: z.number(), credit: z.number(), entityId: z.string().optional(), entityType: z.string().optional(),
})).min(2);
function assertBalanced(lines: JournalEntry['lines']): void {
  linesSchema.parse(lines);
  let debits = 0, credits = 0;
  for (const line of lines) {
    const d = cents(line.debit), c = cents(line.credit);
    if ((d === 0) === (c === 0)) throw new Error('Each journal line must have one positive debit or credit');
    debits += d; credits += c;
    if (!Number.isSafeInteger(debits) || !Number.isSafeInteger(credits)) throw new Error('Journal total exceeds safe amount');
  }
  if (debits !== credits) throw new Error('Unbalanced journal');
}

/** A returned id proves this insert succeeded, not that payment/payroll was updated. */
export async function postJournal(entry: JournalEntry): Promise<{ journalId: string }> {
  assertBalanced(entry.lines);
  const date = new Date(`${entry.date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== entry.date) {
    throw new Error('Journal date must be a valid YYYY-MM-DD date');
  }
  if (!entry.actorId.trim()) throw new Error('Journal actor is required');
  const journalId = entry.id || `je_${randomUUID()}`;
  const existing = await db.crmAuditLog.findFirst({ where: { action: 'JOURNAL_POSTED', targetCollection: 'JournalEntry', targetId: journalId }, select: { id: true } });
  if (existing) throw new Error('Journal identifier already posted; reconcile rather than replay');
  // Explicit PK prevents concurrent duplicate NEW postings with this identifier.
  // Historical rows used random audit ids: the lookup above rejects their replay.
  // Mixed-version writers and historical duplicate ids still need reconciliation.
  await db.crmAuditLog.create({ data: {
    id: journalId, action: 'JOURNAL_POSTED', targetCollection: 'JournalEntry', targetId: journalId,
    actorUserId: entry.actorId, afterData: JSON.stringify({ date: entry.date, memo: entry.memo, lines: entry.lines }), createdAt: date,
  } });
  return { journalId };
}

// ─── Convenience postings (SlowBooks patterns) ────────────────

// Invoice to university/partner: DR A/R / CR Revenue
export async function postInvoice(invoiceId: string, amount: number, opts: { date?: string; memo?: string; actorId: string }): Promise<{ journalId: string }> {
  return postJournal({
    id: `je_inv_${invoiceId}`,
    date: opts.date || new Date().toISOString().slice(0,10),
    memo: opts.memo || `Invoice ${invoiceId}`,
    actorId: opts.actorId,
    lines: [
      { account: GL_ACCOUNTS.AR.code, accountName: GL_ACCOUNTS.AR.name, debit: amount, credit: 0, entityId: invoiceId, entityType: 'Invoice' },
      { account: GL_ACCOUNTS.REVENUE.code, accountName: GL_ACCOUNTS.REVENUE.name, debit: 0, credit: amount, entityId: invoiceId, entityType: 'Invoice' },
    ],
  });
}

// Bill from vendor: DR Expense / CR A/P (or 1300 if inventory)
export async function postBill(billId: string, amount: number, opts: { isInventory?: boolean; date?: string; memo?: string; actorId: string }): Promise<{ journalId: string }> {
  return postJournal({
    id: `je_bill_${billId}`,
    date: opts.date || new Date().toISOString().slice(0,10),
    memo: opts.memo || `Bill ${billId}`,
    actorId: opts.actorId,
    lines: [
      { account: opts.isInventory ? GL_ACCOUNTS.INVENTORY.code : GL_ACCOUNTS.EXPENSE.code, accountName: opts.isInventory ? GL_ACCOUNTS.INVENTORY.name : GL_ACCOUNTS.EXPENSE.name, debit: amount, credit: 0, entityId: billId, entityType: 'Bill' },
      { account: GL_ACCOUNTS.AP.code, accountName: GL_ACCOUNTS.AP.name, debit: 0, credit: amount, entityId: billId, entityType: 'Bill' },
    ],
  });
}

// Credit Memo (customer): CR A/R immediately, application moves nothing (SlowBooks fix)
export async function postCreditMemo(creditId: string, amount: number, opts: { invoiceId?: string; date?: string; memo?: string; actorId: string }): Promise<{ journalId: string }> {
  return postJournal({
    id: `je_cm_${creditId}`,
    date: opts.date || new Date().toISOString().slice(0,10),
    memo: opts.memo || `Credit Memo ${creditId}${opts.invoiceId ? ` → Invoice ${opts.invoiceId}` : ' (unapplied)'}`,
    actorId: opts.actorId,
    lines: [
      { account: GL_ACCOUNTS.REVENUE.code, accountName: GL_ACCOUNTS.REVENUE.name, debit: amount, credit: 0, entityId: creditId, entityType: 'CreditMemo' },
      { account: GL_ACCOUNTS.AR.code, accountName: GL_ACCOUNTS.AR.name, debit: 0, credit: amount, entityId: creditId, entityType: 'CreditMemo' },
    ],
  });
}

// Vendor Credit (mirror of Bill): DR A/P immediately (reduces what you owe)
export async function postVendorCredit(vendorCreditId: string, amount: number, opts: { billId?: string; date?: string; memo?: string; actorId: string }): Promise<{ journalId: string }> {
  return postJournal({
    id: `je_vc_${vendorCreditId}`,
    date: opts.date || new Date().toISOString().slice(0,10),
    memo: opts.memo || `Vendor Credit ${vendorCreditId}${opts.billId ? ` → Bill ${opts.billId}` : ' (unapplied)'}`,
    actorId: opts.actorId,
    lines: [
      { account: GL_ACCOUNTS.AP.code, accountName: GL_ACCOUNTS.AP.name, debit: amount, credit: 0, entityId: vendorCreditId, entityType: 'VendorCredit' },
      { account: GL_ACCOUNTS.EXPENSE.code, accountName: GL_ACCOUNTS.EXPENSE.name, debit: 0, credit: amount, entityId: vendorCreditId, entityType: 'VendorCredit' },
    ],
  });
}

/** Journal-only A/R movement summary. This is NOT due-date aging or proof that
 * credits are unapplied: allocation and currency are absent from this adapter.
 * Never mix pending Payment amounts with journal postings (double counting).
 */
export async function computeARAging(): Promise<{ grossReceivable: number; unappliedCredits: null; credits: number; netReceivable: number; note: string }> {
  const logs = await db.crmAuditLog.findMany({
    where: { targetCollection: 'JournalEntry', action: 'JOURNAL_POSTED' }, select: { afterData: true },
  });
  let gross = 0, credits = 0;
  for (const log of logs) {
    const data = z.object({ lines: linesSchema }).parse(JSON.parse(log.afterData));
    assertBalanced(data.lines);
    for (const line of data.lines) {
      if (line.account === GL_ACCOUNTS.AR.code) { gross += cents(line.debit); credits += cents(line.credit); }
    }
    if (!Number.isSafeInteger(gross) || !Number.isSafeInteger(credits)) throw new Error('AR total exceeds safe amount');
  }
  return { grossReceivable: gross / 100, unappliedCredits: null, credits: credits / 100, netReceivable: (gross - credits) / 100,
    note: 'Journal-only A/R movements, not due-date aging. Credit allocation/currency reconciliation is not implemented; unapplied credits are unknown.' };
}
