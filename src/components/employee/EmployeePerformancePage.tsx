'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, BarChart3, MessageSquare, TrendingUp, Star, Users } from 'lucide-react';

type PerformanceRecord = {
  id: string; period: string; targetLeads: number; achievedLeads: number; targetConversion: number; achievedConversion: number;
  targetRevenue: number; achievedRevenue: number; score: number; feedback: string; managerRating: number; createdAt: string;
};
type Summary = { averageScore: number; averageRating: number; averageTargetLeads: number; averageAchievedLeads: number; averageTargetConversion: number; averageAchievedConversion: number; averageTargetRevenue: number; averageAchievedRevenue: number; totalReviews: number };
const emptySummary: Summary = { averageScore: 0, averageRating: 0, averageTargetLeads: 0, averageAchievedLeads: 0, averageTargetConversion: 0, averageAchievedConversion: 0, averageTargetRevenue: 0, averageAchievedRevenue: 0, totalReviews: 0 };
function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = usePortalStore.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
const money = (value: number) => `৳${Number(value || 0).toLocaleString('en-BD', { maximumFractionDigits: 0 })}`;

export default function EmployeePerformancePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [records, setRecords] = useState<PerformanceRecord[]>([]);
  const [summary, setSummary] = useState<Summary>(emptySummary);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/employee/performance?limit=100', { headers: authHeaders(), cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.success !== true || !Array.isArray(body.data) || !body.summary) throw new Error(body?.error || 'Performance information is unavailable.');
      setRecords(body.data);
      setSummary(body.summary);
    } catch (loadError) {
      setRecords([]);
      setSummary(emptySummary);
      setError(loadError instanceof Error ? loadError.message : 'Performance information is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return <div className="min-h-screen space-y-6 bg-alo-page p-4 lg:p-6">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-2xl font-bold text-alo-text">Performance</h1><p className="text-sm text-alo-text-muted">Actual review records and verified performance measures for your authorized scope.</p></div><Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button></div>
    {error && <Card role="alert" className="border-crm-danger-border"><CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-crm-danger-text"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void load()}>Retry</Button></CardContent></Card>}
    {!error && <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={<BarChart3 className="h-5 w-5 text-[var(--alo-brand)]" />} label="Average score" value={records.length ? `${summary.averageScore.toFixed(1)} / 100` : 'No records'} /><Metric icon={<Star className="h-5 w-5 text-crm-warning-text" />} label="Manager rating" value={records.length ? `${summary.averageRating.toFixed(1)} / 5` : 'No records'} /><Metric icon={<Users className="h-5 w-5 text-crm-success-text" />} label="Achieved / target leads" value={records.length ? `${summary.averageAchievedLeads.toFixed(1)} / ${summary.averageTargetLeads.toFixed(1)}` : 'No records'} /><Metric icon={<TrendingUp className="h-5 w-5 text-[var(--alo-brand)]" />} label="Achieved / target conversion" value={records.length ? `${summary.averageAchievedConversion.toFixed(1)}% / ${summary.averageTargetConversion.toFixed(1)}%` : 'No records'} /></div>
      <Card className="rounded-xl border border-alo-border bg-white"><CardHeader className="pb-0"><div className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-alo-brand" /><CardTitle className="text-base font-semibold text-alo-text">Review history</CardTitle></div></CardHeader><CardContent className="pt-4">{records.length === 0 ? <p className="py-8 text-center text-sm text-alo-text-muted">No performance reviews are available.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-alo-border"><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Period</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Leads</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Conversion</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Revenue</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Score</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Rating</th></tr></thead><tbody>{records.map((record) => <tr key={record.id} className="border-b border-alo-border/50"><td className="px-3 py-2.5 font-medium text-alo-text">{record.period}</td><td className="px-3 py-2.5">{record.achievedLeads} / {record.targetLeads}</td><td className="px-3 py-2.5">{record.achievedConversion}% / {record.targetConversion}%</td><td className="px-3 py-2.5">{money(record.achievedRevenue)} / {money(record.targetRevenue)}</td><td className="px-3 py-2.5">{record.score} / 100</td><td className="px-3 py-2.5">{record.managerRating} / 5</td></tr>)}</tbody></table></div>}</CardContent></Card>
      <Card className="rounded-xl border border-alo-border bg-white"><CardHeader className="pb-0"><div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-alo-brand" /><CardTitle className="text-base font-semibold text-alo-text">Manager feedback</CardTitle></div></CardHeader><CardContent className="space-y-3 pt-4">{records.filter((record) => record.feedback.trim()).map((record) => <div key={record.id} className="rounded-xl border border-alo-border p-4"><p className="text-xs text-alo-text-muted">{record.period}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-alo-text-secondary">{record.feedback}</p></div>)}{records.every((record) => !record.feedback.trim()) && <p className="py-6 text-center text-sm text-alo-text-muted">No manager feedback has been recorded.</p>}</CardContent></Card>
    </>}
  </div>;
}
function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) { return <Card className="rounded-xl border border-alo-border bg-white"><CardContent className="flex items-center gap-3 p-4"><div>{icon}</div><div><p className="text-lg font-bold text-alo-text">{value}</p><p className="text-xs text-alo-text-muted">{label}</p></div></CardContent></Card>; }
