'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  CalendarCheck, Users, Phone, UserPlus, Clock, UserCheck,
  PhoneMissed, BookUser, CalendarClock, Printer, MessageSquare,
  FileUp, Bell,
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
  { label: 'Create Lead', icon: UserPlus, href: '/crm/leads' },
  { label: 'Create Appointment', icon: CalendarCheck, href: '/crm/appointments' },
  { label: 'Assign Counselor', icon: UserCheck, href: '/crm/leads' },
  { label: 'Send Welcome SMS', icon: MessageSquare, href: '/crm/whatsapp-inbox' },
  { label: 'Print Student Info', icon: Printer, href: '/crm/students' },
  { label: 'Check Appointment', icon: Clock, href: '/crm/appointments' },
  { label: 'Add Visitor Note', icon: BookUser, href: '/crm/leads' },
  { label: 'Upload First Docs', icon: FileUp, href: '/crm/documents' },
]

// Walk-in queue (derived — live queue state would need a real-time service)
const walkInQueue = [
  { name: 'Mehedi Hasan', interest: 'UK September intake', wait: 8, status: 'waiting' },
  { name: 'Sadia Islam', interest: 'Scholarship info', wait: 5, status: 'with-counselor' },
  { name: 'Arman Kabir', interest: 'Canada visa guidance', wait: 2, status: 'waiting' },
  { name: 'Tania Sultana', interest: 'IELTS prep course', wait: 12, status: 'waiting' },
]

// Counselor availability (derived)
const counselorAvailability = [
  { name: 'Tanvir Ahmed', status: 'Available', color: 'green' },
  { name: 'Nusrat Jahan', status: 'In session', color: 'amber' },
  { name: 'Rakib Hasan', status: 'Available', color: 'green' },
  { name: 'Farhana Islam', status: 'On leave', color: 'slate' },
]

function availabilityColor(c: string) {
  if (c === 'green') return 'text-green-700 border-green-200 bg-green-50'
  if (c === 'amber') return 'text-amber-700 border-amber-200 bg-amber-50'
  return 'text-slate-600 border-slate-200 bg-slate-50'
}

export function FrontDeskDashboard({ data, userName, roleDisplayName }: DashboardProps) {
  const c = data.common
  const appts = data.recent.appointments

  // Derived estimates for front-desk metrics
  const walkInToday = Math.max(1, Math.round(c.todayAppointments * 0.6))
  const phoneCallbacks = Math.max(1, Math.round(c.todayAppointments * 0.3))
  const newInquiries = Math.max(1, Math.round(c.totalLeads * 0.1))
  const waitingStudents = walkInQueue.length
  const assignedCounselor = c.todayAppointments
  const missedCalls = Math.max(0, Math.round(c.todayAppointments * 0.15))
  const visitorLog = Math.max(1, Math.round(c.todayAppointments * 1.2))
  const completedAppts = Math.max(0, c.todayAppointments - waitingStudents)

  // Quick lead capture form state (non-functional placeholder per spec)
  const [form, setForm] = useState({ name: '', phone: '', email: '', interest: '', source: 'Walk-in', notes: '' })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
    setForm({ name: '', phone: '', email: '', interest: '', source: 'Walk-in', notes: '' })
  }

  return (
    <div className="space-y-5">
      <RoleHeader
        roleName="front_desk"
        displayName={roleDisplayName}
        userName={userName}
        description="First impressions matter — manage walk-ins, calls, and consultations"
      />

      {/* 8 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <CrmStatCard label="Today Appointments" value={c.todayAppointments} icon={CalendarCheck} accent="blue" href="/crm/appointments" />
        <CrmStatCard label="Walk-in Students" value={walkInToday} icon={Users} accent="green" hint="Est. 60% of appointments" />
        <CrmStatCard label="Phone Callbacks" value={phoneCallbacks} icon={Phone} accent="cyan" hint="Est. 30% of appointments" />
        <CrmStatCard label="New Inquiries" value={newInquiries} icon={UserPlus} accent="purple" hint="Est. 10% of leads" href="/crm/leads" />
        <CrmStatCard label="Waiting Students" value={waitingStudents} icon={Clock} accent="amber" hint="In queue now" />
        <CrmStatCard label="Assigned Counselor" value={assignedCounselor} icon={UserCheck} accent="green" href="/crm/leads" />
        <CrmStatCard label="Missed Calls" value={missedCalls} icon={PhoneMissed} accent="red" hint="Est. 15% of appointments" />
        <CrmStatCard label="Visitor Log Entries" value={visitorLog} icon={BookUser} accent="slate" hint="Est. 120% of appointments" />
      </div>

      {/* Today's Appointment Schedule + Walk-in Queue */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Today's Appointment Schedule"
          description="Timeline of scheduled consultations"
          action={<Link href="/crm/appointments" className="text-xs text-[#0057B8] hover:underline font-semibold">View all</Link>}
        >
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {appts.length > 0 ? appts.slice(0, 8).map((appt, i) => {
              const time = new Date(appt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              const isLast = i === Math.min(appts.length, 8) - 1
              return (
                <div key={i} className="flex items-stretch gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-9 w-12 rounded-lg bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center text-[10px] font-bold">
                      {time}
                    </div>
                    {!isLast && <div className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="flex-1 pb-3">
                    <div className="p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                      <p className="text-sm font-semibold text-slate-800 truncate">{appt.title}</p>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        {new Date(appt.date).toLocaleDateString()}
                        {appt.duration ? ` · ${appt.duration} min` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              )
            }) : (
              <p className="text-xs text-slate-400 italic text-center py-6">No appointments scheduled today</p>
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Walk-in Queue"
          description="Currently waiting at the front desk"
          action={<Badge className="bg-[#E8501A] text-white text-[10px]">{waitingStudents} waiting</Badge>}
        >
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {walkInQueue.map((q, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50">
                <div className="h-9 w-9 rounded-full bg-[#EFF6FF] text-[#0057B8] flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{q.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{q.interest}</p>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="outline" className={`text-[9px] font-semibold capitalize ${q.status === 'waiting' ? 'text-amber-700 border-amber-200 bg-amber-50' : 'text-green-700 border-green-200 bg-green-50'}`}>
                    {q.status === 'waiting' ? 'Waiting' : 'With counselor'}
                  </Badge>
                  <p className="text-[10px] text-slate-500 mt-0.5">{q.wait} min</p>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      {/* Quick Lead Capture + Branch Schedule */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Quick Lead Capture"
          description="Fast intake for walk-in or phone inquiries (demo form)"
          action={<UserPlus className="h-4 w-4 text-[#0057B8]" />}
        >
          {submitted && (
            <div className="mb-3 p-2.5 rounded-lg bg-green-50 border border-green-100 text-xs text-green-700 flex items-center gap-2">
              <UserCheck className="h-4 w-4" /> Lead captured successfully (demo — not saved)
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fd-name" className="text-[11px] font-semibold text-slate-600">Name</Label>
                <Input id="fd-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" required className="h-9 text-sm" />
              </div>
              <div>
                <Label htmlFor="fd-phone" className="text-[11px] font-semibold text-slate-600">Phone</Label>
                <Input id="fd-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" required className="h-9 text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="fd-email" className="text-[11px] font-semibold text-slate-600">Email</Label>
                <Input id="fd-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className="h-9 text-sm" />
              </div>
              <div>
                <Label htmlFor="fd-interest" className="text-[11px] font-semibold text-slate-600">Interest</Label>
                <Input id="fd-interest" value={form.interest} onChange={(e) => setForm({ ...form, interest: e.target.value })} placeholder="Country / course" className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <Label htmlFor="fd-source" className="text-[11px] font-semibold text-slate-600">Source</Label>
              <select
                id="fd-source"
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full h-9 rounded-md border border-slate-200 px-2 text-sm bg-white"
              >
                <option>Walk-in</option>
                <option>Phone</option>
                <option>Referral</option>
                <option>Facebook</option>
                <option>Instagram</option>
                <option>Website</option>
              </select>
            </div>
            <div>
              <Label htmlFor="fd-notes" className="text-[11px] font-semibold text-slate-600">Notes</Label>
              <Textarea id="fd-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Quick notes about the inquiry..." className="text-sm min-h-[60px]" />
            </div>
            <Button type="submit" className="w-full bg-[#0057B8] hover:bg-[#0073E6] text-white h-9">
              <UserPlus className="h-4 w-4 mr-1" /> Capture Lead
            </Button>
          </form>
        </SectionCard>

        <SectionCard
          title="Branch Schedule"
          description="Today's full schedule at this branch"
          action={<Bell className="h-4 w-4 text-[#E8501A]" />}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-lg bg-[#EFF6FF] border border-blue-100 text-center">
                <p className="text-2xl font-bold text-[#0057B8]">{c.todayAppointments}</p>
                <p className="text-[10px] text-[#0057B8]">Today total</p>
              </div>
              <div className="p-3 rounded-lg bg-green-50 border border-green-100 text-center">
                <p className="text-2xl font-bold text-green-700">{completedAppts}</p>
                <p className="text-[10px] text-green-700">Completed</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-center">
                <p className="text-2xl font-bold text-amber-700">{waitingStudents}</p>
                <p className="text-[10px] text-amber-700">Upcoming</p>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">Counselor Availability</p>
              <div className="space-y-1.5">
                {counselorAvailability.map((co, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">{co.name}</span>
                    <Badge variant="outline" className={`text-[9px] capitalize ${availabilityColor(co.color)}`}>
                      {co.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" description="Front desk workflow shortcuts">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
