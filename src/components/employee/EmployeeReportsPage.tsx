'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type Report = { taskStats: { total: number; completed: number; overdue: number; byType: { type: string; count: number }[] }; studentStats: { total: number }; applicationStats: { total: number; byStage: { stage: string; count: number }[] }; attendanceStats: { present: number; absent: number; late: number; leave: number; avgHours: number } };

export default function EmployeeReportsPage() {
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch('/api/employee/reports', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error || 'Reports could not be loaded.');
      setData(payload.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Reports could not be loaded.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  if (loading) return <Skeleton className="h-48 w-full" />;
  if (error) return <div role="alert" className="p-6 text-red-700">{error}<Button variant="outline" onClick={load}>Retry</Button></div>;
  if (!data) return <p className="p-6">No records yet.</p>;
  const cards = [ ['Assigned tasks', data.taskStats.total], ['Completed tasks', data.taskStats.completed], ['Overdue tasks', data.taskStats.overdue], ['Assigned students', data.studentStats.total], ['Applications', data.applicationStats.total], ['Attendance records: present', data.attendanceStats.present] ];
  return <div className="space-y-6 bg-alo-page p-4 lg:p-6">
    <h1 className="text-2xl font-bold text-alo-text">Reports &amp; Analytics</h1>
    <p className="text-sm text-alo-text-muted">Reports use your assigned records. Revenue is shown only in authorized finance reports.</p>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{cards.map(([label, value]) => <Card key={label} className="bg-white"><CardHeader><CardTitle className="text-sm">{label}</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{value}</CardContent></Card>)}</div>
    <Card className="bg-white"><CardHeader><CardTitle>Task activity</CardTitle></CardHeader><CardContent>{data.taskStats.byType.length ? <ul className="space-y-2">{data.taskStats.byType.map(row => <li key={row.type} className="flex justify-between rounded-lg border p-3"><span>{row.type}</span><span>{row.count}</span></li>)}</ul> : <p>No task records yet.</p>}</CardContent></Card>
    <Card className="bg-white"><CardHeader><CardTitle>Application pipeline</CardTitle></CardHeader><CardContent>{data.applicationStats.byStage.length ? <ul className="space-y-2">{data.applicationStats.byStage.map(row => <li key={row.stage} className="flex justify-between rounded-lg border p-3"><span>{row.stage}</span><span>{row.count}</span></li>)}</ul> : <p>No application records yet.</p>}</CardContent></Card>
  </div>;
}
