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
  DollarSign,
  TrendingUp,
  GraduationCap,
  Plane,
  BarChart3,
  Handshake,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Building2,
  Users,
  Download,
  Eye,
  Loader2,
} from 'lucide-react';

const iconMap: Record<string, any> = {
  DollarSign, TrendingUp, GraduationCap, Plane, BarChart3, Handshake, Users
};

function SeverityBadge({ severity }: { severity: string }) {
  if (severity === 'high') return <Badge variant="danger" className="text-[11px]">Critical</Badge>;
  return <Badge variant="warning" className="text-[11px]">Warning</Badge>;
}

export default function CeoDashboard() {
  const { user, token, setView } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError(''); setData(null);
      try {
        const res = await fetch('/api/crm/ceo/dashboard', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal, credentials: 'same-origin'
        });
        if (!res.ok) throw new Error('Dashboard unavailable');
        const json = await res.json();
        if (!json.success || !json.data) throw new Error('Dashboard unavailable');
        if (!controller.signal.aborted) setData({ ...json.data, owner: user?.id, sessionToken: token });
      } catch (err) {
        if (!controller.signal.aborted) setError('Executive dashboard data is unavailable.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [token, retry, user?.id]);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-6 h-6 animate-spin text-alo-brand" /></div>;
  }

  if (error) return <div role="alert" className="p-6">{error} <Button onClick={() => setRetry(value => value + 1)}>Retry</Button></div>;
  if (data?.owner !== user?.id || data?.sessionToken !== token) return <p role="status">Loading executive dashboard…</p>;

  const { unavailableMetrics = [], branchPerformance = [], topCounselors = [], marketingRoi = [], highRiskCases = [], kpis = [] } = data || {};

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">CEO Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><BarChart3 className="w-3 h-3 mr-1" />Chief Executive</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled title="Executive report export is not implemented"><Download className="w-4 h-4" /> Export Report</Button>
          <Button variant="brand" size="sm" onClick={() => setView('crm-analytics')}><Eye className="w-4 h-4" /> Full Analytics</Button>
        </div>
      </div>

      {unavailableMetrics.length > 0 && <p role="status" className="rounded border p-3 text-sm">Not available: {unavailableMetrics.join(', ')}. These sections do not indicate zero activity.</p>}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = iconMap[kpi.icon] || BarChart3;
          return (
          <Card key={kpi.label} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-5 h-5 text-alo-brand" />
                {kpi.change != null && <span className={`inline-flex items-center text-[11px] font-medium ${kpi.up ? 'text-crm-success-text' : 'text-crm-danger-text'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{kpi.change}
                </span>}
              </div>
              <p className="text-2xl font-bold text-alo-text">{kpi.value}</p>
              <p className="text-xs text-alo-text-muted mt-0.5">{kpi.label}</p>
              <p className="text-[11px] text-alo-text-muted">{kpi.sub}</p>
            </CardContent>
          </Card>
        ); })}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Branch Performance Table */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-alo-brand" /> Branch Performance
                </CardTitle>
                <span className="text-xs text-alo-text-muted">Aggregation unavailable</span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-alo-text-muted">Branch performance is not available.</p>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Branch</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Leads</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Applications</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Revenue</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Conversion</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branchPerformance.map((b) => (
                      <TableRow key={b.branch}>
                        <TableCell className="text-sm font-medium text-alo-text">{b.branch}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{b.leads}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{b.applications}</TableCell>
                        <TableCell className="text-sm font-semibold text-alo-text text-right">{b.revenue}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{b.conversion}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Marketing ROI */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-alo-brand" /> Marketing ROI by Channel
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {marketingRoi.length === 0 && <p className="text-sm text-alo-text-muted">Marketing ROI is not available.</p>}
                {marketingRoi.map((m) => (
                  <div key={m.channel} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-alo-brand-light/20 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-alo-text w-28 truncate">{m.channel}</span>
                      <span className="text-xs text-alo-text-muted">Spend: {m.spend}</span>
                      <span className="text-xs text-alo-text-muted">Leads: {m.leads}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={m.trend === 'up' ? 'success' : 'danger'} className="text-[11px]">
                        {m.trend === 'up' ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}{m.roi}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Top Counselors */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Users className="w-4 h-4 text-alo-brand" /> Top Counselors
                </CardTitle>
                <Badge variant="muted" className="text-[11px]">Ranking unavailable</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {topCounselors.length === 0 && <p className="text-sm text-alo-text-muted">Counselor rankings are not available.</p>}
                {topCounselors.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-brand-light/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-alo-brand-light flex items-center justify-center text-xs font-bold text-alo-brand">{i + 1}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-alo-text truncate">{c.name}</p>
                        <p className="text-[11px] text-alo-text-muted">{c.branch} · {c.applications} apps</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-alo-text shrink-0">{c.revenue}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* High Risk Cases */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-crm-warning-text" /> High-Risk Cases
                </CardTitle>
                <Badge variant="danger" className="text-[11px]">{highRiskCases.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {highRiskCases.map((c) => (
                  <div key={c.student} className={`p-3 rounded-lg border ${c.severity === 'high' ? 'border-crm-danger-border bg-crm-danger-bg' : 'border-crm-warning-border bg-crm-warning-bg'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-alo-text">{c.student}</p>
                      <SeverityBadge severity={c.severity} />
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{c.country} — {c.issue}</p>
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