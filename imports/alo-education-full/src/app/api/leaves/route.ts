import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination, auditLog } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const LEAVE_TYPES = ['SICK', 'CASUAL', 'ANNUAL', 'MATERNITY', 'PATERNITY', 'UNPAID', 'COMPENSATORY'];

const createLeaveSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(LEAVE_TYPES),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalDays: z.number().int().min(1),
  reason: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — List leave requests with filters, pagination                      */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
  const sp = req.nextUrl.searchParams;

  // Build filters
  const filters: Record<string, unknown>[] = [];

  if (sp.get('employeeId')) filters.push({ employeeId: sp.get('employeeId') });
  if (sp.get('status')) filters.push({ status: sp.get('status') });
  if (sp.get('type')) filters.push({ type: sp.get('type') });

  // Non-admin employees see only their own leave requests
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && !sp.get('employeeId')) {
    const employee = await db.employeeHR.findFirst({ where: { userId: auth.user.id } });
    if (employee) {
      filters.push({ employeeId: employee.id });
    }
  }

  const where = filters.length > 0 ? { AND: filters } : {};

  try {
    const [data, total] = await Promise.all([
      db.leaveRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.leaveRequest.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch leave requests.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create leave request                                             */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createLeaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Employees can only create leave for themselves (or HR/admin for others)
    if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && parsed.data.employeeId !== auth.user.id) {
      const employee = await db.employeeHR.findFirst({ where: { userId: auth.user.id } });
      const isHr = employee?.designation === 'HR Manager';
      if (!isHr) {
        return NextResponse.json(
          { success: false, error: 'Access denied. You can only create leave requests for yourself.' },
          { status: 403 },
        );
      }
    }

    // Validate date range
    if (parsed.data.startDate > parsed.data.endDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date.' },
        { status: 400 },
      );
    }

    const record = await db.leaveRequest.create({
      data: {
        employeeId: parsed.data.employeeId,
        type: parsed.data.type,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        totalDays: parsed.data.totalDays,
        reason: parsed.data.reason || null,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE',
      resource: 'LeaveRequest',
      resourceId: record.id,
      details: { type: parsed.data.type, totalDays: parsed.data.totalDays },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating leave:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create leave request.' },
      { status: 500 },
    );
  }
}
