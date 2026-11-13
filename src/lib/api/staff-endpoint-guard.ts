/**
 * Shared route-level RBAC guard for legacy staff endpoints.
 *
 * `src/proxy.ts` already requires a session for every non-public /api route,
 * but a session alone is not authorisation: a STUDENT or PARTNER identity could
 * otherwise read/write HR records, B2B contacts, official-email queues,
 * university agreements and communication templates through these legacy
 * handlers. The master specification requires the permission check in the
 * backend handler, not only in the proxy or by hiding UI buttons.
 *
 * This module is deliberately small and dependency-free so it can be reused by
 * every legacy handler without creating a second authentication system. It
 * delegates authentication to `withAuth`/`authenticateRequest` and only decides
 * whether the resolved identity may perform a read or a write.
 */

import { NextResponse } from 'next/server';
import type { AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';

/** User types that must never reach internal staff endpoints. */
export const DENIED_STAFF_USER_TYPES = new Set([
  'STUDENT',
  'PARTNER',
  'PORTAL_STUDENT',
  'PORTAL_PARTNER',
  'GUEST',
  'ANONYMOUS',
]);

export type StaffEndpointPolicy = {
  /** Canonical upper-case role names allowed to read. */
  read: readonly string[];
  /** Canonical upper-case role names allowed to write. */
  write: readonly string[];
  /** Extra permission strings that grant read/write access to non-listed roles. */
  readPermissions?: readonly string[];
  writePermissions?: readonly string[];
  /** Human-readable resource name used in denial messages. */
  resource: string;
};

export function staffRoleSet(auth: Pick<AuthContext, 'userType' | 'roles'>): Set<string> {
  return new Set([auth.userType, ...(auth.roles || [])]
    .filter(Boolean)
    .map((role) => String(role).trim().toUpperCase().replace(/[\s-]+/g, '_')));
}

export function isSuperAdminAuthority(auth: Pick<AuthContext, 'userType' | 'roles'>): boolean {
  const roles = staffRoleSet(auth);
  return roles.has('SUPER_ADMIN') || roles.has('ROLE_SUPER_ADMIN');
}

function hasAnyPermission(auth: AuthContext, permissions?: readonly string[]): boolean {
  if (!permissions?.length) return false;
  const granted = new Set((auth.permissions || []).map(String));
  return permissions.some((permission) => granted.has(permission));
}

export type StaffGuardResult = { allowed: true } | { allowed: false; response: NextResponse };

/**
 * Evaluate a read/write request against a policy.
 *
 * Writes additionally require a same-origin (or bearer-authenticated) request,
 * so a CSRF-style cross-site POST cannot mutate internal records even when a
 * valid session cookie exists.
 */
export function evaluateStaffAccess(
  auth: AuthContext,
  policy: StaffEndpointPolicy,
  options: { write: boolean; request?: Request },
): StaffGuardResult {
  if (auth instanceof NextResponse) {
    return { allowed: false, response: auth };
  }
  const deny = (error: string, status: number): StaffGuardResult => ({
    allowed: false,
    response: NextResponse.json({ success: false, error }, {
      status,
      headers: { 'Cache-Control': 'private, no-store' },
    }),
  });

  const roles = staffRoleSet(auth);
  const userType = String(auth.userType || '').trim().toUpperCase();
  if (!auth.userId || DENIED_STAFF_USER_TYPES.has(userType) || roles.has('STUDENT') || roles.has('PARTNER')) {
    return deny(`${policy.resource} is restricted to authorized ALO staff.`, 403);
  }

  if (options.write && options.request && !mutationOriginAllowed(options.request, auth)) {
    return deny('Same-origin request required.', 403);
  }

  if (isSuperAdminAuthority(auth)) return { allowed: true };

  const permittedRoles = options.write ? policy.write : policy.read;
  const explicitPermission = hasAnyPermission(auth, options.write ? policy.writePermissions : policy.readPermissions);
  if (!permittedRoles.some((role) => roles.has(role)) && !explicitPermission) {
    return deny(`Insufficient role permissions for ${policy.resource}.`, 403);
  }
  return { allowed: true };
}

/** Convenience wrapper returning the denial response, or null when allowed. */
export function staffGuardDenied(
  auth: AuthContext,
  policy: StaffEndpointPolicy,
  options: { write: boolean; request?: Request },
): NextResponse | null {
  const result = evaluateStaffAccess(auth, policy, options);
  return result.allowed ? null : result.response;
}

/** Shared policies; role names use the canonical SESSION_ROLES vocabulary. */
export const STAFF_POLICIES = {
  hrLeave: {
    resource: 'HR leave records',
    read: ['ADMIN', 'CEO', 'COO', 'HR_MANAGER', 'HR', 'BRANCH_MANAGER', 'OFFICE_MANAGER'],
    write: ['ADMIN', 'HR_MANAGER', 'HR'],
    readPermissions: ['hr.leave.view_all', 'hp1'],
    writePermissions: ['hr.leave.manage'],
  },
  hrDevices: {
    resource: 'HR device inventory',
    read: ['ADMIN', 'HR_MANAGER', 'HR', 'IT', 'OPERATIONS', 'BRANCH_MANAGER'],
    write: ['ADMIN', 'HR_MANAGER', 'IT'],
    readPermissions: ['hr.devices.view_all', 'ad2'],
    writePermissions: ['hr.devices.manage'],
  },
  officialEmails: {
    resource: 'official email queue',
    read: ['ADMIN', 'CEO', 'MARKETING_MANAGER', 'MARKETING', 'SUPPORT_STAFF', 'FRONT_DESK'],
    write: ['ADMIN', 'MARKETING_MANAGER'],
    readPermissions: ['communication.email.view', 'marketing.report.view'],
    writePermissions: ['communication.email.send'],
  },
  universityAgreements: {
    resource: 'university agreements',
    read: ['ADMIN', 'CEO', 'COO', 'INTERNATIONAL_OFFICER', 'PARTNER_MANAGER', 'DATA_MANAGER', 'APPLICATION_TEAM'],
    write: ['ADMIN', 'INTERNATIONAL_OFFICER', 'PARTNER_MANAGER'],
    readPermissions: ['university.agreements.view'],
    writePermissions: ['university.agreements.manage'],
  },
  b2bContacts: {
    resource: 'B2B contacts',
    read: ['ADMIN', 'CEO', 'COO', 'PARTNER_MANAGER', 'INTERNATIONAL_OFFICER', 'APPLICATION_TEAM', 'BRANCH_MANAGER'],
    write: ['ADMIN', 'PARTNER_MANAGER', 'INTERNATIONAL_OFFICER'],
    readPermissions: ['contacts.view_all', 'partner.contacts.view'],
    writePermissions: ['contacts.update', 'partner.contacts.manage'],
  },
  communicationTemplates: {
    resource: 'communication templates',
    read: ['ADMIN', 'CEO', 'MARKETING_MANAGER', 'MARKETING', 'SUPPORT_STAFF', 'COUNSELOR', 'FRONT_DESK', 'BRANCH_MANAGER'],
    write: ['ADMIN', 'MARKETING_MANAGER'],
    readPermissions: ['whatsapp.templates.view', 'communication.templates.view'],
    writePermissions: ['whatsapp.templates.create', 'whatsapp.templates.edit', 'communication.templates.manage'],
  },
  partnerPackages: {
    resource: 'partner package configuration',
    read: ['ADMIN', 'CEO', 'COO', 'FINANCE', 'PARTNER_MANAGER'],
    // Partners may READ their own packages through scoped handlers; they must
    // never create, reprice or disable B2B package definitions.
    write: ['ADMIN', 'CEO', 'FINANCE'],
    readPermissions: ['partner.packages.view'],
    writePermissions: ['partner.packages.manage'],
  },
  communicationTasks: {
    resource: 'communication tasks and escalations',
    read: ['ADMIN', 'CEO', 'COO', 'BRANCH_MANAGER', 'COUNSELOR', 'APPLICATION_TEAM', 'FRONT_DESK', 'SUPPORT_STAFF', 'MARKETING_MANAGER'],
    write: ['ADMIN', 'BRANCH_MANAGER', 'COUNSELOR', 'APPLICATION_TEAM', 'FRONT_DESK', 'SUPPORT_STAFF'],
    readPermissions: ['communication.tasks.view'],
    writePermissions: ['communication.tasks.manage'],
  },
  slaPolicies: {
    resource: 'SLA policies',
    read: ['ADMIN', 'CEO', 'COO', 'BRANCH_MANAGER', 'COUNSELOR', 'FRONT_DESK', 'SUPPORT_STAFF'],
    write: ['ADMIN', 'BRANCH_MANAGER'],
    readPermissions: ['communication.sla.view'],
    writePermissions: ['communication.sla.manage'],
  },
  interviewQuestions: {
    resource: 'interview question library',
    read: ['ADMIN', 'CEO', 'VISA_OFFICER', 'VISA_INTERVIEW_OFFICER', 'COUNSELOR', 'ENGLISH_TRAINER', 'APPLICATION_TEAM', 'BRANCH_MANAGER'],
    // Mirrors SENSITIVE_API_ROUTES['/api/interview-questions'] in src/proxy.ts
    // so the backend guard does not silently narrow existing staff access.
    write: ['ADMIN', 'COUNSELOR', 'VISA_OFFICER', 'VISA_INTERVIEW_OFFICER', 'APPLICATION_TEAM'],
    readPermissions: ['interview.questions.view'],
    writePermissions: ['interview.questions.manage'],
  },
} satisfies Record<string, StaffEndpointPolicy>;
