'use client';

import React, { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { useCrmLabels } from '@/lib/hooks/use-crm-labels';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, GraduationCap, Flame, Clock, CheckCircle2, FileText,
  ArrowUpRight, ChevronRight, MessageSquare, Sparkles, Phone,
  MapPin, BookOpen, Calendar,
} from 'lucide-react';

const aiActions = [
  { action: 'Send UK visa checklist to Sharif Uddin', priority: 'high' },
  { action: 'Follow up on IELTS score for Tasnia Akter', priority: 'medium' },
  { action: 'Schedule mock interview for Riya Sen', priority: 'high' },
  { action: 'Remind Mehedi Hasan about SOP deadline', priority: 'medium' },
];

function UrgencyBadge({ urgency }: { urgency: string }) {
  if (urgency === 'hot') return <Badge variant="danger" className="text-[11px]">🔥 Hot</Badge>;
  return <Badge variant="warning" className="text-[11px]">Warm</Badge>;
}

export default function CounselorDashboard() {
  const { user, token } = usePortalStore();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    hotLeads: any[];
    todayFollowups: any[];
    applicationReady: any[];
    kpis: any;
  } | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!token) return;
      try {
        const res = await fetch('/api/crm/dashboard/counselor', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Failed to load counselor dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [token]);

  const { hotLeads = [], todayFollowups = [], applicationReady = [], kpis = {} } = data || {};

  // Virtual Editor: KPI card labels are overridable via CMS 'crm-label'
  // items (keys below) with these compiled-in defaults as fallback.
  const labels = useCrmLabels({
    'crm.kpi.myLeads': 'My Leads',
    'crm.kpi.myStudents': 'My Students',
    'crm.kpi.hotLeads': 'Hot Leads',
    'crm.kpi.followUpTasks': 'Follow-up Tasks',
    'crm.kpi.profileCompletion': 'Profile Completion',
    'crm.kpi.applicationReady': 'Application-Ready',
  });

  const kpiItems = [
    { label: labels['crm.kpi.myLeads'], value: kpis.totalLeads ?? '0', change: '+0', up: true, icon: Users, sub: 'Total assigned' },
    { label: labels['crm.kpi.myStudents'], value: kpis.totalStudents ?? '0', change: '+0', up: true, icon: GraduationCap, sub: 'Active profiles' },
    { label: labels['crm.kpi.hotLeads'], value: kpis.hotLeadsCount ?? '0', change: '+0', up: true, icon: Flame, sub: 'Immediate action needed' },
    { label: labels['crm.kpi.followUpTasks'], value: kpis.pendingTasksCount ?? '0', change: '+0', up: false, icon: Clock, sub: 'Due today/overdue' },
    { label: labels['crm.kpi.profileCompletion'], value: kpis.profileCompletion ?? '0%', change: '+0%', up: true, icon: CheckCircle2, sub: 'Average completion' },
    { label: labels['crm.kpi.applicationReady'], value: kpis.applicationReadyCount ?? '0', change: '+0', up: true, icon: FileText, sub: 'Ready to submit' },
  ];

  if (loading) {
    return (
      <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Counselor Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><GraduationCap className="w-3 h-3 mr-1" />Counselor</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Calendar className="w-4 h-4" /> My Calendar</Button>
          {/* Form C — manual lead add. Opens the shared Form B section set so a
              counseling session can be captured completely at the desk. */}
          <Button asChild variant="brand" size="sm">
            <a href="/crm/leads/new"><Users className="w-4 h-4" /> Add Lead</a>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpiItems.map((kpi) => (
          <Card key={kpi.label} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-5 h-5 text-alo-brand" />
                <span className={`inline-flex items-center text-[11px] font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90 text-red-600" />}{kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-alo-text">{kpi.value}</p>
              <p className="text-xs text-alo-text-muted mt-0.5">{kpi.label}</p>
              <p className="text-[11px] text-alo-text-muted">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Hot Leads */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Flame className="w-4 h-4 text-[var(--alo-cta)]" /> Hot Leads
                </CardTitle>
                <Badge variant="danger" className="text-[11px]">{hotLeads.length} leads</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {hotLeads.length > 0 ? (
                  hotLeads.map((l: any) => (
                    <div key={l.id || l.name} className="flex items-center justify-between p-3 rounded-lg border border-alo-border hover:bg-alo-brand-light/20 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-alo-text truncate">{l.name}</p>
                        <p className="text-[11px] text-alo-text-muted flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />{l.course} · {l.country}
                        </p>
                      </div>
                      <UrgencyBadge urgency={l.urgency} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-alo-text-muted">No hot leads found.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Follow-ups */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Clock className="w-4 h-4 text-alo-brand" /> Today&apos;s Follow-ups
                </CardTitle>
                <Badge variant="muted" className="text-[11px]">{todayFollowups.length} tasks</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {todayFollowups.length > 0 ? (
                  todayFollowups.map((f: any) => (
                    <div key={f.id || f.student} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${f.status === 'done' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <div>
                          <p className="text-sm font-medium text-alo-text">{f.student}</p>
                          <p className="text-[11px] text-alo-text-muted">{f.type} · {f.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="h-7 px-2"><Phone className="w-3 h-3 mr-1" /> Call</Button>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="h-7 px-2"><MessageSquare className="w-3 h-3 mr-1" /> Chat</Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-alo-text-muted">No follow-ups due today.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* AI Recommended Next Actions */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-alo-brand" /> AI Recommended Actions
                </CardTitle>
                <Badge variant="brand" className="text-[11px]">Smart Queue</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {aiActions.map((a, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-alo-border hover:bg-alo-brand-light/20 transition-colors">
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${a.priority === 'high' ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <p className="text-xs text-alo-text flex-1 leading-relaxed">{a.action}</p>
                    <ChevronRight className="w-3.5 h-3.5 text-alo-text-muted shrink-0 mt-0.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Application-Ready Students */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Application-Ready
                </CardTitle>
                <Badge variant="success" className="text-[11px]">{applicationReady.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {applicationReady.length > 0 ? (
                  applicationReady.map((s: any) => (
                    <div key={s.id || s.name} className="p-2.5 rounded-lg border border-alo-border hover:bg-alo-brand-light/20 transition-colors">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-medium text-alo-text truncate">{s.name}</p>
                        {s.docsReady ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-alo-text-muted truncate">{s.university} · {s.country}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-alo-text-muted">No applications ready yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Messages Summary */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-alo-brand" /> Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-around py-2">
                <div className="text-center">
                  <p className="text-xl font-bold text-alo-text">8</p>
                  <p className="text-[11px] text-alo-text-muted">Unread</p>
                </div>
                <div className="w-px h-8 bg-alo-border" />
                <div className="text-center">
                  <p className="text-xl font-bold text-alo-text">24</p>
                  <p className="text-[11px] text-alo-text-muted">Today</p>
                </div>
                <div className="w-px h-8 bg-alo-border" />
                <div className="text-center">
                  <p className="text-xl font-bold text-alo-text">3</p>
                  <p className="text-[11px] text-alo-text-muted">Urgent</p>
                </div>
              </div>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="w-full mt-3 ">
                <MessageSquare className="w-3.5 h-3.5" /> Open Inbox
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}