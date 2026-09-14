import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getAutomationSnapshot, getCollaborationFeed } from '@/lib/automation-analytics';
import { db } from '@/lib/db';
import { getGroqProtectionStats } from '@/lib/groq-protection';

// GET /api/workforce/metrics?periodDays=30
export async function GET(req: Request) {
  return withAuth(async () => {
    const url = new URL(req.url);
    const periodDays = parseInt(url.searchParams.get('periodDays') || '30', 10);
    const snap = await getAutomationSnapshot(periodDays);
    const feed = await getCollaborationFeed(20);
    const groq = getGroqProtectionStats();

    // workforce counts — real DB only, no fabrication
    const counts = await Promise.all([
      (db as any).aiEmployee?.count?.().catch(()=>0) || 0,
      (db as any).aiEmployee?.count?.({ where:{ status:'ACTIVE' } }).catch(()=>0) || 0,
      (db as any).aiEmployee?.count?.({ where:{ status:'IDLE' } }).catch(()=>0) || 0,
      (db as any).aiEmployee?.count?.({ where:{ status:'BUSY' } }).catch(()=>0) || 0,
      (db as any).aiEmployee?.count?.({ where:{ status:'PAUSED' } }).catch(()=>0) || 0,
      (db as any).aiEmployee?.count?.({ where:{ status:'FAILED' } }).catch(()=>0) || 0,
      (db as any).agentApprovalQueue?.count?.({ where:{ status:'WAITING_APPROVAL' } }).catch(()=>0) || 0,
      (db as any).agentApprovalQueue?.count?.({ where:{ status:'ESCALATED' } }).catch(()=>0) || 0,
      (db as any).agentTask?.count?.({ where:{ status:'QUEUED' } }).catch(()=>0) || 0,
      (db as any).agentTask?.count?.({ where:{ status:'RUNNING' } }).catch(()=>0) || 0,
      (db as any).automationEvent?.count?.({ where:{ success:true } }).catch(()=>0) || 0,
      (db as any).automationEvent?.count?.({ where:{ success:false } }).catch(()=>0) || 0,
    ]);
    const [total, active, idle, busy, paused, failed, waitingApproval, escalated, queued, running, successCount, failedCount] = counts;

    // success rate & latency (real)
    let avgLatency: number | null = null;
    try {
      const rows: any[] = await (db as any).automationEvent?.findMany?.({ where:{ success:true }, take:50, orderBy:{ createdAt:'desc' }, select:{ result:true } }).catch(()=>[]) || [];
      // result JSON may contain durationMs; if not, skip
      const latencies = rows.map(r=> { try{ const j=typeof r.result==='string'?JSON.parse(r.result):r.result; return j?.durationMs || j?.latencyMs || null; } catch{ return null; }}).filter(Boolean) as number[];
      if (latencies.length) avgLatency = Math.round(latencies.reduce((a,b)=>a+b,0)/latencies.length);
    } catch {}

    return NextResponse.json({
      success:true,
      workforce: { total, active, idle, busy, paused, failed, waitingApproval, escalated, queued, running },
      queue: { queued, running, success: successCount, failed: failedCount },
      groq: groq,
      automation: snap,
      collaboration: feed,
      latency: { avgMs: avgLatency },
      generatedAt: new Date().toISOString(),
    });
  })(req);
}
