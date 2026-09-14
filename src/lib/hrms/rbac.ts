// ALO HRMS — RBAC: Private Employee Profile visible only to Employee (own), HR, Super Admin
// Also role-based widgets, payroll visibility, document access

import type { AuthContext } from '@/lib/auth-middleware';

export type HrmRole = 'super_admin'|'admin'|'hr_manager'|'hr'|'finance'|'accounts'|'manager'|'team_leader'|'branch_manager'|'employee'|'counselor';

const HR_ROLES = ['super_admin','admin','hr_manager','hr'];
const FINANCE_ROLES = ['super_admin','admin','finance','accounts','finance_manager'];
const MANAGER_ROLES = ['super_admin','admin','hr_manager','branch_manager','manager','team_leader'];

export function isSuperAdmin(auth: AuthContext): boolean {
  return auth.roles.some(r=> ['super_admin','admin','SUPER_ADMIN','ADMIN'].includes(r)) || ['SUPER_ADMIN','ADMIN'].includes(auth.userType);
}
export function isHR(auth: AuthContext): boolean {
  if (isSuperAdmin(auth)) return true;
  return auth.roles.some(r=> ['hr_manager','hr','HR_MANAGER','HR'].includes(r.toLowerCase()));
}
export function isFinance(auth: AuthContext): boolean {
  if (isSuperAdmin(auth)) return true;
  return auth.roles.some(r=> ['finance','accounts','finance_manager'].includes(r.toLowerCase()));
}

export function canViewEmployeeProfile(auth: AuthContext, targetEmployeeUserId: string, targetEmployeeId?: string): boolean {
  // Employee can view own profile only
  if (auth.userId === targetEmployeeUserId) return true;
  // HR and Super Admin can view any
  if (isHR(auth) || isSuperAdmin(auth)) return true;
  return false;
}

export function canEditEmployeeProfile(auth: AuthContext, targetUserId: string): boolean {
  if (auth.userId === targetUserId) return false; // employee cannot edit sensitive fields — only view own
  // Only HR and Super Admin can edit private profile
  return isHR(auth) || isSuperAdmin(auth);
}

export function canViewSalaryDetails(auth: AuthContext): boolean {
  // Only HR and Finance can see calculation details
  return isHR(auth) || isFinance(auth) || isSuperAdmin(auth);
}

export function canManagePayroll(auth: AuthContext): boolean {
  return isHR(auth) || isFinance(auth) || isSuperAdmin(auth);
}

export function canManageLeave(auth: AuthContext): boolean {
  return isHR(auth) || isSuperAdmin(auth) || auth.roles.some(r=> MANAGER_ROLES.includes(r.toLowerCase()));
}

export function canViewTeam(auth: AuthContext): boolean {
  return auth.roles.some(r=> MANAGER_ROLES.includes(r.toLowerCase())) || isHR(auth) || isSuperAdmin(auth);
}

export function canViewBranch(auth: AuthContext): boolean {
  return isHR(auth) || isSuperAdmin(auth) || auth.roles.includes('branch_manager') || auth.roles.includes('operations');
}

export function canManageDevices(auth: AuthContext): boolean {
  return isHR(auth) || isSuperAdmin(auth) || auth.roles.includes('it') || auth.roles.includes('operations');
}

export function canViewAllHRAnalytics(auth: AuthContext): boolean {
  return isHR(auth) || isSuperAdmin(auth);
}

// Dashboard widget visibility per role
export function widgetsForRole(role: string): string[] {
  const r = role.toLowerCase();
  if (r.includes('super_admin') || r==='super_admin') return ['headcount','attendance_rate','payroll_cost','documents_missing','birthdays','expiring_contracts','pending_leave','payroll_pending','joining_today','system_health'];
  if (r.includes('hr')) return ['pending_leave','payroll_pending','joining_today','documents_missing','birthdays','expiring_contracts','probation','upcoming_confirmation'];
  if (r.includes('finance')) return ['payroll_pending','salary_cost','loan','pf','voucher'];
  if (r.includes('accounts')) return ['payroll_voucher','salary_payment','reconciliation'];
  if (r.includes('marketing')) return ['own_attendance','own_leave','own_salary_slip','own_documents'];
  if (r.includes('manager') || r.includes('team_leader') || r.includes('branch')) return ['team_attendance','team_leave','team_performance','branch_attendance','branch_staff'];
  if (r.includes('it')) return ['assigned_devices','device_returns','security_alerts'];
  if (r.includes('reception') || r.includes('front_desk')) return ['attendance_summary','visitor'];
  if (r.includes('operations')) return ['branch_attendance','branch_leave','branch_staff'];
  // default employee
  return ['own_attendance','own_leave','own_salary_slip','own_documents','own_tasks'];
}

export function assertNotStudentDashboard(role: string): void {
  if (role.toLowerCase() === 'student') throw new Error('HR module not available on Student Dashboard');
}
