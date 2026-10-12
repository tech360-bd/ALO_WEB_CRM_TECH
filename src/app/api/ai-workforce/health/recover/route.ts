import { ok, failFromError } from '@/lib/ai-workforce/api';
import { recoverFailures } from '@/lib/ai-workforce/health';
import { guard, isGuardFailure } from '../../_guard';

export const dynamic = 'force-dynamic';

/** Failure recovery sweep: close stuck runs, requeue failed events, expire approvals. */
export async function POST(request: Request) {
  const admission = await guard(request, 'awf.health.read');
  if (isGuardFailure(admission)) return admission;
  try {
    return ok(await recoverFailures(), 'Recovery sweep complete');
  } catch (error) {
    return failFromError(error, 'Recovery sweep failed');
  }
}
