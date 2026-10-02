import { ok, failFromError } from '@/lib/ai-workforce/api';
import { systemHealth } from '@/lib/ai-workforce/health';
import { guard, isGuardFailure } from '../_guard';

export const dynamic = 'force-dynamic';

/** AI health monitor: runtimes, capacity, queues, stuck runs, paid dependency. */
export async function GET(request: Request) {
  const admission = await guard(request, 'awf.health.read');
  if (isGuardFailure(admission)) return admission;
  const probe = new URL(request.url).searchParams.get('probe') === 'true';
  try {
    const health = await systemHealth({ probe });
    return ok(health, `AI Workforce is ${health.status.toLowerCase()}`, health.status === 'UNHEALTHY' ? 503 : 200);
  } catch (error) {
    return failFromError(error, 'Unable to read health');
  }
}
