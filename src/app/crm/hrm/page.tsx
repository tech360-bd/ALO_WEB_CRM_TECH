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
  const [analyticsError, setAnalyticsError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const response = await fetch('/api/hrm/analytics', { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !payload?.success) throw new Error(payload?.error || `Analytics unavailable (HTTP ${response.status}).`);
        setAnalytics(payload.data);
      } catch (cause) {
        setAnalyticsError(cause instanceof Error ? cause.message : 'HR analytics are unavailable for this account.');
      } finally { setLoading(false); }
    })();
  }, []);

  if (roleStr === 'student') return <div className="p-8 text-center text-[var(--alo-body)]">HR module not available for Student Dashboard</div>;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--alo-text)]">HR Management Center</h1>
          <p className="text-xs text-[var(--alo-text-muted)]">Enterprise Employee HR System — integrated inside CRM • White / Orange • Asia/Dhaka</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border-[var(--alo-border)] capitalize text-xs">{roleStr.replace(/_/g,' ')}</Badge>
          <Link href="/crm/hrm/profile"><Button size="sm" className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black ">My HR Profile</Button></Link>
        </div>
      </div>

      {/* Role Widgets */}
      <HrRoleWidgets role={roleStr} />
      <HrmQuickActions role={roleStr} />

      {/* KPI Grid (HR Analytics) */}
      <Card className="bg-white border-[var(--alo-border)]">
        <CardHeader className="p-4 border-b border-[var(--alo-border)] flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold text-[var(--alo-text)]">HR Analytics — Live from DB</CardTitle>
          <Link href="/crm/hrm/analytics"><Button variant="ghost" size="sm" className=" text-[var(--alo-cta)]">Detailed Analytics →</Button></Link>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {loading ? <div className="col-span-4 text-xs text-[var(--alo-text-muted)]">Loading analytics...</div> : analyticsError ? <p role="alert" className="col-span-4 text-sm text-amber-800">{analyticsError} Role-authorized widgets remain available above.</p> : analytics ? (
            <>
              <div className="p-3 rounded-xl bg-[var(--alo-page)] border border-[var(--alo-border)]"><p className="text-xs text-[var(--alo-text-muted)]">Headcount</p><p className="text-xl font-bold text-[var(--alo-text)]">{analytics.headcount}</p><p className="text-xs text-[var(--alo-text-muted)]">{analytics.activeEmployees} active</p></div>
              <div className="p-3 rounded-xl bg-[var(--alo-page)] border border-[var(--alo-border)]"><p className="text-xs text-[var(--alo-text-muted)]">Attendance Rate</p><p className="text-sm font-bold text-[var(--alo-text)]">{analytics.attendanceRate == null ? 'Not calculated' : `${analytics.attendanceRate}%`}</p><p className="text-xs text-[var(--alo-text-muted)]">{analytics.attendanceNote}</p></div>
              <div className="p-3 rounded-xl bg-[var(--alo-page)] border border-[var(--alo-border)]"><p className="text-xs text-[var(--alo-text-muted)]">Payroll Cost</p><p className="text-xl font-bold text-[var(--alo-text)]">{analytics.payrollCost == null ? 'Restricted' : `৳${Number(analytics.payrollCost).toLocaleString()}`}</p><p className="text-xs text-[var(--alo-text-muted)]">Paid payroll records</p></div>
              <div className="p-3 rounded-xl bg-[var(--alo-page)] border border-[var(--alo-border)]"><p className="text-xs text-[var(--alo-text-muted)]">Probation</p><p className="text-xl font-bold text-[var(--alo-text)]">{analytics.probationEmployees}</p><p className="text-xs text-[var(--alo-text-muted)]">{analytics.upcomingConfirmation} upcoming confirmations</p></div>
            </>
          ) : <p className="col-span-4 text-xs text-[var(--alo-text-muted)]">No analytics response is available.</p>}
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
            <Card className="bg-white border-[var(--alo-border)] hover:border-[var(--alo-cta)]/25 hover:shadow-md transition-all h-full">
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[var(--alo-cta-soft)] border border-[var(--alo-cta)]/25 flex items-center justify-center"><m.icon className="w-5 h-5 text-[var(--alo-cta)]" /></div>
                <Badge variant="outline" className="text-xs bg-[var(--alo-page)]">{m.badge}</Badge>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm font-bold text-[var(--alo-text)]">{m.title}</p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-1 line-clamp-2">{m.desc}</p>
                <p className="text-xs text-[var(--alo-cta)] font-medium mt-3">Open →</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Tabs defaultValue="birthdays" className="w-full">
        <TabsList className="bg-[var(--alo-surface-muted)] p-1 h-9">
          <TabsTrigger value="birthdays" className="text-xs data-[state=active]:bg-[var(--alo-cta)] data-[state=active]:text-white">Upcoming Birthdays</TabsTrigger>
          <TabsTrigger value="anniversary" className="text-xs data-[state=active]:bg-[var(--alo-cta)] data-[state=active]:text-white">Work Anniversary</TabsTrigger>
          <TabsTrigger value="confirmation" className="text-xs data-[state=active]:bg-[var(--alo-cta)] data-[state=active]:text-white">Upcoming Confirmation</TabsTrigger>
        </TabsList>
        <TabsContent value="birthdays" className="mt-3">
          <Card className="bg-white border-[var(--alo-border)]"><CardContent className="p-4 text-sm text-[var(--alo-body)]">
            {!analytics ? <span className="text-xs text-[var(--alo-text-muted)]">Analytics unavailable.</span> : analytics.upcomingBirthday == null ? <span className="text-xs text-[var(--alo-text-muted)]">Individual birthday data is omitted from this endpoint for privacy.</span> : analytics.upcomingBirthday.length ? analytics.upcomingBirthday.map((b:any)=> <div key={b.employeeId} className="flex justify-between py-2 border-b border-[var(--alo-border)] last:border-0"><span>{b.fullName}</span><span className="text-xs bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] px-2 py-0.5 rounded">{b.daysLeft}d left • {b.dob}</span></div>) : <span className="text-xs text-[var(--alo-text-muted)]">No birthdays in next 30 days.</span>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="anniversary" className="mt-3">
          <Card className="bg-white border-[var(--alo-border)]"><CardContent className="p-4 text-sm text-[var(--alo-body)]">
            {!analytics ? <span className="text-xs text-[var(--alo-text-muted)]">Analytics unavailable.</span> : analytics.upcomingWorkAnniversary == null ? <span className="text-xs text-[var(--alo-text-muted)]">Individual work-anniversary dates are omitted from this endpoint for privacy.</span> : analytics.upcomingWorkAnniversary.length ? analytics.upcomingWorkAnniversary.map((a:any)=> <div key={a.employeeId} className="flex justify-between py-2 border-b border-[var(--alo-border)] last:border-0"><span>{a.fullName}</span><span className="text-xs bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] px-2 py-0.5 rounded">{a.years} years • {a.joiningDate}</span></div>) : <span className="text-xs text-[var(--alo-text-muted)]">No work anniversaries in next 30 days.</span>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="confirmation" className="mt-3">
          <Card className="bg-white border-[var(--alo-border)]"><CardContent className="p-4 text-xs text-[var(--alo-body)]">{analytics?.upcomingConfirmation ?? 0} employees due for confirmation in 30 days</CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
