// ALO Education authorized tool registry. Server-side assignments are required;
// a caller-supplied humanApproved flag is never authorization.
import { z } from 'zod';
import { db } from '@/lib/db';

export type ToolPermission = 'TOOL_READ' | 'TOOL_WRITE' | 'TOOL_EXTERNAL_SEND' | 'TOOL_FINANCE' | 'TOOL_ADMIN';
export interface ToolCtx {
  agentId: string;
  /** Server-authenticated User id, never supplied by a model or request body. */
  actorUserId?: string;
  department?: string;
  /** Legacy callers may send this; it conveys no authority. */
  humanApproved?: boolean;
  idempotencyKey?: string;
}
export interface ToolDef {
  name: string;
  description: string;
  permission: ToolPermission;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  handler: (input: Record<string, unknown>, ctx: ToolCtx) => Promise<Record<string, unknown>>;
}
const registry = new Map<string, ToolDef>();
export function registerTool(def: ToolDef) { registry.set(def.name, def); }
export function listTools(): ToolDef[] { return [...registry.values()]; }
export function getTool(name: string): ToolDef | undefined { return registry.get(name); }

export async function checkToolPermission(toolName: string, ctx: ToolCtx): Promise<{ allowed: boolean; reason: string }> {
  const tool = registry.get(toolName);
  if (!tool) return { allowed: false, reason: 'Unknown tool' };
  if (!ctx.actorUserId) return { allowed: false, reason: 'Server-authenticated administrator required' };
  const actor = await db.user.findUnique({ where: { id: ctx.actorUserId }, select: { status: true, role: true } });
  if (!actor || actor.status !== 'ACTIVE' || !['ADMIN', 'SUPER_ADMIN'].includes(actor.role)) return { allowed: false, reason: 'Administrator authority required; delegated row-scoped execution is not implemented' };
  const agent = await db.agentDefinition.findUnique({ where: { id: ctx.agentId } });
  if (!agent || agent.status.toLowerCase() !== 'active') return { allowed: false, reason: 'Active registered agent required' };
  if (ctx.department && ctx.department !== agent.departmentId) return { allowed: false, reason: 'Agent department mismatch' };
  const grant = await db.agentToolExtension.findUnique({ where: { agentId_toolId: { agentId: ctx.agentId, toolId: toolName } } });
  if (!grant || grant.status !== 'ACTIVE' || !['EXECUTE', tool.permission].includes(grant.permission)) {
    return { allowed: false, reason: 'No active tool assignment with required permission' };
  }
  if (agent.requiresApproval || grant.approvalRequired || ['HIGH', 'CRITICAL'].includes(grant.riskLevel) ||
      ['HIGH', 'CRITICAL'].includes(tool.riskLevel) || ['TOOL_EXTERNAL_SEND', 'TOOL_FINANCE', 'TOOL_ADMIN'].includes(tool.permission)) {
    // Existing AgentApprovalQueue is agent-level, not bound to input/task/tool and
    // has no atomic consumption marker. Treating it as action authority is unsafe.
    return { allowed: false, reason: 'Action-bound single-use approval required; agent-level approval or humanApproved is insufficient' };
  }
  return { allowed: true, reason: 'Active agent tool assignment' };
}

export async function invokeTool(toolName: string, input: Record<string, unknown>, ctx: ToolCtx): Promise<{ ok: boolean; result?: Record<string, unknown>; error?: string }> {
  const audit = (action: string) => db.crmAuditLog.create({ data: {
    action, targetCollection: 'AgentTool', targetId: ctx.agentId,
    afterData: JSON.stringify({ tool: toolName, inputKeys: Object.keys(input) }),
  } });
  const check = await checkToolPermission(toolName, ctx);
  if (!check.allowed) {
    await audit('TOOL_DENIED');
    return { ok: false, error: check.reason };
  }
  await audit('TOOL_REQUESTED');
  let result: Record<string, unknown>;
  try {
    result = await registry.get(toolName)!.handler(input, ctx);
  } catch {
    await audit('TOOL_FAILED');
    return { ok: false, error: 'Tool execution failed' };
  }
  await audit('TOOL_COMPLETED');
  return { ok: true, result };
}

const idSchema = z.string().trim().min(1).max(191);
registerTool({ name: 'readCrm', description: 'Read minimal lead summary', permission: 'TOOL_READ', riskLevel: 'LOW', handler: async input => {
  const { id } = z.object({ type: z.literal('lead'), id: idSchema }).parse(input);
  const row = await db.lead.findUnique({ where: { id }, select: { id: true, status: true, leadScore: true } });
  return { found: row !== null, data: row };
} });
registerTool({ name: 'writeTimeline', description: 'Append student/lead timeline event', permission: 'TOOL_WRITE', riskLevel: 'LOW', handler: async (input, ctx) => {
  const parsed = z.object({ targetType: z.enum(['Lead', 'Student']), targetId: idSchema, action: z.string().trim().min(1).max(160), metadata: z.record(z.string(), z.unknown()).optional() }).parse(input);
  const lead = parsed.targetType === 'Lead' ? await db.lead.findUnique({ where: { id: parsed.targetId }, select: { id: true, studentId: true } }) : null;
  const studentId = parsed.targetType === 'Student' ? parsed.targetId : lead?.studentId;
  if (!studentId) throw new Error('Timeline requires a linked student');
  const student = await db.student.findUnique({ where: { id: studentId }, select: { id: true } });
  if (!student) throw new Error('Student not found');
  const row = await db.timelineEvent.create({ data: {
    studentId: student.id, leadId: lead?.id, stage: 'AI_NOTE', title: parsed.action,
    actor: ctx.agentId, type: 'AI_NOTE', meta: JSON.stringify(parsed.metadata || {}),
  } });
  return { id: row.id };
} });
registerTool({ name: 'draftMessage', description: 'Prepare text for human review; does not send', permission: 'TOOL_WRITE', riskLevel: 'MEDIUM', handler: async input => {
  const { content } = z.object({ content: z.string().trim().min(1).max(4000) }).parse(input);
  return { draft: content, requiresApproval: true };
} });
registerTool({ name: 'sendExternalMessage', description: 'External delivery requires bound approval and a verified connector', permission: 'TOOL_EXTERNAL_SEND', riskLevel: 'HIGH', handler: async () => {
  throw new Error('BLOCKED: no action-bound approval or verified delivery connector in this gateway');
} });
registerTool({ name: 'scoreLead', description: 'Score lead using existing CRM rules', permission: 'TOOL_WRITE', riskLevel: 'LOW', handler: async input => {
  const { leadId } = z.object({ leadId: idSchema }).parse(input);
  const { scoreLead } = await import('@/lib/crm-automation');
  const result = await scoreLead(leadId);
  return { score: result.score, tier: result.tier };
} });
