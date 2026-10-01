// Fixed-asset management contracts (src/lib/assets/service.ts).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    fixedAsset: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findMany: vi.fn(), findUniqueOrThrow: vi.fn() },
    assetAssignment: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    assetMaintenance: { create: vi.fn() },
    depreciationEntry: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));
vi.mock('@/lib/accounting/ledger', () => ({
  postJournal: vi.fn().mockResolvedValue({ journalId: 'je_dep_test' }),
}));
import { db } from '@/lib/db';
import {
  createAsset,
  assignAsset,
  returnAsset,
  recordMaintenance,
  monthlyDepreciationCents,
  depreciateAsset,
  runMonthlyDepreciation,
  disposeAsset,
} from '@/lib/assets/service';

const ASSET = {
  id: 'a1', assetTag: 'AST-1', status: 'IN_USE', purchaseCost: 120000, salvageValue: 0,
  usefulLifeMonths: 12, accumulatedDepreciation: 0, currency: 'BDT',
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(db.fixedAsset.findUnique).mockResolvedValue(ASSET as never);
});

describe('asset creation', () => {
  it('creates an asset with cents and validation', async () => {
    vi.mocked(db.fixedAsset.create).mockResolvedValue({ id: 'a1' } as never);
    await createAsset({ name: 'MacBook Pro', purchaseDate: '2026-10-01', purchaseCost: 2500.50, usefulLifeMonths: 36 }, 'admin');
    expect(db.fixedAsset.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ purchaseCost: 250050, salvageValue: 0, usefulLifeMonths: 36, status: 'IN_STORAGE' }),
    });
  });
  it('rejects salvage above cost, bad life and bad dates', async () => {
    await expect(createAsset({ name: 'X', purchaseDate: '2026-10-01', purchaseCost: 100, salvageValue: 200 }, 'a')).rejects.toThrow(/Salvage/);
    await expect(createAsset({ name: 'X', purchaseDate: '2026-10-01', purchaseCost: 100, usefulLifeMonths: 0 }, 'a')).rejects.toThrow(/Useful life/);
    await expect(createAsset({ name: 'X', purchaseDate: '10/01/2026', purchaseCost: 100 }, 'a')).rejects.toThrow(/date/);
  });
});

describe('assignment', () => {
  it('assigns with an audit row and flips status', async () => {
    const tx = {
      fixedAsset: { findUnique: vi.fn().mockResolvedValue({ ...ASSET, assignedToId: null }), update: vi.fn().mockResolvedValue({ id: 'a1', status: 'IN_USE' }) },
      assetAssignment: { create: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await assignAsset('a1', 'emp1');
    expect(tx.assetAssignment.create).toHaveBeenCalledWith({ data: expect.objectContaining({ assetId: 'a1', assignedToId: 'emp1' }) });
    expect(tx.fixedAsset.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { assignedToId: 'emp1', status: 'IN_USE' } });
  });
  it('refuses double assignment and retired assets', async () => {
    const tx = {
      fixedAsset: { findUnique: vi.fn().mockResolvedValue({ ...ASSET, assignedToId: 'emp9' }), update: vi.fn() },
      assetAssignment: { create: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await expect(assignAsset('a1', 'emp1')).rejects.toThrow(/already assigned/);
    tx.fixedAsset.findUnique.mockResolvedValue({ ...ASSET, status: 'RETIRED' });
    await expect(assignAsset('a1', 'emp1')).rejects.toThrow(/retired or disposed/);
  });
  it('return closes the open assignment', async () => {
    const tx = {
      fixedAsset: { findUnique: vi.fn().mockResolvedValue({ ...ASSET, assignedToId: 'emp1' }), update: vi.fn() },
      assetAssignment: { findFirst: vi.fn().mockResolvedValue({ id: 'asg1', returnedAt: null }), update: vi.fn() },
    };
    vi.mocked(db.$transaction).mockImplementation(async (fn: any) => fn(tx));
    await returnAsset('a1');
    expect(tx.assetAssignment.update).toHaveBeenCalledWith({
      where: { id: 'asg1' },
      data: expect.objectContaining({ returnedAt: expect.any(Date), conditionIn: 'GOOD' }),
    });
  });
});

describe('depreciation', () => {
  it('straight-line monthly amount is floor(depreciable/life)', () => {
    expect(monthlyDepreciationCents({ purchaseCost: 120000, salvageValue: 0, usefulLifeMonths: 12 })).toBe(10000);
    expect(monthlyDepreciationCents({ purchaseCost: 100000, salvageValue: 10000, usefulLifeMonths: 36 })).toBe(2500);
    expect(monthlyDepreciationCents({ purchaseCost: 500, salvageValue: 500, usefulLifeMonths: 12 })).toBe(0);
  });

  it('posts DR 5200 / CR 1510 and updates accumulated depreciation', async () => {
    vi.mocked(db.fixedAsset.update).mockResolvedValue({ ...ASSET } as never);
    const result = await depreciateAsset('a1', '2026-10', 'fin');
    expect(result).toEqual({ depreciated: true, amountCents: 10000, journalEntryId: 'je_dep_test' });
    const { postJournal } = await import('@/lib/accounting/ledger');
    expect(postJournal).toHaveBeenCalledWith(expect.objectContaining({
      id: 'je_dep_a1_2026-10',
      source: 'asset.depreciation',
      sourceRefId: 'a1:2026-10',
      lines: [
        expect.objectContaining({ account: '5200', debit: 100 }),
        expect.objectContaining({ account: '1510', credit: 100 }),
      ],
    }));
    expect(db.depreciationEntry.create).toHaveBeenCalledWith({
      data: { assetId: 'a1', period: '2026-10', depreciationAmount: 10000, accumulatedAfter: 10000, journalEntryId: 'je_dep_test' },
    });
    expect(db.fixedAsset.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { accumulatedDepreciation: 10000 } });
  });

  it('final period takes the remainder so accumulated never exceeds the base', async () => {
    vi.mocked(db.fixedAsset.findUnique).mockResolvedValue({
      ...ASSET, purchaseCost: 100001, usefulLifeMonths: 12, accumulatedDepreciation: 100000,
    } as never);
    const result = await depreciateAsset('a1', '2026-10', 'fin');
    expect(result.amountCents).toBe(1); // remainder, not the full monthly 8333
  });

  it('skips fully depreciated, retired and disposed assets', async () => {
    vi.mocked(db.fixedAsset.findUnique).mockResolvedValue({ ...ASSET, accumulatedDepreciation: 120000 } as never);
    expect(await depreciateAsset('a1', '2026-10', 'fin')).toMatchObject({ depreciated: false, amountCents: 0 });
    vi.mocked(db.fixedAsset.findUnique).mockResolvedValue({ ...ASSET, status: 'DISPOSED' } as never);
    expect(await depreciateAsset('a1', '2026-10', 'fin')).toMatchObject({ depreciated: false, amountCents: 0 });
  });

  it('rejects malformed periods', async () => {
    await expect(depreciateAsset('a1', '2026-13', 'fin')).rejects.toThrow(/YYYY-MM/);
    await expect(depreciateAsset('a1', '2026-1', 'fin')).rejects.toThrow(/YYYY-MM/);
  });

  it('batch run tolerates already-depreciated assets and keeps going', async () => {
    vi.mocked(db.fixedAsset.findMany).mockResolvedValue([{ id: 'a1' }, { id: 'a2' }] as never);
    const { postJournal } = await import('@/lib/accounting/ledger');
    vi.mocked(postJournal)
      .mockResolvedValueOnce({ journalEntryId: 'je1' })
      .mockRejectedValueOnce(new Error('Unique constraint failed: already posted'));
    const report = await runMonthlyDepreciation('2026-10', 'fin');
    expect(report.assetsConsidered).toBe(2);
    expect(report.assetsDepreciated).toBe(1);
    expect(report.results.find((r) => r.assetId === 'a2')?.error).toContain('already depreciated');
  });
});

describe('maintenance and disposal', () => {
  it('records maintenance and flags the asset', async () => {
    vi.mocked(db.assetMaintenance.create).mockResolvedValue({ id: 'm1' } as never);
    await recordMaintenance({ assetId: 'a1', maintenanceDate: '2026-10-05', cost: 250.75, type: 'REPAIR' });
    expect(db.assetMaintenance.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ cost: 25075, type: 'REPAIR' }),
    });
    expect(db.fixedAsset.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { status: 'MAINTENANCE' } });
  });
  it('disposal is a conditional transition', async () => {
    vi.mocked(db.fixedAsset.updateMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(db.fixedAsset.findUniqueOrThrow).mockResolvedValue({ id: 'a1', status: 'DISPOSED' } as never);
    await disposeAsset('a1', 500, '2026-10-10');
    expect(db.fixedAsset.updateMany).toHaveBeenCalledWith({
      where: { id: 'a1', status: { in: ['IN_USE', 'IN_STORAGE', 'MAINTENANCE', 'RETIRED'] } },
      data: expect.objectContaining({ status: 'DISPOSED', disposalAmount: 50000 }),
    });
    vi.mocked(db.fixedAsset.updateMany).mockResolvedValue({ count: 0 } as never);
    await expect(disposeAsset('a1', 500, '2026-10-10')).rejects.toThrow(/already disposed/);
  });
});
