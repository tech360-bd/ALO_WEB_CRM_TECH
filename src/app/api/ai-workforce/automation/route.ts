import { ok, failFromError } from '@/lib/ai-workforce/api';
import { computeAutomationReport } from '@/lib/ai-workforce/automation';
import { guard, isGuardFailure } from '../_guard';

export const dynamic = 'force-dynamic';

/**
 * Automation KPI, computed live from AwfTaskLedger rows.
 * No stored percentage, no constant, no estimate.
 */
export async function GET(request: Request) {
  const admission = await guard(request, 'awf.dashboard.read');
  if (isGuardFailure(admission)) return admission;
  const url = new URL(request.url);
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  try {
    const period = from && to ? { from: new Date(from), to: new Date(to) } : undefined;
    const report = await computeAutomationReport(period);
    return ok(report, report.hasData ? 'Automation measurement' : 'No eligible tasks measured yet');
  } catch (error) {
    return failFromError(error, 'Unable to measure automation');
  }
}
