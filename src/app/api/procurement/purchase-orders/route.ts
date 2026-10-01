import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { createPurchaseOrderFromRequest } from '@/lib/procurement/service';

// ============================================================
// GET  /api/procurement/purchase-orders — list with filters
// POST /api/procurement/purchase-orders — create a PO from an
//      APPROVED purchase request ({ requestId, vendorId, taxRate? })
// ============================================================

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const vendorId = url.searchParams.get('vendorId');
  const where = {
    ...(status ? { status } : {}),
    ...(vendorId ? { vendorId } : {}),
  };
  const [orders, total] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { lines: true, vendor: { select: { id: true, code: true, name: true } } },
    }),
    db.purchaseOrder.count({ where }),
  ]);
  return NextResponse.json({ orders, total });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT'] });

export const POST = withAuth(async (request: Request) => {
  const body = await request.json().catch(() => null);
  if (!body?.requestId || !body?.vendorId) {
    return NextResponse.json({ error: 'requestId and vendorId are required' }, { status: 400 });
  }
  try {
    const order = await createPurchaseOrderFromRequest({
      requestId: body.requestId,
      vendorId: body.vendorId,
      taxRate: body.taxRate,
      expectedDelivery: body.expectedDelivery,
      notes: body.notes,
    });
    return NextResponse.json(order, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create purchase order';
    const conflict = /already converted/.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'PROCUREMENT'] });
