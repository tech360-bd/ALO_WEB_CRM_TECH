'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import PortalFooter from '@/components/portals/PortalFooter';
import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  GraduationCap,
  FileText,
  FileUp,
  MessageSquare,
  MessageCircle,
  CalendarDays,
  Clock,
  CalendarOff,
  TrendingUp,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  ChevronRight,
  Briefcase,
  ShieldAlert,
  Search,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: PortalView;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'employee-dashboard' },
  { icon: CheckSquare, label: 'Tasks', view: 'employee-tasks' },
  { icon: Users, label: 'Leads', view: 'employee-leads' },
  { icon: GraduationCap, label: 'Students', view: 'employee-students' },
  { icon: FileText, label: 'Applications', view: 'employee-applications' },
  { icon: FileUp, label: 'Documents', view: 'employee-documents' },
  { icon: MessageSquare, label: 'Messages', view: 'employee-messages' },
  { icon: MessageCircle, label: 'WhatsApp', view: 'employee-whatsapp' },
  { icon: CalendarDays, label: 'Calendar', view: 'employee-calendar' },
  { icon: Clock, label: 'Attendance', view: 'employee-attendance' },
  { icon: CalendarOff, label: 'Leave', view: 'employee-leave' },
  { icon: TrendingUp, label: 'Performance', view: 'employee-performance' },
  { icon: BarChart3, label: 'Reports', view: 'employee-reports' },
  { icon: Settings, label: 'Settings', view: 'employee-settings' },
  { icon: HelpCircle, label: 'Help', view: 'employee-help' },
];

export default function EmployeePortalShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, currentView, setView, logout, hydrate, notifications, setNotifications, sidebarOpen, setSidebarOpen } =
    usePortalStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [actingAs, setActingAs] = useState<{ sessionId: string; userId: string; role: string; name: string; reason: string; expiresAt: string | null; realActor: string } | null>(null);
  const [serverIdentity, setServerIdentity] = useState<{ id: string; name: string; role: string; branch: string; country: string } | null>(null);
  const [actingAsError, setActingAsError] = useState('');
  const [taskCount, setTaskCount] = useState<number | null>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const displayName = actingAs?.name || serverIdentity?.name || user?.name || 'Employee';
  const designation = actingAs?.role || serverIdentity?.role || (user as any)?.designation || 'Employee';
  const branch = serverIdentity?.branch || '';
  const country = serverIdentity?.country || '';

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/employee/acting-as', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled) return;
        if (payload?.success && payload?.isActing && payload.actingAs) {
          setActingAs({
            sessionId: payload.actingAs.sessionId,
            userId: payload.actingAs.userId,
            role: payload.actingAs.role,
            name: payload.actingAs.name,
            reason: payload.actingAs.reason || '',
            expiresAt: payload.actingAs.expiresAt || null,
            realActor: payload.realActor?.name || payload.realActor?.userId || 'Super Admin',
          });
        } else {
          setActingAs(null);
        }
      })
      .catch(() => { if (!cancelled) setActingAs(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/portal-auth/session', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled || !payload?.success || !payload.data?.user) return;
        const profile = payload.data.user.employeeProfile;
        const roles = Array.isArray(payload.data.roles) ? payload.data.roles : [];
        setServerIdentity({
          id: payload.data.user.id,
          name: payload.data.user.name || '',
          role: roles[0]?.name || payload.data.user.userType || '',
          branch: profile?.branch || '',
          country: '',
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/employee/tasks?status=pending&limit=1', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && payload?.success && Number.isFinite(payload.pagination?.total)) setTaskCount(payload.pagination.total);
      })
      .catch(() => {});
    fetch('/api/employee-access/notifications?unreadOnly=false', { cache: 'no-store' })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled && payload?.success && Array.isArray(payload.notifications)) setNotifications(payload.notifications);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [setNotifications]);

  const handleStopActingAs = async () => {
    setActingAsError('');
    try {
      const response = await fetch('/api/portal-auth/acting-as/stop', { method: 'POST' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) {
        setActingAsError(payload?.error || 'Acting-As session could not be ended.');
        return;
      }
      setActingAs(null);
      router.replace('/super-admin/dashboard');
    } catch {
      setActingAsError('Acting-As session could not be ended. Retry before leaving this view.');
    }
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-alo-brand text-white flex items-center justify-center">
          <Briefcase className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-alo-text truncate">ALO Education</p>
          <p className="text-xs text-alo-text-secondary">Employee Portal</p>
        </div>
      </div>
      <Separator />
      <ScrollArea className="flex-1 py-3">
        <nav className="px-3 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const target = `/employee/${item.view.replace(/^employee-/, '')}`;
            const isActive = pathname === target || (item.view === 'employee-dashboard' && pathname.endsWith('-dashboard'));
            return (
              <button
                key={item.view}
                onClick={() => router.push(target)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-alo-brand-light text-alo-brand font-semibold'
                    : 'text-alo-text-secondary hover:bg-alo-page hover:text-alo-text'
                )}
              >
                <Icon
                  className={cn(
                    'w-[18px] h-[18px]',
                    isActive ? 'text-alo-brand' : 'text-alo-text-muted/60'
                  )}
                />
                <span className="flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-alo-brand" />}
              </button>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator />
      <div className="p-3">
        <Button
 variant="ghost"
 className="w-full justify-start text-alo-text-secondary hover:text-red-600 hover:bg-red-50 "
 onClick={logout}
 >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-alo-page overflow-hidden">
      {actingAs && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md z-50">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="w-5 h-5 text-amber-200 animate-pulse" />
            <span>SUPER ADMIN ACTING AS: <span className="underline decoration-wavy">{actingAs.role} / {actingAs.name}</span></span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-2">Real actor: {actingAs.realActor} · Reason: {actingAs.reason} · Expires {actingAs.expiresAt ? new Date(actingAs.expiresAt).toLocaleTimeString() : 'in 30 minutes'}</span>
          </div>
          <div className="flex items-center gap-2">
            {actingAsError && <span role="alert" className="text-xs font-semibold">{actingAsError}</span>}
            <Button size="sm" className="bg-white text-[var(--alo-cta-active)] hover:bg-white/90 font-bold shadow" onClick={handleStopActingAs}>Stop Acting-As</Button>
          </div>
        </div>
      )}
      <header className="h-14 bg-white border-b border-alo-border flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open employee navigation">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-alo-brand text-white flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-alo-text">ALO Education</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <Badge variant="secondary" className="font-mono text-xs bg-[var(--alo-surface-muted)] text-[var(--alo-body)]">
              {actingAs?.userId || serverIdentity?.id || user?.id || '—'}
            </Badge>
            <Badge variant="brand" className="text-xs">
              {designation}
            </Badge>
            <span className="hidden lg:inline text-xs text-[var(--alo-text-muted)]">{branch || 'Branch scope not assigned'}{country ? ` • ${country}` : ''}</span>
            <span className="hidden lg:inline-flex items-center gap-1 text-xs bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] px-2 py-1 rounded-full font-medium">{taskCount == null ? '—' : taskCount} open tasks</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[var(--alo-text-muted)]" />
            <input placeholder="Search students, leads..." className="pl-9 pr-3 h-9 text-xs bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-lg w-56 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-alo-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[11px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-alo-border z-50 overflow-hidden">
                <div className="px-4 py-3 bg-alo-page border-b border-alo-border flex items-center justify-between">
                  <span className="font-semibold text-sm text-alo-text">Notifications</span>
                  <button
                    onClick={() => {
                      router.push('/employee/notifications');
                      setShowNotifications(false);
                    }}
                    className="text-xs text-alo-brand hover:text-alo-brand font-medium"
                  >
                    View All
                  </button>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {notifications.slice(0, 5).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'px-4 py-3 border-b border-alo-border last:border-0',
                        !n.isRead && 'bg-alo-brand-light/50'
                      )}
                    >
                      <p className="text-sm font-medium text-alo-text">{n.title}</p>
                      <p className="text-xs text-alo-text-secondary mt-0.5 line-clamp-1">
                        {n.message}
                      </p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-sm text-alo-text-secondary p-4 text-center">
                      No notifications
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 ml-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-alo-brand-light text-alo-brand text-xs font-semibold">
                {displayName
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2) || 'E'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-alo-text leading-tight">{displayName}</p>
              <p className="text-xs text-alo-text-secondary">{actingAs?.userId || serverIdentity?.id || user?.id || ''}</p>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:block w-64 bg-white border-r border-alo-border shrink-0 overflow-y-auto">
          {sidebarContent}
        </aside>
        <div className="flex-1 overflow-y-auto flex flex-col">
          <main className="flex-1 p-4 lg:p-6">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
          {/* Site footer — a sibling of <main>, so it is the page's only footer landmark. */}
          <PortalFooter scope="employee" />
        </div>
      </div>
    </div>
  );
}