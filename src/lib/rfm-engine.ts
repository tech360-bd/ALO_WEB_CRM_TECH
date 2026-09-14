/**
 * RFM + Segmentation (from oroinc/OroCRM)
 * Recency / Frequency / Monetary for Lead/Student → campaign targeting
 * Extends existing MarketingReport / Lead scoring
 */
import { db } from '@/lib/db';

export type RfmScore = { recency: number; frequency: number; monetary: number; rfm: string; segment: string };

function scoreRecency(daysSince: number){
  if(daysSince <= 7) return 5;
  if(daysSince <= 30) return 4;
  if(daysSince <= 90) return 3;
  if(daysSince <= 180) return 2;
  return 1;
}
function scoreFrequency(count: number){
  if(count >= 10) return 5;
  if(count >= 5) return 4;
  if(count >= 3) return 3;
  if(count >= 2) return 2;
  return 1;
}
function scoreMonetary(amount: number){
  if(amount >= 5000) return 5;
  if(amount >= 2000) return 4;
  if(amount >= 500) return 3;
  if(amount >= 100) return 2;
  return 1;
}
export function segmentFromRfm(r: number, f: number, m: number): string {
  const avg = (r+f+m)/3;
  if(avg >= 4.5) return 'Champions';
  if(r>=4 && f>=3) return 'Loyal';
  if(r>=4 && f<=2) return 'Potential';
  if(r<=2 && f>=3) return 'At-Risk Loyal';
  if(r<=2 && f<=2) return 'Lost';
  return 'Need Attention';
}

export async function scoreLeadRfm(leadId: string): Promise<RfmScore | null>{
  const lead = await (db as any).lead?.findUnique?.({ where:{ id: leadId }}) ?? await (db as any).partnerLead?.findUnique?.({ where:{ id: leadId }});
  if(!lead) return null;
  const events = await db.studentEvent.findMany({ where:{ studentId: lead.studentId || lead.id }}).catch(()=>[]) as any[];
  const payments = await db.payment.findMany({ where:{ studentId: lead.studentId || lead.id }}).catch(()=>[]) as any[];
  const lastDate = events[0]?.createdAt ? new Date(events[0].createdAt) : new Date(lead.createdAt);
  const days = Math.floor((Date.now() - lastDate.getTime())/86400000);
  const r = scoreRecency(days);
  const f = scoreFrequency(events.length);
  const total = payments.reduce((s:any,p:any)=> s + (p.amount||0), 0);
  const m = scoreMonetary(total);
  return { recency:r, frequency:f, monetary:m, rfm:`${r}${f}${m}`, segment: segmentFromRfm(r,f,m) };
}

export async function buildSegmentFilter(segment: string, limit=100){
  // Example: return lead ids matching segment — caller can use for campaign targeting
  const leads = await (db as any).lead?.findMany?.({ take: 200 }) ?? [];
  const scored = await Promise.all(leads.map(async (l:any)=> ({ lead:l, rfm: await scoreLeadRfm(l.id)})));
  return scored.filter(s=> s.rfm?.segment===segment).slice(0,limit);
}
