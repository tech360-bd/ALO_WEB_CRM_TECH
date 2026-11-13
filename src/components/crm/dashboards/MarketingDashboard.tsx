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
  Globe, Facebook, Instagram, MessageCircle, TrendingUp,
  DollarSign, ArrowUpRight, ArrowDownRight, Calendar,
  Megaphone, FileText, Sparkles, Plus, ChevronRight, Loader2
} from 'lucide-react';

const iconMap: Record<string, any> = {
  Globe, Facebook, Instagram, MessageCircle, TrendingUp, DollarSign
};

export default function MarketingDashboard() {
  const { user, token } = usePortalStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/crm/marketing/dashboard', {
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

  const { campaignPerformance = [], upcomingCalendar = [], contentTasks = [], aiContentQueue = [], kpis = [] } = data || {};

  const typeMap: Record<string, string> = {
    event: 'bg-alo-brand text-white',
    webinar: 'bg-[var(--alo-brand-pale)]0 text-white',
    session: 'bg-[var(--alo-success)] text-white',
    seminar: 'bg-[var(--alo-warning)] text-white',
  };

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Marketing Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="brand" className="text-[11px]"><Megaphone className="w-3 h-3 mr-1" />Marketing Manager</Badge>
            <span className="text-sm text-alo-text-muted">{today}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm"><Calendar className="w-4 h-4" /> Calendar</Button>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm"><Plus className="w-4 h-4" /> New Campaign</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="bg-white rounded-xl border border-alo-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <kpi.icon className="w-5 h-5 text-alo-brand" />
                <span className="inline-flex items-center text-[11px] font-medium text-crm-success-text">
                  <ArrowUpRight className="w-3 h-3" />{kpi.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-alo-text">{kpi.value}</p>
              <p className="text-xs text-alo-text-muted mt-0.5">{kpi.label}</p>
              <p className="text-[11px] text-alo-text-muted">{kpi.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lead Source Distribution */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-alo-brand" /> Lead Source Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="flex items-end gap-2 h-32">
            {[
              { label: 'Facebook', value: 234, max: 234, color: 'bg-[var(--alo-brand)]' },
              { label: 'WhatsApp', value: 178, max: 234, color: 'bg-[var(--alo-success)]' },
              { label: 'Website', value: 156, max: 234, color: 'bg-alo-brand' },
              { label: 'Referral', value: 120, max: 234, color: 'bg-[var(--alo-brand-pale)]0' },
              { label: 'Instagram', value: 89, max: 234, color: 'bg-[var(--alo-error)]' },
              { label: 'Google', value: 52, max: 234, color: 'bg-[var(--alo-warning)]' },
            ].map((s) => (
              <div key={s.label} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-alo-text">{s.value}</span>
                <div className="w-full rounded-t-md bg-[var(--alo-surface-muted)] overflow-hidden" style={{ height: '80px' }}>
                  <div className={`w-full ${s.color} rounded-t-md transition-all`} style={{ height: `${(s.value / s.max) * 100}%`, marginTop: `${100 - (s.value / s.max) * 100}%` }} />
                </div>
                <span className="text-[11px] text-alo-text-muted">{s.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Campaign Performance Table */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-alo-brand" /> Campaign Performance
                </CardTitle>
                <Badge variant="muted" className="text-[11px]">6 campaigns</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs text-alo-text-muted">Campaign</TableHead>
                      <TableHead className="text-xs text-alo-text-muted">Channel</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Spend</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Leads</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Conversions</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">ROI</TableHead>
                      <TableHead className="text-xs text-alo-text-muted text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignPerformance.map((c) => (
                      <TableRow key={c.campaign}>
                        <TableCell className="text-sm font-medium text-alo-text">{c.campaign}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary">{c.channel}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.spend}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.leads}</TableCell>
                        <TableCell className="text-sm text-alo-text-secondary text-right">{c.conversions}</TableCell>
                        <TableCell className="text-sm font-semibold text-crm-success-text text-right">{c.roi}</TableCell>
                        <TableCell className="text-right"><Badge variant={c.status === 'active' ? 'success' : 'muted'} className="text-[11px]">{c.status}</Badge></TableCell>
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
          {/* Upcoming Calendar */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Calendar className="w-4 h-4 text-alo-brand" /> Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {upcomingCalendar.map((e) => (
                  <div key={e.event} className="p-2.5 rounded-lg border border-alo-border hover:bg-alo-brand-light/20 transition-colors">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-alo-text truncate">{e.event}</p>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${typeMap[e.type] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}`}>{e.type}</span>
                    </div>
                    <p className="text-[11px] text-alo-text-muted">{e.location} · {e.date}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Content Queue */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--alo-brand)]" /> AI Content Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {aiContentQueue.map((c, i) => (
                  <div key={i} className="p-2.5 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-brand-pale)]">
                    <div className="flex items-center justify-between mb-0.5">
                      <Badge variant="muted" className="text-[11px]">{c.type}</Badge>
                      <Badge variant={c.status === 'approved' ? 'success' : c.status === 'ready' ? 'warning' : 'muted'} className="text-[11px]">{c.status}</Badge>
                    </div>
                    <p className="text-xs text-alo-text">{c.title}</p>
                    <p className="text-[11px] text-alo-text-muted mt-0.5">{c.words} words</p>
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