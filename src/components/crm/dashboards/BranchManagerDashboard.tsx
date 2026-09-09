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
  Users, UserPlus, AlertTriangle, Clock, FileText, ShieldAlert,
  ArrowUpRight, ArrowDownRight, ChevronRight, Building2, Phone,
  UserCheck, CalendarDays, TrendingUp, Loader2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Users, UserCheck, UserPlus, AlertTriangle, FileText, ShieldAlert
};

export default function BranchManagerDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/branch/dashboard', {
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

  const { counselorPerformance = [], unassignedLeads = [], overdueFollowups = [], pipelineStages = [], kpis = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Branch Manager Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><Building2 className="w-3 h-3 mr-1" />Branch Manager</Badge>
            <Badge variant="muted" className="text-[11px]">{user?.branch || 'Dhaka (Dhanmondi)'}</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm"><CalendarDays className="w-4 h-4" /> Schedule</Button>
          <Button variant="brand" size="sm"><UserPlus className="w-4 h-4" /> Assign Leads</Button>
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
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{kpi.change}
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
          {/* Counselor Performance Table */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-alo-brand" /> Counselor Performance
                </CardTitle>
                <Badge variant="muted" className="text-[11px]">8 counselors</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Counselor</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Leads</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Active</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Applications</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Conversion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {counselorPerformance.map((c) => (
                      <TableRow key={c.name}>
                        <TableCell className="text-sm font-medium text-alo-text">{c.name}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.leads}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.active}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.applications}</TableCell>
                        <TableCell className="text-sm font-medium text-alo-text text-right">{c.conversion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Application Pipeline by Stage */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <FileText className="w-4 h-4 text-alo-brand" /> Application Pipeline by Stage
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {pipelineStages.map((s) => (
                  <div key={s.stage} className="flex items-center gap-4">
                    <div className="w-32 shrink-0 text-right">
                      <p className="text-sm font-medium text-alo-text">{s.stage}</p>
                    </div>
                    <div className="flex-1">
                      <div className="relative h-8 rounded-lg bg-gray-100 overflow-hidden">
                        <div className={`h-full ${s.color} rounded-lg flex items-center justify-end pr-3 transition-all duration-500`} style={{ width: `${s.pct}%` }}>
                          <span className="text-xs font-bold text-white">{s.count}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Unassigned Leads */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-amber-500" /> Unassigned Leads
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">{unassignedLeads.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {unassignedLeads.map((l) => (
                  <div key={l.name} className="flex items-center justify-between p-2.5 rounded-lg border border-alo-border hover:bg-alo-brand-light/20 transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-alo-text truncate">{l.name}</p>
                      <p className="text-[11px] text-alo-text-muted">{l.interest} · {l.time}</p>
                    </div>
                    <Badge variant="muted" className="text-[10px] shrink-0 ml-2">{l.source}</Badge>
                  </div>
                ))}
              </div>
              <Button variant="brand" size="sm" className="w-full mt-3 text-xs">
                Assign All Leads
              </Button>
            </CardContent>
          </Card>

          {/* Overdue Follow-ups */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Overdue Follow-ups
                </CardTitle>
                <Badge variant="danger" className="text-[11px]">{overdueFollowups.length}+</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {overdueFollowups.map((f) => (
                  <div key={f.student} className="p-2.5 rounded-lg border border-red-200 bg-red-50">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-alo-text">{f.student}</p>
                      <Badge variant="danger" className="text-[10px]">{f.type}</Badge>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">Counselor: {f.counselor} · Due: {f.due}</p>
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