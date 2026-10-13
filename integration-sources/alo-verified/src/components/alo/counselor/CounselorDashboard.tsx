'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Users, ClipboardList, CalendarDays, MessageSquare,
  Clock, CheckCircle2, Phone, Target, TrendingUp,
  ArrowUpRight, ArrowDownRight, Zap, UserPlus, Bell,
  BarChart3, Send,
} from 'lucide-react'
import { useAppStore } from '@/lib/store'

const myStudents = [
  { id: 'STD-001', name: 'Tanvir Ahmed', university: 'University of Birmingham', status: 'conditional_offer', course: 'MSc CS', lastContact: '2 hrs ago' },
  { id: 'STD-002', name: 'Fatima Begum', university: 'University of Manchester', status: 'unconditional_offer', course: 'MBA', lastContact: '1 day ago' },
  { id: 'STD-003', name: 'Rahim Uddin', university: 'University of Leeds', status: 'submitted', course: 'BBA', lastContact: '3 hrs ago' },
  { id: 'STD-004', name: 'Nusrat Jahan', university: 'University of Sheffield', status: 'cas_received', course: 'MSc Finance', lastContact: '5 hrs ago' },
  { id: 'STD-005', name: 'Arif Khan', university: 'University of Bristol', status: 'under_review', course: 'LLB', lastContact: '1 day ago' },
]

const todaySchedule = [
  { time: '09:00 AM', student: 'Tanvir Ahmed', type: 'Follow-up Call', duration: '30 min' },
  { time: '10:30 AM', student: 'Fatima Begum', type: 'Application Review', duration: '45 min' },
  { time: '01:00 PM', student: 'New Lead - Sara Ali', type: 'Initial Consultation', duration: '30 min' },
  { time: '03:00 PM', student: 'Rahim Uddin', type: 'Document Check', duration: '20 min' },
  { time: '04:30 PM', student: 'Nusrat Jahan', type: 'Visa Guidance', duration: '30 min' },
]

const followUps = [
  { student: 'Arif Khan', action: 'Send offer letter details', due: 'Today', priority: 'high' },
  { student: 'New Lead - Sara Ali', action: 'Initial consultation call', due: 'Today', priority: 'high' },
  { student: 'Tanvir Ahmed', action: 'Follow up on conditional offer', due: 'Tomorrow', priority: 'medium' },
  { student: 'Fatima Begum', action: 'Confirm MBA enrollment', due: 'Tomorrow', priority: 'medium' },
  { student: 'Rahim Uddin', action: 'Submit pending documents', due: 'In 3 days', priority: 'low' },
]

const recentActivities = [
  { text: 'Tanvir Ahmed received conditional offer from Birmingham', time: '2 hrs ago', type: 'offer' },
  { text: 'Fatima Begum confirmed MBA enrollment at Manchester', time: '4 hrs ago', type: 'enrollment' },
  { text: 'New lead Sara Ali registered via Facebook Ads', time: '5 hrs ago', type: 'lead' },
  { text: 'Nusrat Jahan CAS received from Sheffield', time: '1 day ago', type: 'cas' },
  { text: 'Arif Khan documents uploaded for review', time: '1 day ago', type: 'document' },
]

const statusColors: Record<string, string> = {
  submitted: 'bg-blue-50 text-blue-700',
  under_review: 'bg-purple-50 text-purple-700',
  conditional_offer: 'bg-amber-50 text-amber-700',
  unconditional_offer: 'bg-green-50 text-green-700',
  cas_received: 'bg-[#F37021]/10 text-[#F37021]',
  enrolled: 'bg-green-100 text-green-800',
}

const typeIcons: Record<string, string> = {
  offer: '🎓', enrollment: '✅', lead: '🎯', cas: '📋', document: '📄',
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-green-50 text-green-700',
}

export default function CounselorDashboard() {
  const { setCurrentView } = useAppStore()

  const stats = [
    { title: 'My Students', value: 25, icon: <Users className="h-5 w-5" />, color: 'text-[#F37021]', bg: 'bg-[#F37021]/10', trend: '+3', up: true },
    { title: 'Active Applications', value: 18, icon: <ClipboardList className="h-5 w-5" />, color: 'text-[#0066CC]', bg: 'bg-[#0066CC]/10', trend: '+2', up: true },
    { title: "Today's Appointments", value: 5, icon: <CalendarDays className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50', trend: '0', up: true },
    { title: 'Messages', value: 8, icon: <MessageSquare className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50', trend: '+5', up: true },
    { title: 'Pending Follow-ups', value: 5, icon: <Clock className="h-5 w-5" />, color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10', trend: '-2', up: false },
    { title: 'Conversion Rate', value: '32%', icon: <TrendingUp className="h-5 w-5" />, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', trend: '+5%', up: true },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">Counselor Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Manage students, applications and track performance</p>
        </div>
        <Badge variant="outline" className="w-fit border-[#F37021]/30 text-[#F37021] bg-[#F37021]/5 px-3 py-1 text-xs font-medium">
          Counselor
        </Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 ${s.bg} rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
                <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${s.up ? 'text-green-600' : 'text-red-500'}`}>
                  {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}{s.trend}
                </span>
              </div>
              <p className="text-xl font-bold text-[#1A2332]">{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My Students List & Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Students */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
                <Users className="h-4 w-4 text-[#F37021]" /> My Students
              </CardTitle>
              <Button variant="ghost" size="sm" className="text-[#F37021] text-xs" onClick={() => setCurrentView('crm-students')}>View All →</Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
              {myStudents.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-[#F37021]/10 rounded-full flex items-center justify-center text-[#F37021] text-xs font-bold shrink-0">
                      {s.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1A2332] truncate">{s.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">{s.university} • {s.course}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0 ml-2">
                    <Badge className={`${statusColors[s.status] || 'bg-gray-50 text-gray-600'} text-[9px] border-0`}>
                      {s.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[9px] text-gray-400 mt-0.5">{s.lastContact}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#0066CC]" /> Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
              {todaySchedule.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-14 text-center shrink-0">
                    <p className="text-xs font-bold text-[#F37021]">{s.time}</p>
                    <p className="text-[9px] text-gray-400">{s.duration}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1A2332] truncate">{s.student}</p>
                    <p className="text-[10px] text-gray-500">{s.type}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-[#0066CC] text-[10px] shrink-0">
                    <Phone className="h-3 w-3 mr-1" />Call
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Follow-up Reminders & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Follow-up Reminders */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <Bell className="h-4 w-4 text-[#FFB347]" /> Follow-up Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2.5">
              {followUps.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${f.priority === 'high' ? 'bg-red-500' : f.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#1A2332] truncate">{f.student}</p>
                      <p className="text-[10px] text-gray-500 truncate">{f.action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge className={`${priorityColors[f.priority]} text-[9px] border-0`}>{f.due}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#4CAF50]" /> Recent Student Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-sm shrink-0 mt-0.5">
                    {typeIcons[a.type] || '📋'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1A2332] leading-snug">{a.text}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-leads')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#F37021]/10 rounded-xl flex items-center justify-center text-[#F37021]"><UserPlus className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Add Student</p><p className="text-[11px] text-gray-500">Register new student lead</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-applications')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0066CC]/10 rounded-xl flex items-center justify-center text-[#0066CC]"><CalendarDays className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Schedule Appointment</p><p className="text-[11px] text-gray-500">Book student consultation</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-whatsapp')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center text-green-600"><Send className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Send Follow-up</p><p className="text-[11px] text-gray-500">Message students via WhatsApp</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
