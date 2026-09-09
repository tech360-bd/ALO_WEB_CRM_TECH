// DataScope — branch and assigned-user scoping for RBAC.
//
// The user's brief requires 4 scopes:
//   ALL      — user can see all records across all branches
//   BRANCH   — user can see records in their branch only
//   ASSIGNED — user can see only records assigned to them
//   NONE     — user has no access to this data
//
// Scope is determined per-role and per-module. The helpers below let API routes
// construct Prisma `where` clauses that enforce the scope automatically.

export type DataScope = 'ALL' | 'BRANCH' | 'ASSIGNED' | 'NONE';

// Map role name -> default scope per module.
// Roles not listed default to NONE.
const ROLE_DEFAULT_SCOPE: Record<string, DataScope> = {
  super_admin: 'ALL',
  admin: 'ALL',
  ceo: 'ALL',
  branch_manager: 'BRANCH',
  counselor: 'ASSIGNED',
  application_team: 'ASSIGNED',
  application_officer: 'ASSIGNED',
  visa_officer: 'ASSIGNED',
  finance: 'BRANCH',
  finance_officer: 'BRANCH',
  marketing_manager: 'ALL',
  marketing: 'BRANCH',
  hr_manager: 'ALL',
  hr: 'BRANCH',
  front_desk: 'BRANCH',
  support_staff: 'BRANCH',
  support_agent: 'BRANCH',
  partner_manager: 'BRANCH',
  document_officer: 'ASSIGNED',
  data_manager: 'ALL',
  ai_manager: 'ALL',
  partner: 'ASSIGNED',
  student: 'ASSIGNED',
  employee: 'ASSIGNED',
};

/**
 * Determine the data scope for a given auth context.
 * Super admins and admins always get ALL.
 * Other roles get their default scope from ROLE_DEFAULT_SCOPE.
 */
export function getScopeForAuth(auth: { roles: string[] }): DataScope {
  if (auth.roles.includes('super_admin') || auth.roles.includes('admin')) {
    return 'ALL';
  }
  // Take the most permissive scope across all roles the user has
  const scopes = auth.roles.map(r => ROLE_DEFAULT_SCOPE[r] || 'NONE');
  if (scopes.includes('ALL')) return 'ALL';
  if (scopes.includes('BRANCH')) return 'BRANCH';
  if (scopes.includes('ASSIGNED')) return 'ASSIGNED';
  return 'NONE';
}

/**
 * Build a Prisma `where` clause fragment that enforces the scope.
 *
 * Usage:
 *   const scope = getScopeForAuth(auth);
 *   const where = {
 *     ...buildScopeFilter(scope, auth, { branchField: 'branch', assignedField: 'assignedCounselorId' }),
 *     ...otherFilters,
 *   };
 *
 * Returns an object that can be spread into a Prisma where clause.
 * For NONE scope, returns a clause that matches nothing.
 */
export function buildScopeFilter(
  scope: DataScope,
  auth: { userId: string; roles: string[]; branch?: string },
  options: {
    branchField?: string;
    assignedField?: string;
    ownerIdField?: string;
  } = {}
): Record<string, unknown> {
  const { branchField = 'branch', assignedField = 'assignedToId', ownerIdField } = options;

  switch (scope) {
    case 'ALL':
      return {};
    case 'BRANCH':
      if (!auth.branch) {
        // No branch specified — fall back to assigned
        return assignedField ? { [assignedField]: auth.userId } : {};
      }
      return { [branchField]: auth.branch };
    case 'ASSIGNED':
      // Assigned to this user OR owned by this user
      const clauses: unknown[] = [];
      if (assignedField) clauses.push({ [assignedField]: auth.userId });
      if (ownerIdField) clauses.push({ [ownerIdField]: auth.userId });
      if (clauses.length === 0) return { id: '__NONE__' }; // matches nothing
      return clauses.length === 1 ? clauses[0] as Record<string, unknown> : { OR: clauses };
    case 'NONE':
    default:
      return { id: '__NONE__' }; // matches nothing
  }
}

/**
 * Check if a user can access a specific record.
 * Use this for ownership checks on individual records.
 */
export function canAccessRecord(
  auth: { userId: string; roles: string[]; branch?: string },
  record: { branch?: string; assignedToId?: string; assignedCounselorId?: string; userId?: string; ownerId?: string },
  options: { branchField?: string; assignedField?: string; ownerIdField?: string } = {}
): boolean {
  const scope = getScopeForAuth(auth);
  if (scope === 'ALL') return true;
  if (scope === 'NONE') return false;
  if (scope === 'BRANCH') {
    return !auth.branch || !record.branch || record.branch === auth.branch;
  }
  // ASSIGNED
  const assignedTo = (record.assignedToId || record.assignedCounselorId || record.userId || record.ownerId) as string | undefined;
  return assignedTo === auth.userId;
}
