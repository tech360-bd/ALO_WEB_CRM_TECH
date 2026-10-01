import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth-middleware';
import { runOrchestrated } from '@/lib/agent-orchestrator';

const requestSchema = z.object({
  workflow: z.string().trim().min(1).max(100), actionType: z.string().trim().min(1).max(100),
  payload: z.record(z.string(), z.unknown()).default({}), targetType: z.string().max(50).optional(),
  targetId: z.string().trim().min(1).max(191).optional(), department: z.string().trim().min(1).max(191),
}).strict();

export const POST = withAuth(async (req, auth) => {
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid workflow request' }, { status: 400 });
  try {
    const result = await runOrchestrated({ ...parsed.data, actor: auth.actorUserId });
    const success = result.status === 'COMPLETED' || result.status === 'ALREADY_COMPLETED';
    return NextResponse.json({ success, data: result }, { status: success ? 200 : result.status === 'UNSUPPORTED' ? 422 : 409 });
  } catch {
    console.error('[workforce] Dispatch failed; reconcile persisted events before retry');
    return NextResponse.json({ success: false, error: 'Workflow unavailable; effects may already be applied. Reconcile persisted events before retrying' }, { status: 503 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });

export const GET = withAuth(async () => NextResponse.json({
  success: true, runtime: 'enterprise-workflow-dispatch',
  supported: [{ workflow: 'lead_scoring', actionType: 'LEAD_SCORING', targetType: 'Lead' }],
  autonomousPlanning: false, actionBoundApprovalExecution: false,
  note: 'Authenticated administrator, active agent and server-side tool grant required. Other enterprise workflows are not implemented here.',
}), { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
