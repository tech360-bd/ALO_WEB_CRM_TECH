import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { assignModelToDepartment } from '@/lib/ai-models/registry';

// ============================================================
// GET  /api/ai-models/[id]/departments — department assignments
// POST /api/ai-models/[id]/departments — assign the model to a
//      department ({ departmentId })
// ============================================================

export const GET = withAuth(async (
  _request: Request,
  _auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const assignments = await db.aiModelDepartmentAssignment.findMany({
    where: { modelId: id },
    include: { model: { select: { modelCode: true, name: true, status: true } } },
  });
  return NextResponse.json({ assignments, total: assignments.length });
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'AI_OFFICER', 'EMPLOYEE'] });

export const POST = withAuth(async (
  request: Request,
  _auth,
  context?: { params: Promise<{ id: string }> },
) => {
  const { id } = await context!.params;
  const body = await request.json().catch(() => null);
  if (!body?.departmentId) {
    return NextResponse.json({ error: 'departmentId is required' }, { status: 400 });
  }
  try {
    const assignment = await assignModelToDepartment(id, body.departmentId);
    return NextResponse.json(assignment, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to assign department';
    const notFound = /not found/.test(message);
    return NextResponse.json({ error: message }, { status: notFound ? 404 : 400 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'AI_OFFICER'] });
