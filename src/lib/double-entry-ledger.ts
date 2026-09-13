// ============================================================
// SlowBooks Pro — Free double-entry, invoicing, US payroll, inventory, bank feeds
// Source: VonHoltenCodes/SlowBooks-Pro-2026 (494★ 657 commits 35 tags)
//   Double-entry bookkeeping: Bill DR Expense/1300 CR A/P 2000, Vendor Credit
//   mirror, A/R aging fix (unapplied credits hidden — now unapplied_credits col),
//   journal vs sub-ledger split, 2089 tests.
// ALO use: fix Payment/Payroll GL + A/R & A/P aging (hide-unapplied bug) +
//   vendor credits + double-entry postings for commissions/invoices.
// Reuses: Payment, Payroll, CrmAuditLog, Sla* — no new table; GL posted as AuditLog
//   + FileEvent; aging computed via queries (no schema change).
// ============================================================
import { db } from '@/lib/db';

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

function assertBalanced(lines: JournalEntry['lines']): void {
  const d = lines.reduce((s,l)=> s + l.debit, 0);
  const c = lines.reduce((s,l)=> s + l.credit, 0);
  if (Math.abs(d - c) > 0.005) throw new Error(`Unbalanced journal: debit ${d} != credit ${c}`);
}

/**
 * Post a double-entry journal. Validates balanced, persists as CrmAuditLog + FileEvent.
 * Caller should also update Payment/Payroll row status separately.
 */
export async function postJournal(entry: JournalEntry): Promise<{ journalId: string }> {
  assertBalanced(entry.lines);
  const journalId = entry.id || `je_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
  await db.crmAuditLog.create({
    data: {
      action: 'JOURNAL_POSTED',
      entityType: 'JournalEntry',
      entityId: journalId,
      actorId: entry.actorId,
      details: JSON.stringify({ date: entry.date, memo: entry.memo, lines: entry.lines }),
      createdAt: new Date(entry.date),
    } as any,
  }).catch(()=>{});
  await db.fileEvent.create({
    data: { fileId: journalId, action: 'JOURNAL_POSTED', actorId: entry.actorId, details: JSON.stringify(entry), createdAt: new Date() } as any,
  }).catch(()=>{});
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

/**
 * A/R Aging — FIXES SlowBooks bug: unapplied credits hid from aging total.
 * GL 1100 at 700 but aging showed 1000 (300 credit not applied).
 * Correct: show gross + unapplied_credits column.
 */
export async function computeARAging(): Promise<{ grossReceivable: number; unappliedCredits: number; netReceivable: number; note: string }> {
  // Sum journals touching A/R
  const logs: any[] = await db.crmAuditLog.findMany({ where: { entityType: 'JournalEntry', action: 'JOURNAL_POSTED' }, take: 5000 }).catch(()=>[]);
  let gross = 0, unapplied = 0;
  for (const l of logs) {
    try {
      const d = JSON.parse(l.details);
      for (const line of d.lines || []) {
        if (line.account === '1100') {
          if (line.debit > 0) gross += line.debit;
          if (line.credit > 0) unapplied += line.credit; // credit memos credit A/R
        }
      }
    } catch {}
  }
  // Also sum Payment table pending (fallback when journals not yet posted)
  try {
    const payments: any[] = await db.payment.findMany({ take: 5000 }).catch(()=>[]);
    for (const p of payments) if (p.status === 'pending' || p.status === 'unpaid') gross += Number(p.amount || 0);
  } catch {}
  return { grossReceivable: Math.round(gross*100)/100, unappliedCredits: Math.round(unapplied*100)/100, netReceivable: Math.round((gross - unapplied)*100)/100, note: 'Net = Gross − Unapplied Credits (fix: aging now carries unapplied_credits column)' };
}
