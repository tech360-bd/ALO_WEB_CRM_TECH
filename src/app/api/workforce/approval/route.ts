import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// Approval Center — real queue, no fabrication
// GET /api/workforce/approval?status=WAITING_APPROVAL|ESCALATED|HUMAN_REQUIRED&page=1&pageSize=20
export async function GET(req: Request) {
  return withAuth(async ()=>{
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const page = parseInt(url.searchParams.get('page')||'1',10);
    const pageSize = Math.min(100, parseInt(url.searchParams.get('pageSize')||'20',10));
    const where: any = {};
    if (status) where.status = status;
    try {
      const [rows, total] = await Promise.all([
        (db as any).agentApprovalQueue?.findMany?.({ where, orderBy:{ createdAt:'desc' }, skip:(page-1)*pageSize, take:pageSize }).catch(()=>[]) || [],
        (db as any).agentApprovalQueue?.count?.({ where }).catch(()=>0) || 0,
      ]);
      // fallback to AiCommandAction pending when approvalQueue is empty (preserve 70/30 reality)
      let fallback: any[] = [];
      if (!rows.length) {
        const alt = await (db as any).aiCommandAction?.findMany?.({ where:{ status: status==='WAITING_APPROVAL'?'PENDING': status || 'PENDING' }, take: pageSize, orderBy:{ createdAt:'desc' } }).catch(()=>[]) || [];
        fallback = alt;
      }
      return NextResponse.json({ success:true, data: rows.length? rows: fallback, total: rows.length? total: fallback.length, page, pageSize });
    } catch (e:any) {
      return NextResponse.json({ success:false, error: e?.message || String(e) }, { status:500 });
    }
  })(req);
}

// POST { id, decision: 'APPROVE'|'REJECT'|'ESCALATE', note? }
export async function POST(req: Request) {
  return withAuth(async (_r, auth)=>{
    const body = await req.json().catch(()=>({}));
    const { id, decision, note } = body;
    if (!id || !decision) return NextResponse.json({ success:false, error:'id and decision required' }, { status:400 });
    const actor = (auth as any)?.userId || (auth as any)?.email || 'human';
    try {
      // try approvalQueue first
      let row = await (db as any).agentApprovalQueue?.findUnique?.({ where:{ id } }).catch(()=>null);
      if (row) {
        const nextStatus = decision==='APPROVE'?'APPROVED': decision==='REJECT'?'REJECTED':'ESCALATED';
        const updated = await (db as any).agentApprovalQueue.update({ where:{ id }, data:{ status: nextStatus, reviewedBy: actor, reviewedAt: new Date(), reviewNote: note || null } }).catch(()=>null);
        if (decision==='APPROVE') {
          const { runOrchestrated } = await import('@/lib/agent-orchestrator');
          try { await runOrchestrated({ workflow: row.taskType || 'approval_resume', actionType:'APPROVAL_RESUME', payload: JSON.parse(row.payload||'{}'), actor, trigger:'approval_center', correlationId: row.correlationId }); } catch{}
        }
        await (db as any).agentAuditLog?.create?.({ data:{ agentId: row.agentId || 'approval-center', action:`APPROVAL_${decision}`, details: JSON.stringify({ id, decision, actor, note }) } as any }).catch(()=>{});
        return NextResponse.json({ success:true, data: updated || row });
      }
      // fallback: AiCommandAction
      const alt = await (db as any).aiCommandAction?.findUnique?.({ where:{ id } }).catch(()=>null);
      if (alt) {
        if (decision==='APPROVE') {
          const { approveAndExecute } = await import('@/lib/ai-action-executor');
          const res = await approveAndExecute(id, actor).catch((e:any)=> ({ error:e?.message }));
          return NextResponse.json({ success:true, data: res });
        } else {
          const updated = await (db as any).aiCommandAction.update({ where:{ id }, data:{ status: decision==='REJECT'?'REJECTED':'ESCALATED' } }).catch(()=>null);
          return NextResponse.json({ success:true, data: updated });
        }
      }
      return NextResponse.json({ success:false, error:'Approval item not found' }, { status:404 });
    } catch (e:any) {
      return NextResponse.json({ success:false, error: e?.message || String(e) }, { status:500 });
    }
  })(req);
}
