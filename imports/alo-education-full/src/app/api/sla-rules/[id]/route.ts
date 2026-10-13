import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth, isErrorResponse, auditLog } from '@/lib/access-control';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateSlaRuleSchema = z.object({
  name: z.string().min(1).optional(),
  targetMinutes: z.number().int().positive().optional(),
  warningMinutes: z.number().int().min(0).optional(),
  escalationMinutes: z.number().int().min(0).optional(),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'CRITICAL', 'URGENT']).optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
});

/* ------------------------------------------------------------------ */
/*  GET — Get SLA rule by ID                                              */
/* ------------------------------------------------------------------ */

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  const { id } = await params;

  try {
    const rule = await db.slaRule.findUnique({ where: { id } });
    if (!rule) {
      return NextResponse.json(
        { success: false, error: 'SLA rule not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: rule });
  } catch (error) {
    console.error('Error fetching SLA rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch SLA rule.' },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/*  PATCH — Update SLA rule                                               */
/* ------------------------------------------------------------------ */

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Access denied. Admin only.' },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    const existing = await db.slaRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'SLA rule not found.' },
        { status: 404 },
      );
    }

    const body = await req.json();
    const parsed = updateSlaRuleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updated = await db.slaRule.update({
      where: { id },
      data: parsed.data,
    });

    await auditLog({
      userId: auth.user.id,
      action: 'UPDATE',
      resource: 'SlaRule',
      resourceId: id,
      details: { name: existing.name, changes: parsed.data },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error && error.message.includes('Unique')
      ? 'An SLA rule with this name already exists.'
      : 'Failed to update SLA rule.';
    console.error('Error updating SLA rule:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/*  DELETE — Deactivate SLA rule (set isActive=false)                        */
/* ------------------------------------------------------------------ */

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth(req);
  if (isErrorResponse(auth)) return auth;

  if (auth.user.role !== 'SUPER_ADMIN' && auth.user.role !== 'ADMIN') {
    return NextResponse.json(
      { success: false, error: 'Access denied. Admin only.' },
      { status: 403 },
    );
  }

  const { id } = await params;

  try {
    const existing = await db.slaRule.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'SLA rule not found.' },
        { status: 404 },
      );
    }

    const updated = await db.slaRule.update({
      where: { id },
      data: { isActive: false },
    });

    await auditLog({
      userId: auth.user.id,
      action: 'DELETE',
      resource: 'SlaRule',
      resourceId: id,
      details: { name: existing.name },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error deactivating SLA rule:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate SLA rule.' },
      { status: 500 },
    );
  }
}
