'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  FileText,
  MessageSquare,
  CalendarDays,
  Target,
  BarChart3,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'counselor-dashboard' },
  { icon: Users, label: 'My Students', view: 'counselor-students' },
  { icon: Target, label: 'Leads', view: 'counselor-leads' },
  { icon: FileText, label: 'Applications', view: 'counselor-applications' },
  { icon: MessageSquare, label: 'Inbox', view: 'counselor-inbox' },
  { icon: CalendarDays, label: 'Appointments', view: 'counselor-appointments' },
  { icon: BarChart3, label: 'Reports', view: 'counselor-reports' },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: 'Settings', view: 'counselor-settings' },
  { icon: HelpCircle, label: 'Help', view: 'counselor-help' },
];

function SidebarContent() {
  const { currentView, setView, logout } = usePortalStore();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-alo-brand text-white flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-alo-text truncate">ALO Education</p>
          <p className="text-xs text-alo-text-muted">Counselor Portal</p>
        </div>
      </div>
      <Separator />

      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view as any)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-alo-brand-light text-alo-brand font-semibold'
                    : 'text-alo-text-secondary hover:bg-alo-page'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-alo-brand' : 'text-alo-text-muted')} />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-alo-brand shrink-0" />}
              </button>
            );
          })}
        </nav>

        <Separator className="my-2" />

        <nav className="px-3 space-y-0.5 pb-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view as any)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer',
                  isActive
                    ? 'bg-alo-brand-light text-alo-brand font-semibold'
                    : 'text-alo-text-secondary hover:bg-alo-page'
                )}
              >
                <Icon className={cn('w-[18px] h-[18px] shrink-0', isActive ? 'text-alo-brand' : 'text-alo-text-muted')} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:bg-red-50 h-10 cursor-pointer"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

export default function CounselorPortalShell({ children }: { children: React.ReactNode }) {
  const { user, notifications, sidebarOpen, setSidebarOpen } = usePortalStore();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'C';

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="h-screen flex flex-col bg-alo-page overflow-hidden">
      <header className="h-14 bg-white border-b border-alo-border flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="lg:hidden cursor-pointer">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-alo-brand text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-alo-text">ALO Education</span>
          </div>
          <Badge variant="secondary" className="text-[11px] bg-alo-brand-light text-alo-brand border-0 hidden sm:inline-flex">
            Counselor
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="relative cursor-pointer" onClick={() => setShowNotifDropdown((v) => !v)}>
                  <Bell className="w-5 h-5 text-alo-text-secondary" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center font-bold px-1">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Notifications</TooltipContent>
            </Tooltip>
          </div>
          <Separator orientation="vertical" className="h-6 mx-1 hidden md:block" />
          <div className="flex items-center gap-2 ml-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-alo-brand-light text-alo-brand text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-alo-text leading-tight">{user?.name || 'Counselor'}</p>
              <p className="text-xs text-alo-text-secondary leading-tight">Counselor</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:block w-64 bg-white border-r border-alo-border shrink-0">
          <SidebarContent />
        </aside>
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
