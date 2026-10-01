import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  approvePurchaseOrder,
  sendPurchaseOrder,
  receivePurchaseOrder,
  PROCUREMENT_APPROVER_TYPES,
} from '@/lib/procurement/service';

// ============================================================
// PATCH /api/procurement/purchase-orders/[id] — lifecycle transitions:
//   { action: 'approve' }              → posts DR Expense / CR A/P
//   { action: 'send' }                 → SENT to vendor
//   { action: 'receive', receipts: [...] } → goods receipt
// Approval requires FINANCE/ADMIN/SUPER_ADMIN/CEO.
// ============================================================

export const PATCH = withAuth(async (
  request: Request,
  auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const body = await request.json().catch(() => null);
  const action = body?.action;
  if (!['approve', 'send', 'receive'].includes(action)) {
    return NextResponse.json({ error: 'action must be approve, send or receive' }, { status: 400 });
  }
  try {
    if (action === 'approve') {
      if (!PROCUREMENT_APPROVER_TYPES.includes(auth.userType.toUpperCase())) {
        return NextResponse.json({ error: 'Only FINANCE/ADMIN/SUPER_ADMIN/CEO can approve purchase orders' }, { status: 403 });
      }
      return NextResponse.json(await approvePurchaseOrder(id, auth.actorUserId, auth.userType));
    }
    if (action === 'send') {
      return NextResponse.json(await sendPurchaseOrder(id));
    }
    if (!Array.isArray(body.receipts)) {
      return NextResponse.json({ error: 'receive requires receipts: [{ lineId, quantity }]' }, { status: 400 });
    }
    return NextResponse.json(await receivePurchaseOrder(id, body.receipts));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Transition failed';
    const conflict = /missing or not|not pending|has not been sent|exceeds ordered/.test(message);
    return NextResponse.json({ error: message }, { status: conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'PROCUREMENT'] });
