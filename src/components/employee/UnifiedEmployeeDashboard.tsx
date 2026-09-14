'use client';

import React, { useState, useEffect } from 'react';
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
  ShieldAlert,
  Loader2,
  RefreshCw,
  PhoneCall,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePortalStore } from '@/lib/stores/portal-store';

interface UnifiedEmployeeDashboardProps {
  forcedRole?: string;
  pageTitle?: string;
}

export default function UnifiedEmployeeDashboard({
  forcedRole,
  pageTitle = 'Employee Operating System',
}: UnifiedEmployeeDashboardProps) {
  const { user, logout } = usePortalStore();

  const firstRole = user?.roles && user.roles.length > 0 ? (typeof user.roles[0] === 'string' ? user.roles[0] : (user.roles[0] as any).name) : 'COUNSELOR';
  const activeRole = String(forcedRole || firstRole || 'COUNSELOR').toUpperCase();
  const userName = user?.name || 'Authorized Officer';
  const designation = (user as any)?.designation || activeRole.replace(/_/g, ' ');
  const branch = (user as any)?.branch || 'Dhaka Main Branch';
  const country = (user as any)?.country || 'United Kingdom';

  const [actingAsState, setActingAsState] = useState<{ isActing: boolean; originalAdmin?: string } | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Lead / Task modal state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadCountry, setNewLeadCountry] = useState('United Kingdom');
  const [creatingLead, setCreatingLead] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/employee/dashboard?role=${activeRole}`);
      const json = await res.json();
      if (json.success) {
        setData(json.metrics);
      }
    } catch (e) {
      console.error('Failed to load employee metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check if acting-as is stored in session/localStorage
    if (typeof window !== 'undefined') {
      const actingAdmin = localStorage.getItem('alo_acting_as_admin');
      if (actingAdmin) {
        setActingAsState({ isActing: true, originalAdmin: actingAdmin });
      }
    }

    fetchDashboardData();
  }, [activeRole]);

  const handleStopActingAs = () => {
    localStorage.removeItem('alo_acting_as_admin');
    setActingAsState(null);
    toast.success('Acting-As session ended. Returning to Super Admin.');
    window.location.href = '/admin/employees';
  };

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
      {/* 1. Super Admin Acting-As Alert Banner */}
      {actingAsState?.isActing && (
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md z-50">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ShieldAlert className="w-5 h-5 text-amber-200 animate-pulse" />
            <span>
              SUPER ADMIN ACTING AS: <span className="underline decoration-wavy">{userName}</span> ({activeRole})
            </span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded ml-2">Audit Logging Active</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs h-7"
              onClick={() => {
                window.location.href = '/admin/access-control-center';
              }}
            >
              View Acting-As Audit
            </Button>
            <Button
              size="sm"
              className="bg-white text-orange-600 hover:bg-white/90 text-xs font-bold h-7 shadow"
              onClick={handleStopActingAs}
            >
              Stop Acting-As
            </Button>
          </div>
        </div>
      )}

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

          <Button
            size="sm"
            onClick={() => setShowLeadModal(true)}
            className="bg-[#E8501A] hover:bg-[#D04010] text-white text-xs h-9 font-semibold gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Quick Lead
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative text-slate-600 hover:text-slate-900 rounded-lg"
            onClick={() => toast.info(`${data?.unreadNotifsCount || 0} unread notifications`)}
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
                window.location.href = '/portal/login';
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* 3. Main Dashboard Workspace */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* Loading Skeleton */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-[#0057B8] mb-2" />
            <p className="text-sm font-medium">Loading live operating metrics...</p>
          </div>
        )}

        {!loading && (
          <>
            {/* Marketing Library — one-click repost to your official social (if approved) */}
            {(activeRole.includes("COUNSELOR") || activeRole.includes("MARKETING") || true) && (
              <div className="rounded-2xl border-2 border-[#0057B8]/20 bg-gradient-to-r from-[#eef4ff] to-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#0057B8] text-white flex items-center justify-center"><span className="text-lg">📚</span></div>
                  <div><p className="font-bold text-sm text-[#0057B8]">Marketing Library — Repost Hub</p><p className="text-[11px] text-slate-500">Approved image/video/post দেখে নিজের অফিসিয়াল Facebook/Instagram/LinkedIn এ 1-click পোস্ট করুন — Brand Kit auto-retained</p></div>
                </div>
                <button onClick={()=> window.location.href='/crm/marketing-manager'} className="h-9 px-4 rounded-xl bg-[#E8501A] text-white text-xs font-bold hover:bg-[#d04010]">Open Library →</button>
              </div>
            )}
            {/* Top KPI Cards Grid (12-col grid responsive) */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Assigned Leads</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{data?.assignedLeads ?? 0}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 font-medium">{data?.hotLeads ?? 0} hot leads</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-orange-50 text-[#E8501A] flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Students</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{data?.activeStudents ?? 0}</h3>
                    <p className="text-[11px] text-slate-400 mt-1 font-medium">{data?.totalStudents ?? 0} total in CRM</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0057B8] flex items-center justify-center">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Applications</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{data?.activeApplications ?? 0}</h3>
                    <p className="text-[11px] text-[#0057B8] font-medium mt-1">{data?.offersReceived ?? 0} Offers Received</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Tasks & SLA</p>
                    <h3 className="text-2xl font-black text-slate-800 mt-1">{data?.pendingTasksCount ?? 0}</h3>
                    <p className="text-[11px] text-amber-600 font-medium mt-1">{data?.followUpsDue ?? 0} follow-ups due</p>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Clock className="w-6 h-6" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="bg-white border border-slate-200 p-1 rounded-xl shadow-sm flex flex-wrap h-auto gap-1">
                <TabsTrigger value="overview" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                  Dashboard Overview
                </TabsTrigger>
                <TabsTrigger value="leads" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                  My Leads ({data?.assignedLeads ?? 0})
                </TabsTrigger>
                <TabsTrigger value="students" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                  My Students ({data?.activeStudents ?? 0})
                </TabsTrigger>
                <TabsTrigger value="applications" className="text-xs font-semibold data-[state=active]:bg-[#0057B8] data-[state=active]:text-white">
                  Applications ({data?.activeApplications ?? 0})
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
                          <p className="text-xs text-slate-400">Real-time status of students in your portfolio</p>
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
                                    <p className="text-xs text-slate-400">{s.studentCode} &bull; {s.targetCountry || 'UK'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 capitalize text-xs">
                                    {s.currentStage || 'Counseling'}
                                  </Badge>
                                  <Button size="sm" variant="ghost" className="text-xs text-[#0057B8] font-medium h-7">
                                    Open
                                  </Button>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-8 text-center text-slate-400 text-sm">
                              No active students assigned yet. Click "Quick Lead" to register a candidate.
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
                          <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs">
                            <span className="font-semibold text-slate-700">University of Manchester - MSc Data Science</span>
                            <Badge className="bg-blue-600 text-white text-[10px]">Under Review</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs">
                            <span className="font-semibold text-slate-700">Queen Mary University - BEng Computing</span>
                            <Badge className="bg-emerald-600 text-white text-[10px]">Offer Received</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {activeRole.includes('VISA') && (
                      <Card className="bg-white border-slate-200 shadow-sm">
                        <CardHeader className="p-4 border-b border-slate-100">
                          <CardTitle className="text-sm font-bold text-slate-800">Visa Case Readiness & Interview Priority</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-xs">
                            <span className="font-semibold text-slate-700">Tanvir Ahmed - UK Tier 4 General</span>
                            <Badge className="bg-emerald-600 text-white text-[10px]">Readiness 92% (Ready)</Badge>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100 text-xs">
                            <span className="font-semibold text-slate-700">Fatima Akter - UK Visa Interview Mock</span>
                            <Badge className="bg-amber-600 text-white text-[10px]">Interview Scheduled</Badge>
                          </div>
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
                          onClick={() => (window.location.href = '/admin/university-data')}
                          className="h-14 text-xs flex-col gap-1 border-slate-200 hover:bg-blue-50 hover:text-[#0057B8]"
                        >
                          <Building className="w-4 h-4" /> Course Finder
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => (window.location.href = '/employee/ucc')}
                          className="h-14 text-xs flex-col gap-1 border-slate-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <MessageSquare className="w-4 h-4" /> WhatsApp UCC
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => (window.location.href = '/employee/visa-dashboard')}
                          className="h-14 text-xs flex-col gap-1 border-slate-200 hover:bg-orange-50 hover:text-[#E8501A]"
                        >
                          <ShieldCheck className="w-4 h-4" /> Visa Cases
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => (window.location.href = '/employee/tasks')}
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
                    <Button size="sm" onClick={() => setShowLeadModal(true)} className="bg-[#E8501A] text-white text-xs h-8">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Add Lead
                    </Button>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="overflow-x-auto">
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
                          {(data?.myLeads && data.myLeads.length > 0) ? data.myLeads.map((lead:any)=>(
                            <tr key={lead.id} className="hover:bg-slate-50">
                              <td className="p-3 font-bold text-slate-800">{lead.name}</td>
                              <td className="p-3 text-slate-600">{lead.phone}</td>
                              <td className="p-3 text-slate-600">{lead.destination || lead.country || '—'}</td>
                              <td className="p-3"><Badge className={`${lead.hotLead ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'} text-[10px]`}>{lead.status || (lead.hotLead ? 'Hot Lead' : 'New')}</Badge></td>
                              <td className="p-3 text-right">
                                <Button size="sm" variant="ghost" className="text-[#0057B8] text-xs h-7">Contact</Button>
                              </td>
                            </tr>
                          )) : (
                            <tr><td colSpan={5} className="p-6 text-center text-slate-400">No leads assigned yet.</td></tr>
                          )}
                        </tbody>
                      </table>
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
                            <Button size="sm" variant="outline" className="text-xs border-slate-200 h-8">
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
                      Generate intelligent course shortlists, draft customized SOP outlines, detect missing visa documents, or prepare follow-up scripts powered by ALO AgentOS knowledge.
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold text-xs"
                        onClick={() => toast.success('AI Draft Generated for Student Follow-up')}
                      >
                        Draft Student Follow-up Script
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs"
                        onClick={() => toast.success('AI SOP Outline Generated')}
                      >
                        Generate SOP Structure
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
