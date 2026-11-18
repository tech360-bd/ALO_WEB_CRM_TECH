/**
 * Canonical safe entry points from the Super Admin Master Command Center.
 *
 * The command center is a launcher, not a generic database editor: each link
 * opens the existing module UI so its own validation, RBAC and audit controls
 * remain in force.
 */
export interface WorkspaceLink {
  label: string;
  href: string;
}

export interface PortalWorkspace {
  key: string;
  title: string;
  icon: string;
  description: string;
  previewHref: string;
  previewLabel: string;
  controls: WorkspaceLink[];
}

export const SUPER_ADMIN_PORTAL_WORKSPACES: PortalWorkspace[] = [
  {
    key: 'website',
    title: 'Public website',
    icon: 'Globe',
    description: 'Homepage, public content, navigation, footer, SEO defaults, announcements and managed website sections.',
    previewHref: '/',
    previewLabel: 'Open public site',
    controls: [
      { label: 'Website CMS & revisions', href: '/admin/website-cms' },
      { label: 'Homepage builder', href: '/admin/homepage-builder' },
      { label: 'Countries & destinations', href: '/admin/countries' },
      { label: 'Services', href: '/admin/services' },
      { label: 'Scholarships', href: '/admin/scholarships' },
      { label: 'Resources', href: '/admin/resources' },
      { label: 'Language tests', href: '/admin/language-tests' },
      { label: 'SEO page graph', href: '/admin/seo/orphan-pages' },
    ],
  },
  {
    key: 'crm',
    title: 'CRM workspace',
    icon: 'BriefcaseBusiness',
    description: 'Leads, students, applications, documents, communications, tasks, reports and operational control surfaces.',
    previewHref: '/crm/dashboard',
    previewLabel: 'Open CRM',
    controls: [
      { label: 'CRM command center', href: '/admin/crm-command' },
      { label: 'CRM dashboard', href: '/crm/dashboard' },
      { label: 'Audit logs', href: '/admin/audit-logs' },
    ],
  },
  {
    key: 'student',
    title: 'Student portal',
    icon: 'GraduationCap',
    description: 'Student applications, documents, profile, messages, payments and journey. Access remains student-scoped.',
    previewHref: '/student/login',
    previewLabel: 'Open student sign-in',
    controls: [
      { label: 'Student records', href: '/admin/students' },
      { label: 'Applications', href: '/application-manager/applications' },
      { label: 'Document security', href: '/admin/document-security' },
    ],
  },
  {
    key: 'employee',
    title: 'Employee portal',
    icon: 'Users',
    description: 'Employee accounts, role assignments, permissions, feature access and security controls.',
    previewHref: '/employee/login',
    previewLabel: 'Open employee sign-in',
    controls: [
      { label: 'Employee control', href: '/admin/employees' },
      { label: 'Access control center', href: '/admin/access-control-center' },
      { label: 'Roles & permissions', href: '/admin/role-permissions' },
    ],
  },
  {
    key: 'partner',
    title: 'Partner portal',
    icon: 'Handshake',
    description: 'Partner organisations and partner-facing workflows. Partner data remains restricted to authorized controls.',
    previewHref: '/partner/login',
    previewLabel: 'Open partner sign-in',
    controls: [
      { label: 'Partner management', href: '/admin/partners' },
      { label: 'Partner prospects', href: '/admin/prospects' },
    ],
  },
  {
    key: 'university',
    title: 'University portal',
    icon: 'Landmark',
    description: 'Institution-facing application and document views. Institution accounts remain tenant-scoped.',
    previewHref: '/university-portal',
    previewLabel: 'Open university portal',
    controls: [
      { label: 'University catalogue', href: '/admin/universities' },
      { label: 'University data center', href: '/admin/university-data' },
      { label: 'University data updates', href: '/admin/university-data-updates' },
    ],
  },
  {
    key: 'parent',
    title: 'Parent / guardian portal',
    icon: 'UsersRound',
    description: 'Guardian access, consent and family-facing student information. Data visibility remains consent- and access-level-scoped.',
    previewHref: '/parent-portal',
    previewLabel: 'Open parent portal',
    controls: [
      { label: 'Parent management', href: '/admin/parents' },
      { label: 'Student records', href: '/admin/students' },
    ],
  },
];

export const CRM_MODULE_WORKSPACES: Record<string, WorkspaceLink> = {
  overview: { label: 'Admin overview', href: '/admin/dashboard' },
  leads: { label: 'Lead workspace', href: '/crm/leads' },
  students: { label: 'Student workspace', href: '/crm/students' },
  applications: { label: 'Application workspace', href: '/crm/applications' },
  documents: { label: 'Document security & review', href: '/admin/document-security' },
  visa: { label: 'Visa case workspace', href: '/crm/visa-cases' },
  finance: { label: 'Payments, payroll & access controls', href: '/admin/access-control-center' },
  marketing: { label: 'Marketing workspace', href: '/crm/marketing-manager' },
  hr: { label: 'HR workspace', href: '/crm/hrm' },
  partners: { label: 'Partner workspace', href: '/admin/partners' },
  universities: { label: 'University workspace', href: '/admin/universities' },
  courses: { label: 'Course workspace', href: '/admin/courses' },
  communications: { label: 'Communications inbox', href: '/crm/communications/inbox' },
  tasks: { label: 'Task management', href: '/admin/tasks' },
  reports: { label: 'Reports workspace', href: '/admin/reports' },
  audit: { label: 'Audit log explorer', href: '/admin/audit-logs' },
};
