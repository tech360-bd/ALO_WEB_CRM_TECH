import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateExpenseSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'REIMBURSED']).optional(),
  notes: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — Get expense by ID                                                */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const record = await db.expense.findUnique({ where: { id } });
    if (!record) {
      return NextResponse.json(
        { success: false, error: 'Expense not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: record });
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expense.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Approve/reject/reimburse expense                                  */
/*     RBAC: only FINANCE, ADMIN, SUPER_ADMIN                              */
/* ------------------------------------------------------------------ */

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  // Check RBAC: FINANCE, ADMIN, SUPER_ADMIN
  const hasFinanceAccess =
    auth.user.role === 'SUPER_ADMIN' ||
    auth.user.role === 'ADMIN' ||
    auth.user.role === 'FINANCE';

  if (!hasFinanceAccess) {
    return NextResponse.json(
      { success: false, error: 'Access denied. Only Finance, Admin, or Super Admin can process expenses.' },
      { status: 403 },
    );
  }

  try {
    const existing = await db.expense.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Expense not found.' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    if (!parsed.data.status) {
      return NextResponse.json(
        { success: false, error: 'Status is required.' },
        { status: 400 },
      );
    }

    // Validate transitions
    const validTransitions: Record<string, string[]> = {
      PENDING: ['APPROVED', 'REJECTED'],
      APPROVED: ['REIMBURSED', 'REJECTED'],
      REJECTED: [],
      REIMBURSED: [],
    };

    const allowed = validTransitions[existing.status];
    if (!allowed || !allowed.includes(parsed.data.status)) {
      return NextResponse.json(
        { success: false, error: `Invalid transition: ${existing.status} → ${parsed.data.status}` },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {
      status: parsed.data.status,
      approvedBy: auth.user.id,
    };
    if (parsed.data.notes) {
      updateData.notes = parsed.data.notes;
    }

    const updated = await db.expense.update({
      where: { id },
      data: updateData,
    });

    // Notify the submitter
    try {
      await db.notification.create({
        data: {
          userId: existing.submittedBy,
          type: 'EXPENSE_UPDATE',
          title: `Expense ${parsed.data.status}`,
          message: `Your expense "${existing.title}" (${existing.expenseId}) has been ${parsed.data.status?.toLowerCase()}.`,
          data: JSON.stringify({ expenseId: id }),
        },
      });
    } catch {
      // Notification failure should not break the flow
    }

    await auditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      resource: 'Expense',
      resourceId: id,
      details: { status: parsed.data.status, expenseId: existing.expenseId, amount: existing.amount },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update expense.' },
      { status: 500 },
    );
  }
}
