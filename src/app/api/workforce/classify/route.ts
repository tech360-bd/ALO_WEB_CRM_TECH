import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { classifyWork } from '@/lib/work-classification-engine';

// POST /api/workforce/classify { workflow, actionType, payload, riskLevel, requiresExternalSend, ... }
export async function POST(req: Request) {
  return withAuth(async ()=>{
    const body = await req.json().catch(()=>({}));
    if (!body.workflow || !body.actionType) return NextResponse.json({ success:false, error:'workflow and actionType required' }, { status:400 });
    const result = classifyWork({
      workflow: body.workflow,
      actionType: body.actionType,
      payload: body.payload || {},
      riskLevel: body.riskLevel,
      requiresExternalSend: body.requiresExternalSend,
      requiresMoneyMovement: body.requiresMoneyMovement,
      requiresLegalCommitment: body.requiresLegalCommitment,
      containsPII: body.containsPII,
      confidence: body.confidence,
    });
    return NextResponse.json({ success:true, data: result });
  })(req);
}
