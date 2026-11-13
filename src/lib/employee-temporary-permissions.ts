export const TEMPORARY_EMPLOYEE_VIEW_FEATURES = new Set([
  'employee.documents',
  'employee.profile.private',
  'employee.fields.salary',
  'employee.fields.bankAccount',
  'employee.fields.nid',
  'employee.fields.passport',
  'employee.attendance',
  'employee.leave',
  'employee.payroll',
  'employee.devices',
  'employee.permissions',
  'employee.audit',
]);

export const MAX_TEMPORARY_PERMISSION_DAYS = 30;

export function temporaryPermissionIsEffective(
  grant: { active: boolean; isActive: boolean; startDate: Date; endDate: Date; expiresAt: Date },
  now = new Date(),
): boolean {
  const time = now.getTime();
  return grant.active && grant.isActive
    && grant.startDate.getTime() <= time
    && grant.endDate.getTime() > time
    && grant.expiresAt.getTime() > time;
}
