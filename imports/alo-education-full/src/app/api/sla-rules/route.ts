import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination, auditLog } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ENTITY_TYPES = ['LEAD', 'APPLICATION', 'CASE', 'PAYMENT', 'VISA', 'PARTNER_REQUEST', 'HR_REQUEST', 'FINANCE_APPROVAL'];
const EVENTS = ['NEW', 'STATUS_CHANGE', 'ASSIGNMENT'];
const PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'CRITICAL', 'URGENT'];

const createSlaRuleSchema = z.object({
  name: z.string().min(1),
  entityType: z.enum(ENTITY_TYPES),
  event: z.enum(EVENTS),
  targetMinutes: z.number().int().positive(),
  warningMinutes: z.number().int().min(0),
  escalationMinutes: z.number().int().min(0),
  priority: z.enum(PRIORITIES).optional(),
  department: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — List SLA rules (admin/super_admin only)                          */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Access denied. Admin only.' },
      { status: 403 },
    );
  }

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
  const sp = req.nextUrl.searchParams;

  const filters: Record<string, unknown>[] = [];
  if (sp.get('entityType')) filters.push({ entityType: sp.get('entityType') });
  if (sp.get('event')) filters.push({ event: sp.get('event') });
  if (sp.get('priority')) filters.push({ priority: sp.get('priority') });
  if (sp.get('department')) filters.push({ department: sp.get('department') });
  if (sp.get('isActive') !== null) filters.push({ isActive: sp.get('isActive') === 'true' });

  const where = filters.length > 0 ? { AND: filters } : {};

  try {
    const [data, total] = await Promise.all([
      db.slaRule.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.slaRule.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching SLA rules:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SLA rules.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Create SLA rule (super_admin only)                               */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  if (auth.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Access denied. Super Admin only.' },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const parsed = createSlaRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const rule = await db.slaRule.create({
      data: {
        name: parsed.data.name,
        entityType: parsed.data.entityType,
        event: parsed.data.event,
        targetMinutes: parsed.data.targetMinutes,
        warningMinutes: parsed.data.warningMinutes,
        escalationMinutes: parsed.data.escalationMinutes,
        priority: parsed.data.priority || null,
        department: parsed.data.department || null,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE',
      resource: 'SlaRule',
      resourceId: rule.id,
      details: { name: parsed.data.name, entityType: parsed.data.entityType },
    });

    return NextResponse.json({ success: true, data: rule }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error && error.message.includes('Unique')
      ? 'An SLA rule with this name already exists.'
      : 'Failed to create SLA rule.';
    console.error('Error creating SLA rule:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
