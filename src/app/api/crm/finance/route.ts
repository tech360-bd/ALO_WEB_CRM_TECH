import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// CRM FINANCE API — AloPayment with summary & payment records
// ============================================================

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const studentId = searchParams.get('studentId') || '';
      const currency = searchParams.get('currency') || '';
      const includeSummary = searchParams.get('summary') === 'true';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (status) {
        const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
        if (statuses.length === 1) {
          where.status = statuses[0];
        } else if (statuses.length > 1) {
          where.status = { in: statuses };
        }
      }

      if (studentId) {
        where.studentId = studentId;
      }

      if (currency) {
        where.currency = currency;
      }

      if (search) {
        where.OR = [
          { description: { contains: search } },
          { studentId: { contains: search } },
        ];
      }

      // Build orderBy
      const validSortFields = ['createdAt', 'updatedAt', 'amount', 'status', 'dueDate', 'paidAt'];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const orderBy = { [orderField]: sortOrder === 'asc' ? 'asc' as const : 'desc' as const };

      // Get summary counts in parallel
      const summaryPromise = includeSummary
        ? (async () => {
            const [totalCount, pendingCount, paidCount, overdueCount, totalRevenue, pendingAmount] = await Promise.all([
              db.aloPayment.count({}),
              db.aloPayment.count({ where: { status: 'pending' } }),
              db.aloPayment.count({ where: { status: 'paid' } }),
              db.aloPayment.count({
                where: {
                  status: 'pending',
                  dueDate: { not: '' },
                },
              }),
              // Sum in application code so currency handling stays explicit.
              (async () => {
                const paidPayments = await db.aloPayment.findMany({
                  where: { status: 'paid' },
                  select: { amount: true, currency: true },
                });
                const total = paidPayments.reduce((sum, p) => sum + p.amount, 0);
                return total;
              })(),
              (async () => {
                const pendingPayments = await db.aloPayment.findMany({
                  where: { status: 'pending' },
                  select: { amount: true, currency: true },
                });
                return pendingPayments.reduce((sum, p) => sum + p.amount, 0);
              })(),
            ]);

            return {
              totalCount,
              pendingCount,
              paidCount,
              overdueCount,
              totalRevenue,
              pendingAmount,
            };
          })()
        : Promise.resolve(null);

      let [total, payments, summary] = await Promise.all([
        db.aloPayment.count({ where }),
        db.aloPayment.findMany({
          where,
          orderBy,
          skip,
          take: limit,
        }),
        summaryPromise,
      ]);

      const studentIds = [...new Set(payments.map((payment) => payment.studentId))];
      const students = studentIds.length
        ? await db.student.findMany({ where: { id: { in: studentIds } }, select: { id: true, name: true } })
        : [];
      const studentNames = new Map(students.map((student) => [student.id, student.name]));
      const totalPages = Math.ceil(total / limit);


      return NextResponse.json({
        success: true,
        data: payments.map(p => ({
          ...p,
          studentName: studentNames.get(p.studentId) || p.studentId,
          paymentType: p.description
        })),
        total,
        page,
        totalPages: totalPages === 0 ? 1 : totalPages,
        ...(summary ? { summary } : {}),
      });
    } catch (error) {
      console.error('CRM Finance API error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load finance data' },
        { status: 500 }
      );
    }
  })(request);
}

// ============================================================
// POST — Create payment record
// ============================================================
export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();

      const {
        studentId,
        description = '',
        amount = 0,
        currency = 'BDT',
        status = 'pending',
        dueDate = '',
      } = body;

      if (!studentId) {
        return NextResponse.json(
          { success: false, error: 'Student ID is required' },
          { status: 400 }
        );
      }

      if (amount <= 0) {
        return NextResponse.json(
          { success: false, error: 'Amount must be greater than 0' },
          { status: 400 }
        );
      }

      const payment = await db.aloPayment.create({
        data: {
          studentId,
          description,
          amount: parseFloat(String(amount)),
          currency,
          status,
          dueDate,
        },
      });

      // Log audit action
      await logAuditAction(auth, 'create_payment', 'AloPayment', payment.id, {
        studentId,
        amount: payment.amount,
        currency,
        description,
      });

      return NextResponse.json(
        { success: true, data: payment },
        { status: 201 }
      );
    } catch (error) {
      console.error('CRM Finance POST error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create payment record' },
        { status: 500 }
      );
    }
  })(request);
}
