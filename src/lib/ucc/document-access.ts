import type { AuthContext } from '@/lib/auth-middleware';

const DOCUMENT_ROLES = new Set([
  'SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER', 'COUNSELOR',
  'APPLICATION_TEAM', 'APPLICATION_MANAGER', 'APPLICATION_OFFICER', 'DOCUMENT_OFFICER',
  'VISA_OFFICER', 'VISA_INTERVIEW_OFFICER',
]);
// UCC threads may contain private student context. Front desk/support may handle
// assigned conversations; marketing replies belong in the public social inbox.
const COMMUNICATION_ROLES = new Set([...DOCUMENT_ROLES, 'FRONT_DESK', 'SUPPORT', 'SUPPORT_STAFF']);
const SUPERVISOR_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'DEPARTMENT_MANAGER']);

export function normalizedRoles(auth: AuthContext): Set<string> {
  return new Set([auth.userType, ...auth.roles].map((role) => String(role).toUpperCase()));
}

export function canUseUccDocuments(auth: AuthContext): boolean {
  return [...normalizedRoles(auth)].some((role) => DOCUMENT_ROLES.has(role));
}

export function canUseUccCommunication(auth: AuthContext): boolean {
  return [...normalizedRoles(auth)].some((role) => COMMUNICATION_ROLES.has(role));
}

export function isUccDocumentSupervisor(auth: AuthContext): boolean {
  return [...normalizedRoles(auth)].some((role) => SUPERVISOR_ROLES.has(role));
}

export function canAccessUccConversation(
  auth: AuthContext,
  conversation: { assignedToUserId?: string | null },
): boolean {
  if (!canUseUccCommunication(auth)) return false;
  return isUccDocumentSupervisor(auth) || conversation.assignedToUserId === auth.userId;
}

export function canAccessUccDocumentConversation(
  auth: AuthContext,
  conversation: { assignedToUserId?: string | null },
): boolean {
  if (!canUseUccDocuments(auth)) return false;
  return isUccDocumentSupervisor(auth) || conversation.assignedToUserId === auth.userId;
}

export function canViewUccB2B(auth: AuthContext): boolean {
  const roles = normalizedRoles(auth);
  return [...roles].some((role) => ['SUPER_ADMIN', 'ADMIN', 'APPLICATION_MANAGER', 'APPLICATION_TEAM', 'APPLICATION-MANAGER'].includes(role)) ||
    auth.permissions.some((permission) => [
      'application.view_b2b',
      'application.manage_b2b',
      'application.manage_b2b_providers',
      'application.view_b2b_providers',
    ].includes(permission));
}
