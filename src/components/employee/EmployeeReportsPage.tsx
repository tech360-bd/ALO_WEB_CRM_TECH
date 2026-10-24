'use client';

import { useCallback, useEffect, useState, type ElementType } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Users, FileText, CalendarDays, RefreshCw, AlertTriangle } from 'lucide-react';

interface EmployeeReportData {
  taskStats?: { total: number; completed: number; pending: number; inProgress: number; overdue: number; completionRate: number; byType: Array<{ type: string; count: number }>; byPriority: Array<{ priority: string; count: number }> };
  studentStats?: { total: number; byStage: Array<{ stage: string; count: number }> };
  applicationStats?: { total: number; byStage: Array<{ stage: string; count: number }>; byCountry: Array<{ country: string; count: number }> };
  documentStats?: { byStatus: Array<{ status: string; count: number }> };
  attendanceStats?: { present: number; absent: number; late: number; leave: number; avgHours: number };
  performance?: { score: number; managerRating: number; period: string; achievedLeads: number; targetLeads: number } | null;
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: number | string; detail: string; icon: ElementType }) {
  return <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-start justify-between"><div><p className="text-xs text-alo-text-muted">{label}</p><p className="mt-1 text-2xl font-bold text-alo-text">{value}</p><p className="mt-1 text-xs text-alo-text-muted">{detail}</p></div><Icon className="h-5 w-5 text-alo-brand" /></div></CardContent></Card>;
}

function Breakdown({ title, rows }: { title: string; rows: Array<{ label: string; count: number }> }) {
  return <Card className="bg-white rounded-xl border border-alo-border"><CardHeader className="pb-2"><CardTitle className="text-sm">{title}</CardTitle></CardHeader><CardContent>{rows.length ? <ul className="space-y-2">{rows.map((row) => <li key={row.label} className="flex items-center justify-between gap-3 text-sm"><span className="truncate text-alo-text-secondary">{row.label}</span><Badge variant="outline">{row.count}</Badge></li>)}</ul> : <p className="text-sm text-alo-text-muted">No records yet</p>}</CardContent></Card>;
}

export default function EmployeeReportsPage() {
  const [data, setData] = useState<EmployeeReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = usePortalStore.getState().token;
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const response = await fetch('/api/employee/reports', { headers, cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success) throw new Error(payload?.error || `Reports could not be loaded (HTTP ${response.status}).`);
      setData(payload.data || null);
    } catch (cause) {
      setData(null);
      setError(cause instanceof Error ? cause.message : 'Reports could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReports(); }, [loadReports]);

  const taskStats = data?.taskStats;
  const students = data?.studentStats;
  const applications = data?.applicationStats;
  const attendance = data?.attendanceStats;
  const totalItems = (taskStats?.total || 0) + (students?.total || 0) + (applications?.total || 0);

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-bold text-alo-text">Reports &amp; Activity</h1><p className="text-sm text-alo-text-muted">Your real assigned workload and employee activity records.</p></div><Button variant="outline" onClick={() => void loadReports()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</Button></div>

      {loading && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" aria-live="polite">{[0, 1, 2, 3].map((key) => <Skeleton key={key} className="h-28 rounded-xl" />)}</div>}
      {!loading && error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><span className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" />{error}</span><Button variant="outline" onClick={() => void loadReports()}>Retry</Button></div>}
      {!loading && !error && data && <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Tasks" value={taskStats?.total ?? '—'} detail={`${taskStats?.completed ?? 0} completed · ${taskStats?.pending ?? 0} pending`} icon={Activity} />
          <MetricCard label="Assigned Students" value={students?.total ?? '—'} detail="Records in assigned scope" icon={Users} />
          <MetricCard label="Assigned Applications" value={applications?.total ?? '—'} detail="Applications in assigned scope" icon={FileText} />
          <MetricCard label="Attendance Present" value={attendance?.present ?? '—'} detail={`${attendance?.late ?? 0} late · ${attendance?.avgHours ?? 0} average hours this month`} icon={CalendarDays} />
        </div>

        {totalItems === 0 && <div role="status" className="rounded-xl border border-alo-border bg-white p-5 text-sm text-alo-text-muted">No reportable activity yet for your assigned scope.</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <Breakdown title="Tasks by type" rows={(taskStats?.byType || []).map((item) => ({ label: item.type || 'Not classified', count: item.count }))} />
          <Breakdown title="Students by journey stage" rows={(students?.byStage || []).map((item) => ({ label: item.stage || 'Not recorded', count: item.count }))} />
          <Breakdown title="Applications by stage" rows={(applications?.byStage || []).map((item) => ({ label: item.stage || 'Not recorded', count: item.count }))} />
          <Breakdown title="Applications by country" rows={(applications?.byCountry || []).map((item) => ({ label: item.country || 'Not recorded', count: item.count }))} />
          <Breakdown title="Documents by review status" rows={(data.documentStats?.byStatus || []).map((item) => ({ label: item.status || 'Not recorded', count: item.count }))} />
          <Breakdown title="Tasks by priority" rows={(taskStats?.byPriority || []).map((item) => ({ label: item.priority || 'Not classified', count: item.count }))} />
        </div>
      </>}
    </div>
  );
}
