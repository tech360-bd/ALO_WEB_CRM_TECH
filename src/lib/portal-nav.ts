// Portal-specific menu registry — reuse existing functions, no invention
// Each portal keeps its own role-appropriate structure, grouped headings, icons, active states, badges, submenus

import {
  LayoutDashboard, User, Search, FolderHeart, FolderOpen, FileText, FileUp, MessageSquare, Award, CreditCard, ClipboardList, Calendar, Clock, GraduationCap, Building2, BookOpen, Shield, Users, Target, Plane, BarChart3, Megaphone, UserCog, Bot, Headphones, CheckSquare, Wallet, DollarSign, FileSearch, Globe, GitCompare, ShieldCheck, AlertTriangle, Database, Settings, Lock, ScrollText, Briefcase, CalendarDays, TrendingUp, HelpCircle, LogOut, Map, FileCheck, Video, Newspaper, Handshake, Library, Landmark, Receipt, Laptop, Share2, Lightbulb, Mail, Contact, FileSignature, MapPinned, BookMarked, Send, ClipboardCheck
} from 'lucide-react';

export type NavItem = { label: string; icon: any; href?: string; view?: string; badge?: string; children?: NavItem[] };
export type NavGroup = { title: string; items: NavItem[] };

// Shared Knowledge Sharing nav item reused across all portals
const KNOWLEDGE_SHARING_ITEM = { label:'Knowledge Sharing', icon: Share2, view:'knowledge-sharing-hub', badge:'new' };

// Social Media Management — 24 Platforms, Own AI Agent (Groq/ZAI/OpenRouter), No SaaS
const SOCIAL_MEDIA_ITEM = { label:'Social Media Management', icon: Share2, view:'social-media-hub', badge:'24 AI' };
const SOCIAL_MEDIA_ITEM_ADMIN = { label:'Social Media — 24 Platforms', icon: Share2, view:'social-media-hub', badge:'24 AI' };

const portalNav: Record<string, NavGroup[]> = {
  student: [
    { title:'My Study Journey', items: [
      { label:'Dashboard', icon: GraduationCap, view:'student-dashboard' },
      { label:'My Profile', icon: User, view:'student-profile' },
      { label:'Course Finder', icon: Search, view:'student-course-finder' },
      { label:'AI Advisor', icon: Bot, view:'student-ai-advisor' },
      { label:'Recommendations', icon: Lightbulb, view:'student-recommendations' },
      { label:'Compare', icon: GitCompare, view:'student-compare' },
      { label:'Favorites', icon: FolderHeart, view:'student-favorites' },
    ]},
    { title:'Applications & Visa', items: [
      { label:'My Applications', icon: FolderOpen, view:'student-applications' },
      { label:'Documents', icon: FileText, view:'student-documents' },
      { label:'Visa Center', icon: Plane, view:'student-visa' },
      { label:'Interview Prep', icon: Video, view:'student-interviews' },
      { label:'Scholarships', icon: Award, view:'student-scholarships' },
      { label:'SOP / CV Studio', icon: FileSignature, view:'student-sop' },
    ]},
    { title:'Support', items: [
      { label:'Messages', icon: MessageSquare, view:'student-messages' },
      { label:'Appointments', icon: CalendarDays, view:'student-appointments' },
      { label:'Payments', icon: Wallet, view:'student-payments' },
      { label:'Referrals', icon: Handshake, view:'student-referrals' },
      { label:'Notifications', icon: Newspaper, view:'student-notifications' },
      { label:'Help Center', icon: HelpCircle, view:'student-help' },
      { label:'Settings', icon: Settings, view:'student-settings' },
      KNOWLEDGE_SHARING_ITEM,
    ]},
  ],
  counselor: [
    { title:'Workspace', items: [
      { label:'My Dashboard', icon: LayoutDashboard, view:'employee-dashboard' },
      { label:'My Leads', icon: Target, view:'employee-leads' },
      { label:'My Students', icon: Users, view:'employee-students' },
      { label:'Applications', icon: FileText, view:'employee-applications' },
      { label:'Tasks', icon: CheckSquare, view:'employee-tasks' },
      { label:'Calendar', icon: CalendarDays, view:'employee-calendar' },
      { label:'Documents', icon: FileUp, view:'employee-documents' },
      { label:'Messages', icon: MessageSquare, view:'employee-messages' },
      { label:'WhatsApp', icon: Send, view:'employee-whatsapp' },
      { label:'Attendance', icon: Clock, view:'employee-attendance' },
      { label:'Reports', icon: BarChart3, view:'employee-reports' },
    ]},
    { title:'Social & Marketing', items: [
      SOCIAL_MEDIA_ITEM_ADMIN,
      { label:'Social Inbox', icon: MessageSquare, view:'social-inbox' },
      { label:'Content Studio', icon: Video, view:'social-content' },
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
  admissions: [
    { title:'Admissions', items: [
      { label:'Admissions Overview', icon: LayoutDashboard, view:'crm-dashboard' },
      { label:'Applications', icon: FolderOpen, view:'crm-applications' },
      { label:'Submission Queue', icon: ClipboardList, view:'crm-applications' },
      { label:'Offer Management', icon: FileCheck, view:'crm-applications' },
      { label:'Deadlines', icon: CalendarDays, view:'crm-tasks' },
      { label:'Document Review', icon: FileSearch, view:'crm-documents' },
      { label:'Students', icon: GraduationCap, view:'crm-students' },
      { label:'Reports', icon: BarChart3, view:'crm-reports' },
    ]},
    { title:'Knowledge & Partnerships', items: [
      KNOWLEDGE_SHARING_ITEM,
      { label:'University Research', icon: BookMarked, view:'international-officer-research' },
    ]},
  ],
  document_verification: [
    { title:'Verification', items: [
      { label:'Verification Queue', icon: FileCheck, view:'crm-documents' },
      { label:'Documents', icon: FileText, view:'crm-documents' },
      { label:'Students', icon: Users, view:'crm-students' },
      { label:'Applications', icon: FolderOpen, view:'crm-applications' },
      { label:'Sources & Verification', icon: ShieldCheck, view:'crm-import-center' },
      { label:'Tasks', icon: CheckSquare, view:'crm-tasks' },
      { label:'Audit Trail', icon: ScrollText, view:'crm-audit-logs' },
    ]},
    { title:'Knowledge', items: [
      KNOWLEDGE_SHARING_ITEM,
    ]},
  ],
  visa: [
    { title:'Visa', items: [
      { label:'Visa Dashboard', icon: Plane, view:'employee-visa-dashboard' },
      { label:'Visa Cases', icon: FolderOpen, view:'employee-visa-cases' },
      { label:'Interviews', icon: Video, view:'employee-visa-interviews' },
      { label:'Visa Documents', icon: FileText, view:'employee-visa-documents' },
      { label:'Readiness', icon: ShieldCheck, view:'employee-visa-readiness' },
      { label:'Reports', icon: BarChart3, view:'employee-visa-reports' },
    ]},
    { title:'Knowledge & Partnerships', items: [
      KNOWLEDGE_SHARING_ITEM,
      { label:'Country Guidance', icon: Map, view:'international-officer-strategy' },
    ]},
  ],
  front_desk: [
    { title:'Front Desk', items: [
      { label:'Overview', icon: LayoutDashboard, view:'crm-dashboard' },
      { label:'Walk-in Leads', icon: Target, view:'crm-leads' },
      { label:'Appointments', icon: CalendarDays, view:'crm-appointments' },
      { label:'Inbox', icon: Mail, view:'crm-inbox' },
      { label:'Support', icon: Headphones, view:'crm-support' },
      { label:'Communications', icon: MessageSquare, view:'crm-communications' },
      { label:'Tasks', icon: CheckSquare, view:'crm-tasks' },
    ]},
    { title:'Knowledge', items: [
      KNOWLEDGE_SHARING_ITEM,
    ]},
  ],
  marketing: [
    { title:'Marketing', items: [
      { label:'Marketing Overview', icon: Megaphone, view:'marketing-dashboard' },
      { label:'Campaigns', icon: Target, view:'marketing-campaigns' },
      { label:'Content Calendar', icon: Calendar, view:'marketing-social' },
      { label:'Content Studio', icon: Video, view:'social-content' },
      SOCIAL_MEDIA_ITEM_ADMIN,
      { label:'Social Inbox', icon: MessageSquare, view:'social-inbox' },
      { label:'AI Content Generator', icon: Bot, view:'social-content' },
      { label:'Assets', icon: Library, view:'marketing-brand-assets' },
      { label:'Approvals', icon: CheckSquare, view:'marketing-approvals' },
      { label:'Landing Pages', icon: Globe, view:'marketing-campaigns' },
      { label:'Audience Segments', icon: Users, view:'marketing-leads' },
      { label:'Lead Attribution', icon: TrendingUp, view:'marketing-analytics' },
      { label:'Reports', icon: BarChart3, view:'marketing-analytics' },
      { label:'Integrations', icon: Settings, view:'marketing-workflows' },
    ]},
    { title:'Knowledge & Partnerships', items: [
      KNOWLEDGE_SHARING_ITEM,
      { label:'Business Strategy', icon: MapPinned, view:'international-officer-strategy' },
    ]},
  ],
  partner: [
    { title:'Partner', items: [
      { label:'Dashboard', icon: LayoutDashboard, view:'partner-dashboard' },
      { label:'My Referrals', icon: Handshake, view:'partner-leads' },
      { label:'Students', icon: GraduationCap, view:'partner-students' },
      { label:'Applications', icon: FolderOpen, view:'partner-applications' },
      { label:'Documents', icon: FileUp, view:'partner-documents' },
      { label:'Commission', icon: DollarSign, view:'partner-commission' },
      { label:'Messages', icon: MessageSquare, view:'partner-messages' },
      { label:'Resources', icon: Library, view:'partner-resources' },
      { label:'Reports', icon: BarChart3, view:'partner-reports' },
      { label:'Settings', icon: Settings, view:'partner-settings' },
    ]},
    { title:'Social & Marketing', items: [
      SOCIAL_MEDIA_ITEM,
      { label:'Social Scheduler', icon: CalendarDays, view:'partner-admin-social-scheduler' },
    ]},
    { title:'Knowledge & Partnerships', items: [
      KNOWLEDGE_SHARING_ITEM,
      { label:'University Research', icon: BookMarked, view:'international-officer-research' },
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
      { label:'International Data Catalogue', icon: Database, view:'crm-data-catalogue' },
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
      { label:'International Data Catalogue', icon: Database, view:'crm-data-catalogue' },
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

// AI & interview intelligence — real routes, injected for staff portals only.
// The student portal has its own interview preparation surface and must not
// receive counselor-facing tooling.
const AI_INTELLIGENCE_GROUP: NavGroup = {
  title: 'AI & Interview Intelligence',
  items: [
    { label:'AI Command Center', icon: Bot, href:'/crm/ai-command-center', badge:'AI' },
    { label:'Interview Library', icon: Video, href:'/crm/interview-library' },
    { label:'Practice Windows', icon: Clock, href:'/crm/interview-practice' },
    { label:'Assessment Review', icon: ClipboardCheck, href:'/crm/interview-review' },
  ]
};

export function getNavForRole(role: string): NavGroup[] {
  const key = role.toLowerCase().replace(/-/g,'_');
  const base = portalNav[key] || portalNav['counselor'];
  // Student dashboard must remain unchanged — never inject HR or staff tooling
  if (key === 'student') return base;
  const groups = base.some(g => g.title === 'AI & Interview Intelligence')
    ? base
    : [...base, AI_INTELLIGENCE_GROUP];
  // Inject HR Center if not already present
  const hasHR = groups.some(g=> g.title==='HR Center');
  if (hasHR) return groups;
  const isHrAdmin = ['super_admin','admin','hr','hr_manager','finance','accounts'].includes(key);
  const hrGroup: NavGroup = {
    ...HR_NAV_GROUP,
    items: isHrAdmin ? [...HR_NAV_GROUP.items, ...HR_ADMIN_EXTRA] : HR_NAV_GROUP.items
  };
  return [...groups, hrGroup];
}

// Frequently used for bottom nav (mobile)
export function getFrequentForRole(role: string): NavItem[] {
  const groups = getNavForRole(role);
  const all = groups.flatMap(g=> g.items);
  return all.slice(0,5);
}
