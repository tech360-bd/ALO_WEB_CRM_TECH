import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { assignAsset, returnAsset, recordMaintenance, disposeAsset } from '@/lib/assets/service';

// ============================================================
// GET   /api/assets/[id] — detail with assignment, maintenance
//       and depreciation history
// PATCH /api/assets/[id] — lifecycle: { action: 'assign' | 'return'
//       | 'maintenance' | 'dispose', ...payload }
// ============================================================

export const GET = withAuth(async (
  _request: Request,
  _auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const asset = await db.fixedAsset.findUnique({
    where: { id },
    include: {
      assignments: { orderBy: { assignedAt: 'desc' } },
      maintenance: { orderBy: { maintenanceDate: 'desc' } },
      depreciation: { orderBy: { period: 'desc' } },
    },
  });
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  return NextResponse.json({
    asset,
    netBookValueCents: asset.purchaseCost - asset.accumulatedDepreciation,
    remainingDepreciableCents: Math.max(0, asset.purchaseCost - asset.salvageValue - asset.accumulatedDepreciation),
  });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT', 'EMPLOYEE'] });

export const PATCH = withAuth(async (
  request: Request,
  _auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (!['assign', 'return', 'maintenance', 'dispose'].includes(action)) {
    return NextResponse.json({ error: 'action must be assign, return, maintenance or dispose' }, { status: 400 });
  }
  try {
    switch (action) {
      case 'assign': {
        if (!body.assignedToId) return NextResponse.json({ error: 'assignedToId is required' }, { status: 400 });
        return NextResponse.json(await assignAsset(id, body.assignedToId, { conditionOut: body.conditionOut, notes: body.notes }));
      }
      case 'return': {
        return NextResponse.json(await returnAsset(id, { conditionIn: body.conditionIn, notes: body.notes }));
      }
      case 'maintenance': {
        if (!body.maintenanceDate) return NextResponse.json({ error: 'maintenanceDate is required' }, { status: 400 });
        return NextResponse.json(await recordMaintenance({ ...body, assetId: id }), { status: 201 });
      }
      case 'dispose': {
        if (body.disposalAmount === undefined || !body.disposalDate) {
          return NextResponse.json({ error: 'disposalAmount and disposalDate are required' }, { status: 400 });
        }
        return NextResponse.json(await disposeAsset(id, body.disposalAmount, body.disposalDate));
      }
    }
    // Unreachable: action is validated above; kept for exhaustive safety.
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transition failed';
    const conflict = /already assigned|already disposed|not assigned|retired or disposed/.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'PROCUREMENT'] });
