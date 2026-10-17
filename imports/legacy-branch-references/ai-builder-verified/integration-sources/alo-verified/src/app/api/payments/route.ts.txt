import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId') || '';
    const partnerId = searchParams.get('partnerId') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const invoiceType = searchParams.get('invoiceType') || '';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    // Fetch payments
    const paymentWhere: Record<string, unknown> = {};
    if (studentId) paymentWhere.studentId = studentId;
    if (status) paymentWhere.status = status;

    const payments = await db.payment.findMany({
      where: paymentWhere,
      take: limit,
      orderBy: { paidAt: 'desc' },
    });

    // Fetch invoices
    const invoiceWhere: Record<string, unknown> = {};
    if (studentId) invoiceWhere.studentId = studentId;
    if (partnerId) invoiceWhere.partnerId = partnerId;
    if (status) invoiceWhere.status = status;
    if (invoiceType) invoiceWhere.type = invoiceType;
    if (search) {
      invoiceWhere.OR = [
        { invoiceId: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const invoices = await db.invoice.findMany({
      where: invoiceWhere,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    // Fetch expenses
    const expenseWhere: Record<string, unknown> = {};
    if (status) expenseWhere.status = status;
    if (category) expenseWhere.category = category;

    const expenses = await db.expense.findMany({
      where: expenseWhere,
      take: limit,
      orderBy: { date: 'desc' },
    });

    // Invoice summary
    const invoiceSummary = await db.invoice.aggregate({
      _sum: { amount: true, paidAmount: true },
    });

    const pendingInvoices = await db.invoice.aggregate({
      _sum: { amount: true },
      where: { status: { in: ['pending', 'partial'] } },
    });

    const overdueCount = await db.invoice.count({
      where: { status: 'overdue' },
    });

    return NextResponse.json({
      payments,
      invoices,
      expenses,
      summary: {
        totalInvoiced: invoiceSummary._sum.amount || 0,
        totalPaid: invoiceSummary._sum.paidAmount || 0,
        pendingAmount: pendingInvoices._sum.amount || 0,
        overdueCount,
      },
    });
  } catch (error) {
    console.error('Payments GET error:', error);
    return NextResponse.json({ payments: [], invoices: [], expenses: [], summary: {} });
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const type = body.type || 'payment';

    if (type === 'invoice') {
      // Create invoice
      const lastInvoice = await db.invoice.findFirst({
        orderBy: { createdAt: 'desc' },
        select: { invoiceId: true },
      });
      let nextNum = 1;
      if (lastInvoice?.invoiceId) {
        const parts = lastInvoice.invoiceId.split('-');
        if (parts.length >= 2) {
          nextNum = parseInt(parts[parts.length - 1]) + 1;
        }
      }
      const invoiceId = `INV-${new Date().getFullYear()}${nextNum.toString().padStart(5, '0')}`;

      const invoice = await db.invoice.create({
        data: {
          invoiceId,
          studentId: body.studentId || null,
          partnerId: body.partnerId || null,
          type: body.invoiceType || 'student',
          amount: body.amount || 0,
          currency: body.currency || 'GBP',
          description: body.description || null,
          dueDate: body.dueDate ? new Date(body.dueDate) : null,
          paidAmount: 0,
          status: 'pending',
        },
      });

      return NextResponse.json(invoice, { status: 201 });
    }

    if (type === 'expense') {
      // Create expense
      const expense = await db.expense.create({
        data: {
          category: body.category || 'other',
          amount: body.amount || 0,
          currency: body.currency || 'GBP',
          description: body.description || null,
          paidBy: body.paidBy || null,
          status: body.status || 'pending',
          date: body.date ? new Date(body.date) : new Date(),
        },
      });

      return NextResponse.json(expense, { status: 201 });
    }

    // Default: Create payment
    const payment = await db.payment.create({
      data: {
        studentId: body.studentId || null,
        invoiceId: body.invoiceId || null,
        amount: body.amount || 0,
        currency: body.currency || 'GBP',
        paymentMethod: body.paymentMethod || null,
        transactionRef: body.transactionRef || null,
        status: body.status || 'completed',
        paidAt: new Date(),
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error('Payments POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const type = body.type || 'payment';

    if (type === 'invoice') {
      // Update invoice
      const updateData: Record<string, unknown> = {};
      if (body.status) updateData.status = body.status;
      if (body.paidAmount !== undefined) updateData.paidAmount = body.paidAmount;
      if (body.status === 'paid') updateData.paidAt = new Date();

      const invoice = await db.invoice.update({
        where: { id: body.id },
        data: updateData,
      });

      return NextResponse.json(invoice);
    }

    if (type === 'expense') {
      // Update expense
      const updateData: Record<string, unknown> = {};
      if (body.status) updateData.status = body.status;
      if (body.approvedBy) updateData.approvedBy = body.approvedBy;

      const expense = await db.expense.update({
        where: { id: body.id },
        data: updateData,
      });

      return NextResponse.json(expense);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Payments PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
