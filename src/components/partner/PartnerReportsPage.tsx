'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, GraduationCap, DollarSign, FileText, Target, CalendarDays, Download, RefreshCw } from 'lucide-react';

interface ReportSummary {
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  activeStudents: number;
  applicationCount: number;
  commissionExpected: number;
  commissionReceived: number;
}
interface PeriodLead { period: string; count: number }
interface LeadStatus { status: string; count: number }

const EMPTY_SUMMARY: ReportSummary = {
  totalLeads: 0,
  convertedLeads: 0,
  conversionRate: 0,
  activeStudents: 0,
  applicationCount: 0,
  commissionExpected: 0,
  commissionReceived: 0,
};

function formatCurrency(amount: number) { return `৳${amount.toLocaleString('en-BD')}`; }
function csvCell(value: unknown) { return `"${String(value ?? '').replace(/"/g, '""')}"`; }

export default function PartnerReportsPage() {
  const [summary, setSummary] = useState<ReportSummary>(EMPTY_SUMMARY);
  const [periodData, setPeriodData] = useState<PeriodLead[]>([]);
  const [statusData, setStatusData] = useState<LeadStatus[]>([]);
  const [period, setPeriod] = useState('monthly');
  const [generatedAt, setGeneratedAt] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/partner/reports?period=${period}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !payload.data?.summary) {
        throw new Error(payload.error || `Could not load partner report (HTTP ${response.status})`);
      }
      const data = payload.data;
      setSummary({
        totalLeads: Number(data.summary.totalLeads || 0),
        convertedLeads: Number(data.summary.convertedLeads || 0),
        conversionRate: Number(data.summary.conversionRate || 0),
        activeStudents: Number(data.summary.activeStudents || 0),
        applicationCount: Number(data.summary.applicationCount || 0),
        commissionExpected: Number(data.summary.commissionExpected || 0),
        commissionReceived: Number(data.summary.commissionReceived || 0),
      });
      setPeriodData(Array.isArray(data.leadsByPeriod) ? data.leadsByPeriod.map((item: any) => ({ period: String(item.period || ''), count: Number(item.count || 0) })) : []);
      setStatusData(Array.isArray(data.leadsByStatus) ? data.leadsByStatus.map((item: any) => ({ status: String(item.status || 'not recorded'), count: Number(item.count || 0) })) : []);
      setGeneratedAt(String(data.generatedAt || ''));
    } catch (caught) {
      setSummary(EMPTY_SUMMARY);
      setPeriodData([]);
      setStatusData([]);
      setError(caught instanceof Error ? caught.message : 'Could not load partner report.');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { void fetchReports(); }, [fetchReports]);

  const exportCSV = () => {
    const rows = [
      ['Report type', period],
      ['Total leads', String(summary.totalLeads)],
      ['Converted leads', String(summary.convertedLeads)],
      ['Conversion rate', `${summary.conversionRate}%`],
      ['Active student profiles', String(summary.activeStudents)],
      ['Applications', String(summary.applicationCount)],
      ['Commission expected (BDT)', String(summary.commissionExpected)],
      ['Commission received (BDT)', String(summary.commissionReceived)],
      [],
      ['Period', 'Leads'],
      ...periodData.map((item) => [item.period, String(item.count)]),
      [],
      ['Lead status', 'Count'],
      ...statusData.map((item) => [item.status, String(item.count)]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `partner-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><div className="grid grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-28 w-full rounded-xl" />)}</div><Skeleton className="h-80 w-full rounded-xl" /></div>;

  const maxLeads = Math.max(1, ...periodData.map((item) => item.count));
  const generatedLabel = generatedAt && !Number.isNaN(new Date(generatedAt).getTime())
    ? new Date(generatedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
    : 'Update time not recorded';

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h1 className="text-2xl font-bold text-alo-text">Reports & Analytics</h1><p className="text-sm text-alo-text-muted mt-0.5">Partner-scoped metrics calculated from your saved leads, student profiles, applications, and commission records</p></div><div className="flex flex-wrap items-center gap-2"><Select value={period} onValueChange={setPeriod}><SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent></Select><Button variant="outline" size="sm" onClick={exportCSV} disabled={Boolean(error)}><Download className="w-4 h-4" />Export Report</Button></div></div>

      {error && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-amber-900">{error}</p><Button variant="outline" size="sm" onClick={() => void fetchReports()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></CardContent></Card>}

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard icon={Users} title="Total Leads" value={String(summary.totalLeads)} />
        <MetricCard icon={Target} title="Converted Leads" value={String(summary.convertedLeads)} />
        <MetricCard icon={TrendingUp} title="Conversion Rate" value={`${summary.conversionRate}%`} />
        <MetricCard icon={GraduationCap} title="Student Profiles" value={String(summary.activeStudents)} />
        <MetricCard icon={FileText} title="Applications" value={String(summary.applicationCount)} />
        <MetricCard icon={DollarSign} title="Commission Expected" value={formatCurrency(summary.commissionExpected)} detail={`Received ${formatCurrency(summary.commissionReceived)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white rounded-xl border border-alo-border lg:col-span-2"><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="text-base font-semibold text-alo-text">Lead Trend</CardTitle><Badge variant="muted" className="text-xs"><CalendarDays className="mr-1 h-3 w-3" />{period}</Badge></div></CardHeader><CardContent>{periodData.length === 0 ? <p className="py-8 text-center text-sm text-alo-text-muted">No lead records are available for this period.</p> : <div className="space-y-4">{periodData.map((item) => <div key={item.period} className="grid grid-cols-[90px_1fr_42px] items-center gap-3"><span className="text-xs text-alo-text-secondary">{item.period}</span><div className="h-3 rounded-full bg-[var(--alo-surface-muted)] overflow-hidden"><div className="h-full rounded-full bg-alo-brand transition-all" style={{ width: `${item.count > 0 ? Math.max(2, (item.count / maxLeads) * 100) : 0}%` }} /></div><span className="text-xs text-alo-text-muted text-right">{item.count}</span></div>)}</div>}</CardContent></Card>

        <Card className="bg-white rounded-xl border border-alo-border"><CardHeader><CardTitle className="text-base font-semibold text-alo-text">Lead Status Breakdown</CardTitle></CardHeader><CardContent>{statusData.length === 0 ? <p className="py-8 text-center text-sm text-alo-text-muted">No lead statuses are recorded.</p> : <div className="space-y-3">{statusData.map((item) => <div key={item.status} className="flex items-center justify-between gap-3 border-b last:border-0 pb-2 last:pb-0"><span className="text-sm text-alo-text-secondary capitalize">{item.status.replace(/[_-]+/g, ' ')}</span><Badge variant="outline">{item.count}</Badge></div>)}</div>}</CardContent></Card>
      </div>

      <div className="flex items-center justify-between text-xs text-alo-text-muted"><span>Report values are computed from partner-owned database records.</span><span>Generated {generatedLabel}</span></div>
    </div>
  );
}

function MetricCard({ icon: Icon, title, value, detail }: { icon: typeof Users; title: string; value: string; detail?: string }) {
  return <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Icon className="w-4 h-4 text-alo-brand" /><span className="text-xs text-alo-text-muted">{title}</span></div><p className="text-xl font-bold text-alo-text">{value}</p>{detail && <p className="mt-1 text-[11px] text-alo-text-muted">{detail}</p>}</CardContent></Card>;
}
