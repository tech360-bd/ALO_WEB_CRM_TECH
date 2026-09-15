// Portal-specific menu registry — reuse existing functions, no invention
// Each portal keeps its own role-appropriate structure, grouped headings, icons, active states, badges, submenus

import {
  LayoutDashboard, User, Search, FolderHeart, FolderOpen, FileText, FileUp, MessageSquare, Award, CreditCard, ClipboardList, Calendar, Clock, GraduationCap, Building2, BookOpen, Shield, Users, Target, Plane, BarChart3, Megaphone, UserCog, Bot, Headphones, CheckSquare, Wallet, DollarSign, FileSearch, Globe, GitCompare, ShieldCheck, AlertTriangle, Database, Settings, Lock, ScrollText, Briefcase, CalendarDays, TrendingUp, HelpCircle, LogOut, Map, FileCheck, Video, Newspaper, Handshake, Library, Landmark, Receipt, Laptop, Share2, Lightbulb, Mail, Contact, FileSignature, MapPinned, BookMarked, Send
} from 'lucide-react';

export type NavItem = { label: string; icon: any; href?: string; view?: string; badge?: string; children?: NavItem[] };
export type NavGroup = { title: string; items: NavItem[] };

// Shared Knowledge Sharing nav item reused across all portals
const KNOWLEDGE_SHARING_ITEM = { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' };

export const portalNav: Record<string, NavGroup[]> = {
  student: [
    { title: '', items: [
      { label:'Home', icon: LayoutDashboard, view:'student-dashboard' },
      { label:'My Profile', icon: User, view:'student-profile' },
      { label:'Find Courses', icon: Search, view:'student-course-finder' },
      { label:'My Shortlist', icon: FolderHeart, view:'student-favorites' },
      { label:'My Applications', icon: FolderOpen, view:'student-applications' },
      { label:'Documents', icon: FileUp, view:'student-documents', badge:'pending' },
      { label:'Tasks & Deadlines', icon: ClipboardList, view:'student-onboarding' },
      { label:'Appointments', icon: Calendar, view:'student-appointments' },
      { label:'Messages', icon: MessageSquare, view:'student-messages' },
      { label:'Payments', icon: CreditCard, view:'student-payments' },
      { label:'AI Study Assistant', icon: Bot, view:'student-ai-advisor' },
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' },
      { label:'Help & Support', icon: HelpCircle, view:'student-help' },
    ]},
  ],
  counselor: [
    { title:'Workspace', items: [
      { label:'My Dashboard', icon: LayoutDashboard, view:'employee-dashboard' },
      { label:'My Leads', icon: Target, view:'employee-leads' },
      { label:'Follow-ups', icon: Clock, view:'employee-tasks' },
      { label:'My Students', icon: GraduationCap, view:'employee-students' },
      { label:'Applications', icon: FileText, view:'employee-applications' },
      { label:'Document Requests', icon: FileUp, view:'employee-documents' },
      { label:'Appointments', icon: CalendarDays, view:'employee-calendar' },
      { label:'Messages', icon: MessageSquare, view:'employee-messages' },
      { label:'Tasks', icon: CheckSquare, view:'employee-tasks' },
      { label:'Reports', icon: BarChart3, view:'employee-reports' },
    ]},
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
    { title:'Knowledge & Partnerships', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' },
      { label:'International Officer', icon: Globe, view:'international-officer-dashboard' },
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy' },
    ]},
  ],
  admissions: [
    { title:'Admissions', items: [
      { label:'Admissions Overview', icon: LayoutDashboard, view:'crm-applications' },
      { label:'Application Queue', icon: FolderOpen, view:'crm-applications' },
      { label:'Ready for Review', icon: FileCheck, view:'crm-applications' },
      { label:'Submitted', icon: FileText, view:'crm-applications' },
      { label:'University Decisions', icon: Award, view:'crm-applications' },
      { label:'Offer Follow-up', icon: MessageSquare, view:'crm-applications' },
      { label:'Deadlines', icon: Calendar, view:'crm-applications' },
      { label:'Reports', icon: BarChart3, view:'crm-reports' },
    ]},
    { title:'Knowledge', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
    ]},
  ],
  document_verification: [
    { title:'Review', items: [
      { label:'Review Dashboard', icon: LayoutDashboard, view:'crm-documents' },
      { label:'Pending Review', icon: FileSearch, view:'crm-documents' },
      { label:'In Review', icon: Clock, view:'crm-documents' },
      { label:'Correction Requested', icon: AlertTriangle, view:'crm-documents' },
      { label:'Approved', icon: FileCheck, view:'crm-documents' },
      { label:'Rejected', icon: FileText, view:'crm-documents' },
      { label:'Review History', icon: ScrollText, view:'crm-audit-logs' },
    ]},
    { title:'Knowledge', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
    ]},
  ],
  visa: [
    { title:'Visa & Compliance', items: [
      { label:'Visa Overview', icon: LayoutDashboard, view:'crm-visa-dashboard' },
      { label:'My Cases', icon: FolderOpen, view:'crm-visa-cases' },
      { label:'Checklists', icon: ClipboardList, view:'crm-visa' },
      { label:'Documents', icon: FileUp, view:'crm-visa' },
      { label:'Appointments', icon: CalendarDays, view:'crm-visa' },
      { label:'Deadlines', icon: Clock, view:'crm-visa' },
      { label:'Interview Practice', icon: Video, view:'crm-visa-interviews' },
      { label:'Case History', icon: ScrollText, view:'crm-audit-logs' },
      { label:'Reports', icon: BarChart3, view:'crm-visa-reports' },
    ]},
    { title:'Knowledge', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
    ]},
  ],
  front_desk: [
    { title:'Front Desk', items: [
      { label:'Front Desk Home', icon: LayoutDashboard, view:'crm-dashboard' },
      { label:'New Enquiry', icon: User, view:'crm-leads' },
      { label:'Walk-ins', icon: Users, view:'crm-leads' },
      { label:'Appointments', icon: CalendarDays, view:'crm-appointments' },
      { label:'Lead Lookup', icon: Search, view:'crm-leads' },
      { label:'Today’s Visitors', icon: Users, view:'crm-leads' },
      { label:'Handover Queue', icon: ClipboardList, view:'crm-tasks' },
    ]},
    { title:'Knowledge', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
    ]},
  ],
  marketing: [
    { title:'Marketing', items: [
      { label:'Marketing Overview', icon: LayoutDashboard, view:'marketing-dashboard' },
      { label:'Campaigns', icon: Megaphone, view:'marketing-campaigns' },
      { label:'Content Calendar', icon: Calendar, view:'marketing-campaigns' },
      { label:'Content Studio', icon: FileText, view:'marketing-campaigns' },
      { label:'Assets', icon: Library, view:'marketing-brand-assets' },
      { label:'Approvals', icon: FileCheck, view:'marketing-approvals' },
      { label:'Landing Pages', icon: Globe, view:'marketing-campaigns' },
      { label:'Audience Segments', icon: Users, view:'marketing-campaigns' },
      { label:'Lead Attribution', icon: BarChart3, view:'marketing-analytics' },
      { label:'Reports', icon: BarChart3, view:'marketing-analytics' },
      { label:'Integrations', icon: Settings, view:'crm-social' },
    ]},
    { title:'Knowledge', items: [
      { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub' },
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy' },
    ]},
  ],
  partner: [
    { title:'Partner', items: [
      { label:'Partner Overview', icon: LayoutDashboard, view:'partner-dashboard' },
      { label:'My Referrals', icon: Handshake, view:'partner-leads' },
      { label:'Submit Referral', icon: User, view:'partner-leads' },
      { label:'Referral Status', icon: FileCheck, view:'partner-leads' },
      { label:'Documents', icon: FileUp, view:'partner-documents' },
      { label:'Messages', icon: MessageSquare, view:'partner-messages' },
      { label:'Commission/Settlement', icon: DollarSign, view:'partner-commission' },
      { label:'Reports', icon: BarChart3, view:'partner-reports' },
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
