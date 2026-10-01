import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { registerModel, registryOverview } from '@/lib/ai-models/registry';

// ============================================================
// GET  /api/ai-models — registry overview with deployment evidence
// POST /api/ai-models — register a model (admin/AI officer)
// ============================================================

export const GET = withAuth(async () => {
  return NextResponse.json(await registryOverview());
}, { requireUserTypes: ['FINANCE', 'ADMIN', 'SUPER_ADMIN', 'CEO', 'AI_OFFICER', 'EMPLOYEE'] });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body?.name) {
    return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
  }
  try {
    const model = await registerModel(body, auth.actorUserId);
    return NextResponse.json(model, { status: 201 });
  } catch (err) {
    const conflict = /already exists|Unique constraint/.test(err instanceof Error ? err.message : '');
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed to register model' }, { status: conflict ? 409 : 400 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN', 'AI_OFFICER'] });
