import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination, auditLog, requirePermission } from '@/lib/access-control';
import { generateCaseId } from '@/lib/id-generator';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/* ------------------------------------------------------------------ */
/*  Zod schema for creating a case                                      */
/* ------------------------------------------------------------------ */

const createCaseSchema = z.object({
  type: z.string().min(1),
  studentId: z.string().optional(),
  employeeId: z.string().optional(),
  partnerId: z.string().optional(),
  department: z.string().min(1),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL', 'URGENT']).default('NORMAL'),
  risk: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  nextAction: z.string().optional(),
  dueDate: z.string().optional().transform(v => v ? new Date(v) : undefined),
  parentId: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — List cases with filters, search, sort, pagination            */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
  const sp = req.nextUrl.searchParams;

  // Role-based filtering
  let where: Record<string, unknown> = {};
  if (auth.user.role === 'STUDENT') {
    // Students only see cases linked to them
    where = { studentId: auth.user.id };
  } else {
    // Build filters for non-student users
    const filters: Record<string, unknown>[] = [];

    if (sp.get('type')) filters.push({ type: sp.get('type') });
    if (sp.get('status')) filters.push({ status: sp.get('status') });
    if (sp.get('priority')) filters.push({ priority: sp.get('priority') });
    if (sp.get('ownerId')) filters.push({ ownerId: sp.get('ownerId') });
    if (sp.get('studentId')) filters.push({ studentId: sp.get('studentId') });
    if (sp.get('department')) filters.push({ department: sp.get('department') });

    if (filters.length > 0) {
      where = { AND: filters };
    }

    // Non-admin employees see their own + unassigned
    if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && !sp.get('ownerId')) {
      where = {
        ...where,
        OR: [
          { ownerId: auth.user.id },
          { employeeId: auth.user.id },
        ],
      };
    }
  }

  // Search
  if (sp.get('search')) {
    where = {
      ...where,
      OR: [
        { caseId: { contains: sp.get('search')! } },
        { type: { contains: sp.get('search')! } },
        { department: { contains: sp.get('search')! } },
      ],
    };
  }

  // Sort
  const sortField = sp.get('sortBy') || 'createdAt';
  const sortDir = sp.get('sortDir') === 'asc' ? 'asc' : 'desc';
  const orderBy: Record<string, string> = { [sortField]: sortDir };

  try {
    const [data, total] = await Promise.all([
      db.case.findMany({
        where,
        orderBy,
        take: limit,
        skip,
      }),
      db.case.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch cases.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create a case with SLA and notification                       */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'employee.case.create');
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const caseId = await generateCaseId();

    const caseData = await db.case.create({
      data: {
        caseId,
        type: parsed.data.type,
        studentId: parsed.data.studentId || null,
        employeeId: parsed.data.employeeId || null,
        partnerId: parsed.data.partnerId || null,
        ownerId: auth.user.id,
        department: parsed.data.department,
        priority: parsed.data.priority,
        risk: parsed.data.risk,
        nextAction: parsed.data.nextAction || null,
        dueDate: parsed.data.dueDate || null,
        parentId: parsed.data.parentId || null,
      },
    });

    // Auto-create SLA record if a matching rule exists
    try {
      const slaRule = await db.slaRule.findFirst({
        where: {
          entityType: 'CASE',
          event: 'NEW',
          isActive: true,
          ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
          ...(parsed.data.department ? { department: parsed.data.department } : {}),
        },
      });

      if (slaRule) {
        const targetAt = new Date(Date.now() + slaRule.targetMinutes * 60000);
        await db.slaRecord.create({
          data: {
            slaRuleId: slaRule.id,
            entityType: 'CASE',
            entityId: caseData.id,
            studentId: parsed.data.studentId || null,
            ownerId: auth.user.id,
            targetAt,
          },
        });
      }
    } catch {
      // SLA creation failure should not break case creation
    }

    // Create notification for case owner
    try {
      await db.notification.create({
        data: {
          userId: auth.user.id,
          type: 'CASE_CREATED',
          title: `New Case: ${caseId}`,
          message: `A new ${parsed.data.type} case has been created and assigned to you.`,
          data: JSON.stringify({ caseId: caseData.id, caseNumber: caseId }),
        },
      });
    } catch {
      // Notification failure should not break case creation
    }

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE',
      resource: 'Case',
      resourceId: caseData.id,
      details: { caseId, type: parsed.data.type, department: parsed.data.department },
    });

    return NextResponse.json({ success: true, data: caseData }, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create case.' },
      { status: 500 },
    );
  }
}
