'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function HrmAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/hrm/analytics', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success) throw new Error(payload?.error || `HR analytics unavailable (HTTP ${response.status}).`);
        setData(payload.data);
      } catch (cause) { setError(cause instanceof Error ? cause.message : 'HR analytics are unavailable.'); }
      finally { setLoading(false); }
    })();
  }, []);
  if (loading) return <div className="min-h-screen bg-white p-6 text-xs text-slate-400">Loading HR analytics...</div>;
  if (!data) return <div role="alert" className="min-h-screen bg-white p-6 text-sm text-amber-800">{error || 'HR analytics are not available for this account.'}</div>;
  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div><h1 className="text-xl font-bold text-slate-900">HR Analytics — Verified Data</h1><p className="text-xs text-slate-500">Headcount • recorded attendance • payroll subject to permission • employee lifecycle</p><p className="mt-1 text-xs text-slate-500">{data.attendanceNote}</p></div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          ['Headcount', data.headcount],
          ['Active', data.activeEmployees],
          ['Attendance', data.attendanceRate == null ? 'Not calculated' : `${data.attendanceRate}%`],
          ['Late %', data.latePercent == null ? 'Not calculated' : `${data.latePercent}%`],
          ['Absent %', data.absentPercent == null ? 'Not calculated' : `${data.absentPercent}%`],
          ['Leave %', data.leavePercent == null ? 'Not calculated' : `${data.leavePercent}%`],
          ['Payroll Cost', data.payrollCost == null ? 'Restricted' : `৳${Number(data.payrollCost).toLocaleString()}`],
          ['New Joiners (30d)', data.newJoiners],
          ['Resigned', data.resignedEmployees],
          ['Probation', data.probationEmployees],
          ['Upcoming Confirmation', data.upcomingConfirmation],
          ['Birthdays (30d)', data.upcomingBirthday == null ? 'Private' : data.upcomingBirthday.length],
        ].map(([k,v])=> <Card key={String(k)} className="bg-white border-slate-200"><CardContent className="p-4"><p className="text-xs text-slate-500">{k as string}</p><p className="text-xl font-bold text-slate-900">{String(v)}</p></CardContent></Card>)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white border-slate-200"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Department Cost (Monthly Salary)</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">{data.departmentCost == null ? <p className="text-xs text-slate-400">Department salary breakdown is restricted by payroll permission.</p> : Object.entries(data.departmentCost).length ? Object.entries(data.departmentCost).map(([dept,cost])=> <div key={dept} className="flex justify-between text-xs"><span>{dept}</span><span className="font-bold">৳{Number(cost).toLocaleString()}</span></div>) : <p className="text-xs text-slate-400">No department cost records.</p>}</CardContent></Card>
        <Card className="bg-white border-slate-200"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Branch Breakdown</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">{Object.entries(data.branchBreakdown||{}).map(([b,c])=> <div key={b} className="flex justify-between text-xs"><span>{b}</span><span className="font-bold">{String(c)}</span></div>)}</CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="bg-white border-slate-200"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Upcoming Birthdays (30 days)</CardTitle></CardHeader>
          <CardContent className="p-3 space-y-2">{data.upcomingBirthday == null ? <p className="text-xs text-slate-400">Individual birthdays are omitted from this analytics endpoint for privacy.</p> : data.upcomingBirthday.length ? data.upcomingBirthday.map((b:any)=> <div key={b.employeeId} className="flex justify-between text-xs p-2 bg-pink-50 border border-pink-100 rounded"><span>{b.fullName} — {b.dob}</span><Badge className="bg-white text-pink-700 text-xs">{b.daysLeft}d</Badge></div>) : <p className="text-xs text-slate-400">No birthdays in the reporting window.</p>}</CardContent></Card>
        <Card className="bg-white border-slate-200"><CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Upcoming Work Anniversary</CardTitle></CardHeader>
          <CardContent className="p-3 space-y-2">{data.upcomingWorkAnniversary == null ? <p className="text-xs text-slate-400">Individual work-anniversary dates are omitted from this analytics endpoint for privacy.</p> : data.upcomingWorkAnniversary.length ? data.upcomingWorkAnniversary.map((a:any)=> <div key={a.employeeId} className="flex justify-between text-xs p-2 bg-blue-50 border border-blue-100 rounded"><span>{a.fullName} — {a.years} years</span><span className="text-xs">{a.joiningDate}</span></div>) : <p className="text-xs text-slate-400">No anniversaries in the reporting window.</p>}</CardContent></Card>
      </div>
    </div>
  );
}
