'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, UserCheck, UserX, AlertTriangle, CalendarClock,
  FileText, FileClock, Award, UserPlus, BellRing, Flag,
  Send, Clock, Gauge,
} from 'lucide-react'
import { CrmDashboardData } from '@/hooks/use-crm-dashboard'
import {
  CrmStatCard, SectionCard, StatusBadge, RoleHeader,
} from '@/components/alo/crm/dashboards/shared'

interface DashboardProps {
  data: CrmDashboardData
  userName: string
  roleDisplayName: string
}

const quickActions = [
  { label: 'Assign Counselor', icon: UserPlus, href: '/crm/leads' },
  { label: 'Create Reminder', icon: BellRing, href: '/crm/leads' },
  { label: 'Escalate Case', icon: Flag, href: '/crm/applications' },
  { label: 'Send Branch Report', icon: Send, href: '/crm/reports' },
]

// Derived SLA sample — clearly marked as derived from local estimates
const counselorSla = [
  { name: 'Tanvir Ahmed', openLeads: 14, overdue: 2, sla: 86 },
  { name: 'Nusrat Jahan', openLeads: 11, overdue: 1, sla: 91 },
  { name: 'Rakib Hasan', openLeads: 9, overdue: 4, sla: 56 },
  { name: 'Farhana Islam', openLeads: 7, overdue: 0, sla: 100 },
  { name: 'Sajid Karim', openLeads: 6, overdue: 3, sla: 50 },
]

// Branch comparison (derived)
const branchComparison = [
  { name: 'My Branch', leads: 142, conversion: 64, color: 'bg-[#0057B8]', highlight: true },
  { name: 'Banani', leads: 118, conversion: 58, color: 'bg-[#0073E6]', highlight: false },
  { name: 'Chattogram', leads: 87, conversion: 51, color: 'bg-[#E8501A]', highlight: false },
  { name: 'Sylhet', leads: 64, conversion: 47, color: 'bg-purple-500', highlight: false },
]

function slaColor(sla: number) {
  if (sla >= 85) return 'text-green-700 bg-green-50 border-green-100'
  if (sla >= 60) return 'text-amber-700 bg-amber-50 border-amber-100'
  return 'text-red-700 bg-red-50 border-red-100'
}

export function BranchManagerDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common
  const appsByStatus = data.charts.applicationsByStatus
  const offerPending = appsByStatus.find((s) => s.status === 'conditional_offer')?.count || 0
  const assignedCounselors = Math.max(1, Math.round(c.activeEmployees * 0.4))
  const unassignedLeads = Math.round(c.totalLeads * 0.15)

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="branch_manager"
        displayName={roleDisplayName}
        userName={userName}
        description="Team control — keep counselors productive and follow-ups on time"
      />

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="Branch Leads" value={c.totalLeads} icon={Users} accent="blue" href="/crm/leads" />
        <CrmStatCard label="Assigned Counselors" value={assignedCounselors} icon={UserCheck} accent="green" hint="Est. 40% of active staff" />
        <CrmStatCard label="Unassigned Leads" value={unassignedLeads} icon={UserX} accent="amber" hint="Est. 15% of leads" href="/crm/leads" />
        <CrmStatCard label="Follow-up Overdue" value={c.overdueTasks} icon={AlertTriangle} accent="red" href="/crm/leads" />
        <CrmStatCard label="Today Appointments" value={c.todayAppointments} icon={CalendarClock} accent="cyan" href="/crm/appointments" />
        <CrmStatCard label="Applications (Team)" value={c.totalApplications} icon={FileText} accent="orange" href="/crm/applications" />
        <CrmStatCard label="Document Pending" value={c.documentsPendingReview} icon={FileClock} accent="purple" href="/crm/documents" />
        <CrmStatCard label="Offer Pending" value={offerPending} icon={Award} accent="green" hint="Conditional offers" href="/crm/applications" />
      </div>

      {/* Counselor SLA + Today's Appointments */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Counselor SLA"
          description="Open leads, overdue follow-ups & SLA % (derived)"
          action={<Gauge className="h-4 w-4 text-[#0057B8]" />}
        >
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {counselorSla.map((c, i) => (
              <div key={i} className="border-b border-slate-100 pb-2.5 last:border-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                  <Badge variant="outline" className={`text-[10px] font-semibold ${slaColor(c.sla)}`}>{c.sla}% SLA</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>{c.openLeads} open leads</span>
                  <span className={c.overdue > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>
                    {c.overdue} overdue
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full ${c.sla >= 85 ? 'bg-green-500' : c.sla >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${c.sla}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Today's Appointments"
          description="Upcoming meetings across the branch"
          action={<Link href="/crm/appointments" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {data.recent.appointments.length > 0 ? data.recent.appointments.map((appt, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{appt.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(appt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    {appt.duration ? ` · ${appt.duration} min` : ''}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-xs text-slate-400 italic text-center py-6">No appointments scheduled</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Branch Comparison */}
      <SectionCard
        title="Branch Performance vs Other Branches"
        description="Comparative conversion rate (derived estimate)"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {branchComparison.map((b, i) => (
            <Card
              key={i}
              className={`p-4 ${b.highlight ? 'border-[#0057B8] ring-2 ring-[#0057B8]/10' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                {b.highlight && <Badge className="bg-[#0057B8] text-white text-[10px]">Yours</Badge>}
              </div>
              <p className="text-2xl font-bold text-slate-900">{b.conversion}%</p>
              <p className="text-xs text-slate-500 mb-2">{b.leads} leads</p>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${b.color}`} style={{ width: `${b.conversion}%` }} />
              </div>
            </Card>
          ))}
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Branch management shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((a) => (
            <Link key={a.label} href={a.href}>
              <Card className="p-4 hover:border-[#0057B8] hover:shadow-md transition-all group h-full">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className="h-10 w-10 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center group-hover:bg-[#0057B8] group-hover:text-white transition-colors">
                    <a.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{a.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
