import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { runWorkflow } from '@/lib/ai-workforce/workflow-engine';
import { guard, isGuardFailure, readJson } from '../../../_guard';

export const dynamic = 'force-dynamic';

export async function POST(request: Request, context: { params: Promise<{ slug: string }> }) {
  const body = await readJson(request);
  const mode = String(body.mode || 'SIMULATION').toUpperCase();
  if (!['PRODUCTION', 'SIMULATION', 'TEST'].includes(mode)) return fail('mode must be PRODUCTION, SIMULATION or TEST', 422);
  const admission = await guard(request, mode === 'PRODUCTION' ? 'awf.workflow.trigger' : 'awf.run.simulate');
  if (isGuardFailure(admission)) return admission;
  const { slug } = await context.params;
  try {
    const result = await runWorkflow({
      workflowSlug: slug,
      input: (body.input as Record<string, unknown>) ?? {},
      actor: admission.actor,
      mode: mode as 'PRODUCTION' | 'SIMULATION' | 'TEST',
      idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : undefined,
      triggerType: 'API',
      approvals: (body.approvals as Record<string, string>) ?? undefined,
    });
    return ok(result, `Workflow ${result.status.toLowerCase()}`, result.status === 'FAILED' ? 422 : 200, result.correlationId);
  } catch (error) {
    return failFromError(error, 'Unable to run the workflow', 400);
  }
}
