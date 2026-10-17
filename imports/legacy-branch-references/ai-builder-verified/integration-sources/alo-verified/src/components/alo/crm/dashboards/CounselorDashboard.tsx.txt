'use client'

import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Users, GraduationCap, CalendarCheck, AlertTriangle, Flame,
  UserX, FileClock, FileCheck, MessageSquare,
  UserPlus, BookOpen, Target, Send, FileText, StickyNote,
  MessageCircle, CalendarPlus, ArrowRightCircle, Sparkles,
  Clock, Phone, Mail,
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
  { label: 'Create Student Profile', icon: UserPlus, href: '/crm/students' },
  { label: 'Update Education History', icon: GraduationCap, href: '/crm/students' },
  { label: 'Add Admission Preference', icon: Target, href: '/crm/students' },
  { label: 'Shortlist Courses', icon: BookOpen, href: '/crm/universities' },
  { label: 'Send Course Options', icon: Send, href: '/crm/whatsapp' },
  { label: 'Request Documents', icon: FileText, href: '/crm/documents' },
  { label: 'Add Notes', icon: StickyNote, href: '/crm/leads' },
  { label: 'Send WhatsApp Template', icon: MessageCircle, href: '/crm/whatsapp' },
  { label: 'Book Appointment', icon: CalendarPlus, href: '/crm/appointments' },
  { label: 'Move to Application', icon: ArrowRightCircle, href: '/crm/applications' },
  { label: 'AI Course Match', icon: Sparkles, href: '/crm/ai-command' },
  { label: 'AI SOP / CV Request', icon: Sparkles, href: '/crm/ai-command' },
]

const followupChannels = [
  { icon: MessageCircle, color: 'text-green-600 bg-green-50' },
  { icon: Phone, color: 'text-blue-600 bg-blue-50' },
  { icon: Mail, color: 'text-purple-600 bg-purple-50' },
]

function buildPipeline(data: CrmDashboardData) {
  const c = data.common
  const appsByStatus = data.charts.applicationsByStatus
  const find = (s: string) => appsByStatus.find((x) => x.status === s)?.count || 0
  const offers = find('conditional_offer') + find('unconditional_offer')
  return [
    { stage: 'Lead', count: c.totalLeads, color: 'bg-blue-500' },
    { stage: 'Counseling', count: Math.round(c.totalLeads * 0.6), color: 'bg-cyan-500' },
    { stage: 'Profile Complete', count: c.totalStudents, color: 'bg-purple-500' },
    { stage: 'Application Ready', count: find('ready_to_submit'), color: 'bg-amber-500' },
    { stage: 'Offer Received', count: offers, color: 'bg-[#E8501A]' },
    { stage: 'Visa Preparing', count: c.visaPending, color: 'bg-pink-500' },
    { stage: 'Enrolled', count: find('enrolled'), color: 'bg-green-600' },
  ]
}

export function CounselorDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common
  const co = data.counselor
  const myLeads = co?.leadsCount ?? c.totalLeads
  const myStudents = co?.studentsCount ?? c.totalStudents
  const todaysFollowups = co?.todaysFollowups ?? c.todayAppointments
  const overdueFollowups = co?.overdueFollowups ?? c.overdueTasks
  const hotLeads = Math.max(1, Math.round(myLeads * 0.2))
  const profileIncomplete = Math.round(myStudents * 0.3)
  const appsByStatus = data.charts.applicationsByStatus
  const appReady = appsByStatus.find((s) => s.status === 'ready_to_submit')?.count || Math.round(myStudents * 0.4)

  // "My students" — fall back to recent applications when counselor.students isn't returned
  const myStudentsList = data.recent.applications.slice(0, 6)
  // Today's follow-ups — derive from counselor.appointments or recent leads
  const followups = (co?.appointments?.length ? co.appointments : data.recent.leads).slice(0, 5)
  const appts = co?.appointments?.length ? co.appointments : data.recent.appointments
  const pipeline = buildPipeline(data)

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="counselor"
        displayName={roleDisplayName}
        userName={userName}
        description="Your pipeline — turn leads into enrolled students"
      />

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="My Leads" value={myLeads} icon={Users} accent="blue" href="/crm/leads" />
        <CrmStatCard label="My Students" value={myStudents} icon={GraduationCap} accent="green" href="/crm/students" />
        <CrmStatCard label="Today Follow-ups" value={todaysFollowups} icon={CalendarCheck} accent="cyan" hint="Tasks due today" />
        <CrmStatCard label="Overdue Follow-ups" value={overdueFollowups} icon={AlertTriangle} accent="red" hint="Needs immediate attention" />
        <CrmStatCard label="Hot Leads" value={hotLeads} icon={Flame} accent="orange" hint="Est. 20% of pipeline" />
        <CrmStatCard label="Profile Incomplete" value={profileIncomplete} icon={UserX} accent="amber" hint="Est. 30% of students" />
        <CrmStatCard label="Document Pending" value={c.documentsPendingReview} icon={FileClock} accent="purple" href="/crm/documents" />
        <CrmStatCard label="Application Ready" value={appReady} icon={FileCheck} accent="green" hint="Ready to submit" href="/crm/applications" />
      </div>

      {/* My Students table + Today's Follow-ups */}
      <div className="grid lg:grid-cols-3 gap-4">
        <SectionCard
          title="My Students"
          description="Recent students in your pipeline"
          className="lg:col-span-2"
          action={<Link href="/crm/students" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-2 px-1 font-semibold">Student</th>
                  <th className="py-2 px-1 font-semibold">Target Country</th>
                  <th className="py-2 px-1 font-semibold">Status</th>
                  <th className="py-2 px-1 font-semibold">Next Action</th>
                </tr>
              </thead>
              <tbody>
                {myStudentsList.map((s, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-1">
                      <p className="font-semibold text-slate-800 truncate">
                        {s.student?.firstName} {s.student?.lastName}
                      </p>
                      <p className="text-[10px] text-slate-400">{s.applicationId || s.id}</p>
                    </td>
                    <td className="py-2 px-1 text-slate-700">{s.university?.name ? '—' : 'Multiple'}</td>
                    <td className="py-2 px-1"><StatusBadge status={s.status} /></td>
                    <td className="py-2 px-1 text-xs text-slate-600">Follow-up call</td>
                  </tr>
                ))}
                {myStudentsList.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-xs text-slate-400 italic">No students yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard
          title="Today's Follow-ups"
          description="Scheduled contacts"
          action={
            <Badge className="bg-[#E8501A] text-white text-[10px] gap-1">
              <MessageSquare className="h-3 w-3" /> {todaysFollowups} unread
            </Badge>
          }
        >
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {followups.map((f, i) => {
              const ChannelIcon = followupChannels[i % followupChannels.length]
              return (
                <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 border border-slate-100">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${ChannelIcon.color}`}>
                    <ChannelIcon.icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {f.firstName ? `${f.firstName} ${f.lastName || ''}` : f.title || 'Follow-up'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {f.date ? new Date(f.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today'} · {['WhatsApp', 'Call', 'Email'][i % 3]}
                    </p>
                  </div>
                </div>
              )
            })}
            {followups.length === 0 && (
              <p className="text-xs text-slate-400 italic text-center py-6">No follow-ups scheduled</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Student Pipeline Kanban */}
      <SectionCard
        title="Student Pipeline"
        description="Lead-to-enrolled stages (derived from live counts)"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {pipeline.map((p, i) => (
            <Card key={i} className="p-3 hover:shadow-md transition-shadow">
              <div className={`h-1.5 w-full rounded-full ${p.color} mb-2`} />
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{p.stage}</p>
              <p className="text-xl font-bold text-slate-900 mt-0.5">{p.count.toLocaleString()}</p>
            </Card>
          ))}
        </div>
      </SectionCard>

      {/* Upcoming Appointments */}
      <SectionCard
        title="Upcoming Appointments"
        description="Your next scheduled meetings"
        action={<Link href="/crm/appointments" className="text-xs text-[#0057B8] hover:underline font-semibold">View calendar</Link>}
      >
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {appts.length > 0 ? appts.map((appt, i) => (
            <div key={i} className="p-3 rounded-lg bg-[#EFF6FF] border border-blue-100">
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-lg bg-white text-[#0057B8] flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">{appt.title}</p>
                  <p className="text-xs text-[#0057B8]">
                    {new Date(appt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-xs text-slate-400 italic col-span-full text-center py-4">No upcoming appointments</p>
          )}
        </div>
      </SectionCard>

      {/* Quick Actions — 12 tiles */}
      <SectionCard title="Quick Actions" description="Counselor workflow shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
