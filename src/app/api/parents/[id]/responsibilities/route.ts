import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { RESPONSIBILITY_SCOPES, addPaymentResponsibility } from '@/lib/parent-guardian';

// ============================================================
// POST /api/parents/[id]/responsibilities — assign a financial obligation (s13)
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'FINANCE', 'FINANCE_MANAGER'];
type RouteContext = { params: Promise<{ id: string }> };

export const POST = withAuth(async (request: Request, _auth, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  try {
    const responsibility = await addPaymentResponsibility({
      parentId: id,
      applicationId: typeof body.applicationId === 'string' ? body.applicationId : '',
      scope: typeof body.scope === 'string' ? body.scope : 'ALL',
      amount: Number(body.amount ?? 0),
      currency: typeof body.currency === 'string' ? body.currency : 'USD',
      dueDate: body.dueDate ? String(body.dueDate) : null,
      notes: typeof body.notes === 'string' ? body.notes : '',
    });
    return NextResponse.json({ success: true, responsibility, scopes: RESPONSIBILITY_SCOPES }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to record responsibility' },
      { status: 400 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });
