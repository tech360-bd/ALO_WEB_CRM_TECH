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
  Handshake, Users, GraduationCap, FileText, DollarSign,
  CheckCircle2, ArrowUpRight, Clock, AlertTriangle,
  ChevronRight, Plus, Award, ShieldCheck, Loader2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Handshake, Users, GraduationCap, FileText, DollarSign, CheckCircle2, Award, Clock
};

export default function PartnerManagerDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/partners/dashboard', {
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

  const { partnerPerformance = [], pendingApprovals = [], complianceStatus = [], trainingStatus = [], kpis = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Partner Manager Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><Handshake className="w-3 h-3 mr-1" />Partner Manager</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Award className="w-4 h-4" /> Training</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Plus className="w-4 h-4" /> Add Partner</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi: any) => {
          const Icon = iconMap[kpi.icon] || Handshake;
          return (
            <Card key={kpi.label} className="bg-white rounded-xl border border-alo-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-5 h-5 text-alo-brand" />
                  <span className={`inline-flex items-center text-[11px] font-medium ${kpi.up ? 'text-emerald-600' : 'text-red-600'}`}>
                    {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3 rotate-90 text-red-600" />}{kpi.change}
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
          {/* Partner Performance Table */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-alo-brand" /> Partner Performance
                </CardTitle>
                <Badge variant="muted" className="text-[11px]">{partnerPerformance.length} partners</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto max-h-80 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Partner</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Location</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Students</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Applications</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Commission</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Compliance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerPerformance.map((p: any) => (
                      <TableRow key={p.partner}>
                        <TableCell className="text-sm font-medium text-alo-text">{p.partner}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{p.location}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{p.students}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{p.applications}</TableCell>
                        <TableCell className="text-sm font-semibold text-alo-text text-right">{p.commission}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Progress value={p.compliance} className="h-1.5 w-12" />
                            <span className="text-[11px] text-alo-text-secondary">{p.compliance}%</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Training Status */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Award className="w-4 h-4 text-alo-brand" /> Training Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {trainingStatus.map((t) => (
                  <div key={t.training} className="flex items-center gap-4">
                    <div className="w-40 shrink-0">
                      <p className="text-sm font-medium text-alo-text">{t.training}</p>
                      <p className="text-[11px] text-alo-text-muted">{t.date}</p>
                    </div>
                    <div className="flex-1">
                      <Progress value={(t.completed / t.total) * 100} className="h-2.5" />
                    </div>
                    <span className="text-xs font-semibold text-alo-text-secondary w-20 text-right">{t.completed}/{t.total}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Pending Approvals */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" /> Pending Approvals
                </CardTitle>
                <Badge variant="warning" className="text-[11px]">{pendingApprovals.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingApprovals.map((p) => (
                  <div key={p.name} className="p-2.5 rounded-lg border border-amber-200 bg-amber-50">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-alo-text">{p.name}</p>
                      <Badge variant={p.documents === 'Complete' ? 'success' : p.documents === 'Incomplete' ? 'danger' : 'warning'} className="text-[10px]">{p.documents}</Badge>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{p.location} · Submitted: {p.submitted}</p>
                    <div className="flex gap-1 mt-1.5">
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm" className="text-[10px] h-6 px-2">Approve</Button>
                      <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="text-[10px] h-6 px-2">Review</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Partner Document Compliance */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-alo-brand" /> Compliance Alerts
                </CardTitle>
                <Badge variant="danger" className="text-[11px]">{complianceStatus.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {complianceStatus.map((c) => (
                  <div key={c.partner} className={`p-2.5 rounded-lg border ${c.severity === 'high' ? 'border-red-200 bg-red-50' : c.severity === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-alo-border'}`}>
                    <p className="text-sm font-medium text-alo-text">{c.partner}</p>
                    <p className="text-[11px] text-alo-text-muted">{c.issue}</p>
                    <p className="text-[10px] text-alo-brand mt-0.5">Due: {c.due}</p>
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