import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog, parsePagination } from '@/lib/access-control';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'DISABLED']).default('ACTIVE'),
  sortOrder: z.number().int().min(0).default(0),
});

// GET /api/ai/departments — list departments with pagination & status filter
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
    const status = req.nextUrl.searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [departments, total] = await Promise.all([
      db.aiDepartment.findMany({
        where,
        orderBy: { sortOrder: 'asc' },
        include: { _count: { select: { agents: true } } },
        skip,
        take: limit,
      }),
      db.aiDepartment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      departments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('List departments error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list departments.' },
      { status: 500 },
    );
  }
}

// POST /api/ai/departments — create department (SUPER_ADMIN/ADMIN only)
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Only SUPER_ADMIN or ADMIN can create departments.' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const parsed = createDepartmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { name, description, status, sortOrder } = parsed.data;

    // Check uniqueness
    const existing = await db.aiDepartment.findUnique({ where: { name } });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A department with this name already exists.' },
        { status: 409 },
      );
    }

    const department = await db.aiDepartment.create({
      data: { name, description, status, sortOrder },
      include: { _count: { select: { agents: true } } },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE_AI_DEPARTMENT',
      resource: 'AiDepartment',
      resourceId: department.id,
      details: { name, status },
      ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
    });

    return NextResponse.json({ success: true, department }, { status: 201 });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create department.' },
      { status: 500 },
    );
  }
}
