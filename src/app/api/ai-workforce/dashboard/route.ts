import { ok, failFromError } from '@/lib/ai-workforce/api';
import { dashboardSnapshot, agentPerformance } from '@/lib/ai-workforce/telemetry';
import { guard, isGuardFailure } from '../_guard';

export const dynamic = 'force-dynamic';

/** Live AI Workforce dashboard. Every figure is aggregated from persisted rows. */
export async function GET(request: Request) {
  const admission = await guard(request, 'awf.dashboard.read');
  if (isGuardFailure(admission)) return admission;
  try {
    const [snapshot, performance] = await Promise.all([dashboardSnapshot(), agentPerformance()]);
    return ok({ ...snapshot, agentPerformance: performance }, 'AI Workforce dashboard');
  } catch (error) {
    return failFromError(error, 'Unable to load the dashboard');
  }
}
