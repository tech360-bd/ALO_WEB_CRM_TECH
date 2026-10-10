import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { createPurchaseRequest, submitPurchaseRequest } from '@/lib/procurement/service';

// ============================================================
// GET  /api/procurement/purchase-requests — list (filter by status)
// POST /api/procurement/purchase-requests — create (DRAFT) or
//       create+submit a purchase request
// ============================================================

export const GET = withAuth(async (request: Request, auth) => {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const mine = url.searchParams.get('mine') === '1';
  // 'mine' is resolved from the authenticated actor, never a query param.
  const where = {
    ...(status ? { status } : {}),
    ...(mine ? { requestedById: auth.actorUserId } : {}),
  };
  const [requests, total] = await Promise.all([
    db.purchaseRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { lines: true, purchaseOrder: { select: { id: true, poNumber: true, status: true } } },
    }),
    db.purchaseRequest.count({ where }),
  ]);
  return NextResponse.json({ requests, total });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT', 'EMPLOYEE'] });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body?.title || !Array.isArray(body.lines)) {
    return NextResponse.json({ error: 'title and lines are required' }, { status: 400 });
  }
  try {
    const created = await createPurchaseRequest({
      title: body.title,
      description: body.description,
      requestedById: auth.actorUserId,
      departmentId: body.departmentId,
      neededBy: body.neededBy,
      currency: body.currency,
      lines: body.lines,
    });
    if (body.submit) {
      const submitted = await submitPurchaseRequest(created.id);
      return NextResponse.json(submitted, { status: 201 });
    }
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to create purchase request' }, { status: 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT', 'EMPLOYEE'] });
