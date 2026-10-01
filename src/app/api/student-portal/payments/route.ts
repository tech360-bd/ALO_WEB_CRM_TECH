import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { z } from 'zod';
// This is an unverified request, never settlement or a ledger posting.
const pendingPayment = z.object({
  amount: z.number().finite().positive(),
  description: z.string().max(191).optional(),
  currency: z.string().regex(/^[A-Z]{3}$/).optional(),
  status: z.literal('pending').optional(),
  dueDate: z.string().max(100).optional(),
}).strict();

// ============================================================
// GET /api/student-portal/payments
// Returns student's payments with pagination and status filter
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = Number(searchParams.get('page') || '1');
      const limit = Number(searchParams.get('limit') || '20');
      const status = searchParams.get('status') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100 || !['createdAt', 'updatedAt', 'amount', 'status', 'dueDate', 'paidAt'].includes(sortBy) || !['asc', 'desc'].includes(sortOrder)) return NextResponse.json({ success: false, error: 'Invalid pagination or sort' }, { status: 400 });

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const where: Record<string, unknown> = { studentId: profile.id };
      if (status) where.status = status;

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [payments, total] = await Promise.all([
        db.aloPayment.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.aloPayment.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: payments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch {
      const message = 'Failed to fetch payments';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/payments
// Create a new payment record
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const parsed = pendingPayment.safeParse(await req.json().catch(() => null));
      if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid pending payment request' }, { status: 400 });
      const { description, amount, currency, dueDate } = parsed.data;

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const payment = await db.$transaction(async tx => {
        const payment = await tx.aloPayment.create({
          data: {
            studentId: profile.id,
            description: description || '',
            amount,
            currency: currency || 'BDT',
            status: 'pending',
            dueDate: dueDate || '',
            paidAt: null,
          },
        });

        // Audit log
        await writePortalAudit(tx, auth, 'PAYMENT_CREATED', 'AloPayment', payment.id, {
          amount,
          currency: currency || 'BDT',
          description: description || '',
        });

        return payment;
      });
      return NextResponse.json({ success: true, data: payment }, { status: 201 });
    } catch {
      const message = 'Failed to create payment';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
