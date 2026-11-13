'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import PortalFooter from '@/components/portals/PortalFooter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  GraduationCap,
  LayoutDashboard,
  User,
  Search,
  GitCompare,
  FileText,
  MessageSquare,
  Shield,
  Award,
  CalendarDays,
  Sparkles,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  FolderOpen SVG — inline as specified                                */
/* ------------------------------------------------------------------ */
function FolderOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Navigation configuration                                            */
/* ------------------------------------------------------------------ */
interface NavItem {
  icon: React.ElementType;
  label: string;
  view: PortalView;
  badge?: 'unread-messages';
}

const mainNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'student-dashboard' },
  { icon: User, label: 'My Profile', view: 'student-profile' },
  { icon: Search, label: 'Course Finder', view: 'student-course-finder' },
  { icon: GitCompare, label: 'Shortlist & Compare', view: 'student-favorites' },
  { icon: FileText, label: 'My Applications', view: 'student-applications' },
  { icon: FolderOpenIcon, label: 'My Documents', view: 'student-documents' },
  { icon: MessageSquare, label: 'Messages', view: 'student-messages', badge: 'unread-messages' },
  { icon: Shield, label: 'Visa Guidance', view: 'student-visa' },
  { icon: Award, label: 'Scholarships', view: 'student-scholarships' },
  { icon: CalendarDays, label: 'Appointments', view: 'student-appointments' },
  { icon: Sparkles, label: 'AI Study Coach', view: 'student-ai-advisor' },
  { icon: CreditCard, label: 'Payments', view: 'student-payments' },
  { icon: Bell, label: 'Notifications', view: 'student-notifications' },
];

const bottomNavItems: NavItem[] = [
  { icon: Settings, label: 'Settings', view: 'student-settings' },
  { icon: HelpCircle, label: 'Help', view: 'student-help' },
];

/* ------------------------------------------------------------------ */
/*  Realtime transport status labels (spec s86, s94)                    */
/* ------------------------------------------------------------------ */
const REALTIME_STATUS_LABEL: Record<string, string> = {
  idle: 'offline',
  connecting: 'connecting',
  connected: 'live',
  reconnecting: 'reconnecting',
  not_configured: 'not configured',
  error: 'unavailable',
};

const REALTIME_STATUS_HINT: Record<string, string> = {
  idle: 'No live connection is open for this session.',
  connecting: 'Opening the live notification stream…',
  connected: 'Live: new notifications arrive without refreshing.',
  reconnecting: 'The live connection dropped and is being re-established.',
  not_configured:
    'Realtime updates are not enabled on this deployment. Refresh the page to check for new notifications.',
  error: 'The live notification stream failed. Refresh the page to check for new notifications.',
};

/* ------------------------------------------------------------------ */
/*  Sidebar content (shared between desktop & mobile sheet)             */
/* ------------------------------------------------------------------ */
function SidebarContent() {
  const { currentView, setView, logout, notifications } = usePortalStore();
  const unreadMessages = notifications.filter(
    (n) => n.type === 'message' && !n.isRead
  ).length;

  return (
    <div className="flex flex-col h-full">
      {/* Brand header */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-alo-brand text-white flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-alo-text truncate">
            ALO Education
          </p>
          <p className="text-xs text-alo-text-muted">Student Portal</p>
        </div>
      </div>

      <Separator />

      {/* Main nav items */}
      <ScrollArea className="flex-1 py-2 custom-scrollbar">
        <nav className="px-3 space-y-0.5">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                  isActive
                    ? 'bg-alo-brand-light text-alo-brand font-semibold border-l-[3px] border-alo-brand'
                    : 'text-alo-text-secondary hover:bg-alo-page'
                )}
              >
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] shrink-0',
                    isActive ? 'text-alo-brand' : 'text-alo-text-muted'
                  )}
                />
                <span className="flex-1 text-left truncate">{item.label}</span>
                {item.badge === 'unread-messages' && unreadMessages > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[var(--alo-error)] text-white text-[11px] flex items-center justify-center font-bold shrink-0">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <Separator className="my-2" />

        {/* Bottom nav items */}
        <nav className="px-3 space-y-0.5 pb-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => setView(item.view)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
                  isActive
                    ? 'bg-alo-brand-light text-alo-brand font-semibold border-l-[3px] border-alo-brand'
                    : 'text-alo-text-secondary hover:bg-alo-page'
                )}
              >
                <Icon
                  className={cn(
                    'w-[18px] h-[18px] shrink-0',
                    isActive ? 'text-alo-brand' : 'text-alo-text-muted'
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* Sign out */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-crm-danger-text hover:bg-crm-danger-bg"
          onClick={logout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StudentPortalShell                                                  */
/* ------------------------------------------------------------------ */
export default function StudentPortalShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, setView, notifications, sidebarOpen, setSidebarOpen, realtimeStatus } =
    usePortalStore();
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'S';

  /* Close notification dropdown on outside click */
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
      {/* ============ TOPBAR ============ */}
      <header className="h-14 bg-white border-b border-alo-border flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
        {/* Left section */}
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>

          {/* Logo — desktop only */}
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-alo-brand text-white flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-alo-text">
              ALO Education
            </span>
          </div>

          {/* Student ID badge */}
          {user && (
            <Badge
              variant="secondary"
              className="font-mono text-xs bg-[var(--alo-surface-muted)] text-[var(--alo-body)] hidden sm:inline-flex"
            >
              ID: {user.id.slice(0, 8).toUpperCase()}
            </Badge>
          )}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notification bell */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            >
              <Bell className="w-5 h-5 text-alo-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[var(--alo-error)] text-white text-[11px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>

            {showNotifDropdown && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-alo-border z-50 overflow-hidden">
                <div className="px-4 py-3 bg-alo-page border-b border-alo-border flex items-center justify-between">
                  <span className="font-semibold text-sm text-alo-text">
                    Notifications
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Live transport state (s86/s94): a bell that silently never
                        updates is indistinguishable from an empty inbox. */}
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold',
                        realtimeStatus === 'connected' && 'bg-crm-success-bg text-crm-success-text',
                        realtimeStatus === 'connecting' && 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
                        realtimeStatus === 'reconnecting' && 'bg-crm-warning-bg text-crm-warning-text',
                        realtimeStatus === 'not_configured' && 'bg-[var(--alo-page)] text-[var(--alo-body)]',
                        realtimeStatus === 'error' && 'bg-crm-danger-bg text-crm-danger-text',
                        realtimeStatus === 'idle' && 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]',
                      )}
                      title={REALTIME_STATUS_HINT[realtimeStatus] ?? ''}
                    >
                      <span
                        className={cn(
                          'size-1.5 rounded-full',
                          realtimeStatus === 'connected' && 'bg-[var(--alo-success)]',
                          realtimeStatus === 'connecting' && 'bg-[var(--alo-brand)]',
                          realtimeStatus === 'reconnecting' && 'animate-pulse bg-[var(--alo-warning)]',
                          realtimeStatus === 'not_configured' && 'bg-[var(--alo-page)]',
                          realtimeStatus === 'error' && 'bg-[var(--alo-error)]',
                          realtimeStatus === 'idle' && 'bg-[var(--alo-page)]',
                        )}
                      />
                      {REALTIME_STATUS_LABEL[realtimeStatus] ?? 'idle'}
                    </span>
                    <button
                      onClick={() => {
                        setView('student-notifications');
                        setShowNotifDropdown(false);
                      }}
                      className="text-xs text-alo-brand hover:underline font-medium"
                    >
                      View All
                    </button>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 5).map((n) => (
                      <button
                        key={n.id}
                        onClick={() => {
                          setShowNotifDropdown(false);
                        }}
                        className={cn(
                          'w-full text-left px-4 py-3 border-b border-alo-border hover:bg-alo-page transition',
                          !n.isRead && 'bg-alo-brand-light/50'
                        )}
                      >
                        <p className="text-sm font-medium text-alo-text">
                          {n.title}
                        </p>
                        <p className="text-xs text-alo-text-muted mt-0.5 line-clamp-1">
                          {n.message}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-alo-text-muted p-4 text-center">
                      {/* An empty list means different things depending on whether
                          the stream is healthy. Never imply "no notifications"
                          when we could not actually check (s91, s94). */}
                      {realtimeStatus === 'not_configured' || realtimeStatus === 'error'
                        ? 'Live updates are unavailable, so this list may be incomplete. Open View All to reload.'
                        : realtimeStatus === 'connecting' || realtimeStatus === 'reconnecting'
                          ? 'Connecting to your notifications…'
                          : 'No notifications'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User avatar + name */}
          <div className="flex items-center gap-2 ml-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-alo-brand-light text-alo-brand text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-alo-text leading-tight">
                {user?.name || 'Student'}
              </p>
              <p className="text-xs text-alo-text-muted">Student</p>
            </div>
          </div>
        </div>
      </header>

      {/* ============ BODY ============ */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 bg-white border-r border-alo-border shrink-0">
          <SidebarContent />
        </aside>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
          <main className="flex-1 p-4 lg:p-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
          {/* Site footer — a sibling of <main>, so it is the page's only footer landmark. */}
          <PortalFooter scope="student" />
        </div>
      </div>
    </div>
  );
}