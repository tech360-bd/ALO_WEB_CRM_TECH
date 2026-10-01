'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Clock, Calendar, DollarSign, FileText, Shield, Briefcase, Award, Cake, AlertTriangle, Building, Laptop, Bell } from 'lucide-react';
import Link from 'next/link';
import { HrRoleWidgets, HrmQuickActions } from '@/components/hrm/HrWidgets';
import { usePortalStore } from '@/lib/stores/portal-store';

export default function CrmHrmHubPage() {
  const { user } = usePortalStore();
  const role = (user as any)?.roles?.[0]?.name || (user as any)?.roles?.[0] || (user as any)?.role || 'employee';
  const roleStr = String(role).toLowerCase();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/hrm/analytics').then(r=>r.json()).then(j=> setAnalytics(j.data)).catch(()=>{}).finally(()=> setLoading(false));
  }, []);

  if (roleStr === 'student') return <div className="p-8 text-center text-slate-600">HR module not available for Student Dashboard</div>;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">HR Management Center</h1>
          <p className="text-xs text-slate-500">Enterprise Employee HR System — integrated inside CRM • White / Orange • Asia/Dhaka</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-50 text-[#0B5ED7] border-blue-200 capitalize text-xs">{roleStr.replace(/_/g,' ')}</Badge>
          <Link href="/crm/hrm/profile"><Button size="sm" className="bg-[#F97316] hover:bg-[#D04010] text-white h-8 text-xs">My HR Profile</Button></Link>
        </div>
      </div>

      {/* Role Widgets */}
      <HrRoleWidgets role={roleStr} />
      <HrmQuickActions role={roleStr} />

      {/* KPI Grid (HR Analytics) */}
      <Card className="bg-white border-slate-200">
        <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-slate-800">HR Analytics — Live from DB</CardTitle>
          <Link href="/crm/hrm/analytics"><Button variant="ghost" size="sm" className="text-xs text-[#F97316]">Detailed Analytics →</Button></Link>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? <div className="col-span-4 text-xs text-slate-400">Loading analytics...</div> : (
            <>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Headcount</p>
                <p className="text-xl font-bold text-slate-900">{analytics?.headcount ?? 0}</p>
                <p className="text-xs text-slate-400">{analytics?.activeEmployees ?? 0} active</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Attendance Rate</p>
                <p className="text-xl font-bold text-slate-900">{analytics?.attendanceRate ?? 0}%</p>
                <p className="text-xs text-slate-400">{analytics?.latePercent ?? 0}% late • {analytics?.absentPercent ?? 0}% absent</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Payroll Cost</p>
                <p className="text-xl font-bold text-slate-900">৳{Number(analytics?.payrollCost||0).toLocaleString()}</p>
                <p className="text-xs text-slate-400">This month</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">Probation</p>
                <p className="text-xl font-bold text-slate-900">{analytics?.probationEmployees ?? 0}</p>
                <p className="text-xs text-slate-400">{analytics?.upcomingConfirmation ?? 0} upcoming confirmations</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Module Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title:'Employee Profile', desc:'Private — only Employee/HR/Super Admin', href:'/crm/hrm/profile', icon: Users, badge:'Private' },
          { title:'Document Center', desc:'22 mandatory docs • version history', href:'/crm/hrm/documents', icon: FileText, badge:'22 types' },
          { title:'HR Agreement Center', desc:'Appointment + 12 policies • signature', href:'/crm/hrm/agreements', icon: Shield, badge:'12 policies' },
          { title:'Attendance', desc:'Clock In/Out • Late/Present • Calendar', href:'/crm/hrm/attendance', icon: Clock, badge:'Live' },
          { title:'Devices', desc:'Laptop/Desktop/Tablet/Phone • Asset Tag', href:'/crm/hrm/devices', icon: Laptop, badge:'Assigned' },
          { title:'Login Security', desc:'IP • Browser • OS • Fingerprint • Location', href:'/crm/hrm/security', icon: Shield, badge:'Audit' },
          { title:'Leave Management', desc:'7 leave types • Balance • Approval', href:'/crm/hrm/leave', icon: Calendar, badge:'7 types' },
          { title:'Payroll', desc:'Monthly • Slip • Bank Sheet • HR/Finance only details', href:'/crm/hrm/payroll', icon: DollarSign, badge:'Monthly' },
          { title:'Notice Management', desc:'90 days countdown • Handover • Clearance', href:'/crm/hrm/notices', icon: Bell, badge:'90d' },
          { title:'Exit Management', desc:'Resignation/Termination/Absconding', href:'/crm/hrm/exit', icon: Briefcase, badge:'Exit' },
          { title:'HR Analytics', desc:'Headcount • Late% • Dept Cost • Birthdays', href:'/crm/hrm/analytics', icon: Award, badge:'Live' },
        ].map(m=> (
          <Link key={m.title} href={m.href}>
            <Card className="bg-white border-slate-200 hover:border-orange-200 hover:shadow-md transition-all h-full">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center"><m.icon className="w-5 h-5 text-[#F97316]" /></div>
                <Badge variant="outline" className="text-xs bg-slate-50">{m.badge}</Badge>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm font-bold text-slate-900">{m.title}</p>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.desc}</p>
                <p className="text-xs text-[#F97316] font-medium mt-3">Open →</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Tabs defaultValue="birthdays" className="w-full">
        <TabsList className="bg-slate-100 p-1 h-9">
          <TabsTrigger value="birthdays" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-white">Upcoming Birthdays</TabsTrigger>
          <TabsTrigger value="anniversary" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-white">Work Anniversary</TabsTrigger>
          <TabsTrigger value="confirmation" className="text-xs data-[state=active]:bg-[#F97316] data-[state=active]:text-white">Upcoming Confirmation</TabsTrigger>
        </TabsList>
        <TabsContent value="birthdays" className="mt-3">
          <Card className="bg-white border-slate-200"><CardContent className="p-4 text-sm text-slate-600">
            {analytics?.upcomingBirthday?.length ? analytics.upcomingBirthday.map((b:any)=> <div key={b.employeeId} className="flex justify-between py-2 border-b border-slate-100 last:border-0"><span>{b.fullName}</span><span className="text-xs bg-orange-50 text-[#F97316] px-2 py-0.5 rounded">{b.daysLeft}d left • {b.dob}</span></div>) : <span className="text-xs text-slate-400">No birthdays in next 30 days</span>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="anniversary" className="mt-3">
          <Card className="bg-white border-slate-200"><CardContent className="p-4 text-sm text-slate-600">
            {analytics?.upcomingWorkAnniversary?.length ? analytics.upcomingWorkAnniversary.map((a:any)=> <div key={a.employeeId} className="flex justify-between py-2 border-b border-slate-100 last:border-0"><span>{a.fullName}</span><span className="text-xs bg-blue-50 text-[#0B5ED7] px-2 py-0.5 rounded">{a.years} years • {a.joiningDate}</span></div>) : <span className="text-xs text-slate-400">No work anniversaries in next 30 days</span>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="confirmation" className="mt-3">
          <Card className="bg-white border-slate-200"><CardContent className="p-4 text-xs text-slate-600">{analytics?.upcomingConfirmation ?? 0} employees due for confirmation in 30 days</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
