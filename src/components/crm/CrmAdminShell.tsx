'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Target,
  GraduationCap,
  FileText,
  FileUp,
  Plane,
  Search,
  Building2,
  Award,
  Mail,
  MessageSquare,
  MessageCircle,
  Share2,
  Headphones,
  CheckSquare,
  Calendar,
  Users,
  DollarSign,
  Wallet,
  Megaphone,
  UserCog,
  Bot,
  BarChart3,
  Shield,
  Lock,
  ScrollText,
  Settings,
  LogOut,
  Menu,
  Bell,
  ChevronRight,
  Database,
  Globe,
  FileSearch,
  ShieldCheck,
  GitCompare,
  AlertTriangle,
  BookOpenCheck,
  Truck,
} from 'lucide-react';

// ============================================================
// Types
// ============================================================

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: PortalView;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

// ============================================================
// Navigation Configuration
// ============================================================

const navGroups: NavGroup[] = [
  {
    title: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', view: 'crm-dashboard' },
      { icon: BarChart3, label: 'Analytics', view: 'crm-analytics' },
    ],
  },
  {
    title: 'Student Management',
    items: [
      { icon: Target, label: 'Leads', view: 'crm-leads' },
      { icon: GraduationCap, label: 'Students', view: 'crm-students' },
      { icon: FileText, label: 'Applications', view: 'crm-applications' },
      { icon: FileUp, label: 'Documents', view: 'crm-documents' },
      { icon: Plane, label: 'Visa Cases', view: 'crm-visa' },
    ],
  },
  {
    title: 'Course & University',
    items: [
      { icon: Search, label: 'Course Finder', view: 'crm-course-finder' },
      { icon: Building2, label: 'Universities', view: 'crm-universities' },
      { icon: Award, label: 'Scholarships', view: 'crm-scholarships' },
    ],
  },
  {
    title: 'Communication',
    items: [
      { icon: Mail, label: 'Inbox', view: 'crm-inbox' },
      { icon: MessageSquare, label: 'Communications', view: 'crm-communications' },
      { icon: MessageCircle, label: 'WhatsApp', view: 'crm-whatsapp' },
      { icon: Share2, label: 'Social Media', view: 'crm-social' },
      { icon: Headphones, label: 'Support', view: 'crm-support' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { icon: CheckSquare, label: 'Tasks', view: 'crm-tasks' },
      { icon: Calendar, label: 'Appointments', view: 'crm-appointments' },
      { icon: Users, label: 'Partners', view: 'crm-partners' },
      { icon: DollarSign, label: 'Commissions', view: 'crm-commissions' },
    ],
  },
  {
    title: 'Business',
    items: [
      { icon: Wallet, label: 'Finance', view: 'crm-finance' },
      { icon: BookOpenCheck, label: 'Accounting', view: 'crm-accounting' },
      { icon: Truck, label: 'Procurement & Assets', view: 'crm-procurement' },
      { icon: Megaphone, label: 'Marketing', view: 'crm-marketing' },
      { icon: UserCog, label: 'HRM', view: 'crm-hrm' },
      { icon: Bot, label: 'AI Operations', view: 'crm-ai-command' },
    ],
  },
  {
    title: 'SEO Growth System',
    items: [
      { icon: Globe, label: 'SEO Dashboard', view: 'crm-seo-dashboard' },
      { icon: FileSearch, label: 'Keyword Tracker', view: 'crm-seo-keywords' },
      { icon: FileText, label: 'Content Workflow', view: 'crm-seo-content' },
      { icon: GitCompare, label: 'Competitor Analysis', view: 'crm-seo-competitors' },
      { icon: ShieldCheck, label: 'Technical Audit', view: 'crm-seo-technical' },
      { icon: AlertTriangle, label: 'Policy Watcher', view: 'crm-seo-policy' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: BarChart3, label: 'Reports', view: 'crm-reports' },
      { icon: Users, label: 'Users', view: 'crm-users' },
      { icon: Shield, label: 'Roles', view: 'crm-roles' },
      { icon: Lock, label: 'Permissions', view: 'crm-permissions' },
      { icon: ScrollText, label: 'Audit Logs', view: 'crm-audit-logs' },
      { icon: Settings, label: 'Settings', view: 'crm-settings' },
    ],
  },
];

// ============================================================
// Helper: Format CRM role for display
// ============================================================

function formatCrmRole(role?: string, department?: string): string {
  if (role) {
    return role
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  if (department) {
    return department
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return 'CRM Admin';
}

// ============================================================
// Sidebar Nav Item
// ============================================================

function SidebarNavItem({
  item,
  isActive,
  onClick,
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  const button = (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer',
        isActive
          ? 'bg-alo-brand-light text-alo-brand font-semibold'
          : 'text-alo-text-secondary hover:bg-alo-page hover:text-alo-text'
      )}
    >
      <Icon
        className={cn(
          'w-[18px] h-[18px] shrink-0',
          isActive ? 'text-alo-brand' : 'text-alo-text-muted/60'
        )}
      />
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.badge && !isActive && (
        <span className="text-[11px] leading-none font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 shrink-0">
          {item.badge}
        </span>
      )}
      {isActive && <ChevronRight className="w-3.5 h-3.5 text-alo-brand shrink-0" />}
    </button>
  );

  return button;
}

// ============================================================
// Sidebar Content (shared between desktop & mobile)
// ============================================================

function SidebarContent() {
  const { currentView, setView, logout } = usePortalStore();

  return (
    <div className="flex flex-col h-full">
      {/* Logo Area */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-alo-brand text-white flex items-center justify-center shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-alo-text truncate">ALO Education</p>
          <p className="text-xs text-alo-text-secondary">CRM Admin</p>
        </div>
      </div>
      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-alo-text-muted">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.view}
                    item={item}
                    isActive={currentView === item.view}
                    onClick={() => setView(item.view)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Sign Out */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-alo-text-secondary hover:text-red-600 hover:bg-red-50 h-10 cursor-pointer"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

// ============================================================
// Notification Dropdown
// ============================================================

function NotificationDropdown() {
  const { notifications } = usePortalStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative cursor-pointer"
            onClick={() => setOpen((v) => !v)}
          >
            <Bell className="w-5 h-5 text-alo-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#E8501A] text-white text-[10px] flex items-center justify-center font-bold px-1">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-alo-border z-50 overflow-hidden">
          <div className="px-4 py-3 bg-alo-page border-b border-alo-border flex items-center justify-between">
            <span className="font-semibold text-sm text-alo-text">Notifications</span>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[11px] font-semibold bg-alo-brand-light text-alo-brand border-0">
                {unreadCount} unread
              </Badge>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {notifications.length > 0 ? (
              notifications.slice(0, 8).map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'px-4 py-3 border-b border-alo-border last:border-0 transition-colors',
                    !n.isRead && 'bg-alo-brand-light/50'
                  )}
                >
                  <div className="flex items-start gap-2">
                    {!n.isRead && (
                      <span className="mt-1.5 w-2 h-2 rounded-full bg-alo-cta-accent shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-alo-text leading-snug">
                        {n.title}
                      </p>
                      <p className="text-xs text-alo-text-secondary mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 mx-auto text-alo-text-muted/40 mb-2" />
                <p className="text-sm text-alo-text-muted">No notifications</p>
              </div>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="px-4 py-2.5 bg-alo-page border-t border-alo-border">
              <button
                onClick={() => setOpen(false)}
                className="text-xs font-medium text-alo-brand hover:underline cursor-pointer"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Shell Component
// ============================================================

export default function CrmAdminShell({ children }: { children: ReactNode }) {
  const { user, sidebarOpen, setSidebarOpen } = usePortalStore();

  const roleDisplay = formatCrmRole(user?.crmRole, user?.department);
  const userInitials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2) || 'AD';

  return (
    <div className="h-screen flex flex-col bg-alo-page overflow-hidden">
      {/* ========== Top Header Bar ========== */}
      <header className="h-14 bg-white border-b border-alo-border flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
        {/* Left: Mobile menu + Logo + Role Badge */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden cursor-pointer">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-white">
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Logo (desktop only) */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-alo-brand text-white flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-alo-text">ALO Education</span>
          </div>

          {/* Role Badge (hidden on smallest screens) */}
          <div className="hidden sm:block ml-2 lg:ml-4">
            <Badge className="text-[11px] font-semibold bg-alo-brand-light text-alo-brand border border-blue-200 hover:bg-alo-brand-light">
              {roleDisplay}
            </Badge>
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-2">
          <NotificationDropdown />

          <Separator orientation="vertical" className="h-6 mx-1 hidden md:block" />

          <div className="flex items-center gap-2 ml-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-alo-brand-light text-alo-brand text-xs font-semibold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-alo-text leading-tight">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-alo-text-secondary leading-tight">{roleDisplay}</p>
            </div>
          </div>
        </div>
      </header>

      {/* ========== Body: Sidebar + Content ========== */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-alo-border shrink-0">
          <SidebarContent />
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}