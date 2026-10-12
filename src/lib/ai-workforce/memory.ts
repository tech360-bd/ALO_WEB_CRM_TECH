/**
 * ALO AI Workforce — controlled memory layers (§12).
 *
 * Five scopes with explicit permission rules. Memory access is decided by the
 * server from the authenticated actor plus the agent's memory policy; an agent
 * cannot widen its own scope and a student-facing agent can never read another
 * student's, an employee's, or a Super Admin's memory.
 */
import { db } from '@/lib/db';
import { writeAudit } from './audit';
import { redactSecrets } from './security';
import type { ActorContext, Confidentiality, MemoryScope } from './types';

export interface MemoryPolicy {
  shortTerm: boolean;
  longTerm: boolean;
  company: boolean;
  department: boolean;
  user: boolean;
  /** Highest confidentiality this agent may ever read. */
  maxConfidentiality: Confidentiality;
  /** Long-term / company writes always require human approval. */
  writeScopes: MemoryScope[];
}

export const DEFAULT_MEMORY_POLICY: MemoryPolicy = {
  shortTerm: true,
  longTerm: false,
  company: false,
  department: false,
  user: false,
  maxConfidentiality: 'INTERNAL',
  writeScopes: ['SHORT_TERM'],
};

const CONFIDENTIALITY_RANK: Record<Confidentiality, number> = {
  PUBLIC: 0,
  INTERNAL: 1,
  CONFIDENTIAL: 2,
  RESTRICTED: 3,
};

export function parseMemoryPolicy(raw: unknown): MemoryPolicy {
  const source = typeof raw === 'string' ? safeJson(raw) : (raw as Record<string, unknown> | null);
  if (!source) return { ...DEFAULT_MEMORY_POLICY };
  const scopes = Array.isArray(source.writeScopes) ? (source.writeScopes as MemoryScope[]) : DEFAULT_MEMORY_POLICY.writeScopes;
  return {
    shortTerm: source.shortTerm !== false,
    longTerm: source.longTerm === true,
    company: source.company === true,
    department: source.department === true,
    user: source.user === true,
    maxConfidentiality: (['PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED'] as const).includes(source.maxConfidentiality as Confidentiality)
      ? (source.maxConfidentiality as Confidentiality)
      : 'INTERNAL',
    writeScopes: scopes.filter((scope) => ['SHORT_TERM', 'LONG_TERM', 'COMPANY', 'DEPARTMENT', 'USER'].includes(scope)),
  };
}

function safeJson(raw: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export class MemoryAccessError extends Error {
  readonly status = 403;
  constructor(reason: string) {
    super(`AWF_MEMORY_DENIED: ${reason}`);
  }
}

export interface MemoryRequest {
  scope: MemoryScope;
  ownerKey: string;
  key: string;
  actor: ActorContext;
  agentSlug: string;
  policy: MemoryPolicy;
}

/** Decide, server side, whether this actor+agent may touch this memory address. */
export function evaluateMemoryAccess(request: MemoryRequest, intent: 'READ' | 'WRITE'): { allowed: boolean; reason: string } {
  const { scope, ownerKey, actor, policy, agentSlug } = request;
  const scopeEnabled: Record<MemoryScope, boolean> = {
    SHORT_TERM: policy.shortTerm,
    LONG_TERM: policy.longTerm,
    COMPANY: policy.company,
    DEPARTMENT: policy.department,
    USER: policy.user,
  };
  if (!scopeEnabled[scope]) return { allowed: false, reason: `agent memory policy does not enable ${scope}` };

  if (intent === 'WRITE' && !policy.writeScopes.includes(scope)) {
    return { allowed: false, reason: `agent memory policy does not permit writes to ${scope}` };
  }

  switch (scope) {
    case 'SHORT_TERM':
      // Short-term memory is addressed by run id and is private to that run.
      return { allowed: true, reason: 'short-term run scope' };
    case 'USER': {
      if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN') return { allowed: true, reason: 'administrator user-scope access' };
      if (ownerKey === actor.userId) return { allowed: true, reason: 'own user scope' };
      if (actor.scopedEntityIds?.includes(ownerKey)) return { allowed: true, reason: 'explicitly scoped entity' };
      return { allowed: false, reason: 'cross-user memory access is not authorised' };
    }
    case 'DEPARTMENT': {
      if (actor.role === 'SUPER_ADMIN' || actor.role === 'ADMIN') return { allowed: true, reason: 'administrator department access' };
      if (['STUDENT', 'PARTNER'].includes(actor.role)) return { allowed: false, reason: 'department memory is internal to ALO staff' };
      if (actor.departmentSlug && actor.departmentSlug === ownerKey) return { allowed: true, reason: 'own department' };
      return { allowed: false, reason: 'cross-department memory access is not authorised' };
    }
    case 'COMPANY': {
      if (['STUDENT', 'PARTNER'].includes(actor.role)) return { allowed: false, reason: 'company memory is internal to ALO staff' };
      if (intent === 'WRITE' && actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN') {
        return { allowed: false, reason: 'company memory writes require administrator authority' };
      }
      return { allowed: true, reason: 'company scope' };
    }
    case 'LONG_TERM': {
      if (ownerKey !== agentSlug && actor.role !== 'SUPER_ADMIN' && actor.role !== 'ADMIN') {
        return { allowed: false, reason: 'long-term memory of another agent is not readable' };
      }
      return { allowed: true, reason: 'agent long-term scope' };
    }
    default:
      return { allowed: false, reason: 'unknown scope' };
  }
}

export async function readMemory(request: MemoryRequest): Promise<{ value: string; confidentiality: Confidentiality } | null> {
  const decision = evaluateMemoryAccess(request, 'READ');
  if (!decision.allowed) {
    await writeAudit({
      actor: request.actor,
      action: 'MEMORY_DENIED',
      objectType: 'AwfMemory',
      objectId: `${request.scope}:${request.ownerKey}:${request.key}`,
      result: 'DENIED',
      reason: decision.reason,
    });
    throw new MemoryAccessError(decision.reason);
  }
  const row = await db.awfMemory.findUnique({
    where: { scope_ownerKey_key: { scope: request.scope, ownerKey: request.ownerKey, key: request.key } },
  });
  if (!row) return null;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now()) return null;
  const confidentiality = row.confidentiality as Confidentiality;
  if (CONFIDENTIALITY_RANK[confidentiality] > CONFIDENTIALITY_RANK[request.policy.maxConfidentiality]) {
    await writeAudit({
      actor: request.actor,
      action: 'MEMORY_DENIED',
      objectType: 'AwfMemory',
      objectId: row.id,
      result: 'DENIED',
      reason: `confidentiality ${confidentiality} exceeds the agent limit ${request.policy.maxConfidentiality}`,
    });
    throw new MemoryAccessError(`confidentiality ${confidentiality} exceeds the agent limit`);
  }
  // LONG_TERM and COMPANY knowledge is only durable once a human approved it.
  if ((row.scope === 'LONG_TERM' || row.scope === 'COMPANY') && !row.approved) return null;
  return { value: row.value, confidentiality };
}

export interface MemoryWrite extends MemoryRequest {
  value: string;
  confidentiality?: Confidentiality;
  expiresAt?: Date | null;
  sourceRunId?: string;
  approved?: boolean;
}

export async function writeMemory(request: MemoryWrite): Promise<{ id: string; approved: boolean }> {
  const decision = evaluateMemoryAccess(request, 'WRITE');
  if (!decision.allowed) {
    await writeAudit({
      actor: request.actor,
      action: 'MEMORY_DENIED',
      objectType: 'AwfMemory',
      objectId: `${request.scope}:${request.ownerKey}:${request.key}`,
      result: 'DENIED',
      reason: decision.reason,
    });
    throw new MemoryAccessError(decision.reason);
  }
  const confidentiality = request.confidentiality || 'INTERNAL';
  // Durable knowledge is never self-approved by an agent.
  const approved =
    request.scope === 'SHORT_TERM' || request.scope === 'USER'
      ? true
      : request.approved === true && (request.actor.role === 'SUPER_ADMIN' || request.actor.role === 'ADMIN');
  const value = redactSecrets(String(request.value ?? '')).slice(0, 100_000);
  const row = await db.awfMemory.upsert({
    where: { scope_ownerKey_key: { scope: request.scope, ownerKey: request.ownerKey, key: request.key } },
    create: {
      scope: request.scope,
      ownerKey: request.ownerKey,
      agentSlug: request.agentSlug,
      key: request.key,
      value,
      confidentiality,
      approved,
      approvedById: approved && request.scope !== 'SHORT_TERM' ? request.actor.userId : '',
      sourceRunId: request.sourceRunId || '',
      expiresAt: request.expiresAt ?? (request.scope === 'SHORT_TERM' ? new Date(Date.now() + 24 * 3600 * 1000) : null),
    },
    update: {
      value,
      confidentiality,
      approved,
      sourceRunId: request.sourceRunId || '',
      expiresAt: request.expiresAt ?? (request.scope === 'SHORT_TERM' ? new Date(Date.now() + 24 * 3600 * 1000) : null),
    },
  });
  await writeAudit({
    actor: request.actor,
    action: 'MEMORY_WRITTEN',
    objectType: 'AwfMemory',
    objectId: row.id,
    after: { scope: request.scope, ownerKey: request.ownerKey, key: request.key, approved },
  });
  return { id: row.id, approved };
}

/** Purge expired short-term memory. Safe to run from a scheduled job. */
export async function purgeExpiredMemory(): Promise<number> {
  const result = await db.awfMemory.deleteMany({ where: { expiresAt: { not: null, lt: new Date() } } });
  return result.count;
}
