'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Search,
  User,
  Users,
  UserCheck,
  Shield,
  Building2,
  Megaphone,
  Menu,
  Bell,
  LogOut,
  ChevronDown,
  Briefcase,
  X,
  MessageSquare,
  Bot,
  Brain,
  CheckSquare,
  ClipboardList,
  GraduationCap,
  BarChart3,
  Phone,
  Mail,
  DollarSign,
  FileCheck,
  Globe,
  Settings,
  BookOpen,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

// ─── Types ─────────────────────────────────────────────────────────────────

interface PortalLayoutProps {
  title: string;
  user?: { name: string; email: string; role: string; avatar?: string } | null;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: { key: string; label: string; icon: React.ReactNode; badge?: number }[];
}

// ─── Navigation Definition ──────────────────────────────────────────────────

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Student',
    items: [
      { key: 'student-dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { key: 'student-applications', label: 'Applications', icon: <FileText className="h-4 w-4" /> },
      { key: 'student-documents', label: 'Documents', icon: <FolderOpen className="h-4 w-4" /> },
      { key: 'student-course-finder', label: 'Course Finder', icon: <Search className="h-4 w-4" /> },
      { key: 'student-profile-form', label: 'Profile', icon: <User className="h-4 w-4" /> },
    ],
  },
  {
    label: 'CRM & Operations',
    items: [
      { key: 'crm-dashboard', label: 'Command Center', icon: <LayoutDashboard className="h-4 w-4" /> },
      { key: 'crm-leads', label: 'Leads', icon: <Users className="h-4 w-4" /> },
      { key: 'counselor-student-360', label: 'Student 360°', icon: <UserCheck className="h-4 w-4" /> },
      { key: 'application-manager-portal', label: 'Applications', icon: <ClipboardList className="h-4 w-4" /> },
      { key: 'communication-center', label: 'Communication', icon: <MessageSquare className="h-4 w-4" />, badge: 12 },
      { key: 'document-hub', label: 'Document Hub', icon: <FileCheck className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Marketing & Content',
    items: [
      { key: 'marketing-dashboard', label: 'Marketing', icon: <Megaphone className="h-4 w-4" /> },
      { key: 'social-dashboard', label: 'Social Media', icon: <Globe className="h-4 w-4" /> },
      { key: 'knowledge-center', label: 'Knowledge Base', icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
  {
    label: 'AI & Automation',
    items: [
      { key: 'ai-workforce-control-room', label: 'AI Workforce', icon: <Brain className="h-4 w-4" />, badge: 2000 },
      { key: 'ai-command-center', label: 'AI Command', icon: <Bot className="h-4 w-4" />, badge: 3 },
      { key: 'ai-approval-center', label: 'Approvals', icon: <CheckSquare className="h-4 w-4" />, badge: 5 },
      { key: 'central-ai-command', label: 'AI Central', icon: <Target className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Admin & System',
    items: [
      { key: 'super-admin-dashboard', label: 'Command Center', icon: <LayoutDashboard className="h-4 w-4" /> },
      { key: 'employee-management', label: 'Employees', icon: <Users className="h-4 w-4" /> },
      { key: 'access-control-center', label: 'Access Control', icon: <Shield className="h-4 w-4" /> },
      { key: 'admin-course-management', label: 'Universities', icon: <Building2 className="h-4 w-4" /> },
      { key: 'finance-dashboard', label: 'Finance', icon: <DollarSign className="h-4 w-4" /> },
      { key: 'visa-dashboard', label: 'Visa', icon: <Globe className="h-4 w-4" /> },
      { key: 'audit-logs', label: 'Audit Logs', icon: <BarChart3 className="h-4 w-4" /> },
      { key: 'weekly-reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
      { key: 'settings-panel', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Partner',
    items: [
      { key: 'partner-portal', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { key: 'partner-admin-dashboard', label: 'Admin', icon: <Briefcase className="h-4 w-4" /> },
      { key: 'partner-comm-hub', label: 'Communication', icon: <Phone className="h-4 w-4" /> },
      { key: 'partner-marketing-studio', label: 'Marketing', icon: <Megaphone className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Communication',
    items: [
      { key: 'omnichannel-communication-center', label: 'Omnichannel', icon: <MessageSquare className="h-4 w-4" /> },
      { key: 'whatsapp-command-center', label: 'WhatsApp', icon: <Phone className="h-4 w-4" /> },
      { key: 'comm-command-center', label: 'Command', icon: <BarChart3 className="h-4 w-4" /> },
      { key: 'comm-templates', label: 'Templates', icon: <Mail className="h-4 w-4" /> },
      { key: 'phone-call-center', label: 'Call Center', icon: <Phone className="h-4 w-4" /> },
      { key: 'unified-inbox', label: 'Unified Inbox', icon: <GraduationCap className="h-4 w-4" /> },
    ],
  },
];

// ─── Sidebar Logo ──────────────────────────────────────────────────────────

function SidebarLogo() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-blue text-white font-bold text-lg">
        A
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-alo-black leading-tight">ALO Education</span>
        <span className="text-[11px] text-alo-gray leading-tight">Study Abroad OS</span>
      </div>
    </div>
  );
}

// ─── Sidebar Nav Item ───────────────────────────────────────────────────────

function SidebarNavItem({
  item,
  isActive,
  onNavigate,
  onClose,
}: {
  item: { key: string; label: string; icon: React.ReactNode; badge?: number };
  isActive: boolean;
  onNavigate: (view: string) => void;
  onClose?: () => void;
}) {
  return (
    <button
      onClick={() => {
        onNavigate(item.key);
        onClose?.();
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 min-h-[36px]',
        isActive
          ? 'bg-alo-blue text-white shadow-sm'
          : 'text-alo-gray hover:bg-alo-gray-light hover:text-alo-black'
      )}
    >
      <span className="shrink-0">{item.icon}</span>
      <span className="flex-1 text-left truncate">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className={cn(
          'flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold',
          isActive ? 'bg-white/20 text-white' : 'bg-alo-orange text-white'
        )}>
          {item.badge}
        </span>
      )}
    </button>
  );
}

// ─── Sidebar Content (reused in desktop & mobile sheet) ─────────────────────

function SidebarContent({
  activeView,
  onNavigate,
  user,
  onLogout,
  onClose,
}: {
  activeView: string;
  onNavigate: (view: string) => void;
  user?: { name: string; email: string; role: string; avatar?: string } | null;
  onLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <SidebarLogo />
      <Separator className="bg-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2 py-2">
        {/* Desktop: always expanded */}
        <div className="hidden md:block">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-alo-gray/70">
                {group.label}
              </p>
              <nav className="flex flex-col gap-0.5" role="navigation" aria-label={`${group.label} navigation`}>
                {group.items.map((item) => (
                  <SidebarNavItem
                    key={item.key}
                    item={item}
                    isActive={activeView === item.key}
                    onNavigate={onNavigate}
                    onClose={onClose}
                  />
                ))}
              </nav>
            </div>
          ))}
        </div>

        {/* Mobile: accordion groups */}
        <div className="md:hidden">
          <Accordion type="multiple" defaultValue={['Student', 'CRM & Operations']}>
            {NAV_GROUPS.map((group) => (
              <AccordionItem key={group.label} value={group.label} className="border-0">
                <AccordionTrigger className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-alo-gray/70 hover:no-underline">
                  {group.label}
                </AccordionTrigger>
                <AccordionContent className="pb-1">
                  <nav className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <SidebarNavItem
                        key={item.key}
                        item={item}
                        isActive={activeView === item.key}
                        onNavigate={onNavigate}
                        onClose={onClose}
                      />
                    ))}
                  </nav>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </ScrollArea>

      {/* User Section */}
      <Separator className="bg-border" />
      <div className="p-4">
        {user ? (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-alo-blue/10 text-alo-blue text-xs font-semibold">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-alo-black">{user.name}</p>
              <p className="truncate text-xs text-alo-gray">{user.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-alo-gray hover:text-red-500"
              onClick={onLogout}
              aria-label="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-alo-gray">
            <Briefcase className="h-4 w-4" />
            <span>Demo Mode</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Portal Layout ─────────────────────────────────────────────────────

export function PortalLayout({
  title,
  user,
  activeView,
  onNavigate,
  onLogout,
  children,
}: PortalLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-alo-gray-light">
      {/* ─── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-border bg-white">
        <SidebarContent
          activeView={activeView}
          onNavigate={onNavigate}
          user={user}
          onLogout={onLogout}
        />
      </aside>

      {/* ─── Mobile Sidebar Sheet ─────────────────────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-white">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
          </SheetHeader>
          <SidebarContent
            activeView={activeView}
            onNavigate={onNavigate}
            user={user}
            onLogout={onLogout}
            onClose={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* ─── Main Area ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b border-border bg-white/80 backdrop-blur-sm px-4 md:px-6">
          {/* Left: hamburger + title */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-base font-semibold text-alo-black truncate">{title}</h1>
          </div>

          {/* Right: notifications + avatar dropdown */}
          <div className="flex items-center gap-2">
            {/* Notification Bell */}
            <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
              <Bell className="h-4.5 w-4.5 text-alo-gray" />
              <Badge className="absolute -top-0.5 -right-0.5 h-4.5 w-4.5 items-center justify-center rounded-full bg-alo-orange p-0 text-[9px] font-bold text-white border-2 border-white">
                3
              </Badge>
            </Button>

            {/* User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user?.avatar} alt={user?.name ?? 'User'} />
                    <AvatarFallback className="bg-alo-blue/10 text-alo-blue text-[11px] font-semibold">
                      {user?.name
                        ? user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)
                        : 'DM'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm text-alo-black font-medium truncate max-w-[120px]">
                    {user?.name ?? 'Demo User'}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-alo-gray" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user ? (
                  <>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-alo-black truncate">{user.name}</p>
                      <p className="text-xs text-alo-gray truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={onLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Exit Demo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-alo-gray-light alo-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
