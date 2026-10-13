import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination, auditLog } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const EXPENSE_CATEGORIES = ['OFFICE', 'TRAVEL', 'MARKETING', 'IT', 'UTILITIES', 'SALARY', 'COMMISSION', 'PARTNER', 'OTHER'];

const createExpenseSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.number().positive(),
  currency: z.string().default('BDT'),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  receiptPath: z.string().optional(),
  partnerId: z.string().optional(),
  notes: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — List expenses with filters, pagination                            */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
  const sp = req.nextUrl.searchParams;

  // Build filters
  const filters: Record<string, unknown>[] = [];

  if (sp.get('category')) filters.push({ category: sp.get('category') });
  if (sp.get('status')) filters.push({ status: sp.get('status') });
  if (sp.get('submittedBy')) filters.push({ submittedBy: sp.get('submittedBy') });

  // Non-admin employees see only their own expenses
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && !sp.get('submittedBy')) {
    filters.push({ submittedBy: auth.user.id });
  }

  const where = filters.length > 0 ? { AND: filters } : {};

  // Sort
  const sortField = sp.get('sortBy') || 'createdAt';
  const sortDir = sp.get('sortDir') === 'asc' ? 'asc' : 'desc';
  const orderBy: Record<string, string> = { [sortField]: sortDir };

  try {
    const [data, total] = await Promise.all([
      db.expense.findMany({
        where,
        orderBy,
        take: limit,
        skip,
      }),
      db.expense.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expenses.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create expense                                                  */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createExpenseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { generateExpenseId } = await import('@/lib/id-generator');
    const expenseId = await generateExpenseId();

    const record = await db.expense.create({
      data: {
        expenseId,
        title: parsed.data.title,
        description: parsed.data.description || null,
        category: parsed.data.category,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        expenseDate: parsed.data.expenseDate,
        submittedBy: auth.user.id,
        receiptPath: parsed.data.receiptPath || null,
        partnerId: parsed.data.partnerId || null,
        notes: parsed.data.notes || null,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE',
      resource: 'Expense',
      resourceId: record.id,
      details: { expenseId, category: parsed.data.category, amount: parsed.data.amount },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create expense.' },
      { status: 500 },
    );
  }
}
