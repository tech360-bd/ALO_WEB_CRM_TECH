'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  Users, TrendingUp, GraduationCap, DollarSign, ArrowUpRight,
  ArrowDownRight, Target, BarChart3, CalendarDays, Download,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────── */

interface KpiData {
  leadsThisMonth: number;
  leadsLastMonth: number;
  conversionRate: number;
  conversionLastMonth: number;
  activeStudents: number;
  revenue: number;
  revenueLastMonth: number;
  totalLeadsAllTime: number;
}

interface MonthlyLead {
  month: string;
  leads: number;
  converted: number;
  revenue: number;
}

/* ── Mock Data ─────────────────────────────────────── */

const mockKpi: KpiData = {
  leadsThisMonth: 18,
  leadsLastMonth: 14,
  conversionRate: 32.5,
  conversionLastMonth: 28.0,
  activeStudents: 12,
  revenue: 85000,
  revenueLastMonth: 65000,
  totalLeadsAllTime: 86,
};

const mockMonthlyLeads: MonthlyLead[] = [
  { month: 'Jan 2025', leads: 18, converted: 6, revenue: 85000 },
  { month: 'Dec 2024', leads: 14, converted: 4, revenue: 65000 },
  { month: 'Nov 2024', leads: 22, converted: 7, revenue: 92000 },
  { month: 'Oct 2024', leads: 16, converted: 5, revenue: 72000 },
  { month: 'Sep 2024', leads: 20, converted: 8, revenue: 110000 },
  { month: 'Aug 2024', leads: 12, converted: 3, revenue: 45000 },
  { month: 'Jul 2024', leads: 15, converted: 5, revenue: 68000 },
  { month: 'Jun 2024', leads: 10, converted: 2, revenue: 35000 },
  { month: 'May 2024', leads: 8, converted: 2, revenue: 28000 },
  { month: 'Apr 2024', leads: 6, converted: 1, revenue: 18000 },
  { month: 'Mar 2024', leads: 9, converted: 3, revenue: 42000 },
  { month: 'Feb 2024', leads: 11, converted: 4, revenue: 56000 },
];

/* ── Component ─────────────────────────────────────── */

export default function PartnerReportsPage() {
  const { user } = usePortalStore();
  const [kpi, setKpi] = useState<KpiData>(mockKpi);
  const [monthlyLeads, setMonthlyLeads] = useState<MonthlyLead[]>([]);
  const [loading, setLoading] = useState(true);

  const exportCSV = useCallback(() => {
    const rows = [['Month', 'Leads', 'Converted', 'Conversion %', 'Revenue']];
    monthlyLeads.forEach((m) => {
      const convRate = m.leads > 0 ? Math.round((m.converted / m.leads) * 100) : 0;
      rows.push([m.month, String(m.leads), String(m.converted), `${convRate}%`, String(m.revenue)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partner-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [monthlyLeads]);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      const res = await fetch(`/api/partner/reports?partnerId=${user?.id || ''}`, { headers });
      const data = await res.json();
      if (data.success) {
        if (data.kpi) setKpi(data.kpi);
        if (Array.isArray(data.monthlyLeads) && data.monthlyLeads.length > 0) {
          setMonthlyLeads(data.monthlyLeads);
        } else {
          setMonthlyLeads(mockMonthlyLeads);
        }
      } else {
        setMonthlyLeads(mockMonthlyLeads);
      }
    } catch {
      setMonthlyLeads(mockMonthlyLeads);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const formatCurrency = (amount: number) => `৳${amount.toLocaleString('en-BD')}`;

  const leadsChange = kpi.leadsLastMonth > 0
    ? Math.round(((kpi.leadsThisMonth - kpi.leadsLastMonth) / kpi.leadsLastMonth) * 100)
    : 0;
  const conversionChange = kpi.conversionLastMonth > 0
    ? +(kpi.conversionRate - kpi.conversionLastMonth).toFixed(1)
    : 0;
  const revenueChange = kpi.revenueLastMonth > 0
    ? Math.round(((kpi.revenue - kpi.revenueLastMonth) / kpi.revenueLastMonth) * 100)
    : 0;

  const maxLeads = Math.max(...monthlyLeads.map((m) => m.leads), 1);
  const maxConverted = Math.max(...monthlyLeads.map((m) => m.converted), 1);

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Reports & Analytics</h1>
          <p className="text-sm text-alo-text-muted mt-0.5">Performance overview and key metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="muted" className="text-xs">
            <CalendarDays className="w-3 h-3 mr-1" />
            {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </Badge>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Leads This Month */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-alo-brand-light/50 flex items-center justify-center">
                <Users className="w-5 h-5 text-alo-brand" />
              </div>
              <span className={cn(
                'inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full',
                leadsChange >= 0
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-red-700 bg-red-50'
              )}>
                {leadsChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(leadsChange)}% vs last month
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">{kpi.leadsThisMonth}</p>
            <p className="text-xs text-alo-text-muted mt-1">Leads This Month</p>
            <p className="text-[11px] text-alo-text-muted mt-0.5">{kpi.leadsLastMonth} leads last month</p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <span className={cn(
                'inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full',
                conversionChange >= 0
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-red-700 bg-red-50'
              )}>
                {conversionChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(conversionChange)}pp
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">{kpi.conversionRate}%</p>
            <p className="text-xs text-alo-text-muted mt-1">Conversion Rate</p>
            <p className="text-[11px] text-alo-text-muted mt-0.5">{kpi.conversionLastMonth}% last month</p>
          </CardContent>
        </Card>

        {/* Active Students */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-sky-600" />
              </div>
              <Badge variant="brand" className="text-[10px]">Active</Badge>
            </div>
            <p className="text-2xl font-bold text-alo-text">{kpi.activeStudents}</p>
            <p className="text-xs text-alo-text-muted mt-1">Active Students</p>
            <p className="text-[11px] text-alo-text-muted mt-0.5">{kpi.totalLeadsAllTime} total leads all time</p>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <span className={cn(
                'inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full',
                revenueChange >= 0
                  ? 'text-emerald-700 bg-emerald-50'
                  : 'text-red-700 bg-red-50'
              )}>
                {revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {Math.abs(revenueChange)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">{formatCurrency(kpi.revenue)}</p>
            <p className="text-xs text-alo-text-muted mt-1">Revenue This Month</p>
            <p className="text-[11px] text-alo-text-muted mt-0.5">{formatCurrency(kpi.revenueLastMonth)} last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Leads Trend */}
      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-alo-text">Monthly Leads Trend</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-alo-brand" />
                <span className="text-xs text-alo-text-muted">Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-alo-text-muted">Converted</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-center">Leads</TableHead>
                  <TableHead className="text-center">Converted</TableHead>
                  <TableHead className="text-center hidden sm:table-cell">Conversion %</TableHead>
                  <TableHead className="text-center hidden md:table-cell">Revenue</TableHead>
                  <TableHead className="hidden lg:table-cell min-w-[200px]">Visual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyLeads.map((row) => {
                  const convRate = row.leads > 0 ? Math.round((row.converted / row.leads) * 100) : 0;
                  return (
                    <TableRow key={row.month} className="hover:bg-alo-brand-light/20 transition-colors">
                      <TableCell className="font-medium text-sm text-alo-text">{row.month}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-alo-text">{row.leads}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-sm font-semibold text-emerald-600">{row.converted}</span>
                      </TableCell>
                      <TableCell className="text-center hidden sm:table-cell">
                        <Badge variant={convRate >= 30 ? 'success' : convRate >= 20 ? 'warning' : 'muted'} className="text-[11px]">
                          {convRate}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center hidden md:table-cell text-sm text-alo-text font-medium">
                        {formatCurrency(row.revenue)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden flex">
                            <div
                              className="bg-alo-brand h-full rounded-l-full transition-all"
                              style={{ width: `${(row.leads / maxLeads) * 100}%` }}
                            />
                          </div>
                          <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden flex">
                            <div
                              className="bg-emerald-500 h-full rounded-l-full transition-all"
                              style={{ width: `${(row.converted / maxConverted) * 100}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-alo-brand-light/50 flex items-center justify-center shrink-0">
              <BarChart3 className="w-5 h-5 text-alo-brand" />
            </div>
            <div>
              <p className="text-xs text-alo-text-muted">Avg Leads / Month</p>
              <p className="text-lg font-bold text-alo-text">
                {Math.round(monthlyLeads.reduce((sum, m) => sum + m.leads, 0) / monthlyLeads.length)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-alo-text-muted">Best Month (Leads)</p>
              <p className="text-lg font-bold text-alo-text">
                {monthlyLeads.reduce((best, m) => m.leads > best.leads ? m : best, monthlyLeads[0]).month}
                <span className="text-sm font-normal text-alo-text-muted ml-1.5">
                  ({monthlyLeads.reduce((best, m) => m.leads > best.leads ? m : best, monthlyLeads[0]).leads})
                </span>
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-alo-text-muted">Total Revenue (12 months)</p>
              <p className="text-lg font-bold text-alo-text">
                {formatCurrency(monthlyLeads.reduce((sum, m) => sum + m.revenue, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
