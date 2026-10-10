// ============================================================================
// ALO Education — fixed asset management service.
//
// Assets, assignment history, maintenance records and straight-line monthly
// depreciation. Depreciation posts DR 5200 (Depreciation Expense) /
// CR 1510 (Accumulated Depreciation) to the REAL accounting ledger and keeps
// the denormalized accumulatedDepreciation in sync. All money is INTEGER CENTS.
// ============================================================================

import { db } from '@/lib/db';
import { postJournal } from '@/lib/accounting/ledger';
import { ACCUMULATED_DEPRECIATION_CODE, DEPRECIATION_EXPENSE_CODE } from '@/lib/accounting/chart';

function cents(amount: number): number {
  const value = Math.round(amount * 100);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(value)) {
    throw new Error('Asset amounts must be finite non-negative two-decimal amounts');
  }
  return value;
}

// ─── Assets ─────────────────────────────────────────────────────────────────

export async function createAsset(input: {
  assetTag?: string; name: string; category?: string; description?: string; serialNumber?: string;
  purchaseDate: string; purchaseCost: number; currency?: string; salvageValue?: number;
  usefulLifeMonths?: number; vendorId?: string; location?: string; departmentId?: string; notes?: string;
}, createdById: string) {
  if (!input.name?.trim()) throw new Error('Asset name is required');
  const purchaseCost = cents(input.purchaseCost);
  if (purchaseCost <= 0) throw new Error('Purchase cost must be positive');
  const salvageValue = cents(input.salvageValue ?? 0);
  if (salvageValue > purchaseCost) throw new Error('Salvage value cannot exceed purchase cost');
  const usefulLifeMonths = input.usefulLifeMonths ?? 36;
  if (!Number.isInteger(usefulLifeMonths) || usefulLifeMonths < 1 || usefulLifeMonths > 600) {
    throw new Error('Useful life must be 1..600 months');
  }
  const purchaseDate = new Date(`${input.purchaseDate}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.purchaseDate) || Number.isNaN(purchaseDate.getTime())) {
    throw new Error('Purchase date must be YYYY-MM-DD');
  }
  const assetTag = input.assetTag?.trim() || `AST-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return db.fixedAsset.create({
    data: {
      assetTag, name: input.name.trim(), category: input.category ?? 'IT',
      description: input.description ?? '', serialNumber: input.serialNumber ?? '',
      purchaseDate, purchaseCost, currency: input.currency ?? 'BDT', salvageValue,
      usefulLifeMonths, vendorId: input.vendorId ?? null, location: input.location ?? '',
      departmentId: input.departmentId ?? '', notes: input.notes ?? '',
      status: 'IN_STORAGE', createdById,
    },
  });
}

// ─── Assignment ─────────────────────────────────────────────────────────────

export async function assignAsset(assetId: string, assignedToId: string, opts: { conditionOut?: string; notes?: string } = {}) {
  if (!assignedToId?.trim()) throw new Error('Assignment requires an employee');
  return db.$transaction(async (tx) => {
    const asset = await tx.fixedAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new Error('Asset not found');
    if (asset.status === 'RETIRED' || asset.status === 'DISPOSED') throw new Error('Asset is retired or disposed');
    if (asset.assignedToId) throw new Error('Asset is already assigned; return it first');
    await tx.assetAssignment.create({
      data: {
        assetId, assignedToId, conditionOut: opts.conditionOut ?? 'GOOD', notes: opts.notes ?? '',
      },
    });
    return tx.fixedAsset.update({ where: { id: assetId }, data: { assignedToId, status: 'IN_USE' } });
  });
}

export async function returnAsset(assetId: string, opts: { conditionIn?: string; notes?: string } = {}) {
  return db.$transaction(async (tx) => {
    const asset = await tx.fixedAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new Error('Asset not found');
    if (!asset.assignedToId) throw new Error('Asset is not assigned');
    const openAssignment = await tx.assetAssignment.findFirst({
      where: { assetId, returnedAt: null },
      orderBy: { assignedAt: 'desc' },
    });
    if (openAssignment) {
      await tx.assetAssignment.update({
        where: { id: openAssignment.id },
        data: { returnedAt: new Date(), conditionIn: opts.conditionIn ?? 'GOOD', notes: opts.notes ?? openAssignment.notes },
      });
    }
    return tx.fixedAsset.update({ where: { id: assetId }, data: { assignedToId: null, status: 'IN_STORAGE' } });
  });
}

// ─── Maintenance ────────────────────────────────────────────────────────────

export async function recordMaintenance(input: {
  assetId: string; maintenanceDate: string; type?: string; cost?: number;
  description?: string; performedBy?: string; nextDueAt?: string;
}) {
  const cost = cents(input.cost ?? 0);
  const maintenanceDate = new Date(`${input.maintenanceDate}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.maintenanceDate) || Number.isNaN(maintenanceDate.getTime())) {
    throw new Error('Maintenance date must be YYYY-MM-DD');
  }
  if (input.type && !['PREVENTIVE', 'REPAIR', 'INSPECTION', 'UPGRADE'].includes(input.type)) {
    throw new Error('Invalid maintenance type');
  }
  const result = await db.assetMaintenance.create({
    data: {
      assetId: input.assetId, maintenanceDate, type: input.type ?? 'PREVENTIVE', cost,
      description: input.description ?? '', performedBy: input.performedBy ?? '',
      nextDueAt: input.nextDueAt ? new Date(`${input.nextDueAt}T00:00:00.000Z`) : null,
    },
  });
  await db.fixedAsset.update({ where: { id: input.assetId }, data: { status: 'MAINTENANCE' } });
  return result;
}

// ─── Depreciation ───────────────────────────────────────────────────────────

/** Monthly straight-line depreciation for one asset: (cost - salvage) / life. */
export function monthlyDepreciationCents(asset: { purchaseCost: number; salvageValue: number; usefulLifeMonths: number }): number {
  const depreciable = asset.purchaseCost - asset.salvageValue;
  if (depreciable <= 0) return 0;
  return Math.floor(depreciable / asset.usefulLifeMonths);
}

/** Depreciates one asset for a period (YYYY-MM). Idempotent per (asset, period):
 *  the unique index rejects a second run. Caps at the depreciable base. */
export async function depreciateAsset(assetId: string, period: string, actorId: string): Promise<{ depreciated: boolean; amountCents: number; journalEntryId?: string }> {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) throw new Error('Period must be YYYY-MM');
  if (!actorId?.trim()) throw new Error('Depreciation requires an actor');
  const asset = await db.fixedAsset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error('Asset not found');
  if (asset.status === 'RETIRED' || asset.status === 'DISPOSED') return { depreciated: false, amountCents: 0 };
  const depreciable = asset.purchaseCost - asset.salvageValue;
  if (asset.accumulatedDepreciation >= depreciable) return { depreciated: false, amountCents: 0 };

  const monthly = monthlyDepreciationCents(asset);
  // Final period takes the remainder so accumulated never exceeds the base.
  const remaining = depreciable - asset.accumulatedDepreciation;
  const amount = Math.min(monthly, remaining);
  if (amount <= 0) return { depreciated: false, amountCents: 0 };
  const accumulatedAfter = asset.accumulatedDepreciation + amount;

  const entryDate = `${period}-28`; // last safe day of the month
  const { journalId } = await postJournal({
    id: `je_dep_${asset.id}_${period}`,
    date: entryDate,
    memo: `Depreciation ${asset.assetTag} for ${period}`,
    source: 'asset.depreciation',
    sourceRefId: `${asset.id}:${period}`,
    actorId,
    currency: asset.currency,
    lines: [
      { account: DEPRECIATION_EXPENSE_CODE, debit: amount / 100, credit: 0, entityId: asset.id, entityType: 'FixedAsset' },
      { account: ACCUMULATED_DEPRECIATION_CODE, debit: 0, credit: amount / 100, entityId: asset.id, entityType: 'FixedAsset' },
    ],
  });

  await db.depreciationEntry.create({
    data: { assetId: asset.id, period, depreciationAmount: amount, accumulatedAfter, journalEntryId: journalId },
  });
  await db.fixedAsset.update({
    where: { id: asset.id },
    data: { accumulatedDepreciation: accumulatedAfter },
  });
  return { depreciated: true, amountCents: amount, journalEntryId: journalId };
}

/** Batch run for a period across active assets. Returns per-asset outcomes. */
export async function runMonthlyDepreciation(period: string, actorId: string) {
  const assets = await db.fixedAsset.findMany({
    where: { status: { in: ['IN_USE', 'IN_STORAGE', 'MAINTENANCE'] } },
    select: { id: true },
  });
  const results: { assetId: string; depreciated: boolean; amountCents: number; error?: string }[] = [];
  for (const asset of assets) {
    try {
      const result = await depreciateAsset(asset.id, period, actorId);
      results.push({ assetId: asset.id, ...result });
    } catch (err) {
      // A unique (assetId, period) violation means this asset was already
      // depreciated this period — record as not depreciated, keep going.
      const message = err instanceof Error ? err.message : String(err);
      if (/already posted|Unique constraint/i.test(message)) {
        results.push({ assetId: asset.id, depreciated: false, amountCents: 0, error: 'already depreciated this period' });
      } else {
        results.push({ assetId: asset.id, depreciated: false, amountCents: 0, error: message });
      }
    }
  }
  return {
    period,
    assetsConsidered: assets.length,
    assetsDepreciated: results.filter((r) => r.depreciated).length,
    totalDepreciationCents: results.reduce((s, r) => s + r.amountCents, 0),
    results,
  };
}

export async function disposeAsset(assetId: string, disposalAmount: number, disposalDate: string) {
  const amount = cents(disposalAmount);
  const date = new Date(`${disposalDate}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(disposalDate) || Number.isNaN(date.getTime())) {
    throw new Error('Disposal date must be YYYY-MM-DD');
  }
  const updated = await db.fixedAsset.updateMany({
    where: { id: assetId, status: { in: ['IN_USE', 'IN_STORAGE', 'MAINTENANCE', 'RETIRED'] } },
    data: { status: 'DISPOSED', disposalAmount: amount, disposalDate: date, assignedToId: null },
  });
  if (updated.count !== 1) throw new Error('Asset is missing or already disposed');
  return db.fixedAsset.findUniqueOrThrow({ where: { id: assetId } });
}
