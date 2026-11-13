import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { getOfficeHoursStatus } from '@/lib/communication/after-hours';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isSuperAdmin(auth: AuthContext): boolean {
  const roles = auth.roles || [];
  return roles.includes('SUPER_ADMIN') || roles.includes('super_admin') || auth.userType === 'admin' || auth.userType === 'SUPER_ADMIN';
}
function isAdmin(auth: AuthContext): boolean {
  const roles = auth.roles || [];
  return isSuperAdmin(auth) || roles.includes('ADMIN') || roles.includes('admin') || auth.userType === 'ADMIN';
}

export async function GET(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;
  if (!isAdmin(auth)) return NextResponse.json({ error: 'Forbidden. ADMIN or SUPER_ADMIN required.' }, { status: 403 });

  const agent = await db.agentDefinition.findUnique({ where: { agentCode: 'STUDENT_INTAKE_BN' } }).catch(()=> null)
    || await db.aiAgent.findFirst({ where: { agentCode: 'STUDENT_INTAKE_BN' } }).catch(()=> null);
  const enabled = (agent as any)?.status ? (agent as any).status !== 'disabled' && (agent as any).status !== 'paused' : true;
  const officeHoursStatus = await getOfficeHoursStatus();
  return NextResponse.json({
    success: true,
    data: {
      agentCode: 'STUDENT_INTAKE_BN',
      agentName: (agent as any)?.name || (agent as any)?.agentName || 'Bangla Intake AI (ID-First)',
      status: (agent as any)?.status || 'active',
      enabled,
      officeHours: !officeHoursStatus.isAfterHours,
      officeWindow: officeHoursStatus.message,
      nextOpen: officeHoursStatus.nextOpen,
      timezone: officeHoursStatus.timezone,
      channels: ['website','whatsapp','webchat','facebook'],
      memory: 'AgentMemory per senderId+channel (+ TimelineEvent fallback), sequential queue',
      version: (agent as any)?.version || '1.0.0',
    }
  });
}

export async function PUT(req: NextRequest) {
  const authResult = await authenticateRequest(req);
  if (authResult instanceof NextResponse) return authResult;
  const auth = authResult as AuthContext;
  if (!isSuperAdmin(auth)) return NextResponse.json({ error: 'Forbidden. Super Admin only — intake agent governance.' }, { status: 403 });

  const body = await req.json().catch(()=> ({}));
  const { status, promptTemplate, description } = body;
  let agent = await db.agentDefinition.findUnique({ where: { agentCode: 'STUDENT_INTAKE_BN' } }).catch(()=> null) as any;
  if (!agent) {
    const dept = await db.department.findFirst().catch(()=> null) as any;
    const engine = await db.agentEngineType.findFirst().catch(()=> null) as any;
    if (!dept || !engine) {
      return NextResponse.json({ error: 'Department or AgentEngineType not seeded — create via System Builder first' }, { status: 409 });
    }
    agent = await db.agentDefinition.create({
      data: {
        agentCode: 'STUDENT_INTAKE_BN',
        name: 'Bangla Intake AI (ID-First)',
        description: description || 'First asks Student ID, verifies → independent notice, then BN/EN + doc/voice counseling with memory sequential office-hours aware',
        status: status || 'active',
        departmentId: dept.id,
        engineTypeId: engine.id,
      } as any
    }).catch(async ()=> await db.aiAgent.create({ data: { agentCode: 'STUDENT_INTAKE_BN', agentName: 'Bangla Intake AI', agentType: 'INTAKE', description: description || '', status: status || 'ACTIVE', department: 'admission' } as any }));
  } else {
    await db.agentDefinition.update({ where: { id: agent.id }, data: { status: status || agent.status, description: description ?? agent.description } as any }).catch(()=>{});
    if (promptTemplate) {
      const key = 'prompt:STUDENT_INTAKE_BN';
      const existing = await db.agentMemory.findFirst({ where: { agentId: agent.id, key } }).catch(()=> null) as any;
      if (existing) await db.agentMemory.update({ where: { id: existing.id }, data: { value: String(promptTemplate).slice(0,12000) } as any }).catch(()=>{});
      else await db.agentMemory.create({ data: { agentId: agent.id, key, value: String(promptTemplate).slice(0,12000), memoryType: 'config' } as any }).catch(()=>{});
    }
  }
  await db.aloAuditLog.create({
    data: { actorType: 'user', actorId: (auth as any).userId || (auth as any).actorUserId, actorName: auth.email, action: 'INTAKE_AGENT_UPDATE', resource: 'AgentDefinition', resourceId: (agent as any).id || 'STUDENT_INTAKE_BN', details: JSON.stringify({ status, description }) }
  } as any).catch(()=>{});
  return NextResponse.json({ success: true, data: { status: status || (agent as any).status, promptTemplate: promptTemplate ? 'updated' : undefined } });
}
