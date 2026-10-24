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
    if (tx) throw error;
    console.error('Failed to write security audit log:', error);
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
  targetObject?: { ownerId?: string; departmentId?: string; branchId?: string; assigneeId?: string }
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
  const employee = await db.employee.findFirst({ where: { userId: account.id } });
  if (employee && employee.status.toLowerCase() !== 'active') {
    return { allowed: false, reason: 'Employee account is not active.' };
  }
  const roles = user ? [user.role] : [portal!.userType, ...portal!.roles.map(r => r.role.name)];
  if (roles.some(role => role.toUpperCase() === 'SUPER_ADMIN')) {
    return { allowed: true, scope: 'GLOBAL' };
  }
  // This engine serves employee operations, never student/partner accounts.
  if (roles.some(role => ['STUDENT', 'PARTNER'].includes(role.toUpperCase()))) {
    return { allowed: false, reason: 'Employee permission required.' };
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
  const now = new Date();
  if (employee) {
    const grants = await db.employeeTemporaryPermission.findMany({ where: {
      employeeId: employee.id,
      OR: [{ featureKey }, { permissionKey: featureKey }],
      action: action.toLowerCase(), isActive: true, active: true,
      startDate: { lte: now }, endDate: { gt: now }, expiresAt: { gt: now },
    } });
    for (const grant of grants) {
      const scope = grant.scopeType.toUpperCase();
      if (scope === 'GLOBAL') return { allowed: true, scope: 'GLOBAL' };
      if (['OWN', 'ASSIGNED'].includes(scope) && own) return { allowed: true, scope: scope as AccessScope };
      if (scope === 'BRANCH' && targetObject?.branchId && employee.branch === targetObject.branchId && grant.scopeId === targetObject.branchId) {
        return { allowed: true, scope: 'BRANCH' };
      }
      if (scope === 'DEPARTMENT' && targetObject?.departmentId && employee.department === targetObject.departmentId && grant.scopeId === targetObject.departmentId) {
        return { allowed: true, scope: 'DEPARTMENT' };
      }
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
        const scope = String(permission.scopeType || 'OWN').toUpperCase();
        if (scope === 'GLOBAL') return { allowed: true, scope: 'GLOBAL' };
        if (['OWN', 'ASSIGNED'].includes(scope) && own) return { allowed: true, scope: scope as AccessScope };
        if (scope === 'BRANCH' && targetObject?.branchId && employee.branch === targetObject.branchId && permission.scopeId === targetObject.branchId) return { allowed: true, scope: 'BRANCH' };
        if (scope === 'DEPARTMENT' && targetObject?.departmentId && employee.department === targetObject.departmentId && permission.scopeId === targetObject.departmentId) return { allowed: true, scope: 'DEPARTMENT' };
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
    { userId: viewerId }, `employee.fields.${fieldName}`, 'view', { ownerId: target.userId },
  );
  if (!access.allowed) return false;
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
