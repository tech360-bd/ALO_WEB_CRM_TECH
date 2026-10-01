'use client';

import { useEffect, useRef, useState } from 'react';
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
  User,
  UserPlus,
  GraduationCap,
  FileText,
  FileUp,
  DollarSign,
  BarChart3,
  MessageSquare,
  BookOpen,
  Share2,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Bell,
  ChevronRight,
  Handshake,
} from 'lucide-react';

interface NavItem {
  icon: React.ElementType;
  label: string;
  view: PortalView;
  badge?: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', view: 'partner-dashboard' },
  { icon: User, label: 'Profile', view: 'partner-profile' },
  { icon: UserPlus, label: 'Submit Lead', view: 'partner-leads' },
  { icon: GraduationCap, label: 'My Students', view: 'partner-students' },
  { icon: FileText, label: 'Applications', view: 'partner-applications' },
  { icon: FileUp, label: 'Documents', view: 'partner-documents' },
  { icon: DollarSign, label: 'Commission', view: 'partner-commission' },
  { icon: BarChart3, label: 'Reports', view: 'partner-reports' },
  { icon: MessageSquare, label: 'Messages', view: 'partner-messages' },
  { icon: BookOpen, label: 'Resources', view: 'partner-resources' },
  { icon: Share2, label: 'Referrals', view: 'partner-referrals' },
  { icon: Settings, label: 'Settings', view: 'partner-settings' },
  { icon: HelpCircle, label: 'Help', view: 'partner-help' },
];

export default function PartnerPortalShell({ children }: { children: React.ReactNode }) {
  const { user, currentView, setView, logout, hydrate, notifications, sidebarOpen, setSidebarOpen } =
    usePortalStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-alo-brand text-white flex items-center justify-center">
          <Handshake className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-alo-text truncate">ALO Education</p>
          <p className="text-xs text-alo-text-secondary">Partner Portal</p>
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
                onClick={() => setView(item.view)}
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
                {item.badge && !isActive && (
                  <span className="text-[11px] leading-none font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                    {item.badge}
                  </span>
                )}
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
          className="w-full justify-start text-alo-text-secondary hover:text-red-600 hover:bg-red-50 h-10"
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
      <header className="h-14 bg-white border-b border-alo-border flex items-center justify-between px-4 lg:px-6 shrink-0 z-30">
        <div className="flex items-center gap-3">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              {sidebarContent}
            </SheetContent>
          </Sheet>
          <div className="hidden lg:flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-alo-brand text-white flex items-center justify-center">
              <Handshake className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-alo-text">ALO Education</span>
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-4">
            <Badge variant="secondary" className="font-mono text-xs bg-slate-100 text-slate-600">
              {user?.id}
            </Badge>
            <Badge variant="brand" className="text-xs">
              Partner
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="w-5 h-5 text-alo-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
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
                      setView('partner-notifications');
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
                {user?.name
                  ?.split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2) || 'P'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-alo-text leading-tight">{user?.name}</p>
              <p className="text-xs text-alo-text-secondary">{user?.id}</p>
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:block w-64 bg-white border-r border-alo-border shrink-0 overflow-y-auto">
          {sidebarContent}
        </aside>
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}