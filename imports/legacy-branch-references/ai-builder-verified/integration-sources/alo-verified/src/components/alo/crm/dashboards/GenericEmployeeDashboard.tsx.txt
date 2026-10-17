'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, UserPlus, FileStack, Building2, Handshake,
  ListTodo, ChevronRight, History, GraduationCap,
  MapPin, Sparkles, CalendarDays, MessageSquare,
  FileText, Settings, CheckCircle2, Clock,
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

// Main CRM modules for quick navigation
const navModules = [
  { label: 'Leads', icon: UserPlus, href: '/crm/leads', color: 'bg-[#EFF6FF] text-[#0057B8]' },
  { label: 'Students', icon: Users, href: '/crm/students', color: 'bg-purple-50 text-purple-700' },
  { label: 'Applications', icon: FileStack, href: '/crm/applications', color: 'bg-cyan-50 text-cyan-700' },
  { label: 'Universities', icon: Building2, href: '/crm/universities', color: 'bg-[#FFF7ED] text-[#E8501A]' },
  { label: 'Documents', icon: FileText, href: '/crm/documents', color: 'bg-amber-50 text-amber-700' },
  { label: 'Tasks', icon: ListTodo, href: '/crm/configuration', color: 'bg-green-50 text-green-700' },
  { label: 'Appointments', icon: CalendarDays, href: '/crm/appointments', color: 'bg-pink-50 text-pink-700' },
  { label: 'Reports', icon: GraduationCap, href: '/crm/reports', color: 'bg-blue-50 text-[#0073E6]' },
]

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2)
}

export function GenericEmployeeDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common
  const recentLeads = data.recent.leads.slice(0, 5)
  const recentApps = data.recent.applications.slice(0, 5)
  const recentActivity = data.recent.auditLogs.slice(0, 8)

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="employee"
        displayName={roleDisplayName}
        userName={userName}
        description="Your ALO CRM workspace — quick access to what you need"
      />

      {/* 6 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <CrmStatCard label="Students" value={c.totalStudents} icon={Users} accent="purple" href="/crm/students" />
        <CrmStatCard label="Leads" value={c.totalLeads} icon={UserPlus} accent="blue" href="/crm/leads" />
        <CrmStatCard label="Applications" value={c.totalApplications} icon={FileStack} accent="cyan" href="/crm/applications" />
        <CrmStatCard label="Universities" value={c.totalUniversities} icon={Building2} accent="orange" href="/crm/universities" />
        <CrmStatCard label="Partners" value={c.totalPartners} icon={Handshake} accent="green" href="/crm/partners" />
        <CrmStatCard label="My Tasks" value={c.totalTasks} icon={ListTodo} accent="amber" href="/crm/configuration" />
      </div>

      {/* Quick Navigation */}
      <SectionCard
        title="Quick Navigation"
        description="Jump to any CRM module"
        action={<Sparkles className="h-4 w-4 text-[#E8501A]" />}
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {navModules.map((m) => (
            <Link key={m.label} href={m.href}>
              <Card className="p-4 hover:border-[#0057B8] hover:shadow-md transition-all group h-full">
                <div className="flex flex-col items-center text-center gap-2">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${m.color} group-hover:scale-110 transition-transform`}>
                    <m.icon className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{m.label}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </SectionCard>

      {/* Recent Leads + Recent Applications */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Recent Leads"
          description="Latest prospects entering the pipeline (live)"
          action={<Link href="/crm/leads" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {recentLeads.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6 text-center">No leads yet</p>
            )}
            {recentLeads.map((l, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0057B8] to-[#0073E6] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  {initials(`${l.firstName || ''} ${l.lastName || ''}`.trim() || 'L')}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {l.firstName} {l.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {l.preferredCountry || 'Not set'} · {l.source || 'unknown'}
                  </p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Applications"
          description="Latest student applications (live)"
          action={<Link href="/crm/applications" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {recentApps.length === 0 && (
              <p className="text-xs text-slate-400 italic py-6 text-center">No applications yet</p>
            )}
            {recentApps.map((a, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="h-8 w-8 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center shrink-0">
                  <FileStack className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {a.student?.firstName} {a.student?.lastName}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{a.university?.name || 'Unknown university'}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Recent Activity Timeline */}
      <SectionCard
        title="Recent Activity"
        description="Latest audit log entries across the CRM (live)"
        action={<History className="h-4 w-4 text-[#0057B8]" />}
      >
        {recentActivity.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-6 text-center">No recent activity</p>
        ) : (
          <div className="relative">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-slate-200" />
            <div className="space-y-3">
              {recentActivity.map((log, i) => (
                <div key={i} className="relative flex items-start gap-3 pl-1">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 z-10 ring-4 ring-white ${
                    i === 0 ? 'bg-[#E8501A] text-white' : 'bg-[#EFF6FF] text-[#0057B8]'
                  }`}>
                    {i === 0 ? <Sparkles className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 capitalize truncate">
                        {String(log.action || 'unknown').replace(/_/g, ' ')}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Module: <span className="font-medium text-slate-700 capitalize">{log.module || 'system'}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionCard>

      {/* Bottom CTA strip */}
      <Card className="p-5 bg-gradient-to-r from-[#0057B8] to-[#0073E6] text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-white/15 flex items-center justify-center">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold">Need help getting started?</p>
              <p className="text-xs text-white/80">Explore CRM modules, manage tasks, or contact your administrator.</p>
            </div>
          </div>
          <Link href="/crm/configuration" className="shrink-0">
            <Badge className="bg-[#E8501A] text-white border-0 hover:bg-[#E8501A]/90 cursor-pointer text-xs px-3 py-1.5">
              Open Settings <ChevronRight className="h-3 w-3 inline ml-1" />
            </Badge>
          </Link>
        </div>
      </Card>
    </div>
  )
}
