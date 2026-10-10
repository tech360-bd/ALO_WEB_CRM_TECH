import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { runDetail } from '@/lib/ai-workforce/telemetry';
import { guard, isGuardFailure } from '../../_guard';
import { can } from '@/lib/ai-workforce/rbac';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ runCode: string }> }) {
  const admission = await guard(request, 'awf.run.read.own');
  if (isGuardFailure(admission)) return admission;
  const { runCode } = await context.params;
  try {
    const detail = await runDetail(runCode);
    if (!detail) return fail('Run not found', 404);
    if (!can(admission.actor.role, 'awf.run.read.all') && detail.agent && detail.input && typeof detail.input === 'object') {
      // Owners may only read their own runs; the trace is otherwise withheld.
      const owned = await import('@/lib/db').then(({ db }) => db.awfRun.findUnique({ where: { runCode }, select: { actorUserId: true } }));
      if (owned?.actorUserId !== admission.actor.userId) return fail('Run not found', 404);
    }
    return ok(detail, 'Run trace');
  } catch (error) {
    return failFromError(error, 'Unable to load the run');
  }
}
