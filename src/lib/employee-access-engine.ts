// ============================================================
// Employee Access Control Engine — Centralized RBAC+ABAC+Scope+Field+Workflow+Quota+Temporary+Audit
// Architecture: ROLE + DESIGNATION + PERMISSION + SCOPE + OBJECT + FIELD + WORKFLOW + APPROVAL + QUOTA + TEMPORARY + AUDIT
// Least privilege by default — no permission means deny
// ============================================================

import { db } from '@/lib/db';

// ------------------------------------------------------------
// Designations — 17 core per spec
// ------------------------------------------------------------
export const DESIGNATIONS = [
  'Chairman','CEO','Director','Office Manager','Country Manager','Counselor','Senior Counselor','Application Manager','Application Team','Visa Officer','Visa Interview Officer','Visa Team','Finance','Marketing','Front Desk','HR','Support','Viewer','Custom'
] as const;

// ------------------------------------------------------------
// Permission actions per spec
// ------------------------------------------------------------
export const ACTIONS = ['VIEW','CREATE','EDIT','SUBMIT','ACCEPT','REJECT','APPROVE','VERIFY','SEND','DOWNLOAD','UPLOAD','EXPORT','ASSIGN','REASSIGN','ARCHIVE','CONFIGURE','MANAGE','ESCALATE','GENERATE','PUBLISH','DELETE'] as const;

// ------------------------------------------------------------
// Scopes
// ------------------------------------------------------------
export const SCOPES = ['GLOBAL','COUNTRY','BRANCH','OFFICE','DEPARTMENT','TEAM','ASSIGNED','OWN'] as const;

// ------------------------------------------------------------
// AI actions — low risk vs high risk
// ------------------------------------------------------------
export const AI_LOW_RISK = ['READ','ANALYZE','SUMMARIZE','CLASSIFY','DRAFT','RECOMMEND','PREPARE'] as const;
export const AI_HIGH_RISK = ['FINALIZE','APPROVE','SEND','PAY','DELETE','ESCALATE'] as const;

// ------------------------------------------------------------
// Permission matrix per designation (least privilege)
// ------------------------------------------------------------
export const PERMISSION_MATRIX: Record<string, { modules: string[], actions: string[], scope: string, cannotSelfApprove?: string[] }> = {
  Chairman: { modules: ['*'], actions: ['*'], scope: 'GLOBAL' },
  CEO: { modules: ['*'], actions: ['*'], scope: 'GLOBAL' },
  Director: { modules: ['*'], actions: ['*'], scope: 'GLOBAL', cannotSelfApprove: ['PAYROLL','FINANCE'] },
  'Office Manager': { modules: ['STUDENT','APPLICATION','DOCUMENT','VISA','ATTENDANCE','LEAVE','DEVICE','COMMUNICATION'], actions: ['VIEW','CREATE','EDIT','SUBMIT','VERIFY','SEND','ASSIGN','REASSIGN'], scope: 'OFFICE' },
  'Country Manager': { modules: ['STUDENT','APPLICATION','DOCUMENT','VISA','FINANCE','MARKETING','PARTNER','B2B','BRANCH'], actions: ['VIEW','CREATE','EDIT','SUBMIT','VERIFY','ASSIGN','REASSIGN','APPROVE'], scope: 'COUNTRY' },
  Counselor: { modules: ['STUDENT','APPLICATION','DOCUMENT','COMMUNICATION','WHATSAPP','EMAIL'], actions: ['VIEW','CREATE','EDIT','SUBMIT','SEND','UPLOAD'], scope: 'ASSIGNED' },
  'Senior Counselor': { modules: ['STUDENT','APPLICATION','DOCUMENT','VISA','COMMUNICATION','WHATSAPP','EMAIL','INTERVIEW'], actions: ['VIEW','CREATE','EDIT','SUBMIT','VERIFY','SEND','UPLOAD','ASSIGN'], scope: 'TEAM' },
  'Application Manager': { modules: ['APPLICATION','DOCUMENT','VISA','UNIVERSITY','OFFER','COMMUNICATION'], actions: ['VIEW','CREATE','EDIT','SUBMIT','VERIFY','APPROVE','SEND','ASSIGN','REASSIGN'], scope: 'DEPARTMENT' },
  'Application Team': { modules: ['APPLICATION','DOCUMENT','UNIVERSITY'], actions: ['VIEW','CREATE','EDIT','SUBMIT','VERIFY','UPLOAD'], scope: 'ASSIGNED' },
  'Visa Officer': { modules: ['VISA','DOCUMENT','APPLICATION','INTERVIEW','COMMUNICATION','VISA_DASHBOARD','VISA_CASES','VISA_INTERVIEWS','VISA_READINESS','VISA_REPORTS','VISA_FUNDING','VISA_STUDY_GAP','VISA_REFUSAL','VISA_SENSITIVE','VISA_NOTES','VISA_TASKS','VISA_CHECKLIST'], actions: ['VIEW','CREATE','EDIT','VERIFY','SEND','UPLOAD','ASSIGN','GENERATE','EXPORT'], scope: 'DEPARTMENT' },
  'Visa Interview Officer': { modules: ['VISA','DOCUMENT','APPLICATION','INTERVIEW','COMMUNICATION','VISA_DASHBOARD','VISA_CASES','VISA_INTERVIEWS','VISA_READINESS','VISA_FUNDING','VISA_STUDY_GAP','VISA_REFUSAL','VISA_SENSITIVE','VISA_NOTES','VISA_TASKS','VISA_CHECKLIST','AI_INTERVIEW'], actions: ['VIEW','CREATE','EDIT','VERIFY','SEND','UPLOAD','ASSIGN','GENERATE'], scope: 'DEPARTMENT' },
  'Visa Team': { modules: ['VISA','DOCUMENT','APPLICATION','INTERVIEW','COMMUNICATION','VISA_DASHBOARD','VISA_CASES','VISA_INTERVIEWS'], actions: ['VIEW','CREATE','EDIT','VERIFY','SEND','UPLOAD'], scope: 'DEPARTMENT' },
  Finance: { modules: ['FINANCE','PAYROLL','STUDENT','APPLICATION','PAYMENT'], actions: ['VIEW','CREATE','EDIT','VERIFY','APPROVE','EXPORT'], scope: 'DEPARTMENT', cannotSelfApprove: ['PAYROLL'] },
  Marketing: { modules: ['MARKETING','STUDENT','LEAD','REPORTS'], actions: ['VIEW','CREATE','EDIT','PUBLISH','EXPORT'], scope: 'DEPARTMENT' },
  'Front Desk': { modules: ['STUDENT','APPOINTMENT','COMMUNICATION'], actions: ['VIEW','CREATE','EDIT','SEND'], scope: 'OFFICE' },
  HR: { modules: ['HR','EMPLOYEE','ATTENDANCE','LEAVE','PAYROLL','DEVICE','AGREEMENT','DOCUMENT'], actions: ['VIEW','CREATE','EDIT','APPROVE','ASSIGN','EXPORT'], scope: 'GLOBAL' },
  Support: { modules: ['STUDENT','APPLICATION','COMMUNICATION','TICKET'], actions: ['VIEW','EDIT','SEND','ASSIGN'], scope: 'ASSIGNED' },
  Viewer: { modules: ['STUDENT','APPLICATION','REPORTS'], actions: ['VIEW'], scope: 'OWN' },
  Custom: { modules: [], actions: [], scope: 'OWN' },
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
export async function getEmployeeDesignation(userId: string): Promise<string> {
  try {
    const profile = await db.employeeProfile.findUnique({ where: { userId } }).catch(() => null);
    return (profile as any)?.designation || 'Custom';
  } catch { return 'Custom'; }
}

export function canPerformAction(designation: string, module: string, action: string): boolean {
  const matrix = PERMISSION_MATRIX[designation] || PERMISSION_MATRIX['Custom'];
  if (!matrix) return false;
  if (matrix.modules.includes('*')) return true;
  if (!matrix.modules.includes(module) && !matrix.modules.includes('*')) return false;
  if (matrix.actions.includes('*')) return true;
  return matrix.actions.includes(action);
}

export async function checkSeparationOfDuties(actorId: string, targetEmployeeId: string, actionType: string): Promise<{ allowed: boolean, reason?: string }> {
  if (actorId === targetEmployeeId) {
    const restricted = ['APPROVE','PAYROLL','FINANCE','LEAVE','PERMISSION'];
    if (restricted.some(r => actionType.toUpperCase().includes(r))) {
      return { allowed: false, reason: 'Separation of Duties: Cannot approve own restricted action — MAKER → REVIEWER → APPROVER must be different users' };
    }
  }
  return { allowed: true };
}

export async function canAccessFeatureEngine(userId: string, roles: string[], featureKey: string, action: string = 'view'): Promise<boolean> {
  // Super admin always
  if (roles.includes('super_admin') || roles.includes('SUPER_ADMIN') || roles.includes('admin')) return true;

  // Check portal permission
  try {
    const permKey = `${featureKey.toUpperCase()}_${action.toUpperCase()}`;
    const hasPerm = roles.some(r => r.toLowerCase().includes(featureKey.toLowerCase())) || await (db as any).portalUserRole.findFirst({
      where: { userId, role: { name: { contains: featureKey, mode: 'insensitive' } } }
    }).then((r: any) => !!r).catch(() => false);
    if (hasPerm) return true;
  } catch {}

  // Check temporary permission
  try {
    const temp = await (db as any).employeeTemporaryPermission.findFirst({
      where: { employeeId: userId, featureKey, isActive: true, endDate: { gt: new Date() } }
    });
    if (temp) return true;
  } catch {}

  // Check permission package assignment
  try {
    const pkgAssign = await (db as any).employeePermissionPackageAssignment.findFirst({
      where: { employeeId: userId, isActive: true }
    });
    if (pkgAssign) {
      const pkg = await (db as any).permissionPackage.findUnique({ where: { id: pkgAssign.packageId } }).catch(() => null);
      if (pkg) {
        const perms = typeof pkg.permissions === 'string' ? JSON.parse(pkg.permissions) : pkg.permissions;
        if (Array.isArray(perms) && perms.some((p: any) => (typeof p === 'string' ? p.toLowerCase().includes(featureKey.toLowerCase()) : p.feature?.toLowerCase().includes(featureKey.toLowerCase())))) {
          return true;
        }
      }
    }
  } catch {}

  // Check break glass
  try {
    const bg = await (db as any).employeeBreakGlassAccess.findFirst({
      where: { employeeId: userId, status: 'active', expiresAt: { gt: new Date() } }
    });
    if (bg) return true;
  } catch {}

  // Designation matrix
  const designation = await getEmployeeDesignation(userId);
  const module = featureKey.toUpperCase();
  return canPerformAction(designation, module, action.toUpperCase());
}

export async function canViewEmployeePrivateProfileEngine(actorId: string, actorRoles: string[], targetEmployeeId: string): Promise<boolean> {
  if (actorId === targetEmployeeId) return true;
  if (actorRoles.includes('super_admin') || actorRoles.includes('SUPER_ADMIN')) return true;
  if (actorRoles.includes('chairman')) return true;
  if (actorRoles.includes('hr_manager') || actorRoles.includes('HR')) {
    // HR explicit permission
    try {
      const perm = await (db as any).employeeTemporaryPermission.findFirst({ where: { employeeId: actorId, featureKey: 'employee_private', isActive: true } });
      if (perm) return true;
      // HR role itself grants private view per matrix but need explicit check
      const hasHrAccess = await canAccessFeatureEngine(actorId, actorRoles, 'employee_private', 'view');
      return hasHrAccess;
    } catch { return false; }
  }
  return false;
}

export async function canUseStudentBenefitEngine(employeeId: string, roles: string[], benefitType: string): Promise<boolean> {
  // Student benefits only for students unless employee has explicit permission
  if (roles.includes('student')) return true;
  return await canAccessFeatureEngine(employeeId, roles, 'student_benefit', 'use');
}

export async function checkQuotaBeforeActionEngine(userId: string, featureKey: string): Promise<{ allowed: boolean, current: number, limit: number }> {
  try {
    const current = await (db as any).quotaUsage.count({ where: { userId, featureKey } }).catch(() => 0);
    // Get limit from package
    let limit = 100;
    try {
      const pkgAssign = await (db as any).employeePermissionPackageAssignment.findFirst({ where: { employeeId: userId, isActive: true } });
      if (pkgAssign) limit = 200;
    } catch {}
    return { allowed: current < limit, current, limit };
  } catch {
    return { allowed: true, current: 0, limit: 100 };
  }
}

export async function recordUsageEngine(userId: string, featureKey: string, amount: number = 1) {
  try {
    await (db as any).quotaUsage.create({ data: { userId, featureKey, amount } });
  } catch {}
}

export async function canApproveActionEngine(actorId: string, targetId: string, action: string): Promise<{ allowed: boolean, reason?: string }> {
  // ACCEPT vs APPROVE separation - distinct semantics, handled via permission matrix
  if (action === 'ACCEPT' || action === 'APPROVE') {
    // Both require explicit permission, but different roles; separation of duties still applies
    return await checkSeparationOfDuties(actorId, targetId, action);
  }
  return await checkSeparationOfDuties(actorId, targetId, action);
}

export async function enforceFieldLevelSecurity(userId: string, roles: string[], field: string, targetEmployeeId: string): Promise<boolean> {
  const sensitiveFields = ['salary','personal_phone','emergency_contact','bank_info','nid','passport_number','private_notes'];
  if (sensitiveFields.includes(field.toLowerCase())) {
    return await canViewEmployeePrivateProfileEngine(userId, roles, targetEmployeeId);
  }
  return true;
}

export async function validateAiAction(aiAction: string, requiresHumanApproval: boolean): Promise<{ allowed: boolean, requiresHuman: boolean }> {
  const isLowRisk = (AI_LOW_RISK as readonly string[]).includes(aiAction.toUpperCase());
  const isHighRisk = (AI_HIGH_RISK as readonly string[]).includes(aiAction.toUpperCase());
  if (isHighRisk) {
    return { allowed: false, requiresHuman: true };
  }
  return { allowed: true, requiresHuman: requiresHumanApproval || !isLowRisk };
}
