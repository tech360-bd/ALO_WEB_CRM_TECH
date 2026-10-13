import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, parsePagination, auditLog, requirePermission } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const ENTITY_TYPES = ['LEAD', 'APPLICATION', 'CASE', 'PAYMENT', 'VISA', 'PARTNER_REQUEST', 'HR_REQUEST', 'FINANCE_APPROVAL'];

const createSlaRecordSchema = z.object({
  slaRuleId: z.string().min(1),
  entityType: z.enum(ENTITY_TYPES),
  entityId: z.string().min(1),
  studentId: z.string().optional(),
  ownerId: z.string().min(1),
  targetMinutes: z.number().int().positive(),
});

/* ------------------------------------------------------------------ */
/*  GET — List SLA records with filters, pagination                        */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { page, limit, skip } = parsePagination(req.nextUrl.searchParams);
  const sp = req.nextUrl.searchParams;

  // Build filters
  const filters: Record<string, unknown>[] = [];

  if (sp.get('entityType')) filters.push({ entityType: sp.get('entityType') });
  if (sp.get('entityId')) filters.push({ entityId: sp.get('entityId') });
  if (sp.get('status')) filters.push({ status: sp.get('status') });
  if (sp.get('ownerId')) filters.push({ ownerId: sp.get('ownerId') });

  // Non-admin: show own SLA records
  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN' && !sp.get('ownerId')) {
    filters.push({ ownerId: auth.user.id });
  }

  const where = filters.length > 0 ? { AND: filters } : {};

  try {
    const [data, total] = await Promise.all([
      db.slaRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      db.slaRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data,
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching SLA records:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SLA records.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  POST — Manually create SLA record (admin)                                */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest) {
  const auth = await requirePermission(req, 'employee.case.manage');
  if (isErrorResponse(auth)) return auth;

  try {
    const body = await req.json();
    const parsed = createSlaRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const targetAt = new Date(Date.now() + parsed.data.targetMinutes * 60000);

    const record = await db.slaRecord.create({
      data: {
        slaRuleId: parsed.data.slaRuleId,
        entityType: parsed.data.entityType,
        entityId: parsed.data.entityId,
        studentId: parsed.data.studentId || null,
        ownerId: parsed.data.ownerId,
        targetAt,
      },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'CREATE',
      resource: 'SlaRecord',
      resourceId: record.id,
      details: { entityType: parsed.data.entityType, entityId: parsed.data.entityId },
    });

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error) {
    console.error('Error creating SLA record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create SLA record.' },
      { status: 500 },
    );
  }
}
