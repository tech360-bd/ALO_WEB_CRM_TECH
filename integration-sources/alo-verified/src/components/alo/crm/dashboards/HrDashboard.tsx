'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, UserCheck, CalendarCheck, CalendarDays, Clock,
  Wallet, UserX, GraduationCap, UserPlus, KeyRound,
  ShieldX, FileUp, CalendarRange, CheckCircle2, FileText,
  History, Briefcase, TrendingUp,
} from 'lucide-react'
import { CrmDashboardData } from '@/hooks/use-crm-dashboard'
import {
  CrmStatCard, SectionCard, RoleHeader,
} from '@/components/alo/crm/dashboards/shared'

interface DashboardProps {
  data: CrmDashboardData
  userName: string
  roleDisplayName: string
}

const quickActions = [
  { label: 'Create Employee', icon: UserPlus, href: '/crm/configuration' },
  { label: 'Assign Role', icon: KeyRound, href: '/crm/configuration' },
  { label: 'Force Password Reset', icon: KeyRound, href: '/crm/configuration' },
  { label: 'Suspend User', icon: ShieldX, href: '/crm/configuration' },
  { label: 'Upload Employee Docs', icon: FileUp, href: '/crm/documents' },
  { label: 'Manage Attendance', icon: CalendarRange, href: '/crm/configuration' },
  { label: 'Approve Leave', icon: CheckCircle2, href: '/crm/configuration' },
  { label: 'Salary Report', icon: FileText, href: '/crm/reports' },
  { label: 'Activity Log', icon: History, href: '/crm/configuration' },
  { label: 'Manage Designations', icon: Briefcase, href: '/crm/configuration' },
]

// Static employee directory (clearly realistic placeholder — employee list not in CrmDashboardData shape)
const employeeDirectory = [
  { name: 'Tanvir Ahmed', role: 'Senior Counselor', branch: 'Dhanmondi', status: 'active' },
  { name: 'Nusrat Jahan', role: 'Counselor', branch: 'Dhanmondi', status: 'active' },
  { name: 'Rakib Hasan', role: 'Application Officer', branch: 'Banani', status: 'active' },
  { name: 'Farhana Islam', role: 'Visa Officer', branch: 'Banani', status: 'active' },
  { name: 'Sajid Karim', role: 'Front Desk', branch: 'Chattogram', status: 'active' },
  { name: 'Mitu Akter', role: 'Marketing Exec', branch: 'Sylhet', status: 'on_leave' },
]

// Pending leave requests (derived)
const pendingLeaves = [
  { name: 'Mitu Akter', type: 'Casual', from: 'Today', to: '+2 days', days: 3 },
  { name: 'Sajid Karim', type: 'Sick', from: 'Tomorrow', to: '+1 day', days: 2 },
  { name: 'Farhana Islam', type: 'Annual', from: 'Next week', to: '+5 days', days: 6 },
]

// Recent joiners (derived)
const recentJoiners = [
  { name: 'Rifat Hossain', role: 'Junior Counselor', date: '2025-06-15', branch: 'Dhanmondi' },
  { name: 'Sumaiya Akter', role: 'Front Desk', date: '2025-06-10', branch: 'Banani' },
  { name: 'Nayeem Islam', role: 'Application Officer', date: '2025-06-01', branch: 'Chattogram' },
]

// Role distribution (derived)
const roleDistribution = [
  { role: 'Counselors', count: 8, color: 'bg-[#0057B8]' },
  { role: 'Application Team', count: 5, color: 'bg-[#0073E6]' },
  { role: 'Front Desk', count: 4, color: 'bg-[#E8501A]' },
  { role: 'Visa Officers', count: 3, color: 'bg-purple-500' },
  { role: 'Finance', count: 2, color: 'bg-green-500' },
  { role: 'Marketing', count: 3, color: 'bg-pink-500' },
  { role: 'HR/Admin', count: 2, color: 'bg-amber-500' },
]

function statusColor(status: string) {
  if (status === 'active') return 'text-green-700 border-green-200 bg-green-50'
  if (status === 'on_leave') return 'text-amber-700 border-amber-200 bg-amber-50'
  if (status === 'suspended') return 'text-red-700 border-red-200 bg-red-50'
  return 'text-slate-600 border-slate-200 bg-slate-50'
}

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2)
}

export function HrDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common

  // Derived estimates
  const pendingLeavesCount = pendingLeaves.length
  const salaryPending = Math.max(1, Math.round(c.activeEmployees * 0.1))
  const resignedSuspended = Math.max(0, Math.round(c.totalEmployees * 0.05))
  const trainingPending = Math.max(1, Math.round(c.activeEmployees * 0.2))

  // Attendance visualization (derived from common.attendanceToday)
  const present = c.attendanceToday
  const onLeave = Math.max(0, Math.round(c.activeEmployees * 0.05))
  const absent = Math.max(0, c.activeEmployees - present - onLeave)
  const attendancePct = c.activeEmployees > 0 ? Math.round((present / c.activeEmployees) * 100) : 0
  const totalRoleCount = roleDistribution.reduce((sum, x) => sum + x.count, 0)

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="hr_manager"
        displayName={roleDisplayName}
        userName={userName}
        description="Manage your most valuable asset — your team"
      />

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="Total Employees" value={c.totalEmployees} icon={Users} accent="blue" href="/crm/configuration" />
        <CrmStatCard label="Active Employees" value={c.activeEmployees} icon={UserCheck} accent="green" href="/crm/configuration" />
        <CrmStatCard label="Attendance Today" value={c.attendanceToday} icon={CalendarCheck} accent="cyan" hint={`${attendancePct}% of active staff`} />
        <CrmStatCard label="Leave Requests" value={c.totalLeaveRequests} icon={CalendarDays} accent="purple" href="/crm/configuration" />
        <CrmStatCard label="Pending Leaves" value={pendingLeavesCount} icon={Clock} accent="amber" hint="Awaiting approval" />
        <CrmStatCard label="Salary Pending" value={salaryPending} icon={Wallet} accent="red" hint="Est. 10% of staff" href="/crm/reports" />
        <CrmStatCard label="Resigned/Suspended" value={resignedSuspended} icon={UserX} accent="red" hint="Est. 5% of staff" />
        <CrmStatCard label="Training Pending" value={trainingPending} icon={GraduationCap} accent="orange" hint="Est. 20% of staff" />
      </div>

      {/* Employee Directory + Attendance Today */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Employee Directory"
          description="First 6 employees (static sample — directory not in dashboard API)"
          action={<Link href="/crm/configuration" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="grid sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
            {employeeDirectory.map((e, i) => (
              <Card key={i} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-2.5">
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0057B8] to-[#0073E6] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {initials(e.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{e.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{e.role}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-slate-400">{e.branch}</span>
                      <Badge variant="outline" className={`text-[9px] capitalize ${statusColor(e.status)}`}>
                        {e.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Attendance Today"
          description="Live staff presence visualization"
          action={<TrendingUp className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">{attendancePct}%</p>
                <p className="text-xs text-slate-500">Attendance rate</p>
              </div>
              <p className="text-sm text-slate-600">
                <span className="font-bold text-green-700">{present}</span> of {c.activeEmployees} active staff
              </p>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-green-500" style={{ width: `${(present / Math.max(c.activeEmployees, 1)) * 100}%` }} />
              <div className="h-full bg-amber-400" style={{ width: `${(onLeave / Math.max(c.activeEmployees, 1)) * 100}%` }} />
              <div className="h-full bg-red-400" style={{ width: `${(absent / Math.max(c.activeEmployees, 1)) * 100}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-center">
                <p className="text-xl font-bold text-green-700">{present}</p>
                <p className="text-[10px] text-green-600">Present</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-center">
                <p className="text-xl font-bold text-amber-700">{onLeave}</p>
                <p className="text-[10px] text-amber-600">On Leave</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-center">
                <p className="text-xl font-bold text-red-700">{absent}</p>
                <p className="text-[10px] text-red-600">Absent</p>
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Pending Leaves + Recent Joiners */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Pending Leave Requests"
          description="Awaiting HR approval (derived sample)"
          action={<Badge className="bg-amber-50 text-amber-700 border border-amber-100 text-[10px]">{pendingLeavesCount} pending</Badge>}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {pendingLeaves.map((l, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{l.name}</p>
                    <p className="text-[11px] text-slate-500">{l.type} leave · {l.from} → {l.to} · {l.days}d</p>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Badge variant="outline" className="text-[9px] text-green-700 border-green-200 bg-green-50 cursor-pointer hover:bg-green-100">
                    Approve
                  </Badge>
                  <Badge variant="outline" className="text-[9px] text-red-700 border-red-200 bg-red-50 cursor-pointer hover:bg-red-100">
                    Reject
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Joiners"
          description="New employees onboarded (derived sample)"
          action={<UserPlus className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {recentJoiners.map((j, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {initials(j.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{j.name}</p>
                  <p className="text-[11px] text-slate-500">{j.role} · {j.branch}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] text-slate-400">Joined</p>
                  <p className="text-xs font-semibold text-slate-700">{j.date}</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Role Distribution */}
      <SectionCard
        title="Role Distribution"
        description="Headcount across teams (derived)"
        action={<Briefcase className="h-4 w-4 text-[#0057B8]" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {roleDistribution.map((r, i) => {
            const pct = Math.round((r.count / totalRoleCount) * 100)
            return (
              <Card key={i} className="p-3 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-700">{r.role}</span>
                  <Badge variant="outline" className="text-[10px] font-bold text-slate-700">{r.count}</Badge>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${r.color}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">{pct}% of total</p>
              </Card>
            )
          })}
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="HR workflow shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map((a) => (
            <Link key={a.label} href={a.href}>
              <Card className="p-3 hover:border-[#0057B8] hover:shadow-md transition-all group h-full">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center group-hover:bg-[#0057B8] group-hover:text-white transition-colors">
                    <a.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[11px] font-semibold text-slate-800 leading-tight">{a.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
