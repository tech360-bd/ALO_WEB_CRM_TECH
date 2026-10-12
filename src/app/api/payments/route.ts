import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireAuth as requireAuthApi } from '@/lib/api-auth';
import { requireAuth, requirePermission, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['COMPLETED', 'FAILED', 'CANCELLED'],
  COMPLETED: ['REFUNDED'],
  FAILED: ['PENDING', 'CANCELLED'],
  CANCELLED: ['PENDING'],
  REFUNDED: [],
};

function generatePaymentId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `PAY-${ts}-${rand}`;
}

// ─── GET: List payments ──────────────────────────────────────

export async function GET(req: NextRequest) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const sp = req.nextUrl.searchParams;
    const { page, limit, skip } = parsePagination(sp);

    const where: Record<string, unknown> = {};
    if (sp.get('studentId')) where.studentId = sp.get('studentId');
    if (sp.get('applicationId')) where.applicationId = sp.get('applicationId');
    if (sp.get('status')) where.status = sp.get('status');
    if (sp.get('type')) where.type = sp.get('type');

    // Students see only own payments
    if (auth.user.role === 'STUDENT') {
      where.studentId = auth.user.id;
    }

    const [data, total] = await Promise.all([
      db.payment.findMany({
        where,
        include: { invoices: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.payment.count({ where }),
    ]);

    return NextResponse.json({ success: true, data, meta: { page, limit, total } });
  } catch (error) {
    console.error('Error listing payments:', error);
    return NextResponse.json({ success: false, error: 'Failed to list payments.' }, { status: 500 });
  }
}

// ─── POST: Create payment ────────────────────────────────────

const createPaymentSchema = z.object({
  studentId: z.string().min(1),
  applicationId: z.string().optional(),
  type: z.string().min(1, 'Payment type is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().default('BDT'),
  method: z.string().optional(),
  transactionRef: z.string().optional(),
  notes: z.string().optional(),
  createInvoice: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const apiAuth = await requireAuthApi(req);
  if (apiAuth.error) return apiAuth.error;
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;

    // Permission: students can create own with finance.view_own, staff need finance.manage
    if (auth.user.role === 'STUDENT') {
      if (data.studentId !== auth.user.id) {
        return NextResponse.json({ success: false, error: 'Students can only create payments for themselves.' }, { status: 403 });
      }
      const perm = await requirePermission(req, 'finance.view_own');
      if (isErrorResponse(perm)) return perm;
    } else {
      const perm = await requirePermission(req, 'finance.manage');
      if (isErrorResponse(perm)) return perm;
    }

    const paymentId = generatePaymentId();

    const payment = await db.payment.create({
      data: {
        paymentId,
        studentId: data.studentId,
        applicationId: data.applicationId || undefined,
        type: data.type,
        amount: data.amount,
        currency: data.currency,
        method: data.method || undefined,
        transactionRef: data.transactionRef || undefined,
        notes: data.notes || undefined,
      },
    });

    // Create invoice if requested
    let invoice = null;
    if (data.createInvoice) {
      const invNo = `INV-${Date.now().toString(36).toUpperCase()}`;
      invoice = await db.invoice.create({
        data: {
          invoiceNo: invNo,
          paymentId: payment.id,
          studentId: data.studentId,
          amount: data.amount,
          tax: 0,
          totalAmount: data.amount,
          currency: data.currency,
          status: 'PENDING',
        },
      });
    }

    await auditLog({
      userId: auth.user.id,
      action: 'PAYMENT_CREATE',
      resource: 'Payment',
      resourceId: payment.id,
      details: { paymentId, amount: data.amount, currency: data.currency, type: data.type },
    });

    return NextResponse.json({ success: true, data: { payment, invoice } }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to create payment.' }, { status: 500 });
  }
}

// ─── PATCH: Update payment status ────────────────────────────

const patchPaymentSchema = z.object({
  id: z.string().min(1),
  status: z.string().min(1, 'Status is required'),
  notes: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const auth = await requirePermission(req, 'finance.manage');
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = patchPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues[0].message }, { status: 400 });
    }

    const existing = await db.payment.findUnique({ where: { id: parsed.data.id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Payment not found.' }, { status: 404 });
    }

    const allowed = VALID_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(parsed.data.status)) {
      return NextResponse.json({ success: false, error: `Invalid transition: ${existing.status} → ${parsed.data.status}` }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status: parsed.data.status };
    if (parsed.data.status === 'COMPLETED') updateData.paidAt = new Date();

    const payment = await db.payment.update({
      where: { id: parsed.data.id },
      data: updateData,
    });

    // Update linked invoices if payment completed
    if (parsed.data.status === 'COMPLETED') {
      await db.invoice.updateMany({
        where: { paymentId: parsed.data.id },
        data: { status: 'PAID', paidAt: new Date() },
      });
    }

    await auditLog({
      userId: auth.user.id,
      action: 'PAYMENT_STATUS_UPDATE',
      resource: 'Payment',
      resourceId: parsed.data.id,
      details: { from: existing.status, to: parsed.data.status },
    });

    return NextResponse.json({ success: true, data: payment });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json({ success: false, error: 'Failed to update payment.' }, { status: 500 });
  }
}
