import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export type AccessScope =
  | 'GLOBAL'
  | 'COUNTRY'
  | 'BRANCH'
  | 'OFFICE'
  | 'DEPARTMENT'
  | 'TEAM'
  | 'ASSIGNED'
  | 'OWN'
  | 'RECORD';

export interface AccessCheckContext {
  userId: string;
  userRole?: string;
  designation?: string;
  departmentId?: string;
  branchId?: string;
  officeId?: string;
}

export interface SecurityAuditParams {
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  approvalId?: string;
  ipAddress?: string;
  sessionIdentifier?: string;
}

/**
 * Log sensitive security & operational events into the immutable IntegrationAuditLog.
 */
export async function logSecurityAudit(params: SecurityAuditParams, tx?: Prisma.TransactionClient): Promise<void> {
  try {
    if (tx && '$transaction' in tx) throw new Error('Expected interactive transaction client');
    await (tx || db).integrationAuditLog.create({
      data: {
        actorId: params.actorId,
        actorName: params.actorRole || 'System Actor',
        actorRole: params.actorRole,
        action: params.action,
        resourceType: params.targetType,
        resourceId: params.targetId,
        previousState: params.oldValue || '{}',
        newState: params.newValue || '{}',
        metadata: JSON.stringify({
          reason: params.reason,
          approvalId: params.approvalId,
          ipAddress: params.ipAddress,
          sessionIdentifier: params.sessionIdentifier,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (error) {
    // Access to sensitive fields must fail when its required audit cannot persist.
    throw error;
  }
}

/**
 * Server-Side Backend Access Check Engine
 * Evaluates: Authenticated User, Active Status, Role, Designation, Permission, Scope, Object Ownership & Expiries.
 */
export async function validateRequestAccess(
  context: AccessCheckContext,
  featureKey: string,
  action: string,
  targetObject?: { ownerId?: string; departmentId?: string; branchId?: string; assigneeId?: string; officeId?: string; country?: string; recordType?: string; recordId?: string }
): Promise<{ allowed: boolean; reason?: string; scope?: AccessScope }> {
  // Resolve authority from current database state, never caller-supplied roles,
  // email patterns, or synthetic identities.
  const user = await db.user.findUnique({ where: { id: context.userId } });
  const portal = user ? null : await db.portalUser.findUnique({
    where: { id: context.userId },
    include: { roles: { include: { role: true } } },
  });
  const account = user || portal;
  if (!account) return { allowed: false, reason: 'User account not found.' };
  if (account.status.toLowerCase() !== 'active' || !account.emailVerified) {
    return { allowed: false, reason: 'Account must be active and email verified.' };
  }
  const employee = await db.employee.findFirst({ where: { userId: account.id }, include: { offices: { select: { id: true, status: true } } } });
  if (employee && employee.status.toLowerCase() !== 'active') {
    return { allowed: false, reason: 'Employee account is not active.' };
  }
  const roles = user ? [user.role] : [portal!.userType, ...portal!.roles.map(r => r.role.name)];
  // An external account type never becomes an employee through an attached role.
  if (roles.some(role => ['STUDENT', 'PARTNER'].includes(role.toUpperCase()))) {
    return { allowed: false, reason: 'Employee permission required.' };
  }
  if (roles.some(role => role.toUpperCase() === 'SUPER_ADMIN')) {
    return { allowed: true, scope: 'GLOBAL' };
  }
  // Legacy feature rules have no scope/action columns. A bare feature permits
  // viewing owned records only; other actions require their exact permission key.
  const keys = [`${featureKey}.${action.toLowerCase()}`];
  if (action.toLowerCase() === 'view') keys.push(featureKey);
  const rules = await db.featureAccessRule.findMany({ where: {
    ownerType: { in: ['employee', 'EMPLOYEE', 'user', 'USER'] },
    ownerId: { in: [account.id, ...(employee ? [employee.id] : [])] },
    featureKey: { in: keys },
  } });
  if (rules.some(rule => !rule.isEnabled || rule.requiresApproval)) {
    return { allowed: false, reason: 'Permission disabled or approval required.' };
  }
  const own = !!targetObject && [targetObject.ownerId, targetObject.assigneeId]
    .some(id => !!id && (id === account.id || id === employee?.id));
  if (own && action.toLowerCase() === 'view' && ['employee.profile.private', 'employee.fields.salary', 'employee.fields.bankAccount', 'employee.fields.nid', 'employee.fields.passport'].includes(featureKey)) {
    return { allowed: true, scope: 'OWN' };
  }
  // Resource facts are supplied by server-side record loaders, never request bodies.
  // Every scoped grant must also match the current persisted employee assignment.
  const identities = [account.id, employee?.id, employee?.employeeId].filter(Boolean);
  const owns = !!targetObject?.ownerId && identities.includes(targetObject.ownerId);
  const assigned = !!targetObject?.assigneeId && identities.includes(targetObject.assigneeId);
  let teamPromise: Promise<string | null> | undefined;
  async function targetTeam(): Promise<string | null> {
    if (!employee) return null;
    const targetId = targetObject?.assigneeId || targetObject?.ownerId;
    if (!targetId) return null;
    const target = await db.employee.findFirst({ where: { OR: [{ id: targetId }, { userId: targetId }, { employeeId: targetId }] }, select: { id: true, userId: true, employeeId: true, status: true } });
    if (!target || target.status.toLowerCase() !== 'active' || ![target.id, target.userId, target.employeeId].includes(targetId)) return null;
    const profile = await db.employeeHR.findUnique({ where: { userId: target.userId }, select: { reportingManagerId: true, managerId: true } });
    return profile?.reportingManagerId || profile?.managerId || null;
  }
  async function grantScope(scopeValue: unknown, scopeIdValue: unknown): Promise<AccessScope | null> {
    const alias: Record<string, AccessScope> = { ALL: 'GLOBAL', OWN_ONLY: 'OWN', ASSIGNED_ONLY: 'ASSIGNED', BRANCH_ONLY: 'BRANCH', COUNTRY_ONLY: 'COUNTRY', DEPARTMENT_ONLY: 'DEPARTMENT' };
    const value = String(scopeValue || 'OWN').toUpperCase();
    const scope = alias[value] || value;
    const scopeId = typeof scopeIdValue === 'string' ? scopeIdValue.trim() : '';
    if (scope === 'GLOBAL') return 'GLOBAL';
    if (scope === 'OWN' && owns) return 'OWN';
    if (scope === 'ASSIGNED' && assigned) return 'ASSIGNED';
    if (!employee || !scopeId) return null;
    if (scope === 'BRANCH' && targetObject?.branchId && employee.branch === targetObject.branchId && scopeId === targetObject.branchId) return 'BRANCH';
    if (scope === 'DEPARTMENT' && targetObject?.departmentId && employee.department === targetObject.departmentId && scopeId === targetObject.departmentId) return 'DEPARTMENT';
    if (scope === 'OFFICE' && targetObject?.officeId === scopeId && employee.offices?.some(office => office.id === scopeId && office.status.toUpperCase() === 'ACTIVE')) return 'OFFICE';
    if (scope === 'COUNTRY' && targetObject?.country) {
      let countries: unknown; try { countries = JSON.parse(employee.destinationFocus); } catch { return null; }
      const normalize = (country: string) => country.trim().toUpperCase();
      if (Array.isArray(countries) && countries.some(country => typeof country === 'string' && normalize(country) === normalize(targetObject.country!)) && normalize(scopeId) === normalize(targetObject.country)) return 'COUNTRY';
    }
    if (scope === 'RECORD' && targetObject?.recordType && targetObject.recordId && scopeId === `${targetObject.recordType}:${targetObject.recordId}`) return 'RECORD';
    if (scope === 'TEAM') {
      teamPromise ||= targetTeam();
      const manager = await teamPromise;
      // Only the assigned manager's explicit team grant is valid. A title or
      // caller-selected team identifier never expands the reporting chain.
      if (manager && identities.includes(manager) && identities.includes(scopeId)) return 'TEAM';
    }
    return null;
  }
  const now = new Date();
  if (employee) {
    const grants = await db.employeeTemporaryPermission.findMany({ where: {
      employeeId: employee.id,
      OR: [{ featureKey }, { permissionKey: featureKey }],
      action: action.toLowerCase(), isActive: true, active: true,
      startDate: { lte: now }, endDate: { gt: now }, expiresAt: { gt: now },
    } });
    for (const grant of grants) {
      const scope = await grantScope(grant.scopeType, grant.scopeId);
      if (scope) return { allowed: true, scope };
    }
  }

  if (employee) {
    const assignments = await db.employeePermissionPackageAssignment.findMany({ where: {
      employeeId: employee.id, status: 'active', isActive: true, startsAt: { lte: now },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    } });
    const packages = assignments.length ? await db.permissionPackage.findMany({ where: { id: { in: assignments.map(a => a.packageId) } } }) : [];
    for (const pkg of packages) {
      let permissions: unknown;
      try { permissions = JSON.parse(pkg.permissions); } catch { continue; }
      if (!Array.isArray(permissions)) continue;
      for (const permission of permissions) {
        // A designation is a display label. Only exact, explicitly configured
        // permission/action/scope entries convey authority.
        if (!permission || typeof permission !== 'object' || permission.featureKey !== featureKey || permission.action?.toLowerCase() !== action.toLowerCase()) continue;
        if (permission.isEnabled === false || permission.requiresApproval === true) continue;
        const scope = await grantScope(permission.scopeType, permission.scopeId);
        if (scope) return { allowed: true, scope };
      }
    }
  }
  if (rules.some(rule => rule.isEnabled) && own) return { allowed: true, scope: 'OWN' };
  return { allowed: false, reason: 'No permission for this action and record scope.' };
}


/**
 * Enforces Field-Level Authorization for sensitive fields (Salary, Bank Account, NID, Passport).
 */
export async function canViewField(
  viewerId: string,
  viewerRoles: string[],
  fieldName: 'salary' | 'bankAccount' | 'nid' | 'passport' | 'warnings',
  targetEmployeeId: string
): Promise<boolean> {
  const target = await db.employee.findUnique({ where: { id: targetEmployeeId } });
  if (!target) return false;
  const access = await validateRequestAccess(
    { userId: viewerId }, `employee.fields.${fieldName}`, 'view', { ownerId: target.userId, branchId: target.branch, departmentId: target.department, recordType: 'Employee', recordId: target.id },
  );
  if (!access.allowed) return false;
  // Own raw compensation is not an approved payslip. Final own payroll is
  // exposed by the approved-payroll endpoint, never this private-field helper.
  if (fieldName === 'salary' && target.userId === viewerId && access.scope !== 'GLOBAL') return false;
  await logSecurityAudit({ actorId: viewerId, actorRole: 'Database-authorized actor',
    action: `FIELD_VIEW_${fieldName.toUpperCase()}`, targetType: 'EmployeeProfileField', targetId: targetEmployeeId });
  return true;
}

/**
 * Enforces Maker-Checker Separation of Duties for Restricted Approvals.
 * User cannot approve their own restricted action.
 */
export function canApproveAction(
  userId: string,
  makerId: string,
  userRoles: string[]
): { allowed: boolean; reason?: string } {
  if (userId === makerId) {
    return {
      allowed: false,
      reason: 'Separation of Duties Enforced: You cannot approve your own request or submission.',
    };
  }

  const uRoles = userRoles.map((r) => r.toUpperCase());
  const isAuthorized =
    uRoles.includes('SUPER_ADMIN') ||
    uRoles.includes('CHAIRMAN') ||
    uRoles.includes('HR_MANAGER') ||
    uRoles.includes('FINANCE_OFFICER') ||
    uRoles.includes('FINANCE') ||
    uRoles.includes('APPLICATION_MANAGER');

  if (!isAuthorized) {
    return { allowed: false, reason: 'Insufficient approval authority for restricted workflow action.' };
  }

  return { allowed: true };
}
