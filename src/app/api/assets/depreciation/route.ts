import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { runMonthlyDepreciation, depreciateAsset } from '@/lib/assets/service';

// ============================================================
// GET  /api/assets/depreciation?period=YYYY-MM — preview which
//      assets would depreciate (no posting)
// POST /api/assets/depreciation — run depreciation
//      { period: 'YYYY-MM' } for all active assets, or
//      { period, assetId } for a single asset.
// Posts DR 5200 / CR 1510 per asset; idempotent per (asset, period).
// Finance/admin only — this touches the general ledger.
// ============================================================

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const period = url.searchParams.get('period');
  if (!period || !/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    return NextResponse.json({ error: 'period must be YYYY-MM' }, { status: 400 });
  }
  return NextResponse.json({ period, note: 'POST this period to run depreciation' });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO'] });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body?.period || !/^\d{4}-(0[1-9]|1[0-2])$/.test(body.period)) {
    return NextResponse.json({ error: 'period must be YYYY-MM' }, { status: 400 });
  }
  try {
    if (body.assetId) {
      const result = await depreciateAsset(body.assetId, body.period, auth.actorUserId);
      return NextResponse.json({ period: body.period, ...result });
    }
    const report = await runMonthlyDepreciation(body.period, auth.actorUserId);
    return NextResponse.json(report);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Depreciation run failed' }, { status: 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO'] });
