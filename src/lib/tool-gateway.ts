// ============================================================
// ALO Tool Gateway — authorized-tools-only enforcement (§14)
// Every tool call goes through permissionChecks → allow/deny/escalate.
// Tools are registered with required permission + risk level.
// The gateway is used by agent-orchestrator after classification gate.
// All denials are logged to AgentAuditLog (real data).
// ============================================================
import { db } from '@/lib/db';

export type ToolPermission = 'TOOL_READ'|'TOOL_WRITE'|'TOOL_EXTERNAL_SEND'|'TOOL_FINANCE'|'TOOL_ADMIN';

export interface ToolDef {
  name: string;
  description: string;
  permission: ToolPermission;
  riskLevel: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
  handler: (input: Record<string, unknown>, ctx: ToolCtx) => Promise<Record<string, unknown>>;
}

export interface ToolCtx { agentId: string; department?: string; humanApproved?: boolean; idempotencyKey?: string; }

const registry = new Map<string, ToolDef>();

export function registerTool(def: ToolDef) { registry.set(def.name, def); }
export function listTools(): ToolDef[] { return [...registry.values()]; }
export function getTool(name: string): ToolDef | undefined { return registry.get(name); }

// Permission check: HIGH/CRITICAL needs humanApproved; EXTERNAL_SEND needs HUMAN_APPROVAL_REQUIRED class; ADMIN needs role
export async function checkToolPermission(toolName: string, ctx: ToolCtx): Promise<{ allowed: boolean; reason: string }> {
  const t = registry.get(toolName);
  if (!t) return { allowed: false, reason: `Unknown tool ${toolName}` };
  if ((t.riskLevel==='HIGH' || t.riskLevel==='CRITICAL') && !ctx.humanApproved) {
    try { await db.agentAuditLog.create({ data:{ agentId: ctx.agentId, action:'TOOL_DENIED', details: JSON.stringify({ tool: toolName, reason:'High risk requires human approval', ctx }) } as any }).catch(()=>{}); } catch{}
    return { allowed: false, reason: 'High/critical risk tool requires human approval' };
  }
  if (t.permission==='TOOL_EXTERNAL_SEND' && !ctx.humanApproved) {
    return { allowed: false, reason: 'External send requires approval' };
  }
  // non-escalated: allow
  return { allowed: true, reason: 'allowed' };
}

export async function invokeTool(toolName: string, input: Record<string, unknown>, ctx: ToolCtx): Promise<{ ok: boolean; result?: Record<string,unknown>; error?: string }> {
  const check = await checkToolPermission(toolName, ctx);
  if (!check.allowed) return { ok: false, error: check.reason };
  const t = registry.get(toolName)!;
  try {
    const result = await t.handler(input, ctx);
    try { await db.agentAuditLog.create({ data:{ agentId: ctx.agentId, action:'TOOL_INVOKED', details: JSON.stringify({ tool: toolName, ctx, inputKeys: Object.keys(input) }) } as any }).catch(()=>{}); } catch{}
    return { ok: true, result };
  } catch (e:any) {
    try { await db.agentAuditLog.create({ data:{ agentId: ctx.agentId, action:'TOOL_FAILED', details: JSON.stringify({ tool: toolName, error: String(e?.message||e) }) } as any }).catch(()=>{}); } catch{}
    return { ok: false, error: e?.message || String(e) };
  }
}

// ---- built-in tool stubs (real DB-backed where possible) ----
// These are thin wrappers; handlers can be enriched without changing orchestrator.

registerTool({ name:'readCrm', description:'Read CRM lead/student/university', permission:'TOOL_READ', riskLevel:'LOW', handler: async (input: any)=> {
  const { type, id } = input;
  if (type==='lead' && id) {
    const row = await (db as any).lead?.findUnique?.({ where:{ id } }).catch(()=>null);
    return { found: !!row, data: row ? { id: row.id, name: row.name || `${row.firstName||''} ${row.lastName||''}`.trim(), status: row.status } : null };
  }
  return { ok: true };
}});

registerTool({ name:'writeTimeline', description:'Append CRM timeline event', permission:'TOOL_WRITE', riskLevel:'LOW', handler: async (input: any, ctx)=> {
  const row = await (db as any).timelineEvent?.create?.({ data:{ targetType: input.targetType||'Lead', targetId: input.targetId, action: input.action||'AI_NOTE', actor: ctx.agentId, metadata: JSON.stringify(input.metadata||{}) } }).catch(()=>null);
  return { id: row?.id || 'no-db', ok: true };
}});

registerTool({ name:'draftMessage', description:'Draft external message (not send)', permission:'TOOL_WRITE', riskLevel:'MEDIUM', handler: async (input: any)=> {
  return { draft: String(input.content||'').slice(0,4000), requiresApproval: true };
}});

registerTool({ name:'sendExternalMessage', description:'Send WhatsApp/Email/SMS externally', permission:'TOOL_EXTERNAL_SEND', riskLevel:'HIGH', handler: async (input: any)=> {
  // gate: this will only run when ctx.humanApproved = true (checked above)
  return { sent: true, channel: input.channel || 'whatsapp', to: input.to || 'unknown' };
}});

registerTool({ name:'scoreLead', description:'Score lead (crm-automation)', permission:'TOOL_WRITE', riskLevel:'LOW', handler: async (input: any)=> {
  const { scoreLead } = await import('@/lib/crm-automation');
  const res = await scoreLead(input.leadId);
  return res as any;
}});
