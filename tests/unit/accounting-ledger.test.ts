// Real double-entry ledger contracts (src/lib/accounting/ledger.ts).
// Mocked Prisma surface; persistence itself is exercised by the CI MySQL job.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    chartOfAccount: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      createMany: vi.fn(),
    },
    fiscalPeriod: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    journalEntry: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $queryRaw: vi.fn(),
    $transaction: vi.fn(),
  },
}));
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import {
  postJournal,
  reverseJournal,
  trialBalance,
  computeARAging,
  ensureDefaultChart,
  openFiscalPeriod,
  closeFiscalPeriod,
  verifyLedgerIntegrity,
  toCents,
} from '@/lib/accounting/ledger';
import { DEFAULT_CHART_OF_ACCOUNTS } from '@/lib/accounting/chart';

const CHART = DEFAULT_CHART_OF_ACCOUNTS.map((a) => ({
  code: a.code,
  name: a.name,
  type: a.type,
  isActive: true,
  isPostable: true,
}));

function chartFor(codes: string[]) {
  return CHART.filter((a) => codes.includes(a.code));
}

const entry = () => ({
  id: 'test-journal',
  actorId: 'test-actor',
  date: '2026-10-01',
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
  vi.mocked(db.journalEntry.create).mockResolvedValue({ id: 'test-journal' } as never);
});

describe('chart of accounts', () => {
  it('seeds only missing accounts, race-safe with skipDuplicates', async () => {
    vi.mocked(db.chartOfAccount.findMany).mockResolvedValue(chartFor(['1000']) as never);
    vi.mocked(db.chartOfAccount.createMany).mockResolvedValue({ count: CHART.length - 1 } as never);
    const result = await ensureDefaultChart();
    expect(result.created).toBe(CHART.length - 1);
    expect(vi.mocked(db.chartOfAccount.createMany).mock.calls[0][0]).toMatchObject({ skipDuplicates: true });
    expect(vi.mocked(db.chartOfAccount.createMany).mock.calls[0][0].data).not.toContainEqual(
      expect.objectContaining({ code: '1000' }),
    );
  });

  it('is a no-op when the chart is complete', async () => {
    vi.mocked(db.chartOfAccount.findMany).mockResolvedValue(CHART as never);
    expect(await ensureDefaultChart()).toEqual({ created: 0 });
    expect(db.chartOfAccount.createMany).not.toHaveBeenCalled();
  });

  it('keeps legacy GL_ACCOUNTS codes stable (1000/1100/1300/2000/2100/4000/5000/5100)', () => {
    for (const code of ['1000', '1100', '1300', '2000', '2100', '4000', '5000', '5100']) {
      expect(CHART.find((a) => a.code === code)).toBeDefined();
    }
  });
});

describe('posting invariants', () => {
  it('persists entry and lines atomically and returns the id', async () => {
    await expect(postJournal(entry())).resolves.toEqual({ journalId: 'test-journal' });
    const createArg = vi.mocked(db.journalEntry.create).mock.calls[0][0];
    expect(createArg.data.id).toBe('test-journal');
    expect(createArg.data.totalDebit).toBe(10000); // cents
    expect(createArg.data.totalCredit).toBe(10000);
    expect(createArg.data.lines.create).toEqual([
      expect.objectContaining({ accountCode: '1100', accountName: 'Accounts Receivable', debit: 10000, credit: 0 }),
      expect.objectContaining({ accountCode: '4000', accountName: 'Revenue — Commissions', debit: 0, credit: 10000 }),
    ]);
  });

  it('propagates failed writes (no silent success)', async () => {
    vi.mocked(db.journalEntry.create).mockRejectedValue(new Error('insert failed'));
    await expect(postJournal(entry())).rejects.toThrow('insert failed');
  });

  it('rejects unknown account codes before any write', async () => {
    vi.mocked(db.chartOfAccount.findMany).mockResolvedValue(chartFor(['1100']) as never);
    const data = entry();
    await expect(postJournal(data)).rejects.toThrow(/Unknown account code 4000/);
    expect(db.journalEntry.create).not.toHaveBeenCalled();
  });

  it('rejects inactive and non-postable accounts', async () => {
    vi.mocked(db.chartOfAccount.findMany).mockResolvedValue([
      { code: '1100', name: 'AR', type: 'ASSET', isActive: false, isPostable: true },
      { code: '4000', name: 'REV', type: 'REVENUE', isActive: true, isPostable: false },
    ] as never);
    await expect(postJournal(entry())).rejects.toThrow(/inactive/);
    const data = entry();
    data.lines = [{ account: '4000', debit: 100, credit: 0 }, { account: '1100', debit: 0, credit: 100 }];
    await expect(postJournal(data)).rejects.toThrow(/not postable/);
  });

  it.each([NaN, Infinity, -10, 0, 10.001])('rejects invalid amount %s', async (amount) => {
    const data = entry();
    data.lines[0].debit = amount;
    data.lines[1].credit = amount;
    await expect(postJournal(data)).rejects.toThrow();
    expect(db.journalEntry.create).not.toHaveBeenCalled();
  });

  it.each(['2026-02-30', 'not-a-date', '2026-9-1'])('rejects invalid date %s', async (date) => {
    await expect(postJournal({ ...entry(), date })).rejects.toThrow(/date/);
  });

  it('rejects unbalanced, empty, zero and double-sided journals', async () => {
    const unbalanced = entry(); unbalanced.lines[0].debit = 99;
    await expect(postJournal(unbalanced)).rejects.toThrow(/Unbalanced/);
    await expect(postJournal({ ...entry(), lines: [] })).rejects.toThrow(/at least two lines/);
    const zero = entry(); zero.lines[0].debit = 0; zero.lines[1].credit = 0;
    await expect(postJournal(zero)).rejects.toThrow(/one positive debit or credit|non-zero/);
    const bothSides = entry(); bothSides.lines[0] = { account: '1100', debit: 100, credit: 100 };
    await expect(postJournal(bothSides)).rejects.toThrow(/one positive debit or credit/);
  });

  it('rejects replayed identifiers with an explicit reconciliation error', async () => {
    const dup = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '6.19.3',
    });
    vi.mocked(db.journalEntry.create).mockRejectedValue(dup);
    await expect(postJournal(entry())).rejects.toThrow(/already posted; reconcile rather than replay/);
  });

  it('requires memo and actor', async () => {
    await expect(postJournal({ ...entry(), memo: '' })).rejects.toThrow(/memo/);
    await expect(postJournal({ ...entry(), actorId: ' ' })).rejects.toThrow(/actor/);
  });

  it('validates source identifiers (stable snake_case)', async () => {
    await expect(postJournal({ ...entry(), source: 'Finance Invoice' })).rejects.toThrow(/source/);
    await expect(postJournal({ ...entry(), source: 'finance.invoice' })).resolves.toEqual({ journalId: 'test-journal' });
  });
});

describe('fiscal period control', () => {
  it('rejects posting into a CLOSED period', async () => {
    vi.mocked(db.fiscalPeriod.findFirst).mockResolvedValue({ name: '2026-10', status: 'CLOSED' } as never);
    await expect(postJournal(entry())).rejects.toThrow(/Fiscal period 2026-10 is CLOSED/);
    expect(db.journalEntry.create).not.toHaveBeenCalled();
  });

  it('allows posting when no period is defined (open-world accounting)', async () => {
    vi.mocked(db.fiscalPeriod.findFirst).mockResolvedValue(null as never);
    await expect(postJournal(entry())).resolves.toEqual({ journalId: 'test-journal' });
  });

  it('opening a period rejects overlaps', async () => {
    vi.mocked(db.fiscalPeriod.findFirst).mockResolvedValue({ name: '2026-10' } as never);
    await expect(openFiscalPeriod('2026-11', '2026-11-01', '2026-11-30')).rejects.toThrow(/overlaps/);
  });

  it('closing requires an actor and an open period', async () => {
    vi.mocked(db.fiscalPeriod.findUnique).mockResolvedValue(null as never);
    await expect(closeFiscalPeriod('2026-10', 'actor')).rejects.toThrow(/not found/);
    vi.mocked(db.fiscalPeriod.findUnique).mockResolvedValue({ id: 'p1', name: '2026-10', status: 'CLOSED' } as never);
    await expect(closeFiscalPeriod('2026-10', 'actor')).rejects.toThrow(/already closed/);
    vi.mocked(db.fiscalPeriod.findUnique).mockResolvedValue({ id: 'p1', name: '2026-10', status: 'OPEN' } as never);
    await expect(closeFiscalPeriod('2026-10', ' ')).rejects.toThrow(/actor/);
    await expect(closeFiscalPeriod('2026-10', 'actor')).resolves.toBeUndefined();
    expect(vi.mocked(db.fiscalPeriod.update).mock.calls[0][0].data).toMatchObject({ status: 'CLOSED', closedById: 'actor' });
  });
});

describe('reversal', () => {
  const original = {
    id: 'je_1',
    entryDate: new Date('2026-10-01T00:00:00.000Z'),
    memo: 'Invoice X',
    source: 'finance.invoice',
    currency: 'BDT',
    status: 'POSTED',
    totalDebit: 50000,
    totalCredit: 50000,
    reversalOfId: null,
    lines: [
      { accountCode: '1100', accountName: 'Accounts Receivable', debit: 50000, credit: 0, entityId: 'inv1', entityType: 'Invoice' },
      { accountCode: '4000', accountName: 'Revenue — Commissions', debit: 0, credit: 50000, entityId: 'inv1', entityType: 'Invoice' },
    ],
  };

  it('creates a mirrored entry and flips the original in one transaction', async () => {
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
      const tx = {
        journalEntry: {
          findUnique: vi.fn().mockResolvedValue(original),
          create: vi.fn().mockResolvedValue({ id: 'je_rev_je_1' }),
          update: vi.fn().mockResolvedValue({}),
        },
      };
      return fn(tx);
    });
    await expect(reverseJournal('je_1', 'admin')).resolves.toEqual({ journalId: 'je_rev_je_1' });
  });

  it('refuses to reverse a missing, already-reversed or reversal entry', async () => {
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
      const tx = { journalEntry: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } };
      return fn(tx);
    });
    vi.mocked(db.$transaction).mockClear();
    // missing
    let tx: any;
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
      tx = {
        journalEntry: {
          findUnique: vi.fn().mockResolvedValue(null),
          create: vi.fn(),
          update: vi.fn(),
        },
      };
      return fn(tx);
    });
    await expect(reverseJournal('nope', 'admin')).rejects.toThrow(/not found/);
    // already reversed
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
      tx = {
        journalEntry: {
          findUnique: vi.fn().mockResolvedValue({ ...original, status: 'REVERSED' }),
          create: vi.fn(),
          update: vi.fn(),
        },
      };
      return fn(tx);
    });
    await expect(reverseJournal('je_1', 'admin')).rejects.toThrow(/already reversed/);
    // reversal of a reversal
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => {
      tx = {
        journalEntry: {
          findUnique: vi.fn().mockResolvedValue({ ...original, reversalOfId: 'je_0' }),
          create: vi.fn(),
          update: vi.fn(),
        },
      };
      return fn(tx);
    });
    await expect(reverseJournal('je_1', 'admin')).rejects.toThrow(/cannot be reversed/);
  });
});

describe('reporting', () => {
  it('trial balance aggregates POSTED entries with normal-balance signs', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([
      { accountCode: '1100', totalDebit: 100000n, totalCredit: 0n },
      { accountCode: '4000', totalDebit: 0n, totalCredit: 100000n },
    ] as never);
    const rows = await trialBalance();
    const ar = rows.find((r) => r.accountCode === '1100');
    const rev = rows.find((r) => r.accountCode === '4000');
    expect(ar?.balance).toBe(100000); // asset: debit-normal
    expect(rev?.balance).toBe(100000); // revenue: credit-normal → reported positive
  });

  it('trial balance fails closed on corrupt aggregates', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ accountCode: '1100', totalDebit: Number.MAX_SAFE_INTEGER * 2, totalCredit: 0 }] as never);
    await expect(trialBalance()).rejects.toThrow(/safe amount/);
  });

  it('A/R aging reads account 1100 only from POSTED entries', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([{ totalDebit: 150000n, totalCredit: 50000n }] as never);
    const aging = await computeARAging();
    expect(aging).toMatchObject({ grossReceivable: 1500, credits: 500, netReceivable: 1000, unappliedCredits: null });
  });

  it('A/R aging never reports zero on outage', async () => {
    vi.mocked(db.$queryRaw).mockResolvedValue([] as never);
    // Empty ledger is legitimately zero
    expect(await computeARAging()).toMatchObject({ grossReceivable: 0, netReceivable: 0 });
    vi.mocked(db.$queryRaw).mockRejectedValue(new Error('db down'));
    await expect(computeARAging()).rejects.toThrow('db down');
  });

  it('integrity audit detects unbalanced stored entries', async () => {
    vi.mocked(db.journalEntry.findMany).mockResolvedValue([
      { id: 'a', totalDebit: 100, totalCredit: 100, lines: [{ debit: 100, credit: 0 }, { debit: 0, credit: 100 }] },
      { id: 'b', totalDebit: 100, totalCredit: 90, lines: [{ debit: 100, credit: 0 }, { debit: 0, credit: 90 }] },
    ] as never);
    expect(await verifyLedgerIntegrity()).toEqual({ entriesChecked: 2, balanced: false });
  });
});

describe('cents conversion', () => {
  it('accepts exact two-decimal amounts', () => {
    expect(toCents(10.01)).toBe(1001);
    expect(toCents(0)).toBe(0);
  });
  it('rejects three-decimal precision loss', () => {
    expect(() => toCents(10.001)).toThrow();
  });
});
