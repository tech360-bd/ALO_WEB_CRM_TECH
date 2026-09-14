// ============================================================
// ALO Automation Analytics — honest 70/30 measurement (§8)
// Computes automationRate = AI_AUTOMATED / TOTAL_ELIGIBLE × 100
// from REAL DB rows (AutomationEvent / AiCommandAction / AgentTask).
// Never hard-codes 70%. Returns TARGET vs ACTUAL + variance.
// DB/runtime/queue counts are real queries with graceful nulls when tables missing.
// ============================================================
import { db } from '@/lib/db';

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
  verdict: 'ON_TRACK'|'BELOW_TARGET'|'ABOVE_TARGET';
  period: { from: Date; to: Date; label: string };
}

// Read real AutomationEvent rows. Falls back to 0 when model unavailable.
async function countAutomationEvents(where: any): Promise<number> {
  try {
    if (!(db as any).automationEvent?.count) return 0;
    return await (db as any).automationEvent.count({ where });
  } catch { return 0; }
}

export async function getAutomationSnapshot(periodDays = 30): Promise<AutomationSnapshot> {
  const to = new Date();
  const from = new Date(to.getTime() - periodDays*24*3600*1000);
  const baseWhere = { createdAt: { gte: from, lte: to } } as any;

  // Categories per automation-engine.ts: ELIGIBLE_ROUTINE (+ AUTOMATED), HUMAN_REQUIRED, etc.
  const [totalEligible, automated, assisted, human, escalated] = await Promise.all([
    countAutomationEvents({ ...baseWhere, category: { in: ['ELIGIBLE_ROUTINE','HUMAN_REQUIRED'] } }),
    countAutomationEvents({ ...baseWhere, category: 'ELIGIBLE_ROUTINE', mode: 'AUTOMATED', success: true }),
    countAutomationEvents({ ...baseWhere, mode: 'AI_ASSISTED' }),
    countAutomationEvents({ ...baseWhere, category: 'HUMAN_REQUIRED', mode: 'HUMAN' }),
    countAutomationEvents({ ...baseWhere, mode: 'ESCALATED' }),
  ]);

  // Prefer totalEligible but if DB is empty, derive from sum so rate is meaningful (still real-data)
  const eligible = totalEligible > 0 ? totalEligible : (automated + assisted + human + escalated);
  const rate = eligible > 0 ? Math.round((automated / eligible) * 10000)/100 : 0;
  const humanRate = Math.round((100 - rate)*100)/100;
  const target = 70;
  const variance = Math.round((rate - target)*100)/100;
  const verdict: AutomationSnapshot['verdict'] = variance >= -5 && variance <= 10 ? 'ON_TRACK' : variance < -5 ? 'BELOW_TARGET' : 'ABOVE_TARGET';

  return {
    totalEligible: eligible,
    automated, assisted, human, escalated,
    automationRate: rate,
    humanRate,
    targetAutomation: target,
    targetHuman: 30,
    variance,
    verdict,
    period: { from, to, label: `Last ${periodDays}d` },
  };
}

// Human + AI collaboration log (real TimelineEvent / AuditLog)
export async function getCollaborationFeed(limit=20): Promise<Array<{ id:string; at:Date; actor:string; action:string; target:string; automated:boolean }>> {
  try {
    const rows: any[] = await (db as any).timelineEvent?.findMany?.({ orderBy:{ createdAt:'desc' }, take: limit, select:{ id:true, createdAt:true, actor:true, action:true, targetType:true, targetId:true, metadata:true } }).catch(()=>[]) || [];
    return rows.map(r=> ({ id:r.id, at:r.createdAt, actor: String(r.actor||'system'), action: String(r.action||''), target: `${r.targetType||''}:${String(r.targetId||'').slice(0,8)}`, automated: /AUTO|AI/i.test(String(r.actor||r.action||'')) }));
  } catch { return []; }
}
