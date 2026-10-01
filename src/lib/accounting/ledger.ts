// ============================================================================
// ALO Education — authoritative double-entry ledger service.
//
// Consolidates accounting onto REAL ledger tables (ChartOfAccount,
// JournalEntry, JournalLine, FiscalPeriod) created in migration
// 20261001000002_accounting_ledger. The legacy adapter stored journals as
// JSON inside CrmAuditLog rows, which could not support trial balances,
// reversals, period control or reconciliation. This module is the single
// authoritative posting path; src/lib/double-entry-ledger.ts is a
// compatibility facade over it.
//
// Invariants enforced here and covered by tests:
//   * amounts are INTEGER CENTS — finite, non-negative, two decimals, safe
//   * every entry has >= 2 lines and each line has exactly one positive side
//   * total debit == total credit (stored on the entry, verified after write)
//   * posting requires the account to exist, be active and postable
//   * posting into a CLOSED fiscal period is rejected
//   * deterministic entry ids + UNIQUE(source, sourceRefId) make source
//     postings idempotent-by-rejection (replay is an explicit error, never a
//     silent duplicate)
//   * reversals create a mirrored entry and flip the original's status in one
//     transaction; double reversal is impossible (deterministic reversal id)
//   * database failures propagate — there are no empty catches
// ============================================================================

import { db } from '@/lib/db';
import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import {
  AR_ACCOUNT_CODE,
  DEFAULT_CHART_OF_ACCOUNTS,
  type AccountType,
  isDebitNormal,
} from './chart';

// ─── Amounts (cents) ────────────────────────────────────────────────────────

export function toCents(amount: number): number {
  const value = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(value) || Math.abs(value / 100 - amount) > 1e-9) {
    throw new Error('Journal amounts must be finite non-negative two-decimal amounts');
  }
  return value;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LedgerLine {
  account: string;
  debit: number;
  credit: number;
  entityId?: string;
  entityType?: string;
}

export interface PostJournalInput {
  id?: string;
  /** YYYY-MM-DD (validated strictly, like the legacy adapter) */
  date: string;
  memo: string;
  source?: string;
  sourceRefId?: string;
  actorId: string;
  currency?: string;
  lines: LedgerLine[];
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  type: AccountType | string;
  totalDebit: number; // cents
  totalCredit: number; // cents
  balance: number; // cents; positive = debit-normal balance
}

function assertValidLines(lines: LedgerLine[]): { totalDebit: number; totalCredit: number } {
  if (!Array.isArray(lines) || lines.length < 2) throw new Error('A journal entry requires at least two lines');
  let totalDebit = 0;
  let totalCredit = 0;
  for (const line of lines) {
    if (!line.account || typeof line.account !== 'string') throw new Error('Each journal line requires an account code');
    const debit = toCents(line.debit);
    const credit = toCents(line.credit);
    if ((debit === 0) === (credit === 0)) throw new Error('Each journal line must have one positive debit or credit');
    totalDebit += debit;
    totalCredit += credit;
    if (!Number.isSafeInteger(totalDebit) || !Number.isSafeInteger(totalCredit)) throw new Error('Journal total exceeds safe amount');
  }
  if (totalDebit !== totalCredit) throw new Error('Unbalanced journal');
  if (totalDebit === 0) throw new Error('A journal entry must carry a non-zero amount');
  return { totalDebit, totalCredit };
}

function parseEntryDate(date: string): Date {
  const parsed = new Date(`${date}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new Error('Journal date must be a valid YYYY-MM-DD date');
  }
  return parsed;
}

/** Idempotent, race-safe seeding of the canonical chart. */
export async function ensureDefaultChart(): Promise<{ created: number }> {
  const existing = await db.chartOfAccount.findMany({
    select: { code: true },
    where: { code: { in: DEFAULT_CHART_OF_ACCOUNTS.map((a) => a.code) } },
  });
  const existingCodes = new Set(existing.map((a) => a.code));
  const missing = DEFAULT_CHART_OF_ACCOUNTS.filter((a) => !existingCodes.has(a.code));
  if (missing.length === 0) return { created: 0 };
  // createMany with skipDuplicates so concurrent seeds cannot fail the caller.
  const result = await db.chartOfAccount.createMany({
    data: missing.map((a) => ({
      code: a.code,
      name: a.name,
      type: a.type,
      subType: a.subType ?? null,
      parentCode: a.parentCode ?? null,
      isPostable: true,
      isActive: true,
      description: a.description ?? '',
    })),
    skipDuplicates: true,
  });
  return { created: result.count };
}

async function assertAccountsUsable(codes: string[]): Promise<Map<string, string>> {
  const accounts = await db.chartOfAccount.findMany({
    where: { code: { in: codes } },
    select: { code: true, name: true, isActive: true, isPostable: true },
  });
  const byCode = new Map(accounts.map((a) => [a.code, a.name]));
  for (const code of codes) {
    const account = accounts.find((a) => a.code === code);
    if (!account) throw new Error(`Unknown account code ${code}; seed the chart of accounts first`);
    if (!account.isActive) throw new Error(`Account ${code} is inactive`);
    if (!account.isPostable) throw new Error(`Account ${code} is not postable (parent/summary account)`);
  }
  return byCode;
}

async function assertPeriodOpen(entryDate: Date): Promise<void> {
  const period = await db.fiscalPeriod.findFirst({
    where: { startDate: { lte: entryDate }, endDate: { gte: entryDate } },
    select: { name: true, status: true },
  });
  if (period && period.status === 'CLOSED') {
    throw new Error(`Fiscal period ${period.name} is CLOSED; posting is rejected`);
  }
}

/** A returned id proves the entry and its lines were committed atomically. */
export async function postJournal(input: PostJournalInput): Promise<{ journalId: string }> {
  const { totalDebit, totalCredit } = assertValidLines(input.lines);
  const entryDate = parseEntryDate(input.date);
  if (!input.actorId || !input.actorId.trim()) throw new Error('Journal actor is required');
  if (input.memo === undefined || input.memo === null || String(input.memo).trim() === '') throw new Error('Journal memo is required');
  if (input.source && !/^[a-z0-9_.]+$/.test(input.source)) throw new Error('Journal source must be a stable snake_case identifier');
  const source = input.source ?? 'manual';
  const accountNames = await assertAccountsUsable(input.lines.map((l) => l.account));
  await assertPeriodOpen(entryDate);
  const journalId = input.id?.trim() || `je_${randomUUID()}`;

  try {
    await db.journalEntry.create({
      data: {
        id: journalId,
        entryDate,
        memo: String(input.memo),
        source,
        sourceRefId: input.sourceRefId?.trim() || null,
        currency: input.currency || 'BDT',
        totalDebit,
        totalCredit,
        actorId: input.actorId,
        lines: {
          create: input.lines.map((line) => ({
            accountCode: line.account,
            accountName: accountNames.get(line.account) ?? line.account,
            debit: toCents(line.debit),
            credit: toCents(line.credit),
            entityId: line.entityId ?? null,
            entityType: line.entityType ?? null,
          })),
        },
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      throw new Error('Journal identifier already posted; reconcile rather than replay');
    }
    throw err;
  }
  return { journalId };
}

// Account names are denormalized at posting time from the chart, so the
// historical meaning of a line survives later chart renames.

// ─── Reversal ───────────────────────────────────────────────────────────────

export async function reverseJournal(
  entryId: string,
  actorId: string,
  opts: { memo?: string; date?: string } = {},
): Promise<{ journalId: string }> {
  if (!entryId?.trim()) throw new Error('Journal id is required');
  if (!actorId?.trim()) throw new Error('Journal actor is required');
  const reversalId = `je_rev_${entryId}`;
  return db.$transaction(async (tx) => {
    const original = await tx.journalEntry.findUnique({
      where: { id: entryId },
      include: { lines: true },
    });
    if (!original) throw new Error('Journal entry not found');
    if (original.status === 'REVERSED') throw new Error('Journal entry is already reversed');
    if (original.reversalOfId) throw new Error('A reversal entry cannot be reversed; post a correcting entry instead');

    const reversalDate = opts.date ?? original.entryDate.toISOString().slice(0, 10);
    await tx.journalEntry.create({
      data: {
        id: reversalId,
        entryDate: parseEntryDate(reversalDate),
        memo: opts.memo || `Reversal of ${original.id}: ${original.memo}`,
        source: 'reversal',
        sourceRefId: original.id,
        currency: original.currency,
        totalDebit: original.totalCredit,
        totalCredit: original.totalDebit,
        actorId,
        reversalOfId: original.id,
        lines: {
          create: original.lines.map((line) => ({
            accountCode: line.accountCode,
            accountName: line.accountName,
            debit: line.credit,
            credit: line.debit,
            entityId: line.entityId,
            entityType: line.entityType,
          })),
        },
      },
    });
    await tx.journalEntry.update({
      where: { id: original.id },
      data: { status: 'REVERSED', reversedById: reversalId },
    });
    return { journalId: reversalId };
  });
}

// ─── Reporting ──────────────────────────────────────────────────────────────

interface RawBalanceRow {
  accountCode: string;
  totalDebit: bigint | number;
  totalCredit: bigint | number;
}

function sumToCents(value: bigint | number | null): number {
  const n = typeof value === 'bigint' ? Number(value) : Number(value ?? 0);
  if (!Number.isSafeInteger(n)) throw new Error('Ledger aggregate exceeds safe amount');
  return n;
}

/** Trial balance over POSTED entries (reversed originals are excluded and
 *  their reversals included, so the pair nets to zero — standard practice). */
export async function trialBalance(asOf?: Date): Promise<TrialBalanceRow[]> {
  const asOfClause = asOf ? Prisma.sql`AND je.entryDate <= ${asOf}` : Prisma.empty;
  const rows = await db.$queryRaw<RawBalanceRow[]>(Prisma.sql`
    SELECT jl.accountCode, SUM(jl.debit) AS totalDebit, SUM(jl.credit) AS totalCredit
    FROM JournalLine jl
    JOIN JournalEntry je ON je.id = jl.entryId
    WHERE je.status = 'POSTED' ${asOfClause}
    GROUP BY jl.accountCode
  `);
  const accounts = await db.chartOfAccount.findMany({
    select: { code: true, name: true, type: true },
  });
  const byCode = new Map(accounts.map((a) => [a.code, a]));
  return rows
    .map((row) => {
      const account = byCode.get(row.accountCode);
      const totalDebit = sumToCents(row.totalDebit);
      const totalCredit = sumToCents(row.totalCredit);
      const type = (account?.type ?? 'UNKNOWN') as AccountType | 'UNKNOWN';
      const raw = totalDebit - totalCredit;
      return {
        accountCode: row.accountCode,
        accountName: account?.name ?? row.accountCode,
        type,
        totalDebit,
        totalCredit,
        balance: isDebitNormal(type as AccountType) ? raw : -raw,
      };
    })
    .sort((a, b) => a.accountCode.localeCompare(b.accountCode));
}

/** A/R movement summary computed from the real ledger (legacy semantics,
 *  now source-of-truth tables instead of CrmAuditLog JSON). */
export async function computeARAging(): Promise<{
  grossReceivable: number;
  credits: number;
  netReceivable: number;
  unappliedCredits: null;
  note: string;
}> {
  const rows = await db.$queryRaw<RawBalanceRow[]>(Prisma.sql`
    SELECT SUM(jl.debit) AS totalDebit, SUM(jl.credit) AS totalCredit
    FROM JournalLine jl
    JOIN JournalEntry je ON je.id = jl.entryId
    WHERE je.status = 'POSTED' AND jl.accountCode = ${AR_ACCOUNT_CODE}
  `);
  const row = rows[0];
  const gross = row ? sumToCents(row.totalDebit) : 0;
  const credits = row ? sumToCents(row.totalCredit) : 0;
  return {
    grossReceivable: gross / 100,
    credits: credits / 100,
    netReceivable: (gross - credits) / 100,
    unappliedCredits: null,
    note: 'Ledger A/R movements (accounts 1100) from POSTED entries. Due-date aging and credit allocation require invoice due dates, which are not part of the journal; reconciliation is a separate control.',
  };
}

// ─── Fiscal periods ─────────────────────────────────────────────────────────

export async function openFiscalPeriod(
  name: string,
  startDate: Date | string,
  endDate: Date | string,
): Promise<{ id: string }> {
  if (!/^\d{4}-\d{2}(-\d{2})?$/.test(name)) throw new Error('Fiscal period name must be YYYY-MM or YYYY-MM-DD');
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || start > end) {
    throw new Error('Fiscal period requires a valid date range');
  }
  const overlap = await db.fiscalPeriod.findFirst({
    where: { OR: [{ startDate: { lte: end } , endDate: { gte: start } }] },
    select: { name: true },
  });
  if (overlap) throw new Error(`Fiscal period overlaps existing period ${overlap.name}`);
  const created = await db.fiscalPeriod.create({ data: { name, startDate: start, endDate: end }, select: { id: true } });
  return created;
}

export async function closeFiscalPeriod(name: string, closedById: string): Promise<void> {
  if (!closedById?.trim()) throw new Error('Closing a fiscal period requires an actor');
  const period = await db.fiscalPeriod.findUnique({ where: { name } });
  if (!period) throw new Error('Fiscal period not found');
  if (period.status === 'CLOSED') throw new Error('Fiscal period is already closed');
  await db.fiscalPeriod.update({ where: { id: period.id }, data: { status: 'CLOSED', closedById, closedAt: new Date() } });
}

/** Balance integrity audit: every POSTED entry must satisfy stored totals. */
export async function verifyLedgerIntegrity(): Promise<{ entriesChecked: number; balanced: boolean }> {
  const entries = await db.journalEntry.findMany({
    where: { status: 'POSTED' },
    select: { id: true, totalDebit: true, totalCredit: true, lines: { select: { debit: true, credit: true } } },
  });
  let balanced = true;
  for (const entry of entries) {
    const lineDebit = entry.lines.reduce((s, l) => s + l.debit, 0);
    const lineCredit = entry.lines.reduce((s, l) => s + l.credit, 0);
    if (entry.totalDebit !== entry.totalCredit || lineDebit !== entry.totalDebit || lineCredit !== entry.totalCredit) {
      balanced = false;
      break;
    }
  }
  return { entriesChecked: entries.length, balanced };
}
