/**
 * ALO AI Workforce — RBAC (§40).
 *
 * Authorisation is always decided server side from the authenticated session.
 * A role is never read from a request body, a prompt or a tool argument, and no
 * role can bypass these checks by supplying extra fields.
 */
import { db } from '@/lib/db';
import type { ActorContext, AloRole } from './types';
import { ALO_ROLES } from './types';

export const AWF_CAPABILITIES = [
  'awf.agent.read',
  'awf.agent.create',
  'awf.agent.edit',
  'awf.agent.validate',
  'awf.agent.test',
  'awf.agent.approve',
  'awf.agent.deploy',
  'awf.agent.rollback',
  'awf.agent.disable',
  'awf.tool.read',
  'awf.tool.manage',
  'awf.tool.grant',
  'awf.skill.read',
  'awf.skill.manage',
  'awf.workflow.read',
  'awf.workflow.manage',
  'awf.workflow.trigger',
  'awf.run.read.all',
  'awf.run.read.own',
  'awf.run.execute',
  'awf.run.simulate',
  'awf.approval.read',
  'awf.approval.decide',
  'awf.memory.read',
  'awf.memory.write',
  'awf.memory.manage',
  'awf.dashboard.read',
  'awf.health.read',
  'awf.audit.read',
  'awf.model.manage',
  'awf.knowledge.manage',
] as const;
export type AwfCapability = (typeof AWF_CAPABILITIES)[number];

const ROLE_CAPABILITIES: Record<AloRole, AwfCapability[]> = {
  SUPER_ADMIN: [...AWF_CAPABILITIES],
  ADMIN: [
    'awf.agent.read', 'awf.agent.create', 'awf.agent.edit', 'awf.agent.validate', 'awf.agent.test',
    'awf.agent.approve', 'awf.agent.deploy', 'awf.agent.rollback', 'awf.agent.disable',
    'awf.tool.read', 'awf.tool.grant', 'awf.skill.read', 'awf.workflow.read', 'awf.workflow.manage',
    'awf.workflow.trigger', 'awf.run.read.all', 'awf.run.execute', 'awf.run.simulate',
    'awf.approval.read', 'awf.approval.decide', 'awf.memory.read', 'awf.memory.write',
    'awf.dashboard.read', 'awf.health.read', 'awf.audit.read', 'awf.knowledge.manage',
  ],
  MANAGER: [
    'awf.agent.read', 'awf.tool.read', 'awf.skill.read', 'awf.workflow.read', 'awf.workflow.trigger',
    'awf.run.read.all', 'awf.run.execute', 'awf.run.simulate', 'awf.approval.read', 'awf.approval.decide',
    'awf.memory.read', 'awf.dashboard.read', 'awf.health.read',
  ],
  COUNSELOR: [
    // Counsellors run the lead, profile, matching and application workflows as
    // part of their daily work; they cannot author, approve or deploy agents.
    'awf.agent.read', 'awf.workflow.read', 'awf.workflow.trigger', 'awf.run.read.own', 'awf.run.execute',
    'awf.run.simulate', 'awf.approval.read', 'awf.memory.read',
  ],
  EMPLOYEE: ['awf.agent.read', 'awf.workflow.read', 'awf.run.read.own', 'awf.run.execute', 'awf.memory.read'],
  PARTNER: ['awf.agent.read', 'awf.run.read.own', 'awf.run.execute'],
  STUDENT: ['awf.run.read.own', 'awf.run.execute'],
};

/** Protected architecture operations only Super Admin may perform. */
export const SUPER_ADMIN_ONLY: AwfCapability[] = ['awf.tool.manage', 'awf.skill.manage', 'awf.model.manage', 'awf.memory.manage'];

export function normalizeRole(raw: unknown): AloRole {
  const value = String(raw ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, AloRole> = {
    SUPERADMIN: 'SUPER_ADMIN',
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    BRANCH_MANAGER: 'MANAGER',
    COUNSELOR: 'COUNSELOR',
    COUNSELLOR: 'COUNSELOR',
    EMPLOYEE: 'EMPLOYEE',
    STAFF: 'EMPLOYEE',
    PARTNER: 'PARTNER',
    AGENT: 'PARTNER',
    STUDENT: 'STUDENT',
  };
  const mapped = aliases[value];
  if (mapped) return mapped;
  return (ALO_ROLES as readonly string[]).includes(value) ? (value as AloRole) : 'STUDENT';
}

export function can(role: AloRole, capability: AwfCapability): boolean {
  if (SUPER_ADMIN_ONLY.includes(capability)) return role === 'SUPER_ADMIN';
  return ROLE_CAPABILITIES[role]?.includes(capability) ?? false;
}

export function capabilitiesFor(role: AloRole): AwfCapability[] {
  return ROLE_CAPABILITIES[role] ?? [];
}

export class AuthorizationError extends Error {
  readonly status = 403;
  constructor(capability: string) {
    super(`AWF_FORBIDDEN: ${capability} is not permitted for this role`);
  }
}

export function requireCapability(actor: ActorContext, capability: AwfCapability): void {
  if (!can(actor.role, capability)) throw new AuthorizationError(capability);
}

/**
 * Agent-level authorisation: an agent declares which roles may invoke it, and
 * the role must additionally hold the execute capability.
 */
export function canInvokeAgent(actor: ActorContext, allowedRolesJson: string): boolean {
  if (!can(actor.role, 'awf.run.execute')) return false;
  let allowed: string[] = [];
  try {
    const parsed = JSON.parse(allowedRolesJson || '[]');
    allowed = Array.isArray(parsed) ? parsed.map((item) => normalizeRole(item)) : [];
  } catch {
    allowed = [];
  }
  if (!allowed.length) return actor.role === 'SUPER_ADMIN';
  return allowed.includes(actor.role);
}

/** Resolve an authenticated actor from the application session. */
export async function resolveActor(request: Request): Promise<ActorContext | null> {
  const { authenticateRequest } = await import('@/lib/auth-middleware');
  const result = await authenticateRequest(request);
  if (result instanceof Response) return null;
  const context = result as { userId: string; email: string; userType: string; branch?: string };
  const user = await db.user.findUnique({ where: { id: context.userId }, select: { id: true, role: true, status: true, email: true } });
  if (!user || user.status !== 'ACTIVE') return null;
  return {
    userId: user.id,
    role: normalizeRole(user.role || context.userType),
    email: user.email,
    departmentSlug: context.branch,
    ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
  };
}
