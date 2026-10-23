import { db } from '@/lib/db';
import { calculateKPIs } from '@/lib/application-manager/service';
import { canViewB2B } from '@/lib/application-manager/service';

export type ApplicationDashboardActor = {
  userId: string;
  userType: string;
  partnerId?: string;
  roles: string[];
  permissions: string[];
};

export function canReadApplicationDashboard(actor: ApplicationDashboardActor): boolean {
  const roles = actor.roles.map((role) => role.toLowerCase());
  if (actor.partnerId || actor.userType.toLowerCase() === 'partner' || roles.some((role) => role.startsWith('partner'))) return false;
  return roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) ||
    actor.permissions.includes('application.view_all') || actor.permissions.includes('application.view_reports') ||
    actor.permissions.includes('application.view_dashboard');
}

export async function getApplicationDashboardMetrics(actor: ApplicationDashboardActor) {
  const roles = actor.roles.map((role) => role.toLowerCase());
  const canViewB2BFlag = canViewB2B(actor.roles, actor.permissions);
  const where: Record<string, any> = {};
  const globalScope = roles.some((role) => ['super_admin', 'admin', 'application_manager', 'application_team'].includes(role)) || actor.permissions.includes('application.view_all');
  if (!globalScope) {
    if (roles.includes('counselor') || actor.userType.toLowerCase() === 'counselor') where.counselorId = actor.userId;
    else if (roles.includes('visa_officer')) where.visaOfficerId = actor.userId;
    else if (actor.permissions.includes('application.view_assigned')) {
      where.OR = [
        { counselorId: actor.userId }, { applicationOfficer: actor.userId },
        { appTeamOfficerId: actor.userId }, { visaOfficerId: actor.userId },
      ];
    }
  }
  if (!canViewB2BFlag) {
    Object.assign(where, {
      isB2b: false,
      isB2bConfidential: false,
      applicationSource: { notIn: ['B2B_INBOUND_APPLICATION', 'B2B_OUTBOUND_APPLICATION'] },
      b2bApplications: { none: {} },
    });
  }

  const applicationRelation = { is: where };
  const [applications, total, active, b2bApplications, documents, deadlines, tasks] = await Promise.all([
    db.application.findMany({ where, take: 1000, orderBy: { updatedAt: 'desc' } }),
    db.application.count({ where }),
    db.application.count({ where: { AND: [where, { status: 'active' }] } }),
    canViewB2BFlag ? db.b2bApplication.findMany({ where: { application: applicationRelation }, take: 1000 }) : Promise.resolve([]),
    db.applicationDocument.findMany({ where: { application: applicationRelation }, take: 2000 }),
    db.applicationDeadline.findMany({ where: { application: applicationRelation, status: { not: 'COMPLETED' } }, take: 2000 }),
    db.applicationTask.findMany({ where: { application: applicationRelation, status: 'PENDING' }, take: 2000 }),
  ]);

  const metrics: Record<string, any> = calculateKPIs(applications, b2bApplications, documents, deadlines, tasks);
  metrics.totalApplications = total;
  if (!canViewB2BFlag) {
    delete metrics.b2b;
    delete metrics.b2bInbound;
    delete metrics.b2bOutbound;
  }
  return { metrics, total, active, canViewB2B: canViewB2BFlag };
}
