'use client'

import { useState, useEffect, ReactNode, ComponentType } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getSession, clearSession, workspaceFor } from '@/lib/session'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Menu, LogOut, Settings, Bell, ChevronDown, Home, LifeBuoy,
} from 'lucide-react'

export interface NavItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  badge?: string
  // Optional role whitelist. If absent, the item is visible to all roles.
  // The PortalShell filter checks `roles.includes(roleName)` (or '*' for any).
  roles?: string[]
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

// ─── Student Navigation ──────────────────────────────────────────────────────

import {
  LayoutDashboard, User, Search, Sparkles, Heart, FileText, FolderOpen,
  Plane, MessageSquare, CalendarDays, FileEdit, Award, CreditCard,
  Users, Bell as BellIcon, LifeBuoy as HelpIcon, Settings as SettingsIcon,
  ShieldCheck, Mic, Briefcase, BookMarked, Megaphone,
} from 'lucide-react'

export const studentNav: NavGroup[] = [
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
      { label: 'Notifications', href: '/student/notifications', icon: BellIcon },
      { label: 'Help Center', href: '/student/help', icon: HelpIcon },
      { label: 'Settings', href: '/student/settings', icon: SettingsIcon },
    ],
  },
]

// ─── Partner Navigation ──────────────────────────────────────────────────────

import {
  UserPlus, Wallet, BookOpen, RefreshCw, Mail,
} from 'lucide-react'

export const partnerNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/partner/dashboard', icon: LayoutDashboard },
      { label: 'Register Student', href: '/partner/register-student', icon: UserPlus },
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
      { label: 'Wallet', href: '/partner/wallet', icon: Wallet },
      { label: 'Commission Structure', href: '/partner/commission-structure', icon: Award },
      { label: 'Commission Payments', href: '/partner/commission-payments', icon: CreditCard },
    ],
  },
  {
    title: 'Engage',
    items: [
      { label: 'Enquiries', href: '/partner/enquiries', icon: Mail },
      { label: 'Learning Resources', href: '/partner/learning-resources', icon: BookOpen },
      { label: 'AI Mock Interview', href: '/partner/ai-mock-interview', icon: Sparkles },
      { label: 'Deadlines', href: '/partner/deadlines', icon: CalendarDays },
      { label: 'Updates', href: '/partner/updates', icon: Megaphone },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Settings', href: '/partner/settings', icon: SettingsIcon },
    ],
  },
]

// ─── CRM Navigation ──────────────────────────────────────────────────────────

import {
  Building2, Network, BarChart3, Mailbox, CalendarClock,
  Bot, ScrollText,
  CheckSquare, CalendarCheck,
} from 'lucide-react'

// Full 20-item CRM menu — every role sees the Dashboard plus the items
// permitted by their role. Visibility is filtered by `filterCrmNavForRole`.
export const crmNav: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard, roles: ['*'] },
      { label: 'Leads', href: '/crm/leads', icon: Users, roles: ['super_admin', 'ceo_director', 'admin', 'branch_manager', 'country_manager', 'office_manager', 'counselor', 'junior_counselor', 'marketing_manager', 'marketing_executive', 'front_desk', 'partner_manager', 'support_agent'] },
      { label: 'Students', href: '/crm/students', icon: User, roles: ['super_admin', 'ceo_director', 'admin', 'branch_manager', 'country_manager', 'office_manager', 'counselor', 'junior_counselor', 'application_team', 'finance', 'partner_manager', 'document_officer'] },
    ],
  },
  {
    title: 'Applications & Visa',
    items: [
      { label: 'Applications', href: '/crm/applications', icon: FileText, roles: ['super_admin', 'ceo_director', 'admin', 'branch_manager', 'country_manager', 'office_manager', 'counselor', 'junior_counselor', 'application_team', 'finance', 'partner_manager', 'document_officer'] },
      { label: 'Decision Pending', href: '/crm/decision-pending', icon: BellIcon, roles: ['super_admin', 'admin', 'application_team', 'branch_manager'] },
      { label: 'Offer Letters', href: '/crm/offer-letter-management', icon: Award, roles: ['super_admin', 'admin', 'application_team', 'branch_manager'] },
      { label: 'Visa Cases', href: '/crm/visa-letter-management', icon: Plane, roles: ['super_admin', 'admin', 'visa_officer', 'branch_manager', 'ceo_director'] },
      { label: 'Visa Files', href: '/crm/visa-files', icon: ShieldCheck, roles: ['super_admin', 'admin', 'visa_officer', 'branch_manager', 'ceo_director', 'counselor', 'application_team'] },
    ],
  },
  {
    title: 'Institutions & Data',
    items: [
      { label: 'Course Finder', href: '/crm/course-finder', icon: Search, roles: ['super_admin', 'admin', 'counselor', 'junior_counselor', 'data_manager', 'branch_manager', 'application_team'] },
      { label: 'Universities', href: '/crm/colleges-universities', icon: Building2, roles: ['super_admin', 'admin', 'data_manager', 'counselor', 'branch_manager', 'application_team'] },
      { label: 'Documents', href: '/crm/documents', icon: FolderOpen, roles: ['super_admin', 'admin', 'application_team', 'document_officer', 'visa_officer', 'branch_manager', 'counselor'] },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { label: 'Marketing Automation', href: '/crm/marketing-automation', icon: Megaphone, roles: ['super_admin', 'admin', 'marketing_manager', 'marketing_executive', 'ceo_director'] },
      { label: 'Messages', href: '/crm/whatsapp-inbox', icon: MessageSquare, roles: ['super_admin', 'admin', 'support_agent', 'counselor', 'branch_manager', 'front_desk'] },
      { label: 'Tasks', href: '/crm/tasks', icon: CheckSquare, roles: ['super_admin', 'admin', 'branch_manager', 'counselor', 'application_team', 'visa_officer', 'finance', 'hr_manager', 'front_desk', 'partner_manager'] },
      { label: 'Appointments', href: '/crm/appointments', icon: CalendarCheck, roles: ['super_admin', 'admin', 'branch_manager', 'counselor', 'front_desk', 'partner_manager'] },
    ],
  },
  {
    title: 'Business',
    items: [
      { label: 'Partners', href: '/crm/sub-agent-management', icon: Network, roles: ['super_admin', 'ceo_director', 'admin', 'partner_manager', 'finance'] },
      { label: 'Commissions', href: '/crm/commissions', icon: Wallet, roles: ['super_admin', 'admin', 'finance', 'partner_manager', 'ceo_director'] },
      { label: 'Finance', href: '/crm/finance', icon: CreditCard, roles: ['super_admin', 'admin', 'finance', 'ceo_director'] },
      { label: 'Marketing', href: '/crm/email-campaign', icon: Megaphone, roles: ['super_admin', 'admin', 'marketing_manager', 'marketing_executive', 'ceo_director'] },
    ],
  },
  {
    title: 'Insights & HR',
    items: [
      { label: 'Reports', href: '/crm/reports', icon: BarChart3, roles: ['super_admin', 'ceo_director', 'admin', 'branch_manager', 'finance', 'marketing_manager', 'hr_manager', 'partner_manager'] },
      { label: 'HRM', href: '/crm/event-management', icon: Briefcase, roles: ['super_admin', 'admin', 'hr_manager', 'ceo_director'] },
      { label: 'AI Command Center', href: '/crm/ai-command', icon: Bot, roles: ['super_admin', 'admin', 'ai_manager', 'ceo_director'] },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Audit Logs', href: '/crm/audit-logs', icon: ScrollText, roles: ['super_admin', 'admin', 'marketing_manager'] },
      { label: 'Settings', href: '/crm/settings', icon: SettingsIcon, roles: ['super_admin', 'admin'] },
    ],
  },
]

// Filter CRM nav items by role
export function filterCrmNavForRole(roleName: string | undefined): NavGroup[] {
  if (!roleName) return []
  // Super admin sees everything
  if (roleName === 'super_admin') return crmNav
  return crmNav
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const roles = (item as any).roles as string[] | undefined
        if (!roles || roles.length === 0) return true
        return roles.includes('*') || roles.includes(roleName)
      }),
    }))
    .filter((group) => group.items.length > 0)
}

// ─── Shell Component ─────────────────────────────────────────────────────────

interface PortalShellProps {
  workspace: 'student' | 'partner' | 'crm'
  navGroups: NavGroup[]
  brandLabel: string
  brandSubLabel: string
  children: ReactNode
}

export function PortalShell({
  workspace,
  navGroups,
  brandLabel,
  brandSubLabel,
  children,
}: PortalShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const session = getSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!session) {
      router.replace('/')
    }
  }, [session, router])

  if (!session) {
    return null
  }

  const userName = session?.user.name || 'User'
  const userEmail = session?.user.email || ''
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const roleLabel = session?.roles[0]?.displayName || session?.user.userType || 'User'

  // Validate workspace matches user type
  if (session) {
    const ws = workspaceFor(session)
    if (ws && ws !== workspace) {
      // User is in wrong workspace; redirect to their correct one
      if (typeof window !== 'undefined') {
        router.replace(`/${ws}/dashboard`)
      }
    }
  }

  function handleLogout() {
    clearSession()
    router.push('/')
  }

  const sidebarContent = (
    <nav className="flex flex-col gap-6 px-3 py-4 h-full overflow-y-auto custom-scrollbar">
      {/* Logo */}
      <div className="px-3 py-2 flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#0057B8] to-[#0073E6] flex items-center justify-center text-white font-bold text-sm shadow-sm">
            ALO
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-[#0f172a]">{brandLabel}</span>
            <span className="text-[10px] uppercase tracking-wider text-[#0057B8] font-semibold">{brandSubLabel}</span>
          </div>
        </Link>
      </div>

      {/* Nav groups */}
      <div className="flex flex-col gap-5 flex-1">
        {navGroups.map((group) => (
          <div key={group.title} className="flex flex-col gap-1">
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon
              const active =
                pathname === item.href ||
                (item.href !== `/${workspace}/dashboard` && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    active
                      ? 'bg-[#0057B8] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-[#0057B8]'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <Badge className="h-5 px-1.5 text-[10px] bg-[#E8501A] text-white">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-100">
        <Link
          href={`/${workspace}/settings`}
          className="flex items-center gap-2 text-xs text-slate-500 hover:text-[#0057B8] font-medium"
        >
          <LifeBuoy className="h-3.5 w-3.5" />
          Help & Support
        </Link>
      </div>
    </nav>
  )

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top header */}
      <header className="sticky top-0 z-40 h-16 border-b border-slate-200 bg-white/95 backdrop-blur flex items-center px-4 lg:px-6 gap-3">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            {sidebarContent}
          </SheetContent>
        </Sheet>

        {/* Breadcrumb / page title */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h1 className="text-base font-semibold text-[#0f172a] truncate">
            {navGroups
              .flatMap((g) => g.items)
              .find((i) => pathname === i.href || (i.href !== `/${workspace}/dashboard` && pathname.startsWith(i.href)))?.label || brandSubLabel}
          </h1>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#E8501A]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-2 h-10">
                <Avatar className="h-8 w-8 border border-slate-200">
                  <AvatarFallback className="bg-[#0057B8] text-white text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-semibold text-[#0f172a]">{userName}</span>
                  <span className="text-[10px] text-slate-500">{roleLabel}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${workspace}/settings`} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/" className="cursor-pointer">
                  <Home className="mr-2 h-4 w-4" />
                  Back to Home
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Body: sidebar + main */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-64 shrink-0 border-r border-slate-200 bg-white flex-col">
          {sidebarContent}
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="p-4 lg:p-6 max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
