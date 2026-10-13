import {
  LayoutDashboard, User, Search, Sparkles, Heart, FileText, FolderOpen,
  Plane, MessageSquare, CalendarDays, FileEdit, Award, CreditCard,
  Users, Bell, LifeBuoy, Settings, ShieldCheck, Mic, Briefcase, BookMarked, Megaphone,
  ScrollText,
} from 'lucide-react'
import type { NavGroup } from './PortalShell'

export const studentNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
      { label: 'AI Course Match', href: '/student/ai-course-match', icon: Sparkles },
    ],
  },
  {
    title: 'Discover',
    items: [
      { label: 'Course Finder', href: '/student/course-finder', icon: Search },
      { label: 'Shortlist & Compare', href: '/student/shortlist', icon: Heart },
      { label: 'Scholarships', href: '/student/scholarships', icon: Award },
      { label: 'Resource Hub', href: '/student/resources', icon: BookMarked },
    ],
  },
  {
    title: 'Apply',
    items: [
      { label: 'My Applications', href: '/student/applications', icon: FileText },
      { label: 'My Documents', href: '/student/documents', icon: FolderOpen },
      { label: 'Visa Center', href: '/student/visa', icon: Plane },
    ],
  },
  {
    title: 'Visa Success System',
    items: [
      { label: 'Visa Readiness', href: '/student/visa-readiness', icon: ShieldCheck },
      { label: 'Financial Proof', href: '/student/financial-proof', icon: CreditCard },
      { label: 'Interview Practice', href: '/student/interview-practice', icon: Mic },
      { label: 'Pre-Departure', href: '/student/pre-departure', icon: Briefcase },
      { label: 'AI Visa Coach', href: '/student/ai-visa-coach', icon: Sparkles },
    ],
  },
  {
    title: 'Engage',
    items: [
      { label: 'Messages', href: '/student/messages', icon: MessageSquare },
      { label: 'Appointments', href: '/student/appointments', icon: CalendarDays },
      { label: 'SOP & CV Studio', href: '/student/ai-cv', icon: FileEdit },
      { label: 'Payments', href: '/student/payments', icon: CreditCard },
      { label: 'Referrals', href: '/student/referrals', icon: Users },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'My Profile', href: '/student/profile', icon: User },
      { label: 'Notifications', href: '/student/notifications', icon: Bell },
      { label: 'Help Center', href: '/student/help', icon: LifeBuoy },
      { label: 'Settings', href: '/student/settings', icon: Settings },
    ],
  },
]

export const partnerNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/partner/dashboard', icon: LayoutDashboard },
      { label: 'Register Student', href: '/partner/register-student', icon: User },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'My Students', href: '/partner/students', icon: Users },
      { label: 'Applications', href: '/partner/applications', icon: FileText },
      { label: 'Visa Tracking', href: '/partner/visa-tracking', icon: Plane },
      { label: 'Search Programs', href: '/partner/search-programs', icon: Search },
    ],
  },
  {
    title: 'Finance',
    items: [
      { label: 'Wallet', href: '/partner/wallet', icon: CreditCard },
      { label: 'Commission Structure', href: '/partner/commission-structure', icon: Award },
      { label: 'Commission Payments', href: '/partner/commission-payments', icon: CreditCard },
    ],
  },
  {
    title: 'Engage',
    items: [
      { label: 'Enquiries', href: '/partner/enquiries', icon: MessageSquare },
      { label: 'Learning Resources', href: '/partner/learning-resources', icon: LifeBuoy },
      { label: 'AI Mock Interview', href: '/partner/ai-mock-interview', icon: Sparkles },
      { label: 'Deadlines', href: '/partner/deadlines', icon: CalendarDays },
      { label: 'Updates', href: '/partner/updates', icon: Bell },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', href: '/partner/settings', icon: Settings },
    ],
  },
]

export const crmNavGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
      { label: 'Leads', href: '/crm/leads', icon: Users },
      { label: 'Students', href: '/crm/students', icon: User },
    ],
  },
  {
    title: 'Applications',
    items: [
      { label: 'Applications', href: '/crm/applications', icon: FileText },
      { label: 'Decision Pending', href: '/crm/decision-pending', icon: Bell },
      { label: 'Offer Letters', href: '/crm/offer-letter-management', icon: Award },
      { label: 'Visa Letters', href: '/crm/visa-letter-management', icon: Plane },
      { label: 'Visa Files', href: '/crm/visa-files', icon: ShieldCheck },
    ],
  },
  {
    title: 'Institutions',
    items: [
      { label: 'Colleges & Universities', href: '/crm/colleges-universities', icon: Search },
      { label: 'Sub-Agent Management', href: '/crm/sub-agent-management', icon: Users },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Marketing Automation', href: '/crm/marketing-automation', icon: Megaphone, roles: ['marketing_manager', 'marketing_executive', 'super_admin', 'admin'] },
      { label: 'WhatsApp Inbox', href: '/crm/whatsapp-inbox', icon: MessageSquare, roles: ['marketing_manager', 'marketing_executive', 'super_admin', 'admin'] },
      { label: 'Email Campaign', href: '/crm/email-campaign', icon: MessageSquare, roles: ['marketing_manager', 'marketing_executive', 'super_admin', 'admin'] },
      { label: 'Event Management', href: '/crm/event-management', icon: CalendarDays, roles: ['marketing_manager', 'marketing_executive', 'super_admin', 'admin'] },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Reports', href: '/crm/reports', icon: FileText },
      { label: 'Documents', href: '/crm/documents', icon: FolderOpen },
      { label: 'Finance', href: '/crm/finance', icon: CreditCard },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Audit Logs', href: '/crm/audit-logs', icon: ScrollText, roles: ['super_admin', 'admin', 'marketing_manager'] },
      { label: 'Configuration', href: '/crm/configuration', icon: Settings },
      { label: 'Settings', href: '/crm/settings', icon: Settings },
    ],
  },
]

