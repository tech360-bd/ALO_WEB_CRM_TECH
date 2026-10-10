// ============================================================================
// ALO Education — LEGACY JOURNAL ADAPTER (compatibility facade).
//
// DEPRECATED since 2026-10-01: the authoritative implementation is
// src/lib/accounting/ledger.ts, which persists to the REAL double-entry
// tables (JournalEntry/JournalLine/ChartOfAccount/FiscalPeriod) created in
// migration 20261001000002_accounting_ledger.
//
// This module keeps the historical exported surface (GL_ACCOUNTS, postJournal,
// postInvoice, postBill, postCreditMemo, postVendorCredit, computeARAging)
// so existing imports keep working, and delegates every posting to the real
// ledger. Do not add new call sites; import from '@/lib/accounting/ledger'.
// ============================================================================

import {
  postJournal as ledgerPostJournal,
  computeARAging as ledgerComputeARAging,
  type PostJournalInput,
} from '@/lib/accounting/ledger';

export type JournalEntry = PostJournalInput;

// Canonical chart (mirrors SlowBooks 1100 A/R, 2000 A/P, 1300 Inventory, 4000 Revenue, 5000 Expense)
// Codes match src/lib/accounting/chart.ts verbatim.
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

/** A returned id proves this entry and its lines were committed atomically. */
export async function postJournal(entry: JournalEntry): Promise<{ journalId: string }> {
  return ledgerPostJournal(entry);
}

// ─── Convenience postings (SlowBooks patterns) ────────────────

// Invoice to university/partner: DR A/R / CR Revenue
export async function postInvoice(invoiceId: string, amount: number, opts: { date?: string; memo?: string; actorId: string }): Promise<{ journalId: string }> {
  return postJournal({
    id: `je_inv_${invoiceId}`,
    date: opts.date || new Date().toISOString().slice(0, 10),
    memo: opts.memo || `Invoice ${invoiceId}`,
    actorId: opts.actorId,
    source: 'finance.invoice',
    sourceRefId: invoiceId,
    lines: [
      { account: GL_ACCOUNTS.AR.code, debit: amount, credit: 0, entityId: invoiceId, entityType: 'Invoice' },
      { account: GL_ACCOUNTS.REVENUE.code, debit: 0, credit: amount, entityId: invoiceId, entityType: 'Invoice' },
    ],
  });
}

// Bill from vendor: DR Expense / CR A/P (or 1300 if inventory)
export async function postBill(billId: string, amount: number, opts: { isInventory?: boolean; date?: string; memo?: string; actorId: string }): Promise<{ journalId: string }> {
  return postJournal({
    id: `je_bill_${billId}`,
    date: opts.date || new Date().toISOString().slice(0, 10),
    memo: opts.memo || `Bill ${billId}`,
    actorId: opts.actorId,
    source: 'procurement.bill',
    sourceRefId: billId,
    lines: [
      { account: opts.isInventory ? GL_ACCOUNTS.INVENTORY.code : GL_ACCOUNTS.EXPENSE.code, debit: amount, credit: 0, entityId: billId, entityType: 'Bill' },
      { account: GL_ACCOUNTS.AP.code, debit: 0, credit: amount, entityId: billId, entityType: 'Bill' },
    ],
  });
}

// Credit Memo (customer): CR A/R immediately, application moves nothing (SlowBooks fix)
export async function postCreditMemo(creditId: string, amount: number, opts: { invoiceId?: string; date?: string; memo?: string; actorId: string }): Promise<{ journalId: string }> {
  return postJournal({
    id: `je_cm_${creditId}`,
    date: opts.date || new Date().toISOString().slice(0, 10),
    memo: opts.memo || `Credit Memo ${creditId}${opts.invoiceId ? ` → Invoice ${opts.invoiceId}` : ' (unapplied)'}`,
    actorId: opts.actorId,
    source: 'finance.credit_memo',
    sourceRefId: creditId,
    lines: [
      { account: GL_ACCOUNTS.REVENUE.code, debit: amount, credit: 0, entityId: creditId, entityType: 'CreditMemo' },
      { account: GL_ACCOUNTS.AR.code, debit: 0, credit: amount, entityId: creditId, entityType: 'CreditMemo' },
    ],
  });
}

// Vendor Credit (mirror of Bill): DR A/P immediately (reduces what you owe)
export async function postVendorCredit(vendorCreditId: string, amount: number, opts: { billId?: string; date?: string; memo?: string; actorId: string }): Promise<{ journalId: string }> {
  return postJournal({
    id: `je_vc_${vendorCreditId}`,
    date: opts.date || new Date().toISOString().slice(0, 10),
    memo: opts.memo || `Vendor Credit ${vendorCreditId}${opts.billId ? ` → Bill ${opts.billId}` : ' (unapplied)'}`,
    actorId: opts.actorId,
    source: 'procurement.vendor_credit',
    sourceRefId: vendorCreditId,
    lines: [
      { account: GL_ACCOUNTS.AP.code, debit: amount, credit: 0, entityId: vendorCreditId, entityType: 'VendorCredit' },
      { account: GL_ACCOUNTS.EXPENSE.code, debit: 0, credit: amount, entityId: vendorCreditId, entityType: 'VendorCredit' },
    ],
  });
}

/** Journal-only A/R movement summary (see ledger.computeARAging for caveats). */
export async function computeARAging(): Promise<{ grossReceivable: number; unappliedCredits: null; credits: number; netReceivable: number; note: string }> {
  return ledgerComputeARAging();
}
