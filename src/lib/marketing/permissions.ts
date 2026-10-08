import type { UserRole } from './types';

export const MARKETING_PERMISSIONS = [
  'marketing.dashboard.view',
  'marketing.campaign.create',
  'marketing.campaign.update',
  'marketing.campaign.approve',
  'marketing.content.generate',
  'marketing.content.edit',
  'marketing.content.approve',
  'marketing.asset.upload',
  'marketing.video.generate',
  'marketing.calendar.schedule',
  'marketing.social.inbox.view',
  'marketing.social.reply.suggest',
  'marketing.social.reply.send',
  'marketing.comment.convert_lead',
  'marketing.dm.convert_lead',
  'marketing.whatsapp.capture_lead',
  'marketing.lead.assign',
  'marketing.report.view',
  'marketing.report.export',
  'marketing.agentos.view',
  'marketing.agentos.pause',
  'marketing.agentos.approve',
  'marketing.seo.generate',
  'marketing.seo.publish_approve',
  'marketing.email.view',
  'marketing.email.manage',
] as const;

export type MarketingPermission = (typeof MARKETING_PERMISSIONS)[number];

const ROLE_PERMISSIONS: Record<UserRole, MarketingPermission[]> = {
  super_admin: [...MARKETING_PERMISSIONS],
  marketing_manager: MARKETING_PERMISSIONS.filter(
    (p) => !p.includes('system') && !p.includes('secrets')
  ),
  marketing_staff: [
    'marketing.dashboard.view',
    'marketing.email.view',
    'marketing.content.generate',
    'marketing.content.edit',
    'marketing.asset.upload',
    'marketing.calendar.schedule',
    'marketing.social.inbox.view',
    'marketing.social.reply.suggest',
    'marketing.report.view',
    'marketing.agentos.view',
  ],
  counselor: [
    'marketing.social.inbox.view',
    'marketing.social.reply.suggest',
    'marketing.social.reply.send',
    'marketing.report.view',
  ],
  partner: [],
  student: [],
};

export function getUserPermissions(role: UserRole): MarketingPermission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(
  userPermissions: MarketingPermission[],
  required: MarketingPermission
): boolean {
  return userPermissions.includes(required);
}

export function requirePermission(
  userPermissions: MarketingPermission[],
  required: MarketingPermission
): void {
  if (!hasPermission(userPermissions, required)) {
    throw new Error(`Permission denied: ${required}`);
  }
}

// Mock user for demo (replace with real auth)
export function getMockUser() {
  return {
    id: 'demo-marketing-manager-1',
    email: 'marketing@aloeducation.com',
    name: 'Marketing Manager',
    role: 'marketing_manager' as UserRole,
    permissions: getUserPermissions('marketing_manager'),
    isActingAs: false,
    actingAsRole: null as UserRole | null,
    actingAsUserId: null as string | null,
  };
}

export function getMockSuperAdmin() {
  return {
    id: 'demo-super-admin-1',
    email: 'admin@aloeducation.com',
    name: 'Super Admin',
    role: 'super_admin' as UserRole,
    permissions: getUserPermissions('super_admin'),
    isActingAs: true,
    actingAsRole: 'marketing_manager' as UserRole,
    actingAsUserId: 'demo-marketing-manager-1',
  };
}