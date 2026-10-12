import type { AuthContext } from '@/lib/auth-middleware';

/** Temporary containment, NOT verified counselor functionality.
 * Historical UCC/CommunicationThread assignee IDs have no identity domain;
 * matching a User ID or PortalUser ID cannot establish ownership. Only
 * canonical administrators may use these private-data paths pending an
 * explicit ownership migration/backfill. No environment bypass.
 */
export function canUseUnscopedUccAdmin(auth: AuthContext): boolean {
  return auth.identityDomain === 'user' && ['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase());
}

export function normalizedRoles(auth: AuthContext): Set<string> {
  return new Set([auth.userType, ...auth.roles].map((role) => String(role).toUpperCase()));
}

export function canUseUccDocuments(auth: AuthContext): boolean {
  return canUseUnscopedUccAdmin(auth);
}

export function canUseUccCommunication(auth: AuthContext): boolean {
  return canUseUnscopedUccAdmin(auth);
}

export function isUccDocumentSupervisor(auth: AuthContext): boolean {
  return canUseUnscopedUccAdmin(auth);
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
