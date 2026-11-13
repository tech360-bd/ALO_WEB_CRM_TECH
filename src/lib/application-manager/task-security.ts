import { canViewB2B } from '@/lib/application-manager/service';

export type TaskActor = {
  userId: string;
  userType: string;
  partnerId?: string;
  roles: string[];
  permissions: string[];
};

export function isTaskPartner(actor: TaskActor): boolean {
  return Boolean(actor.partnerId || actor.userType.toLowerCase() === 'partner' || actor.roles.some((role) => role.toLowerCase().startsWith('partner')));
}

export function canReadTasks(actor: TaskActor): boolean {
  if (isTaskPartner(actor) || actor.userType.toLowerCase() === 'student') return false;
  const roles = actor.roles.map((role) => role.toLowerCase());
  return roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team', 'counselor', 'application_officer', 'document_officer', 'visa_officer'].includes(role)) ||
    actor.permissions.includes('application.view_tasks') || actor.permissions.includes('application.view_all');
}

export function canManageTasks(actor: TaskActor): boolean {
  const roles = actor.roles.map((role) => role.toLowerCase());
  return roles.some((role) => ['super_admin', 'application_manager', 'application_team'].includes(role)) ||
    actor.permissions.includes('application.create_task') || actor.permissions.includes('application.manage_tasks');
}

export function applicationTaskScope(actor: TaskActor): Record<string, any> | null {
  const roles = actor.roles.map((role) => role.toLowerCase());
  if (roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || actor.permissions.includes('application.view_all')) return {};
  if (roles.includes('counselor') || actor.userType.toLowerCase() === 'counselor') return { counselorId: actor.userId };
  if (roles.includes('application_officer') || roles.includes('document_officer')) return { OR: [{ applicationOfficer: actor.userId }, { appTeamOfficerId: actor.userId }] };
  if (roles.includes('visa_officer')) return { visaOfficerId: actor.userId };
  if (actor.permissions.includes('application.view_assigned')) return { OR: [
    { counselorId: actor.userId }, { applicationOfficer: actor.userId }, { appTeamOfficerId: actor.userId }, { visaOfficerId: actor.userId },
  ] };
  return null;
}

export function applicationTaskWhere(scope: Record<string, any>, canSeeB2B: boolean): Record<string, any> {
  if (canSeeB2B) return scope;
  const nonB2b = {
    isB2b: false,
    isB2bConfidential: false,
    applicationSource: { notIn: ['B2B_INBOUND_APPLICATION', 'B2B_OUTBOUND_APPLICATION'] },
    b2bApplications: { none: {} },
  };
  return Object.keys(scope).length ? { AND: [scope, nonB2b] } : nonB2b;
}

export function isTaskApplicationB2B(application: any): boolean {
  return application?.isB2b === true || application?.isB2bConfidential === true ||
    String(application?.applicationSource || '').toUpperCase().startsWith('B2B_') ||
    String(application?.stage || '').toUpperCase().includes('B2B');
}

export function actorCanViewB2B(actor: TaskActor): boolean {
  return canViewB2B(actor.roles, actor.permissions);
}
