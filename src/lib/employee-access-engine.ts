// ============================================================
// Employee Access Control Engine — Centralized RBAC+ABAC+Scope+Field+Workflow+Quota+Temporary+Audit
// Architecture: ROLE + DESIGNATION + PERMISSION + SCOPE + OBJECT + FIELD + WORKFLOW + APPROVAL + QUOTA + TEMPORARY + AUDIT
// Least privilege by default — no permission means deny
// ============================================================

import { db } from '@/lib/db';
import { validateRequestAccess, canViewField } from '@/lib/access-control/central-security-engine';

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
  // Executive titles are not access grants. Administrative, financial, HR,
  // publishing and approval rights must come from explicit backend permissions.
  Chairman: { modules: [], actions: [], scope: 'OWN' },
  CEO: { modules: [], actions: [], scope: 'OWN' },
  Director: { modules: [], actions: [], scope: 'OWN' },
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
  return (await validateRequestAccess({ userId }, featureKey, action)).allowed;
}

export async function canViewEmployeePrivateProfileEngine(actorId: string, actorRoles: string[], targetEmployeeId: string): Promise<boolean> {
  const employee = await db.employee.findFirst({ where: { OR: [{ id: targetEmployeeId }, { userId: targetEmployeeId }] } });
  if (!employee) return false;
  return (await validateRequestAccess({ userId: actorId }, 'employee.profile.private', 'view', { ownerId: employee.userId })).allowed;
}

export async function canUseStudentBenefitEngine(employeeId: string, roles: string[], benefitType: string): Promise<boolean> {
  return (await validateRequestAccess({ userId: employeeId }, `student.benefits.${benefitType}`, 'use')).allowed;
}

export async function checkQuotaBeforeActionEngine(userId: string, featureKey: string): Promise<{ allowed: boolean, current: number, limit: number }> {
  if (!(await canAccessFeatureEngine(userId, [], featureKey, 'use'))) return { allowed: false, current: 0, limit: 0 };
  const employee = await db.employee.findFirst({ where: { userId } });
  if (!employee) return { allowed: false, current: 0, limit: 0 };
  const rule = await db.featureAccessRule.findFirst({ where: { ownerType: 'EMPLOYEE', ownerId: employee.id, featureKey, isEnabled: true } });
  const limit = rule?.limitValue || 0;
  const month = new Date(); month.setUTCDate(1); month.setUTCHours(0, 0, 0, 0);
  const usages = await db.featureUsageLog.findMany({ where: { ownerType: 'EMPLOYEE', ownerId: employee.id, featureKey, createdAt: { gte: month } } });
  let current = 0;
  for (const usage of usages) {
    try { const amount = JSON.parse(usage.metadata || '{}').amount; current += Number.isSafeInteger(amount) && amount > 0 ? amount : 1; }
    catch { current += 1; }
  }
  return { allowed: limit > 0 && current < limit, current, limit };
}

export async function recordUsageEngine(userId: string, featureKey: string, amount: number = 1) {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Usage amount must be a positive integer');
  const employee = await db.employee.findFirst({ where: { userId } });
  if (!employee) throw new Error('Employee not found');
  await db.featureUsageLog.create({ data: { ownerType: 'EMPLOYEE', ownerId: employee.id, featureKey, action: 'use', metadata: JSON.stringify({ amount }) } });
}

export async function canApproveActionEngine(actorId: string, targetId: string, action: string): Promise<{ allowed: boolean, reason?: string }> {
  // ACCEPT vs APPROVE require distinct exact permissions, both subject to separation.
  const separation = await checkSeparationOfDuties(actorId, targetId, action);
  if (!separation.allowed) return separation;
  return validateRequestAccess({ userId: actorId }, 'employee.workflow', action.toLowerCase(), { ownerId: targetId });
}

export async function enforceFieldLevelSecurity(userId: string, roles: string[], field: string, targetEmployeeId: string): Promise<boolean> {
  const sensitiveFields = ['salary','personal_phone','emergency_contact','bank_info','nid','passport_number','private_notes'];
  if (sensitiveFields.includes(field.toLowerCase())) {
    if (field.toLowerCase() === 'salary') {
      const employee = await db.employee.findFirst({ where: { OR: [{ id: targetEmployeeId }, { userId: targetEmployeeId }] } });
      return employee ? canViewField(userId, [], 'salary', employee.id) : false;
    }
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
  return { allowed: isLowRisk && !requiresHumanApproval, requiresHuman: requiresHumanApproval || !isLowRisk };
}
