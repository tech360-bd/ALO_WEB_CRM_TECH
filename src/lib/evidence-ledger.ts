/**
 * Evidence Ledger (from trycompai/crm) — no confidence scores
 * Replaces `confidence 0.85` with priced observations
 * Each agent tool reports observation + ledger prices evidence, only strong evidence is applied
 * Integrate with AgentAuditLog + marketing/audit
 */
import { db } from '@/lib/db';

export type Evidence = {
  id: string;
  source: 'inbox' | 'calendar' | 'signature_block' | 'web_research' | 'linkedin' | 'manual' | 'document' | 'api';
  observation: string;
  recordType: 'Lead' | 'Student' | 'University' | 'Application' | 'Payment';
  recordId?: string;
  price: number; // 0-100, strong >=70 auto-applied
  createdAt: Date;
  actorId: string;
};

export const EVIDENCE_PRICING: Record<string, number> = {
  inbox_thread: 90,
  calendar_meeting: 85,
  signature_block: 60,
  web_research_cited: 75,
  web_research_uncited: 30,
  linkedin_verified: 70,
  manual_low: 40,
};

export async function priceEvidence(obs: Omit<Evidence,'price'|'id'|'createdAt'>): Promise<Evidence> {
  const base = EVIDENCE_PRICING[obs.source] ?? 50;
  const price = Math.min(100, base + (obs.observation.length > 50 ? 10 : 0));
  return { id: `ev_${Date.now()}_${Math.random().toString(36).slice(2,6)}`, price, createdAt: new Date(), ...obs };
}

export async function applyIfStrong(ev: Evidence, applyFn: ()=>Promise<void>): Promise<{ applied: boolean; reason: string }> {
  if (ev.price >= 70) {
    await applyFn();
    await db.agentAuditLog.create({ data: { agentId: 'evidence-ledger', action: 'EVIDENCE_APPLIED', details: JSON.stringify(ev), createdAt: ev.createdAt } as any }).catch(()=>{});
    return { applied: true, reason: `strong evidence ${ev.price}` };
  }
  await db.agentAuditLog.create({ data: { agentId: 'evidence-ledger', action: 'EVIDENCE_REJECTED_WEAK', details: JSON.stringify(ev), createdAt: ev.createdAt } as any }).catch(()=>{});
  return { applied: false, reason: `weak evidence ${ev.price} <70 — human review` };
}

// Durable lease pattern (from trycompai eve framework) — FOR UPDATE SKIP LOCKED
export async function claimDueAgentTasks(limit=10){
  // MySQL does not support SKIP LOCKED in Prisma; emulate with transaction + status
  return await db.$transaction(async (tx:any)=>{
    const tasks = await tx.agentTask.findMany({ where:{ status:'pending', scheduledAt:{ lte:new Date()}}, take: limit, orderBy:{ scheduledAt:'asc'}});
    for(const t of tasks) await tx.agentTask.update({ where:{ id:t.id }, data:{ status:'running', claimedAt:new Date()}});
    return tasks;
  }).catch(()=>[]);
}
