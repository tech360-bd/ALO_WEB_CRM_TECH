'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Users, UserCheck, UserX, Briefcase, DollarSign, Clock,
  ArrowUpRight, ArrowDownRight, CalendarDays, UserPlus,
  CheckCircle2, XCircle, BarChart3, TrendingUp,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useAppStore } from '@/lib/store'

const attendanceData = [
  { day: 'Mon', present: 11, late: 1, absent: 1 },
  { day: 'Tue', present: 10, late: 2, absent: 1 },
  { day: 'Wed', present: 12, late: 0, absent: 1 },
  { day: 'Thu', present: 11, late: 1, absent: 1 },
  { day: 'Fri', present: 9, late: 2, absent: 2 },
]

const leaveRequests = [
  { id: 1, name: 'Sarah Khan', type: 'Casual', days: 3, from: '2025-03-10', to: '2025-03-12', reason: 'Personal work' },
  { id: 2, name: 'James Mitchell', type: 'Sick', days: 2, from: '2025-03-08', to: '2025-03-09', reason: 'Flu' },
  { id: 3, name: 'Rita Das', type: 'Annual', days: 5, from: '2025-03-15', to: '2025-03-19', reason: 'Vacation' },
  { id: 4, name: 'David Roy', type: 'Casual', days: 1, from: '2025-03-11', to: '2025-03-11', reason: 'Family event' },
]

const recentHires = [
  { name: 'Anika Rahman', dept: 'Counseling', date: '2025-03-01', role: 'Senior Counselor' },
  { name: 'Mark Spencer', dept: 'IT', date: '2025-02-20', role: 'Full Stack Developer' },
  { name: 'Lina Akter', dept: 'Marketing', date: '2025-02-15', role: 'Content Writer' },
]

const departments = [
  { name: 'Counseling', count: 5, budget: 12 },
  { name: 'Visa', count: 3, budget: 8 },
  { name: 'Marketing', count: 2, budget: 6 },
  { name: 'Finance', count: 2, budget: 7 },
  { name: 'IT', count: 2, budget: 9 },
]

export default function HRDashboard() {
  const { setCurrentView } = useAppStore()

  const stats = [
    { title: 'Total Employees', value: 14, icon: <Users className="h-5 w-5" />, color: 'text-[#F37021]', bg: 'bg-[#F37021]/10', trend: '+2', up: true },
    { title: 'Present Today', value: 11, icon: <UserCheck className="h-5 w-5" />, color: 'text-green-600', bg: 'bg-green-50', trend: '+1', up: true },
    { title: 'On Leave', value: 3, icon: <UserX className="h-5 w-5" />, color: 'text-[#0066CC]', bg: 'bg-[#0066CC]/10', trend: '0', up: true },
    { title: 'Open Positions', value: 4, icon: <Briefcase className="h-5 w-5" />, color: 'text-[#FFB347]', bg: 'bg-[#FFB347]/10', trend: '+1', up: false },
    { title: 'Payroll This Month', value: '£48K', icon: <DollarSign className="h-5 w-5" />, color: 'text-[#4CAF50]', bg: 'bg-[#4CAF50]/10', trend: '+5%', up: true },
    { title: 'Avg Attendance', value: '92%', icon: <TrendingUp className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-50', trend: '+3%', up: true },
  ]

  const handleApprove = (id: number, action: 'approve' | 'reject') => {
    // Mock action - in production this would call an API
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">HR Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Employee management, attendance and payroll overview</p>
        </div>
        <Badge variant="outline" className="w-fit border-[#4CAF50]/30 text-[#4CAF50] bg-[#4CAF50]/5 px-3 py-1 text-xs font-medium">
          HR Manager
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

      {/* Attendance Chart & Department Headcount */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#F37021]" /> Attendance Overview (This Week)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={attendanceData} margin={{ left: 10, right: 10, top: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="present" stackId="a" fill="#4CAF50" radius={[0, 0, 0, 0]} barSize={32} />
                <Bar dataKey="late" stackId="a" fill="#FFB347" radius={[0, 0, 0, 0]} barSize={32} />
                <Bar dataKey="absent" stackId="a" fill="#E91E63" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-2">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#4CAF50]" /><span className="text-[11px] text-gray-500">Present</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#FFB347]" /><span className="text-[11px] text-gray-500">Late</span></div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-[#E91E63]" /><span className="text-[11px] text-gray-500">Absent</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <Users className="h-4 w-4 text-[#0066CC]" /> Department Headcount
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {departments.map((d, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#1A2332]">{d.name}</span>
                    <span className="text-sm font-bold text-[#1A2332]">{d.count} staff</span>
                  </div>
                  <Progress value={(d.count / 14) * 100} className="h-2" />
                  <p className="text-[10px] text-gray-400 mt-1">Budget: £{d.budget}K/mo</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests & Recent Hires */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-[#E91E63]" /> Leave Requests Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {leaveRequests.map(l => (
                <div key={l.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#1A2332]">{l.name}</span>
                      <Badge className="bg-amber-50 text-amber-700 text-[9px] border-0">{l.type}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{l.days} day(s) • {l.from} to {l.to}</p>
                    <p className="text-[10px] text-gray-400">{l.reason}</p>
                  </div>
                  <div className="flex gap-1.5 ml-3">
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600 hover:bg-green-50" onClick={() => handleApprove(l.id, 'approve')}>
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-500 hover:bg-red-50" onClick={() => handleApprove(l.id, 'reject')}>
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-[#1A2332] flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-[#4CAF50]" /> Recent Hires
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {recentHires.map((h, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-green-50/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xs font-bold">
                      {h.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">{h.name}</p>
                      <p className="text-xs text-gray-500">{h.role} • {h.dept}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{h.date}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-hr')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#F37021]/10 rounded-xl flex items-center justify-center text-[#F37021]"><UserPlus className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Add Employee</p><p className="text-[11px] text-gray-500">Onboard new team member</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-hr')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#4CAF50]/10 rounded-xl flex items-center justify-center text-[#4CAF50]"><DollarSign className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Process Payroll</p><p className="text-[11px] text-gray-500">Run monthly payroll</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setCurrentView('crm-hr')}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-11 h-11 bg-[#0066CC]/10 rounded-xl flex items-center justify-center text-[#0066CC]"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="font-semibold text-[#1A2332] text-sm">Approve Leave</p><p className="text-[11px] text-gray-500">Review pending requests</p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
