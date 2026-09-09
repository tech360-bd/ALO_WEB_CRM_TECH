import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/payments
// Returns student's payments with pagination and status filter
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const status = searchParams.get('status') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch payments';
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
      const body = await req.json();
      const { description, amount, currency, status, dueDate } = body;

      if (!amount || amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Valid payment amount is required.' },
          { status: 400 }
        );
      }

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

      const payment = await db.aloPayment.create({
        data: {
          studentId: profile.id,
          description: description || '',
          amount,
          currency: currency || 'BDT',
          status: status || 'pending',
          dueDate: dueDate || '',
          paidAt: status === 'paid' ? new Date() : null,
        },
      });

      // Audit log
      await logAuditAction(auth, 'PAYMENT_CREATED', 'AloPayment', payment.id, {
        amount,
        currency: currency || 'BDT',
        description: description || '',
      });

      return NextResponse.json({ success: true, data: payment }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create payment';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
