'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Sparkles, FileText, BookOpen, CheckCircle2, ShieldAlert,
  Clock, ArrowUpRight, ChevronRight, Bot, Eye, Download,
  BarChart3, AlertTriangle, Brain, Loader2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  BookOpen, FileText, CheckCircle2, ShieldAlert, Brain, Clock
};

function TaskStatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'warning' | 'danger' | 'muted'> = {
    approved: 'success',
    pending: 'warning',
    rejected: 'danger',
  };
  return <Badge variant={map[status] || 'muted'} className="text-[11px]">{status}</Badge>;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    'Course Match': 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
    'SOP Draft': 'bg-purple-100 text-purple-700',
    'CV Draft': 'bg-emerald-100 text-emerald-700',
    'Doc Check': 'bg-amber-100 text-amber-700',
    'Visa Risk': 'bg-red-100 text-red-700',
  };
  return <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${colors[type] || 'bg-[var(--alo-surface-muted)]'}`}>{type}</span>;
}

export default function AiCommandDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/ai/dashboard', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setData(json.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-alo-brand" /></div>;
  }

  const { aiTaskOverview = [], auditLogs = [], pendingApprovals = [], performanceMetrics = [], kpis = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">AI Command Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><Brain className="w-3 h-3 mr-1" />AI Manager</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><BarChart3 className="w-4 h-4" /> Analytics</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Sparkles className="w-4 h-4" /> Run AI Task</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
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

      {/* AI Performance Metrics */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-alo-brand" /> AI Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {performanceMetrics.map((m) => (
              <div key={m.metric} className="text-center p-3 rounded-lg bg-alo-brand-light/20">
                <m.icon className="w-5 h-5 text-alo-brand mx-auto mb-1.5" />
                <p className="text-lg font-bold text-alo-text">{m.value}</p>
                <p className="text-[11px] text-alo-text-muted">{m.metric}</p>
                <span className="text-[11px] text-emerald-600 font-medium">{m.trend}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* AI Task Overview Table */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-alo-brand" /> AI Task Overview
                </CardTitle>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className=" text-alo-brand">View All <ChevronRight className="w-3.5 h-3.5" /></Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Task</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Type</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Status</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Created</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aiTaskOverview.map((t) => (
                      <TableRow key={t.task}>
                        <TableCell className="text-sm font-medium text-alo-text max-w-[200px] truncate">{t.task}</TableCell>
                        <TableCell><TypeBadge type={t.type} /></TableCell>
                        <TableCell><TaskStatusBadge status={t.status} /></TableCell>
                        <TableCell className="text-sm text-alo-text-muted">{t.created}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{t.action}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Pending Approval Queue */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Pending Approvals
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">{pendingApprovals.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pendingApprovals.map((p) => (
                  <div key={p.task} className={`p-2.5 rounded-lg border ${p.priority === 'high' ? 'border-amber-200 bg-amber-50' : 'border-alo-border'}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-xs font-medium text-alo-text truncate">{p.task}</p>
                      <Badge variant={p.priority === 'high' ? 'danger' : p.priority === 'medium' ? 'warning' : 'muted'} className="text-[11px] shrink-0 ml-1">{p.priority}</Badge>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <TypeBadge type={p.type} />
                      <div className="flex gap-1">
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm" className="text-[11px] h-6 px-2">Approve</Button>
                        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="text-[11px] h-6 px-2">Reject</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Audit Logs */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Bot className="w-4 h-4 text-purple-500" /> AI Audit Logs
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {auditLogs.map((l, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-purple-200 bg-purple-50">
                    <p className="text-xs text-alo-text">{l.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="muted" className="text-[11px]">{l.model}</Badge>
                      <span className="text-[11px] text-alo-text-muted">{l.tokens} tokens</span>
                      <span className="text-[11px] text-alo-text-muted">{l.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}