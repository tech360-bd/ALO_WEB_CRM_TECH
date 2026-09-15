// Portal-specific menu registry — reuse existing functions, no invention
// Each portal keeps its own role-appropriate structure, grouped headings, icons, active states, badges, submenus

import {
  LayoutDashboard, User, Search, FolderHeart, FolderOpen, FileText, FileUp, MessageSquare, Award, CreditCard, ClipboardList, Calendar, Clock, GraduationCap, Building2, BookOpen, Shield, Users, Target, Plane, BarChart3, Megaphone, UserCog, Bot, Headphones, CheckSquare, Wallet, DollarSign, FileSearch, Globe, GitCompare, ShieldCheck, AlertTriangle, Database, Settings, Lock, ScrollText, Briefcase, CalendarDays, TrendingUp, HelpCircle, LogOut, Map, FileCheck, Video, Newspaper, Handshake, Library, Landmark, Receipt, Laptop, Share2, Lightbulb, Mail, Contact, FileSignature, MapPinned, BookMarked, Send
} from 'lucide-react';

export type NavItem = { label: string; icon: any; href?: string; view?: string; badge?: string; children?: NavItem[] };
export type NavGroup = { title: string; items: NavItem[] };

// Shared Knowledge Sharing nav item reused across all portals
const KNOWLEDGE_SHARING_ITEM = { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' };

// Social Media Management — 24 Platforms, Own AI Agent (Groq/ZAI/OpenRouter), No SaaS
const SOCIAL_MEDIA_ITEM = { label:'Social Media Management', icon: Share2, view:'social-media-hub', badge:'24 AI' };
const SOCIAL_MEDIA_ITEM_ADMIN = { label:'Social Media — 24 Platforms', icon: Share2, view:'social-media-hub', badge:'24 AI' };

    { title:'Knowledge & Partnerships', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' },
      { label:'International Officer', icon: Globe, view:'international-officer-dashboard' },
      { label:'University Research', icon: BookMarked, view:'international-officer-research' },
      { label:'Partnership Comms', icon: Mail, view:'international-officer-communications' },
      { label:'Contact Details', icon: Contact, view:'international-officer-contacts' },
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy' },
    ]},
  ],
  senior_counselor: [
    { title:'Team', items: [
      { label:'Team Overview', icon: Users, view:'employee-dashboard' },
      { label:'Unassigned Leads', icon: Target, view:'employee-leads' },
      { label:'Team Leads', icon: Users, view:'employee-leads' },
      { label:'Assignments', icon: ClipboardList, view:'employee-tasks' },
      { label:'SLA & Escalations', icon: AlertTriangle, view:'employee-tasks' },
      { label:'Applications', icon: FileText, view:'employee-applications' },
      { label:'Team Calendar', icon: CalendarDays, view:'employee-calendar' },
      { label:'Performance Reports', icon: BarChart3, view:'employee-reports' },
    ]},
    { title:'Social & Marketing', items: [
      { label:'Social Media — 24 Platforms', icon: Share2, view:'social-media-hub', badge:'24 AI' },
      { label:'Social Inbox', icon: MessageSquare, view:'social-inbox' },
    ]},
    { title:'Knowledge & Partnerships', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' },
      { label:'International Officer', icon: Globe, view:'international-officer-dashboard' },
      { label:'University Research', icon: BookMarked, view:'international-officer-research' },
      { label:'Partnership Comms', icon: Mail, view:'international-officer-communications' },
      { label:'Agreements', icon: FileSignature, view:'international-officer-agreements' },
      { label:'Contact Details', icon: Contact, view:'international-officer-contacts' },
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy' },
    ]},
  ],
  data: [
    { title:'Data', items: [
      { label:'Data Overview', icon: Database, view:'crm-course-finder' },
      { label:'Universities', icon: Building2, view:'crm-universities' },
      { label:'Campuses', icon: Building2, view:'crm-universities' },
      { label:'Courses', icon: BookOpen, view:'crm-course-finder' },
      { label:'Intakes', icon: Calendar, view:'crm-course-finder' },
      { label:'Scholarships', icon: Award, view:'crm-scholarships' },
      { label:'Sources & Verification', icon: ShieldCheck, view:'crm-import-center' },
      { label:'Import/Export', icon: FileUp, view:'crm-import-center' },
      { label:'Validation Queue', icon: FileSearch, view:'crm-import-center' },
      { label:'Change History', icon: ScrollText, view:'crm-audit-logs' },
    ]},
    { title:'Knowledge & Partnerships', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
      { label:'University Research', icon: BookMarked, view:'international-officer-research' },
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy' },
    ]},
  ],
  finance: [
    { title:'Finance', items: [
      { label:'Finance Overview', icon: LayoutDashboard, view:'crm-finance' },
      { label:'Invoices', icon: Receipt, view:'crm-finance' },
      { label:'Payments', icon: CreditCard, view:'crm-finance' },
      { label:'Receipts', icon: Receipt, view:'crm-finance' },
      { label:'Refund Requests', icon: CreditCard, view:'crm-finance' },
      { label:'Reconciliation', icon: BarChart3, view:'crm-finance' },
      { label:'Reports', icon: BarChart3, view:'crm-finance' },
    ]},
    { title:'Knowledge', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
    ]},
  ],
  hr: [
    { title:'HR', items: [
      { label:'My Workspace', icon: LayoutDashboard, view:'crm-hrm' },
      { label:'Employee Directory', icon: Users, view:'crm-hrm' },
      { label:'Tasks', icon: CheckSquare, view:'crm-tasks' },
      { label:'Calendar', icon: CalendarDays, view:'crm-hrm' },
      { label:'Leave/Attendance', icon: Calendar, view:'crm-hrm' },
      { label:'Training', icon: BookOpen, view:'crm-hrm' },
      { label:'Announcements', icon: Newspaper, view:'crm-hrm' },
      { label:'HR Reports', icon: BarChart3, view:'crm-hrm' },
    ]},
    { title:'Knowledge', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
    ]},
  ],
  department_head: [
    { title:'Department', items: [
      { label:'Department Overview', icon: LayoutDashboard, view:'crm-dashboard' },
      { label:'Team Workload', icon: Users, view:'crm-tasks' },
      { label:'SLA', icon: Clock, view:'crm-tasks' },
      { label:'Escalations', icon: AlertTriangle, view:'crm-tasks' },
      { label:'Applications', icon: FileText, view:'crm-applications' },
      { label:'Reports', icon: BarChart3, view:'crm-reports' },
    ]},
    { title:'Knowledge & Partnerships', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
      { label:'International Officer', icon: Globe, view:'international-officer-dashboard' },
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy' },
    ]},
  ],
  coo: [
    { title:'Operations', items: [
      { label:'Operations Overview', icon: LayoutDashboard, view:'crm-dashboard' },
      { label:'Department Comparison', icon: BarChart3, view:'crm-dashboard' },
      { label:'Lead-to-Enrollment Funnel', icon: TrendingUp, view:'crm-analytics' },
      { label:'Capacity & Workload', icon: Users, view:'crm-tasks' },
      { label:'Critical Exceptions', icon: AlertTriangle, view:'crm-tasks' },
      { label:'Social Media — 24 Platforms', icon: Share2, view:'social-media-hub', badge:'24 AI' },
      { label:'Integration Health', icon: Settings, view:'crm-social' },
      { label:'AI Activity', icon: Bot, view:'crm-ai-command' },
      { label:'Executive Reports', icon: BarChart3, view:'crm-reports' },
    ]},
    { title:'Knowledge & Partnerships', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
      { label:'International Officer', icon: Globe, view:'international-officer-dashboard' },
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy' },
    ]},
  ],
  super_admin: [
    { title:'Master Command', items: [
      { label:'Master Command Center', icon: Shield, view:'super-admin-master-command', badge:'live' },
      { label:'Website CMS Hub', icon: Globe, view:'super-admin-website-cms', badge:'new' },
      { label:'CRM Command Center', icon: Briefcase, view:'super-admin-crm-command', badge:'new' },
      { label:'Social Media — 24 Platforms', icon: Share2, view:'social-media-hub', badge:'24 AI' },
      { label:'System Overview', icon: LayoutDashboard, view:'crm-dashboard' },
      { label:'Users & Roles', icon: Users, view:'crm-users' },
      { label:'Departments/Branches', icon: Building2, view:'crm-roles' },
      { label:'Workflow Settings', icon: Settings, view:'crm-roles' },
      { label:'Data Management', icon: Database, view:'crm-course-finder' },
      { label:'Integrations', icon: Globe, view:'crm-social' },
      { label:'AI Command Center', icon: Bot, view:'crm-ai-command' },
      { label:'Audit Logs', icon: ScrollText, view:'crm-audit-logs' },
      { label:'Security', icon: Shield, view:'crm-permissions' },
      { label:'Jobs/Queues', icon: Clock, view:'crm-audit-logs' },
      { label:'System Health', icon: BarChart3, view:'crm-dashboard' },
      { label:'Backup/Recovery', icon: Database, view:'crm-settings' },
      { label:'Settings', icon: Settings, view:'crm-settings' },
    ]},
    { title:'Knowledge & Partnerships', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' },
      { label:'International Officer', icon: Globe, view:'international-officer-dashboard' },
      { label:'University Research', icon: BookMarked, view:'international-officer-research' },
      { label:'Partnership Comms', icon: Mail, view:'international-officer-communications' },
      { label:'Agreements', icon: FileSignature, view:'international-officer-agreements' },
      { label:'Contact Details', icon: Contact, view:'international-officer-contacts' },
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy' },
    ]},
  ],
  // NEW: Dedicated International Officer Role
  international_officer: [
    { title:'International Officer', items: [
      { label:'Dashboard', icon: LayoutDashboard, view:'international-officer-dashboard' },
      { label:'University Research', icon: BookMarked, view:'international-officer-research' },
      { label:'Research Evidence', icon: FileSearch, view:'international-officer-research' },
      { label:'Digital Twin', icon: Building2, view:'international-officer-research' },
    ]},
    { title:'Partnership Management', items: [
      { label:'Communications', icon: Mail, view:'international-officer-communications' },
      { label:'Emails & Letters', icon: Send, view:'international-officer-communications' },
      { label:'Agreements', icon: FileSignature, view:'international-officer-agreements' },
      { label:'Contact Details', icon: Contact, view:'international-officer-contacts' },
      { label:'B2B Contacts', icon: Users, view:'international-officer-contacts' },
    ]},
    { title:'Strategy & Knowledge', items: [
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy', badge:'key' },
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' },
      { label:'Reports & Analytics', icon: BarChart3, view:'international-officer-dashboard' },
    ]},
  ],
  // Partner Manager also gets full access
  partner_manager: [
    { title:'Partner Management', items: [
      { label:'Dashboard', icon: LayoutDashboard, view:'partner-dashboard' },
      { label:'My Referrals', icon: Handshake, view:'partner-leads' },
      { label:'Documents', icon: FileUp, view:'partner-documents' },
      { label:'Messages', icon: MessageSquare, view:'partner-messages' },
      { label:'Commission', icon: DollarSign, view:'partner-commission' },
    ]},
    { title:'International Partnerships', items: [
      { label:'International Officer', icon: Globe, view:'international-officer-dashboard' },
      { label:'University Research', icon: BookMarked, view:'international-officer-research' },
      { label:'Partnership Comms', icon: Mail, view:'international-officer-communications' },
      { label:'Agreements', icon: FileSignature, view:'international-officer-agreements' },
      { label:'Contact Details', icon: Contact, view:'international-officer-contacts' },
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy', badge:'key' },
    ]},
    { title:'Knowledge', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' },
    ]},
  ],
};

// HRMS Enterprise — HR Center available on every internal dashboard except Student (injected at runtime)
const HR_NAV_GROUP: NavGroup = {
  title: 'HR Center',
  items: [
    { label:'HR Center', icon: Briefcase, href:'/crm/hrm', badge:'live' },
    { label:'My HR Profile', icon: User, href:'/crm/hrm/profile' },
    { label:'Attendance', icon: Clock, href:'/crm/hrm/attendance' },
    { label:'Leave', icon: CalendarDays, href:'/crm/hrm/leave' },
    { label:'Payroll / Slip', icon: DollarSign, href:'/crm/hrm/payroll' },
    { label:'Documents', icon: FileText, href:'/crm/hrm/documents' },
    { label:'Devices', icon: Laptop, href:'/crm/hrm/devices' },
    { label:'Security', icon: ShieldCheck, href:'/crm/hrm/security' },
  ]
};

const HR_ADMIN_EXTRA: NavItem[] = [
  { label:'Agreements', icon: Shield, href:'/crm/hrm/agreements' },
  { label:'Notices 90d', icon: ScrollText, href:'/crm/hrm/notices' },
  { label:'Exit', icon: Briefcase, href:'/crm/hrm/exit' },
  { label:'HR Analytics', icon: BarChart3, href:'/crm/hrm/analytics' },
];

export function getNavForRole(role: string): NavGroup[] {
  const key = role.toLowerCase().replace(/-/g,'_');
  const base = portalNav[key] || portalNav['counselor'];
  // Student dashboard must remain unchanged — never inject HR
  if (key === 'student') return base;
  // Inject HR Center if not already present
  const hasHR = base.some(g=> g.title==='HR Center');
  if (hasHR) return base;
  const isHrAdmin = ['super_admin','admin','hr','hr_manager','finance','accounts'].includes(key);
  const hrGroup: NavGroup = {
    ...HR_NAV_GROUP,
    items: isHrAdmin ? [...HR_NAV_GROUP.items, ...HR_ADMIN_EXTRA] : HR_NAV_GROUP.items
  };
  return [...base, hrGroup];
}

// Frequently used for bottom nav (mobile)
export function getFrequentForRole(role: string): NavItem[] {
  const groups = getNavForRole(role);
  const all = groups.flatMap(g=> g.items);
  return all.slice(0,5);
}
