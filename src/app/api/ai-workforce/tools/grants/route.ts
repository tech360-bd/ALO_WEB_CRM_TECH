import { db } from '@/lib/db';
import { ok, fail, failFromError } from '@/lib/ai-workforce/api';
import { writeAudit } from '@/lib/ai-workforce/audit';
import { guard, isGuardFailure, readJson } from '../../_guard';

export const dynamic = 'force-dynamic';

/**
 * Grant or revoke a tool for an agent. Only a human with awf.tool.grant may
 * call this; an agent can never reach it, and the granted permission may not
 * exceed the permission the tool itself declares.
 */
export async function POST(request: Request) {
  const admission = await guard(request, 'awf.tool.grant');
  if (isGuardFailure(admission)) return admission;
  const body = await readJson(request);
  const agentSlug = String(body.agentSlug || '');
  const toolSlug = String(body.toolSlug || '');
  const revoke = body.revoke === true;
  if (!agentSlug || !toolSlug) return fail('agentSlug and toolSlug are required', 422);

  try {
    const [agent, tool] = await Promise.all([
      db.awfAgent.findUnique({ where: { slug: agentSlug }, select: { id: true } }),
      db.awfTool.findUnique({ where: { slug: toolSlug }, select: { id: true, permission: true, requiresApproval: true, riskLevel: true } }),
    ]);
    if (!agent || !tool) return fail('Agent or tool not found', 404);

    if (revoke) {
      await db.awfToolGrant.updateMany({ where: { agentId: agent.id, toolId: tool.id }, data: { status: 'REVOKED' } });
      await writeAudit({ actor: admission.actor, action: 'TOOL_GRANT_REVOKED', objectType: 'AwfToolGrant', objectId: `${agentSlug}:${toolSlug}`, after: { revoked: true } });
      return ok({ agentSlug, toolSlug, status: 'REVOKED' }, 'Tool grant revoked');
    }

    const grant = await db.awfToolGrant.upsert({
      where: { agentId_toolId: { agentId: agent.id, toolId: tool.id } },
      create: {
        agentId: agent.id,
        toolId: tool.id,
        // The grant can never widen the tool's own declared permission.
        permission: tool.permission,
        approvalRequired: tool.requiresApproval || ['HIGH', 'CRITICAL'].includes(tool.riskLevel),
        maxCallsPerRun: Math.min(Number(body.maxCallsPerRun || 10), 50),
        status: 'ACTIVE',
        grantedById: admission.actor.userId,
      },
      update: { status: 'ACTIVE', permission: tool.permission, approvalRequired: tool.requiresApproval || ['HIGH', 'CRITICAL'].includes(tool.riskLevel) },
    });
    await writeAudit({ actor: admission.actor, action: 'TOOL_PERMISSION_CHANGED', objectType: 'AwfToolGrant', objectId: grant.id, after: { agentSlug, toolSlug, permission: grant.permission } });
    return ok({ agentSlug, toolSlug, permission: grant.permission, approvalRequired: grant.approvalRequired }, 'Tool granted');
  } catch (error) {
    return failFromError(error, 'Unable to change the tool grant', 400);
  }
}
