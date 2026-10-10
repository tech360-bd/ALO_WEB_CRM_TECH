// ALO Education metrics: shared event-based calculation, no outage-to-zero fallback.
import { db } from '@/lib/db';
import { measureAutomation, readAutomationBuckets } from '@/lib/automation-measurement';

export interface AutomationSnapshot {
  totalEligible: number;
  automated: number;
  assisted: number;
  human: number;
  escalated: number;
  automationRate: number; // 0-100
  humanRate: number;
  targetAutomation: number; // 70
  targetHuman: number; // 30
  variance: number; // actual - target
  verdict: 'ON_TRACK'|'BELOW_TARGET'|'ABOVE_TARGET'|'NO_DATA';
  hasData: boolean;
  period: { from: Date; to: Date; label: string };
}

export async function getAutomationSnapshot(periodDays = 30): Promise<AutomationSnapshot> {
  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 365) throw new Error('periodDays must be an integer from 1 to 365');
  const to = new Date();
  const from = new Date(to.getTime() - periodDays * 24 * 3600 * 1000);
  const measured = measureAutomation(await readAutomationBuckets({ from, to }));
  const variance = Math.round((measured.automationRate - 70) * 100) / 100;
  return {
    totalEligible: measured.eligible, automated: measured.automated, assisted: measured.assisted,
    human: measured.human, escalated: measured.escalated, automationRate: measured.automationRate,
    humanRate: measured.humanRate, hasData: measured.hasData,
    targetAutomation: 70, targetHuman: 30, variance,
    verdict: !measured.hasData ? 'NO_DATA' : variance < -5 ? 'BELOW_TARGET' : variance > 10 ? 'ABOVE_TARGET' : 'ON_TRACK',
    period: { from, to, label: `Last ${periodDays}d` },
  };
}

export async function getCollaborationFeed(limit = 20): Promise<Array<{ id: string; at: Date; actor: string; action: string; target: string; automated: boolean }>> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid feed limit');
  const rows = await db.automationEvent.findMany({ orderBy: { createdAt: 'desc' }, take: limit,
    select: { id: true, createdAt: true, actor: true, action: true, targetType: true, targetId: true, mode: true, success: true } });
  return rows.map(row => ({ id: row.id, at: row.createdAt, actor: row.actor, action: row.action,
    target: `${row.targetType}:${row.targetId || ''}`, automated: row.mode === 'AUTOMATED' && row.success }));
}
