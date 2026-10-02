import { db } from '@/lib/db';
import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { runAgent } from '@/lib/ai-workforce/runner';
import { guard, isGuardFailure, readJson } from '../_guard';
import { can } from '@/lib/ai-workforce/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const admission = await guard(request, 'awf.run.read.own');
  if (isGuardFailure(admission)) return admission;
  const url = new URL(request.url);
  const take = Math.min(Number(url.searchParams.get('take') || 50), 200);
  const seesEverything = can(admission.actor.role, 'awf.run.read.all');
  try {
    const runs = await db.awfRun.findMany({
      where: {
        ...(seesEverything ? {} : { actorUserId: admission.actor.userId }),
        ...(url.searchParams.get('mode') ? { mode: String(url.searchParams.get('mode')) } : {}),
        ...(url.searchParams.get('status') ? { status: String(url.searchParams.get('status')) } : {}),
        ...(url.searchParams.get('workflow') ? { workflowSlug: String(url.searchParams.get('workflow')) } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        runCode: true, mode: true, status: true, workflowSlug: true, durationMs: true, automationMode: true,
        automationCategory: true, runtimeKey: true, fallbackUsed: true, createdAt: true, correlationId: true,
        agent: { select: { slug: true, name: true } },
      },
    });
    return ok({ runs, scope: seesEverything ? 'ALL' : 'OWN' }, 'Run history');
  } catch (error) {
    return failFromError(error, 'Unable to load runs');
  }
}

/** Execute an agent. SIMULATION requires only awf.run.simulate and never writes. */
export async function POST(request: Request) {
  const body = await readJson(request);
  const mode = String(body.mode || 'SIMULATION').toUpperCase();
  if (!['PRODUCTION', 'SIMULATION', 'TEST'].includes(mode)) return fail('mode must be PRODUCTION, SIMULATION or TEST', 422);
  const admission = await guard(request, mode === 'PRODUCTION' ? 'awf.run.execute' : 'awf.run.simulate');
  if (isGuardFailure(admission)) return admission;
  if (!body.agentSlug) return fail('agentSlug is required', 422);
  try {
    const result = await runAgent({
      agentSlug: String(body.agentSlug),
      input: (body.input as Record<string, unknown>) ?? {},
      actor: admission.actor,
      mode: mode as 'PRODUCTION' | 'SIMULATION' | 'TEST',
      idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : undefined,
      workflowSlug: body.workflowSlug ? String(body.workflowSlug) : undefined,
      triggerType: 'API',
      approvals: (body.approvals as Record<string, string>) ?? undefined,
    });
    return ok(result, `Run ${result.status.toLowerCase()}`, result.status === 'FAILED' ? 422 : 200, result.runCode);
  } catch (error) {
    return failFromError(error, 'Unable to execute the agent', 400);
  }
}
