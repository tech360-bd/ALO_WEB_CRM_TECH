import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { decideApproval } from '@/lib/ai-workforce/approvals';
import { guard, isGuardFailure, readJson } from '../../_guard';

export const dynamic = 'force-dynamic';

/** Human decision on a sensitive action. Approvals are single-use downstream. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const admission = await guard(request, 'awf.approval.decide');
  if (isGuardFailure(admission)) return admission;
  const { id } = await context.params;
  const body = await readJson(request);
  const decision = String(body.decision || '').toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(decision)) return fail('decision must be APPROVED or REJECTED', 422);
  try {
    const result = await decideApproval(id, admission.actor, decision as 'APPROVED' | 'REJECTED', body.note ? String(body.note) : '');
    return ok(result, `Approval ${decision.toLowerCase()}`);
  } catch (error) {
    return failFromError(error, 'Unable to record the decision', 403);
  }
}
