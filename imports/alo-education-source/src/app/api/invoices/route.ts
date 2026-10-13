import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireRole } from '@/lib/api-auth';
import { requireAuth, requirePermission, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';

const VALID_INVOICE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['PAID', 'OVERDUE', 'CANCELLED'],
  OVERDUE: ['PAID', 'CANCELLED'],
  PAID: [],
  CANCELLED: [],
};

// ─── GET: List invoices ──────────────────────────────────────

export async function GET(req: NextRequest) {
  const apiAuth = await requireRole(req, ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'COUNSELOR', 'APPLICATION_TEAM']);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp);

    const where: Record<string, unknown> = {};
    if (sp.get('studentId')) where.studentId = sp.get('studentId');
    if (sp.get('partnerId')) where.partnerId = sp.get('partnerId');
    if (sp.get('status')) where.status = sp.get('status');

    // Students see only own invoices
    if (auth.user.role === 'STUDENT') {
      where.studentId = auth.user.id;
    }

    const [data, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: { payment: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error listing invoices:', error);
    return NextResponse.json({ success: false, error: 'Failed to list invoices.' }, { status: 500 });
  }
}

// ─── POST: Create invoice ────────────────────────────────────

const createInvoiceSchema = z.object({
  paymentId: z.string().optional(),
  studentId: z.string().min(1, 'Student ID is required'),
  partnerId: z.string().optional(),
  amount: z.number().nonnegative('Amount must be non-negative'),
  tax: z.number().nonnegative().default(0),
  currency: z.string().default('BDT'),
  dueDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'finance.invoices');
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;

    const invoice = await db.invoice.create({
      data: {
        invoiceNo,
        paymentId: data.paymentId || undefined,
        studentId: data.studentId,
        partnerId: data.partnerId || undefined,
        amount: data.amount,
        tax: data.tax,
        totalAmount: data.amount + data.tax,
        currency: data.currency,
        dueDate: data.dueDate,
        notes: data.notes || undefined,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'INVOICE_CREATE',
      resource: 'Invoice',
      resourceId: invoice.id,
      details: { invoiceNo, amount: data.amount, tax: data.tax, total: data.amount + data.tax },
    });

    return NextResponse.json({ success: true, data: invoice }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to create invoice.' }, { status: 500 });
  }
}

// ─── PATCH: Update invoice status ────────────────────────────

const patchInvoiceSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1, 'Status is required'),
});

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission(req, 'finance.invoices');
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = patchInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await db.invoice.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Invoice not found.' }, { status: 404 });
    }

    const allowed = VALID_INVOICE_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json({ success: false, error: `Invalid transition: ${existing.status} → ${parsed.data.status}` }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status };
    if (parsed.data.status === 'PAID') updateData.paidAt = new Date();

    const invoice = await db.invoice.update({
      where: { id: parsed.data.id },
      data: updateData,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'INVOICE_STATUS_UPDATE',
      resource: 'Invoice',
      resourceId: parsed.data.id,
      details: { from: existing.status, to: parsed.data.status },
    });

    return NextResponse.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to update invoice.' }, { status: 500 });
  }
}
