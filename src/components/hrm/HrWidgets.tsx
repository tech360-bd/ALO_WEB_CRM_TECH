'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Calendar, Clock, FileText, DollarSign, Cake, Award, AlertTriangle, Briefcase, Building } from 'lucide-react';
import Link from 'next/link';

type WidgetProps = { role: string };

function StatCard({ title, value, sub, icon: Icon, href }: any) {
  return (
    <Card className="bg-white border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-slate-500">{title}</p>
            <p className="text-xl font-bold text-slate-900">{value ?? '-'}</p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          </div>
          <div className="w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#E8501A]" />
          </div>
        </div>
        {href && <Link href={href} className="text-xs text-[#E8501A] font-medium mt-2 inline-block hover:underline">View →</Link>}
      </CardContent>
    </Card>
  );
}

export function HrRoleWidgets({ role }: WidgetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/hrm/widgets?role=${role}`)
      .then(r => r.json())
      .then(j => setData(j.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [role]);

  if (loading) return <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-pulse"><div className="h-24 bg-slate-100 rounded-xl" /><div className="h-24 bg-slate-100 rounded-xl" /><div className="h-24 bg-slate-100 rounded-xl" /><div className="h-24 bg-slate-100 rounded-xl" /></div>;
  if (!data) return null;

  const widgets = data.widgets || {};
  const own = data.own || {};
  const quick = data.quick || {};

  if (role.toLowerCase().includes('hr') || role.toLowerCase().includes('super_admin')) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">HR Overview</h3>
          <Link href="/crm/hrm"><Button size="sm" className="bg-[#E8501A] hover:bg-[#D04010] text-white h-7 text-xs">Open HR Center</Button></Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard title="Headcount" value={widgets.headcount} sub={`${widgets.attendanceRate || 0}% attendance today`} icon={Users} href="/crm/hrm/analytics" />
          <StatCard title="Pending Leaves" value={quick.pendingLeave || widgets.pendingLeaves} sub="Awaiting approval" icon={Calendar} href="/crm/hrm/leave" />
          <StatCard title="Payroll Cost" value={widgets.payrollCost ? `৳${Number(widgets.payrollCost).toLocaleString()}` : '—'} sub="This month" icon={DollarSign} href="/crm/hrm/payroll" />
          <StatCard title="Documents Missing" value={own.missingMandatory ?? quick.documentsMissing} sub="Mandatory docs" icon={FileText} href="/crm/hrm/documents" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <Card className="bg-white border-slate-200"><CardHeader className="p-3 border-b"><CardTitle className="text-xs font-bold flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-amber-600" /> Expiring Contracts</CardTitle></CardHeader><CardContent className="p-3 text-xs text-slate-600">{widgets.upcomingConfirmation ?? 0} probation ending in 30 days</CardContent></Card>
          <Card className="bg-white border-slate-200"><CardHeader className="p-3 border-b"><CardTitle className="text-xs font-bold flex items-center gap-2"><Cake className="w-3 h-3 text-pink-600" /> Birthdays</CardTitle></CardHeader><CardContent className="p-3 space-y-1">{(widgets.upcomingBirthday || []).slice(0, 2).map((b: any) => <div key={b.employeeId} className="text-xs">{b.fullName} — {b.daysLeft}d left</div>) || <span className="text-xs text-slate-400">No birthdays this week</span>}</CardContent></Card>
          <Card className="bg-white border-slate-200"><CardHeader className="p-3 border-b"><CardTitle className="text-xs font-bold flex items-center gap-2"><Award className="w-3 h-3 text-blue-600" /> New Joiners</CardTitle></CardHeader><CardContent className="p-3 text-xs">{widgets.newJoiners ?? 0} joined last 30 days</CardContent></Card>
        </div>
      </div>
    );
  }

  if (role.toLowerCase().includes('finance') || role.toLowerCase().includes('accounts')) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Payroll Pending" value={widgets.payrollPending ?? quick.payrollPending} icon={DollarSign} href="/crm/hrm/payroll" />
        <StatCard title="Salary Cost" value={widgets.payrollCost ? `৳${Number(widgets.payrollCost).toLocaleString()}` : '—'} icon={Briefcase} href="/crm/hrm/payroll" />
        <StatCard title="PF Total" value="—" sub="Provident Fund" icon={Building} href="/crm/hrm/payroll" />
        <StatCard title="My Salary Slip" value={own.salaryStatus || '—'} sub={own.netPay ? `৳${own.netPay}` : ''} icon={FileText} href="/crm/hrm/payroll" />
      </div>
    );
  }

  if (['manager', 'team_leader', 'branch_manager'].some(k => role.toLowerCase().includes(k))) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard title="Team Attendance" value={data.team ? `${data.team.present}/${data.team.count}` : '—'} sub={`${data.team?.late || 0} late today`} icon={Users} href="/crm/hrm/attendance" />
        <StatCard title="Team Leave" value={quick.pendingLeave} sub="Pending approvals" icon={Calendar} href="/crm/hrm/leave" />
        <StatCard title="Team Performance" value="—" sub="Avg score" icon={Award} href="/crm/hrm/analytics" />
      </div>
    );
  }

  if (role.toLowerCase().includes('marketing')) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="My Attendance" value={own.attendance?.status || '—'} sub={own.attendance?.hoursWorked ? `${own.attendance.hoursWorked} hrs` : 'Today'} icon={Clock} href="/crm/hrm/attendance" />
        <StatCard title="My Leave" value={own.pendingLeaves ?? 0} sub="Pending" icon={Calendar} href="/crm/hrm/leave" />
        <StatCard title="My Salary Slip" value={own.salaryStatus || '—'} icon={DollarSign} href="/crm/hrm/payroll" />
        <StatCard title="My Documents" value={own.documentsCount ?? 0} sub={`${own.missingMandatory ?? 0} missing`} icon={FileText} href="/crm/hrm/documents" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard title="My Attendance" value={own.attendance?.status || '—'} sub={own.attendance ? `${own.attendance.clockIn || ''} - ${own.attendance.clockOut || ''}` : 'Clock in/out'} icon={Clock} href="/crm/hrm/attendance" />
      <StatCard title="My Leave" value={own.pendingLeaves ?? 0} sub="Pending approvals" icon={Calendar} href="/crm/hrm/leave" />
      <StatCard title="My Documents" value={own.documentsCount ?? 0} sub={`${own.missingMandatory ?? 0} missing`} icon={FileText} href="/crm/hrm/documents" />
      <StatCard title="Salary Slip" value={own.salaryStatus || '—'} sub={own.netPay ? `৳${own.netPay}` : 'Monthly'} icon={DollarSign} href="/crm/hrm/payroll" />
    </div>
  );
}

export function HrmQuickActions({ role }: { role: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap gap-2">
      <Link href="/crm/hrm/attendance"><Button size="sm" className="bg-[#E8501A] hover:bg-[#D04010] text-white h-8 text-xs">Clock In / Out</Button></Link>
      <Link href="/crm/hrm/leave"><Button size="sm" variant="outline" className="h-8 text-xs">Apply Leave</Button></Link>
      <Link href="/crm/hrm/documents"><Button size="sm" variant="outline" className="h-8 text-xs">My Documents</Button></Link>
      <Link href="/crm/hrm/profile"><Button size="sm" variant="outline" className="h-8 text-xs">My HR Profile</Button></Link>
      {(role.toLowerCase().includes('hr') || role.toLowerCase().includes('super_admin')) && (
        <Link href="/crm/hrm/analytics"><Button size="sm" variant="outline" className="h-8 text-xs">HR Analytics</Button></Link>
      )}
    </div>
  );
}
