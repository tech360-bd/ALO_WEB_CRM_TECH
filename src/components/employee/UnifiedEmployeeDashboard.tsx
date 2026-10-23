'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  GraduationCap,
  FileText,
  ShieldCheck,
  DollarSign,
  Megaphone,
  Briefcase,
  Building,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Bell,
  LogOut,
  UserCheck,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Inbox,
  Filter,
  Eye,
  Loader2,
  RefreshCw,
  PhoneCall,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePortalStore } from '@/lib/stores/portal-store';
import { HrRoleWidgets, HrmQuickActions } from '@/components/hrm/HrWidgets';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

function displayMetric(value: number | string | null | undefined): number | string {
  return value == null || value === '' ? '—' : value;
}

function normalizeDashboardRole(value: string): string {
  return value.trim().replace(/[\s-]+/g, '_').toUpperCase();
}

interface UnifiedEmployeeDashboardProps {
  forcedRole?: string;
  pageTitle?: string;
}

export default function UnifiedEmployeeDashboard({
  forcedRole,
  pageTitle = 'Employee Operating System',
}: UnifiedEmployeeDashboardProps) {
  const router = useRouter();
  const { user, logout } = usePortalStore();
  const [resolvedRole, setResolvedRole] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Route props may select a dashboard view, but the API is the source of
  // the effective role and enforces that the employee is actually assigned it.
  const requestedRole = forcedRole ? normalizeDashboardRole(forcedRole) : '';
  const activeRole = requestedRole || normalizeDashboardRole(resolvedRole);
  const canCreateLead = ['COUNSELOR', 'SENIOR_COUNSELOR', 'MARKETING', 'MARKETING_MANAGER', 'FRONT_DESK', 'BRANCH_MANAGER', 'OFFICE_MANAGER'].includes(activeRole);
  const userName = data?.userName || 'Employee';
  const designation = activeRole ? activeRole.replace(/_/g, ' ') : 'Employee';
  const branch = data?.branch || 'Branch not assigned';
  const country = data?.country || 'Country not assigned';

  // Quick Lead / Task modal state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCountry, setNewLeadCountry] = useState('');
  const [creatingLead, setCreatingLead] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    setPermissionDenied(false);
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      setError('You are offline. Dashboard data may be stale. Please reconnect.');
      setLoading(false);
      return;
    }
    try {
      const dashboardUrl = requestedRole ? `/api/employee/dashboard?role=${encodeURIComponent(requestedRole)}` : '/api/employee/dashboard';
      const res = await fetch(dashboardUrl);
      const json = await res.json().catch(()=> ({}));
      if (res.status === 403 || json.error?.toLowerCase().includes('forbidden') || json.error?.toLowerCase().includes('insufficient')) {
        setPermissionDenied(true);
        setError(json.error || 'Permission denied for this dashboard.');
        return;
      }
      if (!res.ok) {
        setError(json.error || json.details || `Failed to load metrics (HTTP ${res.status})`);
        return;
      }
      if (json.success) {
        if (typeof json.userRole === 'string') setResolvedRole(json.userRole);
        setData({ ...json.metrics, userName: json.userName, branch: json.branch, country: json.country, actingAs: json.actingAs });
      } else {
        setError(json.error || 'Failed to load metrics');
      }
    } catch (e:any) {
      console.error('Failed to load employee metrics:', e);
      setError(e?.message || 'Network error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      fetchDashboardData();
      return;
    }
    const handleOnline = () => { setIsOffline(false); fetchDashboardData(); };
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);
    fetchDashboardData();
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [requestedRole]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadName || !newLeadPhone) {
      toast.error('Please enter name and phone.');
      return;
    }
    setCreatingLead(true);
    try {
      const res = await fetch('/api/employee/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: newLeadName, phone: newLeadPhone, country: newLeadCountry }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success('New lead registered successfully!');
        setShowLeadModal(false);
        setNewLeadName('');
        setNewLeadPhone('');
        fetchDashboardData();
      } else {
        toast.error(json.error || 'Failed to create lead');
      }
    } catch {
      toast.error('Network error creating lead');
    } finally {
      setCreatingLead(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans">
      {/* 2. Top Header Shell */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0057B8] to-[#003C80] text-white flex items-center justify-center font-black text-lg shadow-sm">
            ALO
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 tracking-tight">{pageTitle}</h1>
              <Badge className="bg-blue-50 text-[#0057B8] border-blue-200 font-semibold text-xs capitalize">
                {activeRole.toLowerCase().replace(/_/g, ' ')}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>{branch}</span> &bull; <span>{country} Desk</span>
            </p>
          </div>
        </div>

        {/* Global Search & User Profile Quick Actions */}
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              placeholder="Search students, leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs bg-slate-50 border-slate-200 rounded-lg focus:bg-white transition-all"
            />
          </div>

          {canCreateLead && (
            <Button
              size="sm"
              onClick={() => setShowLeadModal(true)}
              className="bg-[#E8501A] hover:bg-[#D04010] text-white text-xs h-9 font-semibold gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Quick Lead
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-600 hover:text-slate-900 rounded-lg"
            onClick={() => toast.info(data?.unreadNotifsCount == null ? 'Unread notification count unavailable' : `${data.unreadNotifsCount} unread notifications`)}
          >
            <Bell className="w-5 h-5" />
            {data?.unreadNotifsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
          </Button>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-300">
              {userName.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-none">{userName}</p>
              <p className="text-[10px] text-slate-400">{designation}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-400 hover:text-red-600 h-8 w-8 ml-1"
              onClick={() => {
                logout();
                router.replace('/portal/login');
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {isOffline && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-800 px-4 py-2 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> You are offline — showing cached data where available. Reconnect to refresh live metrics.
        </div>
      )}
      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {permissionDenied && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center space-y-3">
              <ShieldAlert className="w-8 h-8 text-red-600 mx-auto" />
              <h3 className="font-bold text-red-800">Permission Denied</h3>
              <p className="text-xs text-red-700 max-w-md mx-auto">{error || 'Your role does not have access to this dashboard. Contact Super Admin for permission.'}</p>
              <Button size="sm" variant="outline" onClick={()=> router.push('/employee/dashboard')} className="text-xs">Back to My Dashboard</Button>
            </CardContent>
          </Card>
        )}
        {error && !permissionDenied && !loading && (
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">Unable to load dashboard metrics</p>
                <p className="text-xs text-amber-700 mt-1">{error}</p>
                <Button size="sm" variant="outline" className="mt-3 h-7 text-xs gap-1" onClick={fetchDashboardData}><RefreshCw className="w-3 h-3" /> Retry</Button>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0057B8] mb-2" />
            <p className="text-sm font-medium">Loading live operating metrics...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* HRMS Enterprise — Role-specific HR Widgets (available on every internal dashboard except Student) */}
            {activeRole !== 'STUDENT' && (
              <div className="space-y-3">
                <HrRoleWidgets role={activeRole} />
                <HrmQuickActions role={activeRole} />
              </div>
            )}
            {/* Unified Communication Engine — 10x inbox widget, role-filtered visibility, SLA aware */}
            <DashboardCommunicationWidget
              role={
                activeRole.includes('COUNSELOR') ? 'COUNSELOR' :
                activeRole.includes('APPLICATION') ? 'APPLICATION_MANAGER' :
                activeRole.includes('VISA') ? 'VISA_OFFICER' :
                activeRole.includes('MARKETING') ? 'MARKETING_MANAGER' :
                activeRole.includes('FINANCE') ? 'FINANCE' :
                activeRole.includes('FRONT_DESK') ? 'FRONT_DESK' :
                activeRole.includes('ADMIN') || activeRole.includes('SUPER_ADMIN') ? 'SUPER_ADMIN' :
                'STAFF_CRM'
              }
              unreadCount={data?.unreadMessages ?? null}
              slaOverdueCount={data?.slaOverdueCount ?? null}
              onNavigateToInbox={() => router.push('/crm/communications/inbox')}
            />

            {activeRole.includes('MARKETING') && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-slate-800">Marketing content library</p>
                  <p className="text-[11px] text-slate-500">External social publishing and provider delivery are not configured or verified.</p>
                </div>
                <button onClick={() => router.push('/crm/marketing-manager')} className="h-9 px-4 rounded-xl bg-[#E8501A] text-white text-xs font-bold hover:bg-[#d04010]">Open library</button>
              </div>
            )}
            {/* Top KPI Cards Grid — 12-column responsive: desktop 12-col, tablet 2-col, mobile 1-col; role-specific KPIs */}
            {!permissionDenied && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Common KPIs */}
              <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={()=> setActiveTab('leads')}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Leads in Scope</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.assignedLeads)}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">{displayMetric(data?.hotLeads)} marked hot • {displayMetric(data?.newLeads)} marked new</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#E8501A] flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={()=> setActiveTab('students')}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Students in Scope</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.activeStudents)}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">{displayMetric(data?.totalStudents)} student records in scope</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0057B8] flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={()=> setActiveTab('applications')}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{activeRole.includes('COUNTRY') ? 'Country Applications' : activeRole.includes('BRANCH') ? 'Branch Applications' : 'Active Applications'}</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.activeApplications ?? data?.branchApplications ?? data?.countryApplications)}</h3>
                    <p className="text-[11px] text-[#0057B8] font-medium mt-1">{displayMetric(data?.offersReceived ?? data?.countryOffers ?? data?.offerCount)} Offers Received</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={()=> setActiveTab('tasks')}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Tasks & Follow-ups</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.pendingTasksCount)}</h3>
                    <p className="text-[11px] text-amber-600 font-medium mt-1">{displayMetric(data?.followUpsDue)} follow-ups due • {displayMetric(data?.overdueFollowUps)} overdue • {displayMetric(data?.slaBreaches)} breaches</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              {/* Role-specific second row — counselor */}
              {(activeRole.includes('COUNSELOR')) && (
                <>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Conversion Rate</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.conversionRate)}</h3>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">Share of assigned leads marked converted in CRM.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unread Messages</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.unreadMessages ?? data?.unreadMessagesCount)}</h3>
                        <p className="text-[11px] text-slate-400 mt-1">{displayMetric(data?.unreadNotifsCount)} notifications</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><MessageSquare className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Appointments Today</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.appointmentsToday)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Scheduled or confirmed for assigned students.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0057B8] flex items-center justify-center"><Calendar className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Documents</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.pendingDocuments)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Document pending-status data is unavailable.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                </>
              )}

              {(activeRole.includes('APPLICATION')) && (
                <>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Draft Applications</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.draftCount ?? data?.draftApplications)}</h3>
                        <p className="text-[11px] text-slate-400 mt-1">needs completion</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center"><FileText className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Offers Recorded</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.offerCount ?? data?.offersReceived)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Offer status present in scoped application records.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Application Deadline Count</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.deadlineAlerts)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Deadline metrics are not connected.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Review Queue</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.reviewCount)}</h3>
                        <p className="text-[11px] text-blue-600 mt-1">under review</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Eye className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                </>
              )}

              {(activeRole.includes('VISA')) && (
                <>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Visa Cases</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.visaCasesCount ?? data?.visaCases)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Readiness totals are not verified.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Scheduled Interviews</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.interviewsScheduled ?? data?.interviewsPending)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Interview schedule data is unavailable.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Calendar className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cases Marked High Risk</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.highRiskCount ?? data?.highRisk)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Recorded risk classification in CRM.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><ShieldAlert className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Escalated Cases</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.escalatedCases)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Escalation count is not connected to this dashboard.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                </>
              )}

              {(activeRole.includes('FINANCE')) && (
                <>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Receipt Total</p>
                        <h3 className="text-lg font-black text-slate-800 mt-1">{displayMetric(data?.todaysReceipts)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Payment totals are not connected to this dashboard.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Payroll Records</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.pendingPayrollRecords)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Only records in this employee's scope.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Commission Records</p>
                        <h3 className="text-lg font-black text-slate-800 mt-1">{displayMetric(data?.pendingCommissionRecords)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Only records in this employee's scope.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Briefcase className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Revenue Total</p>
                        <h3 className="text-lg font-black text-slate-800 mt-1">{displayMetric(data?.monthlyRevenue)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Revenue totals are not connected to this dashboard.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                </>
              )}

              {(activeRole.includes('MARKETING')) && (
                <>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Campaigns</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.activeCampaigns ?? data?.campaignsRunning)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">active/published status in CRM</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Megaphone className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campaign-Attributed Leads</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.totalLeadsGenerated)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Campaign attribution data is unavailable.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center"><Users className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Social Inquiries Today</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.socialInquiriesToday)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Provider-backed inbox metrics are unavailable.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><MessageSquare className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Channel</p>
                        <h3 className="text-sm font-black text-slate-800 mt-1">{displayMetric(data?.topChannel)}</h3>
                        <p className="text-[11px] text-slate-400 mt-1">source attribution unavailable</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center"><Globe className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                </>
              )}

              {(activeRole.includes('HR') || activeRole.includes('BRANCH') || activeRole.includes('COUNTRY') || activeRole.includes('OFFICE_MANAGER')) && (
                <>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{activeRole.includes('HR') || activeRole.includes('OFFICE_MANAGER') ? 'Employees in Scope' : activeRole.includes('BRANCH') ? 'Leads in Branch' : 'Student Profiles by Preferred Country'}</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.totalEmployees ?? data?.branchLeads ?? data?.countryStudents)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">{activeRole.includes('HR') || activeRole.includes('OFFICE_MANAGER') ? 'Employee records in this authorized scope.' : activeRole.includes('BRANCH') ? 'Lead records assigned within this branch.' : 'Profiles matching this employee’s destination focus.'}</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center"><Building className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{activeRole.includes('HR') || activeRole.includes('OFFICE_MANAGER') ? 'Active Employees' : activeRole.includes('BRANCH') ? 'Branch Students' : 'Country Applications'}</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.activeEmployees ?? data?.branchStudents ?? data?.countryApplications)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">{activeRole.includes('HR') || activeRole.includes('OFFICE_MANAGER') ? 'Records marked active in CRM.' : activeRole.includes('BRANCH') ? 'Student records assigned within this branch.' : 'Applications matching the selected destinations.'}</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{activeRole.includes('HR') || activeRole.includes('OFFICE_MANAGER') ? 'Pending Leave Requests Today' : activeRole.includes('BRANCH') ? 'Branch Offers Recorded' : 'Country Offers Recorded'}</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.leaveRequestsToday ?? data?.offersReceived ?? data?.countryOffers)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">{activeRole.includes('HR') || activeRole.includes('OFFICE_MANAGER') ? 'Pending requests created today.' : 'Offer status recorded in scoped applications.'}</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><Clock className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{activeRole.includes('HR') || activeRole.includes('OFFICE_MANAGER') ? 'Attendance Marked Present Today' : activeRole.includes('BRANCH') ? 'Branch Applications' : 'Visa Cases in Selected Countries'}</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.attendancePresent ?? data?.branchApplications ?? data?.visaCasesCount)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">{activeRole.includes('HR') || activeRole.includes('OFFICE_MANAGER') ? 'Attendance records for today in this scope.' : activeRole.includes('BRANCH') ? 'Applications assigned in this branch scope.' : 'Visa cases matching destination focus.'}</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                </>
              )}

              {activeRole.includes('SUPPORT') && (
                <>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Assigned Threads</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.openTickets)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Open communication threads assigned to this account.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center"><MessageSquare className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white border-slate-200/80 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgent Assigned Threads</p>
                        <h3 className="text-2xl font-black text-slate-800 mt-1">{displayMetric(data?.urgentTickets)}</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Open threads marked urgent in CRM.</p>
                      </div>
                      <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center"><AlertTriangle className="w-6 h-6" /></div>
                    </CardContent>
                  </Card>
                </>
              )}

              {(activeRole.includes('FRONT_DESK') || activeRole.includes('PARTNER')) && (
                <div className="sm:col-span-2 lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600" role="status">
                  {activeRole.includes('FRONT_DESK') ? 'Walk-in metrics are unavailable because no verified walk-in data source is connected.' : 'Partner totals are unavailable because no authorized partner metric source is connected.'}
                </div>
              )}
            </div>
            )}

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm flex flex-wrap h-auto gap-1">
                <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                  Dashboard Overview
                </TabsTrigger>
                <TabsTrigger value="leads" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                  My Leads ({displayMetric(data?.assignedLeads)})
                </TabsTrigger>
                <TabsTrigger value="students" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                  My Students ({displayMetric(data?.activeStudents)})
                </TabsTrigger>
                <TabsTrigger value="applications" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                  Applications ({displayMetric(data?.activeApplications)})
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                  Tasks & Follow-ups
                </TabsTrigger>
                <TabsTrigger value="ai-assistant" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" /> AI Workspace
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Overview with Role Specific Modules */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left 2 Cols: Main Operations Queue */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-sm font-bold text-slate-800">Assigned Student Pipeline</CardTitle>
                          <p className="text-xs text-slate-400">Student records returned by this request are limited to your account's assigned scope.</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveTab('students')}
                          className="text-xs text-[#0057B8] font-semibold gap-1"
                        >
                          View All <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                          {(data?.myStudents && data.myStudents.length > 0) ? (
                            data.myStudents.map((s: any) => (
                              <div key={s.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-blue-100 text-[#0057B8] flex items-center justify-center font-bold text-xs">
                                    {s.fullName?.substring(0, 2).toUpperCase() || 'ST'}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-slate-800">{s.fullName}</p>
                                    <p className="text-xs text-slate-400">{s.studentCode} &bull; {s.currentCountry || 'Country not recorded'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 capitalize text-xs">
                                    {s.currentStage || 'Stage not recorded'}
                                  </Badge>
                                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="text-xs text-[#0057B8] font-medium h-7">
                                    Open
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                              No active students are available in this account's assigned scope.
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Role Specific Additional Queue */}
                    {activeRole.includes('APPLICATION') && (
                      <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="p-4 border-b border-slate-100">
                          <CardTitle className="text-sm font-bold text-slate-800">University Application Review Queue</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                          {(data?.recentApplications && data.recentApplications.length>0) ? data.recentApplications.slice(0,4).map((app:any)=>(
                            <div key={app.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs">
                              <span className="font-semibold text-slate-700 truncate pr-2">{app.universityName || app.university} - {app.courseName || app.course} {app.intake? `(${app.intake})`:''}</span>
                              <Badge className={`${app.stage==='offer_received' || app.safeStatus==='OFFER_RECEIVED' ? 'bg-emerald-600' : 'bg-blue-600'} text-white text-[10px] shrink-0`}>{app.safeStatus || app.stage}</Badge>
                            </div>
                          )) : (
                            <div className="text-center py-4 text-xs text-slate-400">No applications in queue. Create an application draft to begin.</div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {activeRole.includes('VISA') && (
                      <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="p-4 border-b border-slate-100">
                          <CardTitle className="text-sm font-bold text-slate-800">Recent Visa Cases — Recorded Stage</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                          {(data?.recentVisaCases && data.recentVisaCases.length>0) ? data.recentVisaCases.slice(0,4).map((vc:any)=>(
                            <div key={vc.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs">
                              <span className="font-semibold text-slate-700 truncate pr-2">{vc.studentName || vc.caseCode} - {vc.destinationCountry || vc.university}</span>
                              <Badge variant="outline" className="text-[10px] shrink-0">Stage: {vc.currentStage || 'not recorded'}</Badge>
                            </div>
                          )) : (
                            <div className="text-center py-4 text-xs text-slate-400">No visa cases are available in this account's assigned scope.</div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Right 1 Col: Quick Actions & Today's Schedule */}
                  <div className="space-y-6">
                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardHeader className="p-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold text-slate-800">Today's Tasks & Follow-ups</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 space-y-3">
                        {data?.pendingTasksCount > 0 ? (
                          <div className="space-y-2">
                            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-orange-50 border border-orange-100">
                              <Clock className="w-4 h-4 text-[#E8501A] mt-0.5 shrink-0" />
                              <div className="text-xs">
                                <p className="font-bold text-slate-800">{data.followUpsDue ?? 0} Follow-ups Due Today</p>
                                <p className="text-slate-500">{data.overdueFollowUps ?? 0} overdue — take action</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                              <Calendar className="w-4 h-4 text-[#0057B8] mt-0.5 shrink-0" />
                              <div className="text-xs">
                                <p className="font-bold text-slate-800">{data.pendingTasksCount ?? 0} Pending Tasks</p>
                                <p className="text-slate-500">View in Tasks tab for details</p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-slate-400 text-xs">No tasks due today. All clear.</div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-white border-slate-200 shadow-sm">
                      <CardHeader className="p-4 border-b border-slate-100">
                        <CardTitle className="text-sm font-bold text-slate-800">Role Quick Links</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4 grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          onClick={() => router.push('/admin/university-data')}
                          className="h-14 text-xs flex-col gap-1 border-slate-200 hover:bg-blue-50 hover:text-[#0057B8]"
                        >
                          <Building className="w-4 h-4" /> Course Finder
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push('/employee/ucc')}
                          className="h-14 text-xs flex-col gap-1 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <MessageSquare className="w-4 h-4" /> WhatsApp UCC
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push('/employee/visa-dashboard')}
                          className="h-14 text-xs flex-col gap-1 border-slate-200 hover:bg-orange-50 hover:text-[#E8501A]"
                        >
                          <ShieldCheck className="w-4 h-4" /> Visa Cases
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => router.push('/employee/tasks')}
                          className="h-14 text-xs flex-col gap-1 border-slate-200 hover:bg-purple-50 hover:text-purple-700"
                        >
                          <CheckCircle2 className="w-4 h-4" /> All Tasks
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Leads Management */}
              <TabsContent value="leads" className="space-y-4">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-bold text-slate-800">Assigned Marketing Leads</CardTitle>
                      <p className="text-xs text-slate-400">Inbound and walk-in prospective international students</p>
                    </div>
                    {canCreateLead && (
                      <Button size="sm" onClick={() => setShowLeadModal(true)} className="bg-[#E8501A] text-white text-xs h-8">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Add Lead
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="p-4">
                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3">Lead Name</th>
                            <th className="p-3">Phone</th>
                            <th className="p-3">Target Country</th>
                            <th className="p-3">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(data?.myLeads && data.myLeads.length > 0) ? (() => {
                            const q = searchQuery.toLowerCase();
                            const filtered = q ? data.myLeads.filter((l:any)=> `${l.name} ${l.phone} ${l.destination} ${l.country} ${l.status}`.toLowerCase().includes(q)) : data.myLeads;
                            if (filtered.length===0) return (<tr><td colSpan={5} className="p-6 text-center text-slate-400">No matching leads for "{searchQuery}"</td></tr>);
                            return filtered.map((lead:any)=>(
                            <tr key={lead.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-800">{lead.name}</td>
                              <td className="p-3 text-slate-600">{lead.phone}</td>
                              <td className="p-3 text-slate-600">{lead.destination || lead.country || '—'}</td>
                              <td className="p-3"><Badge className={`${lead.hotLead ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'} text-[10px]`}>{lead.status || (lead.hotLead ? 'Hot Lead' : 'New')}</Badge></td>
                              <td className="p-3 text-right">
                                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="text-[#0057B8] text-xs h-7">Contact</Button>
                              </td>
                            </tr>
                          ))})() : (
                            <tr><td colSpan={5} className="p-6 text-center text-slate-400">No leads assigned yet.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    {/* Mobile stacked cards */}
                    <div className="md:hidden space-y-3">
                      {(data?.myLeads && data.myLeads.length > 0) ? (() => {
                        const q = searchQuery.toLowerCase();
                        const filtered = q ? data.myLeads.filter((l:any)=> `${l.name} ${l.phone} ${l.destination} ${l.country}`.toLowerCase().includes(q)) : data.myLeads;
                        if (filtered.length===0) return <div className="text-center py-6 text-slate-400 text-xs">No matching leads.</div>;
                        return filtered.map((lead:any)=>(
                          <div key={lead.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-bold text-sm text-slate-800">{lead.name}</p>
                                <p className="text-xs text-slate-500">{lead.phone} • {lead.destination || lead.country || '—'}</p>
                              </div>
                              <Badge className={`${lead.hotLead ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'} text-[10px]`}>{lead.status || (lead.hotLead ? 'Hot Lead' : 'New')}</Badge>
                            </div>
                            <div className="mt-3 flex gap-2">
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="flex-1 text-xs h-8"><PhoneCall className="w-3 h-3 mr-1" /> Call</Button>
                              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="flex-1 bg-[#0057B8] text-white text-xs h-8"><MessageSquare className="w-3 h-3 mr-1" /> Message</Button>
                            </div>
                          </div>
                        ));
                      })() : (
                        <div className="text-center py-6 text-slate-400 text-xs">No leads assigned yet.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Students Portfolio */}
              <TabsContent value="students" className="space-y-4">
                <Card className="bg-white border-slate-200 shadow-sm">
                  <CardHeader className="p-4 border-b border-slate-100">
                    <CardTitle className="text-sm font-bold text-slate-800">My Student Registry</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="divide-y divide-slate-100">
                      {(data?.myStudents && data.myStudents.length > 0) ? (
                        data.myStudents.map((s: any) => (
                          <div key={s.id} className="py-3 flex items-center justify-between">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{s.fullName}</p>
                              <p className="text-xs text-slate-400">{s.email} &bull; {s.phone}</p>
                            </div>
                            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="text-xs border-slate-200 h-8">
                              Open Profile
                            </Button>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-6 text-slate-400 text-xs">No students found.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: AI Assistant */}
              <TabsContent value="ai-assistant" className="space-y-4">
                <Card className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white border-none shadow-lg">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-base">ALO Counselor & Officer AI Co-Pilot</h3>
                    </div>
                    <p className="text-xs text-blue-200 max-w-xl">
                      AI drafting is unavailable from this panel while the existing ALO AI Workforce, knowledge sources, and role/department permissions are being reconciled. No draft or SOP is generated here.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        className="bg-amber-500 text-slate-900 font-bold text-xs opacity-60"
                        disabled
                        title="Unavailable: no verified, role-scoped follow-up workflow is connected to this control."
                      >
                        Draft Student Follow-up Script (Unavailable)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 text-white border-white/20 text-xs opacity-60"
                        disabled
                        title="Unavailable: no approved employee SOP source/search workflow is connected to this control."
                      >
                        Generate SOP Structure (Unavailable)
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>

      {/* Quick Lead Registration Modal */}
      {showLeadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="bg-white max-w-md w-full shadow-2xl border-slate-200">
            <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold text-slate-800">Quick Lead Registration</CardTitle>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setShowLeadModal(false)}>
                <XCircle className="w-4 h-4 text-slate-400" />
              </Button>
            </CardHeader>
            <form onSubmit={handleCreateLead}>
              <CardContent className="p-4 space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Full Name *</label>
                  <Input
                    required
                    value={newLeadName}
                    onChange={(e) => setNewLeadName(e.target.value)}
                    placeholder="e.g. Mahfuzur Rahman"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Phone Number *</label>
                  <Input
                    required
                    value={newLeadPhone}
                    onChange={(e) => setNewLeadPhone(e.target.value)}
                    placeholder="e.g. +880 1712-000000"
                    className="mt-1 h-9 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700">Target Study Destination</label>
                  <select
                    value={newLeadCountry}
                    onChange={(e) => setNewLeadCountry(e.target.value)}
                    className="w-full mt-1 h-9 text-xs border border-slate-200 rounded-lg px-3 bg-white"
                  >
                    <option value="">Select destination (optional)</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="USA">USA</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="Ireland">Ireland</option>
                  </select>
                </div>
              </CardContent>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowLeadModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button type="submit" disabled={creatingLead} size="sm" className="bg-[#E8501A] hover:bg-[#D04010] text-white text-xs font-semibold">
                  {creatingLead ? 'Saving...' : 'Register Lead'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
