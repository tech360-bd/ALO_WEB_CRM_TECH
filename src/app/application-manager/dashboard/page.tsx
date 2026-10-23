'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileCheck, Send, Clock, Award, Shield, AlertTriangle, CheckCircle2,
  Users, Building2, BookOpen, Filter, ArrowUpRight, Plus, Eye,
  RefreshCw, FileText, Calendar, Lock, Loader2, ArrowDownRight,
  X, CheckSquare, User, Handshake, TrendingUp, Globe, GraduationCap,
  Timer, FileWarning, Briefcase
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

export default function ApplicationManagerDashboard() {
  const router = useRouter();
  const token = usePortalStore(state => state.token);
  const [metrics, setMetrics] = useState<any>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [recentApps, setRecentApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [resDashboard, resMetrics, resApps] = await Promise.all([
        fetch('/api/app-manager/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/applications/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/applications?limit=12', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (!resDashboard.ok || !resMetrics.ok) {
        const txt = await resDashboard.text();
        throw new Error(`Failed to load dashboard: ${resDashboard.status}`);
      }

      const dashJson = await resDashboard.json();
      const metJson = await resMetrics.json();
      const appsJson = resApps.ok ? await resApps.json() : { applications: [] };

      setDashboard(dashJson);
      setMetrics(metJson.metrics || metJson.data || metJson.kpis || dashJson.kpis || {});
      setRecentApps(appsJson.applications || appsJson.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="p-8 bg-[#FFFFFF] min-h-screen">
        <div className="max-w-[1600px] mx-auto space-y-6">
          <div className="h-20 bg-[var(--alo-page)] rounded-2xl animate-pulse border border-[var(--alo-border)]" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-[var(--alo-page)] rounded-xl animate-pulse border border-[var(--alo-border)]" />)}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 bg-[#FFFFFF] min-h-screen flex items-center justify-center">
        <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-2xl p-8 text-center max-w-md space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="font-semibold text-[var(--alo-text)]">Failed to load dashboard</h3>
          <p className="text-sm text-[var(--alo-body)]">{error}</p>
          <Button onClick={fetchDashboardData} className="bg-[var(--alo-brand)] text-white">Retry</Button>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: 'Total Applications', value: metrics?.totalApplications ?? metrics?.total ?? 0, icon: FileCheck, color: 'text-[var(--alo-brand)] bg-[var(--alo-brand)]/10 border-[var(--alo-brand)]/20' },
    { label: 'New Today', value: metrics?.newToday ?? 0, icon: Plus, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Direct', value: metrics?.direct ?? 0, icon: User, color: 'text-[var(--alo-brand)] bg-[var(--alo-brand-pale)] border-[var(--alo-border)]' },
    { label: 'Partner', value: metrics?.partner ?? 0, icon: Handshake, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { label: 'B2B Total', value: metrics?.b2b ?? metrics?.confidentialB2bCases ?? 0, icon: Building2, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { label: 'B2B Inbound', value: metrics?.b2bInbound ?? 0, icon: ArrowDownRight, color: 'text-[var(--alo-cta-active)] bg-[var(--alo-cta-soft)] border-[var(--alo-cta)]/25' },
    { label: 'B2B Outbound', value: metrics?.b2bOutbound ?? 0, icon: ArrowUpRight, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Submitted', value: metrics?.submitted ?? 0, icon: Send, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { label: 'Decision Pending', value: metrics?.decisionPending ?? 0, icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { label: 'Conditional Offers', value: metrics?.conditionalOffers ?? 0, icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { label: 'Unconditional Offers', value: metrics?.unconditionalOffers ?? 0, icon: Award, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { label: 'Rejected', value: metrics?.rejected ?? 0, icon: X, color: 'text-red-600 bg-red-50 border-red-200' },
    { label: 'Deferred', value: metrics?.deferred ?? 0, icon: Timer, color: 'text-[var(--alo-body)] bg-[var(--alo-page)] border-[var(--alo-border)]' },
    { label: 'Documents Pending', value: metrics?.documentsPending ?? 0, icon: FileWarning, color: 'text-[var(--alo-cta-active)] bg-[var(--alo-cta-soft)] border-[var(--alo-cta)]/25' },
    { label: 'CAS / I-20 / COE Pending', value: metrics?.casPending ?? 0, icon: Shield, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
    { label: 'Urgent Deadlines', value: metrics?.urgentDeadlines ?? 0, icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
    { label: 'Pending Tasks', value: metrics?.pendingTasks ?? 0, icon: CheckSquare, color: 'text-[var(--alo-brand)] bg-[var(--alo-brand)]/10 border-[var(--alo-brand)]/20' },
  ];

  return (
    <div className="p-4 md:p-6 bg-[#FFFFFF] min-h-screen">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <DashboardCommunicationWidget role="APPLICATION_MANAGER" unreadCount={null} slaOverdueCount={null} onNavigateToInbox={() => router.push('/crm/communications/inbox')} />
        {/* Header 12-col */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <div className="bg-white border border-[var(--alo-border)] rounded-2xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--alo-brand)] flex items-center justify-center shadow-sm">
                  <FileCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-[var(--alo-text)]">Application Command Center</h1>
                  <p className="text-sm text-[var(--alo-text-muted)]">Direct, Partner & B2B Inbound/Outbound — 30+ stage pipeline with safe status mapping</p>
                  <div className="flex gap-2 mt-2">
                    <Badge className="bg-[var(--alo-brand)]/10 text-[var(--alo-brand)] border-[var(--alo-brand)]/20 text-[11px]">REAL API</Badge>
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">B2B SECURED</Badge>
                    <Badge className="bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)] text-[11px]">{recentApps.length} live records</Badge>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/application-manager/applications"><Button variant="outline" className="border-[var(--alo-border)] text-[var(--alo-text)]">All Applications</Button></Link>
                <Link href="/application-manager/b2b"><Button className="bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5"><Lock className="w-4 h-4" />B2B Queue</Button></Link>
                <Button onClick={fetchDashboardData} variant="outline" className="border-[var(--alo-border)]"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards — 4 per row desktop, 2 tablet, 1 mobile — 17 cards */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <h2 className="text-sm font-semibold text-[var(--alo-text)] mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[var(--alo-brand)]" />Key Performance Indicators — Live Database</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpis.map((kpi, idx) => {
                const Icon = kpi.icon;
                return (
                  <Card key={idx} className="bg-white border-[var(--alo-border)] shadow-sm hover:shadow-md transition-shadow rounded-xl">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${kpi.color}`}><Icon className="w-5 h-5" /></div>
                        <span className="text-[11px] text-[var(--alo-text-muted)] font-mono">LIVE DB</span>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-[var(--alo-text)]">{kpi.value}</p>
                        <p className="text-xs text-[var(--alo-body)] leading-tight mt-1">{kpi.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* 12 sections grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Pipeline stages */}
          <div className="col-span-12 lg:col-span-8">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)] flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4 text-[var(--alo-brand)]" />Pipeline Stages — 30+ Internal Mapping</CardTitle>
                <Link href="/application-manager/applications" className="text-xs text-[var(--alo-brand)] hover:underline">View pipeline →</Link>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(dashboard?.breakdowns?.stages || {}).slice(0, 12).map(([stage, count]: any) => (
                    <div key={stage} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[var(--alo-text)] truncate">{stage.replace(/_/g, ' ')}</span>
                      <Badge className="bg-white border-[var(--alo-border)] text-[var(--alo-brand)] text-[11px]">{count as any}</Badge>
                    </div>
                  ))}
                  {(!dashboard?.breakdowns?.stages || Object.keys(dashboard.breakdowns.stages).length === 0) && (
                    <div className="col-span-3 py-8 text-center text-sm text-[var(--alo-text-muted)]">No applications found. Pipeline will populate from real database.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Submission breakdown */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Send className="w-4 h-4 text-emerald-600" />Submission Methods</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-3">
                {[
                  { label: 'Direct University Portal', value: dashboard?.breakdowns?.stages?.SUBMITTED_VIA_PORTAL || 0 },
                  { label: 'Email', value: dashboard?.breakdowns?.stages?.SUBMITTED_VIA_EMAIL || 0 },
                  { label: 'University Representative', value: dashboard?.breakdowns?.stages?.SUBMITTED_VIA_REP || 0 },
                  { label: 'B2B Inbound', value: metrics?.b2bInbound || 0 },
                  { label: 'B2B Outbound', value: metrics?.b2bOutbound || 0 },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">
                    <span className="text-xs text-[var(--alo-text)]">{item.label}</span>
                    <span className="text-sm font-bold text-[var(--alo-text)]">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* B2B confidential alerts */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="bg-white border-rose-200 shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-rose-100 flex flex-row items-center justify-between bg-rose-50/50 rounded-t-xl">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-rose-700"><Lock className="w-4 h-4" />B2B Confidential Alerts</CardTitle>
                <Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[11px]">RESTRICTED</Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {(dashboard?.alerts?.confidential || []).length === 0 ? (
                  <p className="text-xs text-[var(--alo-text-muted)] py-4 text-center">No confidential alerts. B2B queue clear.</p>
                ) : (
                  dashboard.alerts.confidential.map((alert: any, i: number) => (
                    <div key={i} className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
                      <p className="font-semibold text-rose-800">{alert.b2bProvider?.name || 'B2B Provider'} — {alert.b2bType}</p>
                      <p className="text-rose-600 mt-1">Ref: {alert.b2bReference || 'PENDING'} • Status: {alert.b2bStatus}</p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Document review */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm font-semibold flex items-center gap-2"><FileCheck className="w-4 h-4 text-[var(--alo-brand)]" />Document Review Queue</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2">
                {(dashboard?.documents || []).slice(0, 5).map((doc: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">
                    <div><p className="text-xs font-medium text-[var(--alo-text)] truncate">{doc.fileName || doc.documentType}</p><p className="text-[11px] text-[var(--alo-text-muted)]">{doc.status}</p></div>
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[11px]">{doc.status}</Badge>
                  </div>
                ))}
                {(dashboard?.documents || []).length === 0 && <p className="text-xs text-[var(--alo-text-muted)] py-4 text-center">No documents pending review.</p>}
                <Link href="/application-manager/document-review"><Button variant="outline" size="sm" className="w-full mt-2 border-[var(--alo-border)] ">Open Document Review</Button></Link>
              </CardContent>
            </Card>
          </div>

          {/* Offer management */}
          <div className="col-span-12 lg:col-span-4">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Award className="w-4 h-4 text-purple-600" />Offer Management</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-center"><p className="text-lg font-bold text-purple-700">{metrics?.conditionalOffers || 0}</p><p className="text-[11px] text-purple-600">Conditional</p></div>
                  <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-center"><p className="text-lg font-bold text-violet-700">{metrics?.unconditionalOffers || 0}</p><p className="text-[11px] text-violet-600">Unconditional</p></div>
                </div>
                <Link href="/application-manager/offer-management"><Button variant="outline" size="sm" className="w-full border-[var(--alo-border)] ">Manage Offers</Button></Link>
              </CardContent>
            </Card>
          </div>

          {/* CAS / I-20 / COE */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-600" />CAS / I-20 / COE — Destination Mapping</CardTitle></CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'UK CAS', dest: 'UK', count: dashboard?.applications?.filter((a: any) => a.country === 'UK' && a.stage?.includes('CAS')).length || 0 },
                    { label: 'USA I-20', dest: 'USA', count: dashboard?.applications?.filter((a: any) => a.country === 'USA' && a.stage?.includes('I20')).length || 0 },
                    { label: 'Australia COE', dest: 'Australia', count: dashboard?.applications?.filter((a: any) => a.country === 'Australia' && a.stage?.includes('COE')).length || 0 },
                    { label: 'Canada LOA/PAL', dest: 'Canada', count: dashboard?.applications?.filter((a: any) => a.country === 'Canada').length || 0 },
                    { label: 'Ireland Offer', dest: 'Ireland', count: dashboard?.applications?.filter((a: any) => a.country === 'Ireland').length || 0 },
                    { label: 'Dubai Visa Letter', dest: 'Dubai', count: dashboard?.applications?.filter((a: any) => a.country === 'Dubai' || a.country === 'UAE').length || 0 },
                  ].map((item, i) => (
                    <div key={i} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 text-center">
                      <p className="font-semibold text-[var(--alo-text)]">{item.count}</p>
                      <p className="text-[11px] text-[var(--alo-body)] mt-1">{item.label}</p>
                      <p className="text-[11px] text-[var(--alo-text-muted)]">{item.dest}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Deadlines */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)] flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-red-600" />Deadline Engine</CardTitle>
                <Link href="/application-manager/deadlines" className="text-xs text-[var(--alo-brand)]">View all →</Link>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {(dashboard?.deadlines || []).slice(0, 5).map((dl: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">
                    <div><p className="text-xs font-medium text-[var(--alo-text)]">{dl.deadlineType?.replace(/_/g, ' ')}</p><p className="text-[11px] text-[var(--alo-text-muted)]">{new Date(dl.deadlineDate).toLocaleDateString()} • {dl.application?.universityName || dl.applicationId}</p></div>
                    <Badge className={`${dl.status === 'OVERDUE' ? 'bg-red-50 text-red-700 border-red-200' : dl.status === 'DUE_TODAY' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]'} text-[11px]`}>{dl.status}</Badge>
                  </div>
                ))}
                {(dashboard?.deadlines || []).length === 0 && <p className="text-xs text-[var(--alo-text-muted)] py-4 text-center">No pending deadlines. Alerts will appear here as deadlines approach.</p>}
              </CardContent>
            </Card>
          </div>

          {/* Activity */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-[var(--alo-brand)]" />Recent Activity — Timeline</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2">
                {(dashboard?.statusLogs || []).slice(0, 6).map((log: any, i: number) => (
                  <div key={i} className="flex gap-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">
                    <div className="w-2 h-2 rounded-full bg-[var(--alo-brand)] mt-1.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium text-[var(--alo-text)] truncate">{log.note || `${log.oldStatus} → ${log.newStatus}`}</p><p className="text-[11px] text-[var(--alo-text-muted)]">{new Date(log.createdAt).toLocaleString()} • {log.visibility}</p></div>
                  </div>
                ))}
                {(dashboard?.statusLogs || []).length === 0 && <p className="text-xs text-[var(--alo-text-muted)] py-4 text-center">No activity yet.</p>}
              </CardContent>
            </Card>
          </div>

          {/* Tasks */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)] flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><CheckSquare className="w-4 h-4 text-[var(--alo-brand)]" />Pending Tasks</CardTitle>
                <Link href="/application-manager/tasks" className="text-xs text-[var(--alo-brand)]">View tasks →</Link>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {(dashboard?.tasks || []).slice(0, 6).map((task: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3">
                    <div><p className="text-xs font-medium text-[var(--alo-text)]">{task.taskTitle}</p><p className="text-[11px] text-[var(--alo-text-muted)]">{task.assignedToName || task.assignedTo} • Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</p></div>
                    <Badge className={`${task.priority === 'URGENT' ? 'bg-red-50 text-red-700 border-red-200' : task.priority === 'HIGH' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-[var(--alo-page)] text-[var(--alo-body)] border-[var(--alo-border)]'} text-[11px]`}>{task.priority}</Badge>
                  </div>
                ))}
                {(dashboard?.tasks || []).length === 0 && <p className="text-xs text-[var(--alo-text-muted)] py-4 text-center">No pending tasks.</p>}
              </CardContent>
            </Card>
          </div>

          {/* Source performance */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm font-semibold flex items-center gap-2"><Globe className="w-4 h-4 text-[var(--alo-brand)]" />Source Performance — 10 Normalized Sources</CardTitle></CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(dashboard?.breakdowns?.sources || {}).map(([src, count]: any) => (
                    <div key={src} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 flex items-center justify-between">
                      <span className="text-[11px] font-medium text-[var(--alo-text)] truncate">{src.replace(/_/g, ' ')}</span>
                      <Badge className="bg-white border-[var(--alo-border)] text-[var(--alo-text)] text-[11px]">{count as any}</Badge>
                    </div>
                  ))}
                  {(!dashboard?.breakdowns?.sources || Object.keys(dashboard.breakdowns.sources).length === 0) && (
                    <div className="col-span-2 py-6 text-center text-xs text-[var(--alo-text-muted)]">No source data yet. Application sources will appear here once applications are submitted.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* University response */}
          <div className="col-span-12 lg:col-span-6">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl h-full">
              <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm font-semibold flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[var(--alo-brand)]" />University Response & Country Breakdown</CardTitle></CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold text-[var(--alo-body)] mb-2">By Country</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(dashboard?.breakdowns?.countries || {}).slice(0, 6).map(([country, count]: any) => (
                        <div key={country} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2.5 flex items-center justify-between">
                          <span className="text-xs text-[var(--alo-text)]">{country}</span>
                          <span className="text-xs font-bold text-[var(--alo-text)]">{count as any}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Live application stream */}
          <div className="col-span-12">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
              <CardHeader className="p-4 border-b border-[var(--alo-border)] flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--alo-brand)]" />Live Application Stream</CardTitle>
                <Link href="/application-manager/applications" className="text-xs text-[var(--alo-brand)] hover:underline">View full table →</Link>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--alo-border)] text-left text-[var(--alo-text-muted)] bg-[var(--alo-page)]">
                        <th className="p-3 font-medium">App ID</th>
                        <th className="p-3 font-medium">Student</th>
                        <th className="p-3 font-medium">University</th>
                        <th className="p-3 font-medium">Course</th>
                        <th className="p-3 font-medium">Source</th>
                        <th className="p-3 font-medium">Stage</th>
                        <th className="p-3 font-medium">Safe Status</th>
                        <th className="p-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApps.length === 0 ? (
                        <tr><td colSpan={8} className="p-8 text-center text-[var(--alo-text-muted)]">No applications found. Real database will populate this table. Use Create Application to add first record.</td></tr>
                      ) : (
                        recentApps.map((app: any) => (
                          <tr key={app.id} className="border-b border-[var(--alo-border)]/60 hover:bg-[var(--alo-page)] transition-colors">
                            <td className="p-3 font-mono text-xs text-[var(--alo-brand)]">{app.applicationCode || app.id.substring(0, 10)}</td>
                            <td className="p-3 font-medium text-[var(--alo-text)]">{app.studentId?.substring(0, 8) || 'Student'}</td>
                            <td className="p-3 text-[var(--alo-text)]">{app.universityName}</td>
                            <td className="p-3 text-xs text-[var(--alo-body)]">{app.courseName}</td>
                            <td className="p-3">
                              {app.isB2b ? <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px]"><Lock className="w-2.5 h-2.5 mr-1" />{app.b2bType || 'B2B'}</Badge> : <Badge variant="outline" className="text-[var(--alo-body)] border-[var(--alo-border)] text-[11px]">{(app.applicationSource || 'DIRECT').replace(/_/g, ' ')}</Badge>}
                            </td>
                            <td className="p-3 text-xs text-amber-600 font-medium">{app.stage}</td>
                            <td className="p-3"><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">{app.safeStatus || 'UNDER REVIEW'}</Badge></td>
                            <td className="p-3 text-right"><Link href={`/application-manager/application/${app.id}`}><Button size="sm" variant="ghost" className="text-[var(--alo-text)] hover:text-[var(--alo-brand)]"><Eye className="w-4 h-4 mr-1" />Manage</Button></Link></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
