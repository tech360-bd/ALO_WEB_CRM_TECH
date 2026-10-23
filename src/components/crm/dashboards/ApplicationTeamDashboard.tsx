'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  FileCheck, FileX, Send, CheckCircle2, Award, AlertTriangle,
  Clock, ArrowUpRight, ChevronRight, Upload, Eye, Calendar,
  XCircle, Loader2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  FileCheck, FileX, Send, CheckCircle2, Award, Eye
};

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'brand' | 'muted' }> = {
    'Ready to Submit': { variant: 'success' },
    'Document Review': { variant: 'warning' },
    'Submitted': { variant: 'brand' },
    'Acknowledged': { variant: 'muted' },
    'Conditional Offer': { variant: 'success' },
    'Missing Docs': { variant: 'danger' },
  };
  const v = map[stage] || { variant: 'muted' as const };
  return <Badge variant={v.variant} className="text-[11px]">{stage}</Badge>;
}

export default function ApplicationTeamDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/applications/dashboard', {
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

  const { applications = [], kpis = [], missingDocs = [], universityFollowups = [], deadlineAlerts = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Application Team Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><FileCheck className="w-3 h-3 mr-1" />Application Team</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Upload className="w-4 h-4" /> Batch Upload</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Send className="w-4 h-4" /> Submit Application</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi: any) => {
          const Icon = iconMap[kpi.icon] || CheckCircle2;
          return (
            <Card key={kpi.label} className="bg-white rounded-xl border border-alo-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-alo-brand" />
                  <span className={`inline-flex items-center text-[11px] font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}>
                    {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}{kpi.change}
                  </span>
                </div>
                <p className="text-2xl font-bold text-alo-text">{kpi.value}</p>
                <p className="text-xs text-alo-text-muted mt-0.5">{kpi.label}</p>
                <p className="text-[11px] text-alo-text-muted">{kpi.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Applications by Stage Table */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Send className="w-4 h-4 text-alo-brand" /> Applications by Stage
                </CardTitle>
                <Badge variant="muted" className="text-[11px]">118 total</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Student</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">University</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Country</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Stage</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((a: any) => (
                      <TableRow key={a.id || a.student + a.university}>
                        <TableCell className="text-sm font-medium text-alo-text">{a.student}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{a.university}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{a.country}</TableCell>
                        <TableCell><StageBadge stage={a.stage} /></TableCell>
                        <TableCell className="text-sm text-alo-text-muted text-right">{a.submitted}</TableCell>
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
          {/* Missing Documents Alert */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Missing Documents
                </CardTitle>
                <Badge variant="danger" className="text-[11px]">{missingDocs.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {missingDocs.map((d) => (
                  <div key={d.student + d.doc} className={`p-2.5 rounded-lg border ${d.severity === 'high' ? 'border-red-200 bg-red-50' : d.severity === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-alo-border'}`}>
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-alo-text truncate">{d.student}</p>
                      <Badge variant={d.severity === 'high' ? 'danger' : d.severity === 'medium' ? 'warning' : 'muted'} className="text-[11px] shrink-0 ml-1">By {d.deadline}</Badge>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{d.doc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* University Follow-ups */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-alo-brand" /> University Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {universityFollowups.map((f, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-alo-border hover:bg-alo-brand-light/20 transition-colors">
                    <p className="text-sm font-medium text-alo-text">{f.university}</p>
                    <p className="text-[11px] text-alo-text-muted mt-0.5">{f.task}</p>
                    <p className="text-[11px] text-alo-brand mt-1">Due: {f.due}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Deadline Alerts */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" /> Deadline Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {deadlineAlerts.map((d, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-amber-200 bg-amber-50">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-alo-text truncate">{d.university}</p>
                      <Badge variant="warning" className="text-[11px] shrink-0 ml-1">{d.daysLeft}d left</Badge>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{d.intake} · Deadline: {d.deadline}</p>
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