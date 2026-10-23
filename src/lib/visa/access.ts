import type { AuthContext } from '@/lib/auth-middleware';

export type VisaCaseViewScope = 'full' | 'summary' | 'stage';
export type VisaCaseAccessMode = 'view' | 'update' | 'sensitive';

const ROLE = {
  superAdmin: ['super_admin'],
  admin: ['admin'],
  visaStaff: ['visa_officer', 'visa_interview_officer', 'visa_team'],
  counselor: ['counselor', 'senior_counselor'],
  applicationTeam: ['application_team', 'application_manager', 'application_officer'],
  partner: ['partner', 'partner_super_admin', 'partner_manager'],
  student: ['student'],
} as const;

export function normalizedVisaRoles(auth: Pick<AuthContext, 'roles' | 'userType'>): string[] {
  return [...new Set([...(auth.roles || []), auth.userType || ''].map((role) => role.trim().toLowerCase()).filter(Boolean))];
}

export function hasVisaRole(auth: Pick<AuthContext, 'roles' | 'userType'>, roleGroup: keyof typeof ROLE): boolean {
  const roles = normalizedVisaRoles(auth);
  return ROLE[roleGroup].some((role) => roles.includes(role));
}

export function hasVisaPermission(auth: Pick<AuthContext, 'permissions'>, ...permissionIds: string[]): boolean {
  const granted = new Set((auth.permissions || []).map((permission) => permission.trim().toLowerCase()));
  return permissionIds.some((permission) => granted.has(permission.toLowerCase()));
}

export function isVisaSuperAdmin(auth: Pick<AuthContext, 'roles' | 'userType'>): boolean {
  return hasVisaRole(auth, 'superAdmin');
}

export function isVisaPartner(auth: Pick<AuthContext, 'roles' | 'userType' | 'partnerId'>): boolean {
  return Boolean(auth.partnerId) || hasVisaRole(auth, 'partner');
}

export function isVisaStudent(auth: Pick<AuthContext, 'roles' | 'userType'>): boolean {
  return hasVisaRole(auth, 'student');
}

export function visaDashboardWhere(auth: AuthContext): Record<string, unknown> | null {
  if (isVisaSuperAdmin(auth)) return {};
  if (isVisaPartner(auth) || isVisaStudent(auth)) return null;
  if (hasVisaRole(auth, 'visaStaff') && hasVisaPermission(auth, 'visa.dashboard.view', 'visa.cases.assigned.view', 'v1')) {
    if (hasVisaPermission(auth, 'visa.cases.view_all')) return {};
    return { visaOfficerId: auth.userId };
  }
  if (hasVisaRole(auth, 'admin') && hasVisaPermission(auth, 'visa.dashboard.view', 'visa.cases.view_all')) {
    return hasVisaPermission(auth, 'visa.cases.view_all') ? {} : null;
  }
  return null;
}

export function visaCaseListScope(auth: AuthContext): { where: Record<string, unknown>; viewScope: VisaCaseViewScope } | null {
  if (isVisaSuperAdmin(auth)) return { where: {}, viewScope: 'full' };
  if (isVisaPartner(auth) || isVisaStudent(auth)) return null;

  if (hasVisaRole(auth, 'admin')) {
    if (!hasVisaPermission(auth, 'visa.cases.view_all')) return null;
    return { where: {}, viewScope: 'full' };
  }

  if (hasVisaRole(auth, 'visaStaff')) {
    if (hasVisaPermission(auth, 'visa.cases.view_all')) return { where: {}, viewScope: 'full' };
    if (!hasVisaPermission(auth, 'visa.cases.view', 'visa.cases.assigned.view', 'v1')) return null;
    return { where: { visaOfficerId: auth.userId }, viewScope: 'full' };
  }

  if (hasVisaRole(auth, 'counselor') && hasVisaPermission(auth, 'visa.cases.summary.view')) {
    return { where: { counselorId: auth.userId }, viewScope: 'summary' };
  }

  if (hasVisaRole(auth, 'applicationTeam') && hasVisaPermission(auth, 'visa.cases.stage.view')) {
    return { where: { applicationOfficerId: auth.userId }, viewScope: 'stage' };
  }

  return null;
}

export function visaCaseViewScope(auth: AuthContext, visaCase: { visaOfficerId?: string | null; counselorId?: string | null; applicationOfficerId?: string | null }): VisaCaseViewScope | null {
  if (isVisaSuperAdmin(auth)) return 'full';
  if (isVisaPartner(auth) || isVisaStudent(auth)) return null;

  if (hasVisaRole(auth, 'admin')) {
    return hasVisaPermission(auth, 'visa.cases.view_all') ? 'full' : null;
  }

  if (hasVisaRole(auth, 'visaStaff')) {
    if (hasVisaPermission(auth, 'visa.cases.view_all')) return 'full';
    const canViewAssigned = hasVisaPermission(auth, 'visa.cases.view', 'visa.cases.assigned.view', 'v1');
    return canViewAssigned && visaCase.visaOfficerId === auth.userId ? 'full' : null;
  }

  if (hasVisaRole(auth, 'counselor')) {
    return hasVisaPermission(auth, 'visa.cases.summary.view') && visaCase.counselorId === auth.userId ? 'summary' : null;
  }

  if (hasVisaRole(auth, 'applicationTeam')) {
    return hasVisaPermission(auth, 'visa.cases.stage.view') && visaCase.applicationOfficerId === auth.userId ? 'stage' : null;
  }

  return null;
}

export function canViewVisaSensitive(auth: AuthContext, visaCase: { visaOfficerId?: string | null }): boolean {
  if (isVisaSuperAdmin(auth)) return true;
  const scope = visaCaseViewScope(auth, visaCase);
  if (scope !== 'full') return false;
  if (hasVisaRole(auth, 'admin') || hasVisaRole(auth, 'visaStaff')) {
    return hasVisaPermission(auth, 'visa.sensitive.view');
  }
  return hasVisaPermission(auth, 'visa.sensitive.view');
}

export function canUpdateVisaCase(auth: AuthContext, visaCase: { visaOfficerId?: string | null }): boolean {
  if (isVisaSuperAdmin(auth)) return true;
  if (isVisaPartner(auth) || isVisaStudent(auth)) return false;
  if (hasVisaRole(auth, 'admin')) {
    return hasVisaPermission(auth, 'visa.cases.update') && hasVisaPermission(auth, 'visa.cases.view_all');
  }
  if (hasVisaRole(auth, 'visaStaff')) {
    return visaCaseViewScope(auth, visaCase) === 'full' && hasVisaPermission(auth, 'visa.cases.update');
  }
  return false;
}

export function canManageVisaPermission(auth: AuthContext, permission: string, visaCase?: { visaOfficerId?: string | null }): boolean {
  if (isVisaSuperAdmin(auth)) return true;
  if (!hasVisaPermission(auth, permission)) return false;
  if (hasVisaRole(auth, 'admin')) return !visaCase || hasVisaPermission(auth, 'visa.cases.view_all');
  if (visaCase && hasVisaRole(auth, 'visaStaff')) return visaCaseViewScope(auth, visaCase) === 'full';
  return hasVisaRole(auth, 'visaStaff');
}

export function safeVisaCaseSummary(visaCase: any) {
  return {
    id: visaCase.id,
    caseCode: visaCase.caseCode,
    studentId: visaCase.studentId,
    studentName: visaCase.studentName,
    destinationCountry: visaCase.destinationCountry,
    university: visaCase.university,
    course: visaCase.course,
    intake: visaCase.intake,
    currentStage: visaCase.currentStage,
    updatedAt: visaCase.updatedAt,
  };
}

export function safeVisaCaseStage(visaCase: any) {
  return {
    id: visaCase.id,
    caseCode: visaCase.caseCode,
    applicationId: visaCase.applicationId,
    destinationCountry: visaCase.destinationCountry,
    currentStage: visaCase.currentStage,
    updatedAt: visaCase.updatedAt,
  };
}
