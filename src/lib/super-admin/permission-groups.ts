// ============================================================
// ALO EDUCATION — PERMISSION GROUP CATALOGUE (spec §9)
//
// 24 permission groups. Each group is a named bundle of canonical
// permission keys ("module.feature.action"). Assigning a group to a
// role or an individual employee is recorded in
// `permission_group_grants` and audited.
//
// The catalogue is the *definition*; live grants come from the
// database. `riskLevel` drives the extra confirmation step:
//   standard  — no extra confirmation
//   sensitive — confirm + reason required
//   critical  — confirm + reason, and blocked in Acting-As mode
// ============================================================

export type PermissionGroupRisk = 'standard' | 'sensitive' | 'critical';

export interface PermissionGroupDefinition {
  key: string;
  name: string;
  description: string;
  department: string;
  riskLevel: PermissionGroupRisk;
  permissions: string[];
}

const p = (module: string, feature: string, ...actions: string[]) =>
  actions.map((action) => `${module}.${feature}.${action}`);

export const PERMISSION_GROUP_CATALOG: readonly PermissionGroupDefinition[] = [
  {
    key: 'student_management',
    name: 'Student Management',
    description: 'Create, view and maintain student profiles, assignments and lifecycle.',
    department: 'Student Operations',
    riskLevel: 'sensitive',
    permissions: [
      ...p('student', 'profile', 'view', 'create', 'update', 'assign', 'export'),
      ...p('student', 'assignment', 'assign', 'update'),
      ...p('student', 'status', 'update', 'approve'),
    ],
  },
  {
    key: 'lead_management',
    name: 'Lead Management',
    description: 'Ingest, qualify, assign and convert leads across every channel.',
    department: 'Student Operations',
    riskLevel: 'standard',
    permissions: [
      ...p('lead', 'record', 'view', 'create', 'update', 'assign', 'export'),
      ...p('lead', 'conversion', 'create', 'approve'),
    ],
  },
  {
    key: 'partner_management',
    name: 'Partner Management',
    description: 'Onboard partners, review partner leads and manage partner visibility.',
    department: 'Partnerships',
    riskLevel: 'sensitive',
    permissions: [
      ...p('partner', 'profile', 'view', 'create', 'update', 'approve', 'export'),
      ...p('partner', 'lead', 'view', 'assign', 'update'),
    ],
  },
  {
    key: 'application_management',
    name: 'Application Management',
    description: 'Prepare, submit and track university applications and stage transitions.',
    department: 'Application Team',
    riskLevel: 'sensitive',
    permissions: [
      ...p('application', 'record', 'view', 'create', 'update', 'submit', 'export'),
      ...p('application', 'stage', 'update', 'approve'),
    ],
  },
  {
    key: 'document_management',
    name: 'Document Management',
    description: 'Review, approve and version student documents. Download is separately logged.',
    department: 'Application Team',
    riskLevel: 'sensitive',
    permissions: [
      ...p('document', 'record', 'view', 'create', 'update', 'approve', 'reject'),
      ...p('document', 'download', 'download'),
    ],
  },
  {
    key: 'communication_management',
    name: 'Communication Management',
    description: 'Unified WhatsApp / SMS / social / portal messaging and notes.',
    department: 'Student Operations',
    riskLevel: 'standard',
    permissions: [
      ...p('communication', 'thread', 'view', 'create', 'update', 'assign'),
      ...p('communication', 'message', 'send', 'approve_ai_reply'),
    ],
  },
  {
    key: 'counselor_operations',
    name: 'Counselor Operations',
    description: 'Follow-ups, appointments, course matching, SOP/CV and student messaging.',
    department: 'Counseling',
    riskLevel: 'standard',
    permissions: [
      ...p('counselor', 'follow_up', 'view', 'create', 'update'),
      ...p('counselor', 'appointment', 'view', 'create', 'update'),
      ...p('counselor', 'course_match', 'create', 'generate'),
      ...p('sop', 'draft', 'view', 'create', 'update'),
      ...p('cv', 'draft', 'view', 'create', 'update'),
    ],
  },
  {
    key: 'marketing_operations',
    name: 'Marketing Operations',
    description: 'Campaign management, ROI reporting and lead-source attribution.',
    department: 'Marketing',
    riskLevel: 'standard',
    permissions: [
      ...p('marketing', 'campaign', 'view', 'create', 'update', 'approve', 'export'),
      ...p('marketing', 'report', 'view', 'export'),
      ...p('marketing', 'integration', 'view'),
    ],
  },
  {
    key: 'social_inbox',
    name: 'Social Inbox',
    description: 'Facebook, Instagram and Messenger conversations and comment automation.',
    department: 'Marketing',
    riskLevel: 'standard',
    permissions: [
      ...p('social', 'inbox', 'view', 'update', 'assign'),
      ...p('social', 'message', 'send', 'approve_ai_reply'),
      ...p('social', 'lead', 'create'),
    ],
  },
  {
    key: 'creative_studio',
    name: 'Creative Studio',
    description: 'Creatives, AI video requests and creative approval workflow.',
    department: 'Marketing',
    riskLevel: 'standard',
    permissions: [
      ...p('creative', 'asset', 'view', 'create', 'update', 'approve'),
      ...p('creative', 'video', 'request', 'approve'),
    ],
  },
  {
    key: 'visa_operations',
    name: 'Visa Operations',
    description: 'Visa cases, interview queue, readiness and student-safe feedback.',
    department: 'Visa',
    riskLevel: 'sensitive',
    permissions: [
      ...p('visa', 'case', 'view', 'create', 'update', 'review', 'escalate', 'export'),
      ...p('visa', 'interview', 'view', 'create', 'finish'),
      ...p('visa', 'readiness', 'view', 'generate'),
    ],
  },
  {
    key: 'visa_sensitive_access',
    name: 'Visa Sensitive Access',
    description: 'Passport, refusal history, funding and sponsor evidence. Every view is audited.',
    department: 'Visa',
    riskLevel: 'critical',
    permissions: [
      ...p('visa', 'sensitive', 'view', 'download'),
      ...p('visa', 'refusal', 'view'),
      ...p('visa', 'funding', 'view', 'review'),
    ],
  },
  {
    key: 'finance_operations',
    name: 'Finance Operations',
    description: 'Payments, invoices and reconciliation.',
    department: 'Finance',
    riskLevel: 'critical',
    permissions: [
      ...p('finance', 'payment', 'view', 'create', 'update', 'approve', 'export'),
      ...p('finance', 'invoice', 'view', 'create', 'approve'),
    ],
  },
  {
    key: 'commission_management',
    name: 'Commission Management',
    description: 'University and partner commission approval and payout state.',
    department: 'Finance',
    riskLevel: 'critical',
    permissions: [
      ...p('commission', 'record', 'view', 'create', 'update', 'approve', 'export'),
    ],
  },
  {
    key: 'hr_operations',
    name: 'HR Operations',
    description: 'Attendance, leave, payroll tasks and employee records.',
    department: 'HR',
    riskLevel: 'critical',
    permissions: [
      ...p('hr', 'attendance', 'view', 'update'),
      ...p('hr', 'leave', 'view', 'approve'),
      ...p('hr', 'payroll', 'view', 'approve'),
      ...p('hr', 'employee', 'view', 'create', 'update'),
    ],
  },
  {
    key: 'english_test_operations',
    name: 'English Test Operations',
    description: 'Mock tests, credits, AI scoring and practice plans.',
    department: 'English Test',
    riskLevel: 'standard',
    permissions: [
      ...p('english_test', 'mock', 'view', 'create', 'update'),
      ...p('english_test', 'credit', 'view', 'assign'),
      ...p('english_test', 'result', 'view', 'generate'),
    ],
  },
  {
    key: 'ai_command_center',
    name: 'AI Command Center',
    description: 'Run, pause and inspect AI agents and jobs. Destructive actions need approval.',
    department: 'AI Operations',
    riskLevel: 'critical',
    permissions: [
      ...p('ai', 'agent', 'view', 'create', 'update', 'pause', 'approve'),
      ...p('ai', 'job', 'view', 'create', 'approve', 'reject'),
      ...p('ai', 'system_builder', 'request', 'approve', 'apply'),
    ],
  },
  {
    key: 'website_builder',
    name: 'Website Builder',
    description: 'Pages, content and publishing. Publishing always requires approval.',
    department: 'Marketing',
    riskLevel: 'sensitive',
    permissions: [
      ...p('website', 'page', 'view', 'create', 'update', 'approve'),
      ...p('website', 'content', 'publish', 'approve'),
    ],
  },
  {
    key: 'reports',
    name: 'Reports',
    description: 'Global report center with export. Export is separately permissioned.',
    department: 'Operations',
    riskLevel: 'standard',
    permissions: [
      ...p('report', 'view', 'view'),
      ...p('report', 'export', 'export', 'download'),
      ...p('report', 'generate', 'create'),
    ],
  },
  {
    key: 'system_settings',
    name: 'System Settings',
    description: 'Company profile, integrations, free-mock rules, maintenance mode.',
    department: 'Operations',
    riskLevel: 'critical',
    permissions: [
      ...p('settings', 'general', 'view', 'update'),
      ...p('settings', 'integration', 'view', 'update'),
      ...p('settings', 'maintenance', 'update'),
    ],
  },
  {
    key: 'audit_logs',
    name: 'Audit Logs',
    description: 'Read the immutable audit trail. Never deletable from the UI.',
    department: 'Compliance',
    riskLevel: 'sensitive',
    permissions: [
      ...p('audit', 'log', 'view', 'export'),
    ],
  },
  {
    key: 'branch_management',
    name: 'Branch Management',
    description: 'Branches, managers, employee assignment and branch reports.',
    department: 'Operations',
    riskLevel: 'sensitive',
    permissions: [
      ...p('branch', 'record', 'view', 'create', 'update', 'assign', 'export'),
      ...p('branch', 'report', 'view', 'export'),
    ],
  },
  {
    key: 'country_management',
    name: 'Country Management',
    description: 'Destination operations, country teams, guides and data scans.',
    department: 'Operations',
    riskLevel: 'standard',
    permissions: [
      ...p('country', 'record', 'view', 'update', 'assign'),
      ...p('country', 'data_scan', 'create'),
      ...p('country', 'report', 'view', 'export'),
    ],
  },
  {
    key: 'super_admin_tools',
    name: 'Super Admin Tools',
    description: 'Employee control, RBAC, Acting-As, lockdown and global search.',
    department: 'Super Admin',
    riskLevel: 'critical',
    permissions: [
      ...p('super_admin', 'employee', 'view', 'create', 'update', 'suspend', 'revoke_sessions'),
      ...p('super_admin', 'rbac', 'view', 'create', 'update', 'assign'),
      ...p('super_admin', 'acting_as', 'act_as'),
      ...p('super_admin', 'lockdown', 'update'),
      ...p('super_admin', 'global_search', 'view'),
    ],
  },
] as const;

export function findGroupDefinition(key: string): PermissionGroupDefinition | undefined {
  return PERMISSION_GROUP_CATALOG.find((group) => group.key === key);
}

/** All `module.feature` pairs referenced by a group, for the matrix UI. */
export function groupModules(definition: PermissionGroupDefinition): string[] {
  return [...new Set(definition.permissions.map((key) => key.split('.').slice(0, 2).join('.')))];
}
