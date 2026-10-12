'use client';
import { useState, useEffect, ReactNode } from 'react';
import { usePortalStore, type PortalView } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Search, Bell, ChevronRight, LogOut } from 'lucide-react';
import { getNavForRole, getFrequentForRole, type NavItem } from '@/lib/portal-nav';

type Props = {
  role: string;
  title?: string;
  subtitle?: string;
  primaryAction?: { label: string; onClick: () => void; icon?: any };
  children: ReactNode;
  showSearch?: boolean;
  onSearch?: (q: string) => void;
};

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const hasChildren = !!(item.children && item.children.length);
  const [open, setOpen] = useState(active);
  useEffect(() => { if (active) setOpen(true); }, [active]);
  return (
    <div>
      <button
        onClick={() => hasChildren ? setOpen(!open) : onClick()}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          active ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-700 hover:bg-slate-100',
        )}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate">{item.label}</span>
        {item.badge && <Badge className={cn('text-[10px] px-1.5 py-0', active ? 'bg-white text-orange-600' : 'bg-orange-100 text-orange-700')}>{item.badge}</Badge>}
        {hasChildren && <ChevronRight className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-90')} />}
      </button>
      {hasChildren && open && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-200 pl-3">
          {item.children!.map(child => (
            <button key={child.label} onClick={onClick} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-900">
              <child.icon className="w-3.5 h-3.5" />{child.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

type SidebarContentProps = {
  role: string;
  collapsed: boolean;
  collapsible?: boolean;
  navGroups: ReturnType<typeof getNavForRole>;
  currentView: string;
  user: any;
  setView: (v: PortalView) => void;
  setMobileOpen: (o: boolean) => void;
  logout: () => void;
};

function SidebarContent({ role, collapsed, collapsible = false, navGroups, currentView, user, setView, setMobileOpen, logout }: SidebarContentProps) {
  const isActive = (view?: string) => view ? currentView === view : false;
  return (
    <div className="flex flex-col h-full bg-white">
      <div className={cn('p-4 flex items-center gap-3 border-b border-slate-200', collapsible && collapsed && 'justify-center px-2')}>
        <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm">ALO</div>
        {(!collapsible || !collapsed) && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-900 leading-tight truncate">ALO Education</p>
            <p className="text-[11px] text-slate-500 capitalize">{role.replace('_', ' ')}</p>
          </div>
        )}
      </div>
      <ScrollArea className="flex-1 py-3">
        <nav className={cn('px-3 space-y-5', collapsible && collapsed && 'px-2')}>
          {navGroups.map(group => (
            <div key={group.title}>
              {group.title && (!collapsible || !collapsed) && <p className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{group.title}</p>}
              <div className="space-y-0.5">
                {group.items.map(item => (
                  <NavLink key={item.label} item={item} active={!!item.view && isActive(item.view as PortalView)} onClick={() => {
                    if (item.view) setView(item.view as PortalView);
                    setMobileOpen(false);
                  }} />
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-3 border-t border-slate-200">
        <div className={cn('flex items-center gap-3', collapsible && collapsed && 'justify-center')}>
          <Avatar className="w-8 h-8"><AvatarFallback className="bg-slate-100 text-slate-700 text-xs">{user?.name?.[0] || 'U'}</AvatarFallback></Avatar>
          {(!collapsible || !collapsed) && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
            </div>
          )}
          {(!collapsible || !collapsed) && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={logout}><LogOut className="w-4 h-4" /></Button>}
        </div>
      </div>
    </div>
  );
}

export default function UnifiedPortalShell({ role, title, subtitle, primaryAction, children, showSearch = true, onSearch }: Props) {
  const { user, currentView, setView, logout } = usePortalStore() as any;
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const navGroups = getNavForRole(role);
  const frequent = getFrequentForRole(role);

  const isActive = (view?: string) => view ? currentView === view : false;

  useEffect(() => {
    const t = setTimeout(() => onSearch?.(searchQ), 400);
    return () => clearTimeout(t);
  }, [searchQ, onSearch]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-14 bg-white border-b border-slate-200 flex items-center gap-3 px-4 sticky top-0 z-30">
        <Button variant="ghost" size="icon" className="hidden lg:flex h-8 w-8" onClick={() => setCollapsed(!collapsed)}><Menu className="w-4 h-4" /></Button>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="lg:hidden h-8 w-8"><Menu className="w-4 h-4" /></Button></SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent role={role} collapsed={collapsed} navGroups={navGroups} currentView={currentView} user={user} setView={setView} setMobileOpen={setMobileOpen} logout={logout} />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex items-center gap-4 min-w-0">
          {title ? (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-900 truncate">{title}</h1>
              {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
            </div>
          ) : <div className="text-sm font-bold">Dashboard</div>}
          {showSearch && (
            <div className="hidden md:flex relative max-w-xs flex-1 ml-4">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search students, leads, applications..." className="pl-9 h-9 bg-slate-50 border-slate-200 text-sm" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {primaryAction && (
            <Button onClick={primaryAction.onClick} className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold h-9 hidden sm:flex">
              {primaryAction.icon && <primaryAction.icon className="w-4 h-4 mr-1" />}{primaryAction.label}
            </Button>
          )}
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="icon" className="h-8 w-8 relative"><Bell className="w-4 h-4" /><span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" /></Button>
          <Avatar className="w-8 h-8 hidden sm:flex"><AvatarFallback>{user?.name?.[0] || 'U'}</AvatarFallback></Avatar>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className={cn('hidden lg:block border-r border-slate-200 bg-white shrink-0 overflow-hidden transition-all duration-200', collapsed ? 'w-16' : 'w-64')}>
          <SidebarContent role={role} collapsed={collapsed} collapsible navGroups={navGroups} currentView={currentView} user={user} setView={setView} setMobileOpen={setMobileOpen} logout={logout} />
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-[1600px] mx-auto space-y-6">
            {showSearch && (
              <div className="md:hidden relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <Input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search..." className="pl-9 h-9 bg-white border-slate-200" />
              </div>
            )}
            {primaryAction && (
              <Button onClick={primaryAction.onClick} className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:hidden">
                {primaryAction.icon && <primaryAction.icon className="w-4 h-4 mr-2" />}{primaryAction.label}
              </Button>
            )}
            {children}
          </div>
        </main>
      </div>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around py-1 z-30">
        {frequent.slice(0, 5).map(item => {
          const Icon = item.icon;
          const active = !!item.view && isActive(item.view as PortalView);
          return (
            <button key={item.label} onClick={() => item.view && setView(item.view as PortalView)} className={cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg', active ? 'text-orange-600' : 'text-slate-500')}>
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium truncate max-w-[60px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
      <div className="lg:hidden h-16" />
    </div>
  );
}
