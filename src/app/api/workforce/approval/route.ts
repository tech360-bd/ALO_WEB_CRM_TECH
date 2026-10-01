import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// Agent-level decisions only. AgentApprovalQueue has no task/tool/payload binding;
// approving here MUST NOT execute an action or invent a resume payload.
const statuses = ['pending', 'approved', 'rejected', 'escalated'] as const;
const querySchema = z.object({
  status: z.enum(statuses).optional(), page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const GET = withAuth(async req => {
  const query = querySchema.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!query.success) return NextResponse.json({ success: false, error: 'Invalid approval filters' }, { status: 400 });
  try {
    const { status, page, pageSize } = query.data;
    const where = status ? { status } : {};
    const [data, total] = await Promise.all([
      db.agentApprovalQueue.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
      db.agentApprovalQueue.count({ where }),
    ]);
    return NextResponse.json({ success: true, source: 'AgentApprovalQueue', scope: 'agent', data, total, page, pageSize });
  } catch {
    return NextResponse.json({ success: false, error: 'Approval storage unavailable' }, { status: 503 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });

const decisionSchema = z.object({ id: z.string().min(1).max(191), decision: z.enum(['APPROVE', 'REJECT', 'ESCALATE']), note: z.string().max(1000).default('') }).strict();
export const POST = withAuth(async (req, auth) => {
  const body = decisionSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ success: false, error: 'Invalid approval decision' }, { status: 400 });
  const { id, decision, note } = body.data;
  const actor = auth.actorUserId;
  try {
    const result = await db.$transaction(async tx => {
      const current = await tx.agentApprovalQueue.findUnique({ where: { id } });
      if (!current) return 'NOT_FOUND';
      if (current.status !== 'pending') return 'CONFLICT';
      const changed = await tx.agentApprovalQueue.updateMany({ where: { id, status: 'pending' }, data: {
        status: decision === 'APPROVE' ? 'approved' : decision === 'REJECT' ? 'rejected' : 'escalated', notes: note,
        ...(decision === 'APPROVE' ? { approvedById: actor, approvedAt: new Date() } : {}),
        ...(decision === 'REJECT' ? { rejectedById: actor, rejectedAt: new Date() } : {}),
      } });
      if (changed.count !== 1) return 'CONFLICT';
      await tx.agentAuditLog.create({ data: { agentId: current.agentId, action: `APPROVAL_${decision}`, actorId: actor,
        metadata: JSON.stringify({ approvalId: id, scope: 'agent', executed: false }) } });
      return 'RECORDED';
    });
    if (result === 'NOT_FOUND') return NextResponse.json({ success: false, error: 'Approval not found' }, { status: 404 });
    if (result === 'CONFLICT') return NextResponse.json({ success: false, error: 'Approval already decided' }, { status: 409 });
    return NextResponse.json({ success: true, decisionRecorded: true, executed: false,
      note: 'Agent-level decision recorded only; this does not authorize or execute a task.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Approval decision could not be persisted' }, { status: 503 });
  }
}, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] });
