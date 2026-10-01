import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { createAsset } from '@/lib/assets/service';

// ============================================================
// GET  /api/assets — list/filter fixed assets
// POST /api/assets — register a fixed asset
// ============================================================

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');
  const assignedToId = url.searchParams.get('assignedToId');
  const where = {
    ...(status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(assignedToId ? { assignedToId } : {}),
  };
  const [assets, total] = await Promise.all([
    db.fixedAsset.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 }),
    db.fixedAsset.count({ where }),
  ]);
  const totals = {
    purchaseCostCents: assets.reduce((s, a) => s + a.purchaseCost, 0),
    accumulatedDepreciationCents: assets.reduce((s, a) => s + a.accumulatedDepreciation, 0),
    netBookValueCents: assets.reduce((s, a) => s + (a.purchaseCost - a.accumulatedDepreciation), 0),
    byStatus: assets.reduce<Record<string, number>>((acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; }, {}),
  };
  return NextResponse.json({ assets, total, totals });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT', 'EMPLOYEE'] });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.purchaseDate || body?.purchaseCost === undefined) {
    return NextResponse.json({ error: 'name, purchaseDate and purchaseCost are required' }, { status: 400 });
  }
  try {
    const asset = await createAsset(body, auth.actorUserId);
    return NextResponse.json(asset, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create asset' }, { status: 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'PROCUREMENT'] });
