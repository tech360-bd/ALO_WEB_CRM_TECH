/**
 * ALO AI Workforce — audit logging (§41).
 *
 * Every privileged Builder operation and every tool decision is recorded with
 * actor, timestamp, object, action, before, after and result. Audit writes are
 * never conditional on agent configuration, so no agent can disable its own
 * audit trail.
 */
import { db } from '@/lib/db';
import { redactDeep } from './security';
import type { ActorContext } from './types';

export const AUDIT_ACTIONS = [
  'AGENT_CREATED', 'AGENT_EDITED', 'AGENT_VERSION_CREATED', 'AGENT_VALIDATED', 'AGENT_TESTED',
  'AGENT_APPROVED', 'AGENT_DEPLOYED', 'AGENT_PAUSED', 'AGENT_DISABLED', 'AGENT_ARCHIVED',
  'AGENT_ROLLED_BACK', 'TOOL_CREATED', 'TOOL_UPDATED', 'TOOL_PERMISSION_CHANGED', 'TOOL_GRANT_REVOKED',
  'SKILL_CREATED', 'SKILL_UPDATED', 'WORKFLOW_CREATED', 'WORKFLOW_UPDATED', 'WORKFLOW_TRIGGERED',
  'MODEL_ROUTING_CHANGED', 'MEMORY_POLICY_CHANGED', 'MEMORY_WRITTEN', 'MEMORY_DENIED',
  'APPROVAL_REQUESTED', 'APPROVAL_GRANTED', 'APPROVAL_REJECTED', 'APPROVAL_CONSUMED',
  'TOOL_INVOKED', 'TOOL_DENIED', 'TOOL_FAILED', 'RUN_STARTED', 'RUN_COMPLETED', 'RUN_FAILED',
  'RUN_ESCALATED', 'SECURITY_BLOCKED', 'PROPOSAL_CREATED', 'PROPOSAL_DECIDED', 'KNOWLEDGE_INGESTED',
  'AGENT_INVOKE_DENIED', 'RUN_RECOVERED', 'RUNTIME_SYNCED', 'REGISTRY_SYNCED',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditInput {
  actor?: Pick<ActorContext, 'userId' | 'role' | 'ipAddress'> | null;
  action: AuditAction;
  objectType: string;
  objectId?: string;
  before?: unknown;
  after?: unknown;
  result?: 'SUCCESS' | 'DENIED' | 'FAILED';
  reason?: string;
  correlationId?: string;
}

function serialize(value: unknown): string {
  if (value === undefined || value === null) return '{}';
  try {
    return JSON.stringify(redactDeep(value)).slice(0, 60_000);
  } catch {
    return '{"error":"unserializable"}';
  }
}

export async function writeAudit(input: AuditInput): Promise<string> {
  const row = await db.awfAuditLog.create({
    data: {
      actorId: input.actor?.userId || 'system',
      actorRole: input.actor?.role || 'SYSTEM',
      action: input.action,
      objectType: input.objectType,
      objectId: input.objectId || '',
      before: serialize(input.before),
      after: serialize(input.after),
      result: input.result || 'SUCCESS',
      reason: String(input.reason || '').slice(0, 1000),
      correlationId: input.correlationId || '',
      ipAddress: input.actor?.ipAddress || '',
    },
  });
  return row.id;
}

export interface AuditQuery {
  action?: string;
  objectType?: string;
  objectId?: string;
  actorId?: string;
  take?: number;
}

export async function readAudit(query: AuditQuery = {}) {
  return db.awfAuditLog.findMany({
    where: {
      ...(query.action ? { action: query.action } : {}),
      ...(query.objectType ? { objectType: query.objectType } : {}),
      ...(query.objectId ? { objectId: query.objectId } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: Math.min(500, Math.max(1, query.take ?? 100)),
  });
}
