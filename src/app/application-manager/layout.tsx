'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import {
  LayoutDashboard, FileText, Plus, Users, Handshake, Building2, Lock,
  Send, FileCheck, Award, Shield, Calendar, MessageSquare, CheckSquare,
  BarChart3, Settings, Menu, X, LogOut, Eye, AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SIDEBAR_ITEMS = [
  { href: '/application-manager/dashboard', label: 'Dashboard', icon: LayoutDashboard, countKey: null },
  { href: '/application-manager/applications', label: 'All Applications', icon: FileText, countKey: 'total' },
  { href: '/application-manager/create', label: 'Create Application', icon: Plus, countKey: null },
  { href: '/application-manager/direct', label: 'Direct Applications', icon: Users, countKey: 'direct' },
  { href: '/application-manager/partner', label: 'Partner Applications', icon: Handshake, countKey: 'partner' },
  { href: '/application-manager/b2b', label: 'B2B Applications', icon: Building2, countKey: 'b2b', confidential: true },
  { href: '/application-manager/b2b/create', label: 'Create B2B Application', icon: Plus, countKey: null, confidential: true },
  { href: '/application-manager/b2b/providers', label: 'B2B Providers', icon: Lock, countKey: 'b2bProviders', confidential: true },
  { href: '/application-manager/submission-queue', label: 'Submission Queue', icon: Send, countKey: 'submitted' },
  { href: '/application-manager/document-review', label: 'Document Review', icon: FileCheck, countKey: 'documentsPending' },
  { href: '/application-manager/offer-management', label: 'Offer Management', icon: Award, countKey: 'offers' },
  { href: '/application-manager/cas-i20-coe', label: 'CAS / I-20 / COE', icon: Shield, countKey: 'casPending' },
  { href: '/application-manager/deadlines', label: 'Deadlines', icon: Calendar, countKey: 'urgentDeadlines' },
  { href: '/application-manager/comments', label: 'Comments', icon: MessageSquare, countKey: null },
  { href: '/application-manager/tasks', label: 'Tasks', icon: CheckSquare, countKey: 'pendingTasks' },
  { href: '/application-manager/reports', label: 'Reports', icon: BarChart3, countKey: null },
  { href: '/application-manager/settings', label: 'Settings', icon: Settings, countKey: null },
];

export default function ApplicationManagerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const token = usePortalStore(s => s.token);
  const user = usePortalStore(s => s.user);
  const hydrate = usePortalStore(s => s.hydrate);
  const clearAuth = usePortalStore(s => (s as any).clearAuth || s.logout);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const checkAuth = async () => {
      setAuthError(null);
      if (!token) {
        setAuthError('Authentication required. Please login.');
        setLoadingAuth(false);
        return;
      }
      try {
        const res = await fetch('/api/applications/metrics', { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 401) {
          setAuthError('Session expired. Please login again.');
          setLoadingAuth(false);
          return;
        }
        if (res.status === 403) {
          setAuthError('Access denied. Application Manager role required.');
          setLoadingAuth(false);
          return;
        }
        if (res.ok) {
          const json = await res.json();
          setMetrics(json.metrics || json.data || {});
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingAuth(false);
      }
    };
    checkAuth();
  }, [token]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-[#0B5ED7] mx-auto" />
          <p className="text-sm text-[#0F172A]">Verifying Application Manager access...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-[#0F172A]">Access Restricted</h2>
          <p className="text-sm text-gray-600">{authError}</p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/login"><Button className="bg-[#0B5ED7] hover:bg-[#004494] text-white">Login</Button></Link>
            <Link href="/"><Button variant="outline" className="border-[#E2E8F0]">Home</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#0F172A] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-[280px] bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0B5ED7] to-[#F97316] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">ALO Application</p>
              <p className="text-[11px] text-gray-500">Manager Portal</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-3 flex-1 overflow-y-auto space-y-1">
          {SIDEBAR_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== '/application-manager/dashboard' && pathname.startsWith(item.href));
            const count = item.countKey ? (metrics?.[item.countKey] ?? null) : null;
            return (
              <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}>
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all ${isActive ? 'bg-[#0B5ED7] text-white shadow-sm' : 'text-gray-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#E2E8F0]'}`}>
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'} ${item.confidential ? 'text-rose-500' : ''}`} />
                    <span className="font-medium truncate">{item.label}</span>
                    {item.confidential && <Lock className="w-3 h-3 text-rose-400" />}
                  </div>
                  {count !== null && count > 0 && (
                    <Badge className={`${isActive ? 'bg-white/20 text-white border-white/20' : 'bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20'} text-[10px] px-1.5 py-0`}>{count}</Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#E2E8F0] space-y-3">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#0B5ED7] flex items-center justify-center text-white text-xs font-bold">{user?.name?.[0] || 'A'}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user?.name || 'Application Manager'}</p>
              <p className="text-[11px] text-gray-500 truncate">{user?.email || ''}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full border-[#E2E8F0] text-gray-600" onClick={handleLogout}><LogOut className="w-4 h-4 mr-2" />Logout</Button>
          <p className="text-[10px] text-gray-400 text-center">B2B Confidential — Backend Secured</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0] p-3 flex items-center justify-between lg:hidden">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5" /></Button>
          <span className="font-semibold text-sm">Application Manager</span>
          <div className="w-8" />
        </header>
        <main className="flex-1 bg-[#FFFFFF]">{children}</main>
      </div>
    </div>
  );
}
