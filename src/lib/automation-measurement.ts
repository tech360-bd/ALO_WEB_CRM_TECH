import { db } from '@/lib/db';

export interface AutomationBucket {
  workflow: string;
  category: string;
  mode: string;
  success: boolean;
  count: number;
}

/** Canonical KPI: successful fully AUTOMATED eligible events / ALL eligible events.
 * Failed, pending, assisted and escalated eligible work stays in the denominator.
 * HUMAN_REQUIRED is never eligible. Human rate is measured, not 100 - automation.
 * Legacy AutomationMetric counters are not merged: they may duplicate events.
 */
export function measureAutomation(buckets: AutomationBucket[]) {
  let total = 0, eligible = 0, automated = 0, assisted = 0, human = 0, escalated = 0, unsuccessful = 0;
  for (const bucket of buckets) {
    total += bucket.count;
    if (bucket.category === 'ELIGIBLE_ROUTINE') {
      eligible += bucket.count;
      if (bucket.mode === 'AUTOMATED' && bucket.success) automated += bucket.count;
    }
    if (bucket.mode === 'AI_ASSISTED' && bucket.success) assisted += bucket.count;
    if (bucket.mode === 'HUMAN' && bucket.success) human += bucket.count;
    if (bucket.mode === 'ESCALATED') escalated += bucket.count;
    if (!bucket.success) unsuccessful += bucket.count;
  }
  const percent = (n: number, d: number) => d ? Math.round(n / d * 10000) / 100 : 0;
  return { total, eligible, automated, assisted, human, escalated, unsuccessful,
    automationRate: percent(automated, eligible), humanRate: percent(human, total), hasData: eligible > 0 };
}

/** Database failures propagate. Empty results mean no observations, not an outage. */
export async function readAutomationBuckets(period?: { from: Date; to: Date }): Promise<AutomationBucket[]> {
  const rows = await db.automationEvent.groupBy({
    by: ['workflow', 'category', 'mode', 'success'],
    where: period ? { createdAt: { gte: period.from, lte: period.to } } : undefined,
    _count: { _all: true },
  });
  return rows.map(row => ({ workflow: row.workflow, category: row.category, mode: row.mode, success: row.success, count: row._count._all }));
}
