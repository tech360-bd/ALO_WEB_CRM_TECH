import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { submitPurchaseRequest, decidePurchaseRequest, PROCUREMENT_APPROVER_TYPES } from '@/lib/procurement/service';

// ============================================================
// GET   /api/procurement/purchase-requests/[id] — detail
// PATCH /api/procurement/purchase-requests/[id] — transition:
//        { action: 'submit' | 'approve' | 'reject', reason? }
// Approval requires FINANCE/ADMIN/SUPER_ADMIN/CEO.
// ============================================================

export const GET = withAuth(async (
  _request: Request,
  _auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const request = await db.purchaseRequest.findUnique({
    where: { id },
    include: { lines: true, purchaseOrder: { include: { lines: true, vendor: true } } },
  });
  if (!request) return NextResponse.json({ error: 'Purchase request not found' }, { status: 404 });
  return NextResponse.json(request);
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT', 'EMPLOYEE'] });

export const PATCH = withAuth(async (
  request: Request,
  auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (!['submit', 'approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'action must be submit, approve or reject' }, { status: 400 });
  }
  try {
    if (action === 'submit') {
      return NextResponse.json(await submitPurchaseRequest(id));
    }
    if (!PROCUREMENT_APPROVER_TYPES.includes(auth.userType.toUpperCase())) {
      return NextResponse.json({ error: 'Only FINANCE/ADMIN/SUPER_ADMIN/CEO can decide purchase requests' }, { status: 403 });
    }
    return NextResponse.json(await decidePurchaseRequest(
      id,
      action === 'approve' ? 'approved' : 'rejected',
      auth.actorUserId,
      body?.reason,
    ));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transition failed';
    const conflict = /missing or already|not in DRAFT/.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT', 'EMPLOYEE'] });
