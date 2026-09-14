import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { runOrchestrated } from '@/lib/agent-orchestrator';

// POST /api/workforce/orchestrate — triggers Master Orchestrator loop
// Body: { workflow, actionType, payload, targetType, targetId, department, priority }
export async function POST(req: Request) {
  return withAuth(async (_r, auth) => {
    const body = await req.json().catch(()=> ({}));
    if (!body.workflow || !body.actionType) {
      return NextResponse.json({ success:false, error:'workflow and actionType required' }, { status:400 });
    }
    const res = await runOrchestrated({
      workflow: String(body.workflow),
      actionType: String(body.actionType),
      payload: (body.payload as Record<string,unknown>) || {},
      trigger: body.trigger || 'api',
      actor: (auth as any)?.userId || (auth as any)?.email || 'api',
      targetType: body.targetType,
      targetId: body.targetId || null,
      department: body.department,
      priority: body.priority,
      idempotencyKey: body.idempotencyKey,
      correlationId: body.correlationId,
    });
    return NextResponse.json({ success:true, data: res });
  })(req);
}

// GET shows policy defaults (no secrets)
export async function GET(req: Request) {
  return withAuth(async ()=>{
    return NextResponse.json({
      success:true,
      policy: {
        maxSteps: parseInt(process.env.AGENT_MAX_STEPS||'12',10),
        maxRuntimeMs: parseInt(process.env.AGENT_MAX_RUNTIME_MS||'120000',10),
        maxToolCalls: parseInt(process.env.AGENT_MAX_TOOL_CALLS||'8',10),
        tokenBudget: parseInt(process.env.AGENT_TOKEN_BUDGET||'12000',10),
        approvalPolicy: process.env.AGENT_APPROVAL_POLICY || 'STANDARD',
      },
      flow: ['EVENT','CLASSIFICATION','AGENT_SELECTION','RAG','MEMORY','PLAN','PERMISSION_CHECK','TOOL_EXECUTION','VALIDATION','DB_WRITE','AUDIT_LOG','QUEUE_COMPLETE'],
    });
  })(req);
}
