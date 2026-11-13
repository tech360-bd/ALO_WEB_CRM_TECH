import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { recordResponsibilityPayment } from '@/lib/parent-guardian';

// ============================================================
// POST /api/parents/[id]/responsibilities/[responsibilityId]/pay
// Records a payment against a parent's financial responsibility.
//
// The parent id in the path is cross-checked against the responsibility row so
// a caller cannot pay down another family's obligation by mixing ids (s99).
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'FINANCE', 'FINANCE_MANAGER'];
type RouteContext = { params: Promise<{ id: string; responsibilityId: string }> };

export const POST = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id, responsibilityId } = await context.params;
  const responsibility = await db.parentGuardianPaymentResponsibility.findUnique({
    where: { id: responsibilityId },
  });
  if (!responsibility) {
    return NextResponse.json({ success: false, error: 'Responsibility not found' }, { status: 404 });
  }
  if (responsibility.parentId !== id) {
    return NextResponse.json({ success: false, error: 'PARENT_MISMATCH' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ success: false, error: 'A positive amount is required' }, { status: 400 });
  }

  try {
    const result = await recordResponsibilityPayment(responsibilityId, amount);
    await logAuditAction(auth, 'PARENT_RESPONSIBILITY_PAYMENT', 'ParentGuardianPaymentResponsibility', responsibilityId, {
      amount,
      ...result,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Payment recording failed' },
      { status: 400 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });
