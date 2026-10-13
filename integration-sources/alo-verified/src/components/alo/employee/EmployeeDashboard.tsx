'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users, Target, ClipboardList, Clock, CheckCircle2, AlertCircle,
  CalendarDays, TrendingUp, Briefcase
} from 'lucide-react'
import { toast } from 'sonner'

interface DashboardData {
  role: string
  employee: { id: string; employeeId: string; name: string }
  stats: {
    assignedLeads: number
    assignedStudents: number
    pendingTasks: number
    todayAttendance: string
    totalPendingTasks: number
    applicationsCount: number
  }
  recent: {
    leads: Array<{ id: string; leadId: string; firstName: string; lastName: string; status: string; createdAt: string }>
    tasks: Array<{ id: string; title: string; status: string; dueDate: string; priority: string }>
  }
}

export default function EmployeeDashboard() {
  const { currentUser } = useAppStore()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [clockingIn, setClockingIn] = useState(false)

  useEffect(() => {
    if (currentUser?.referenceId) {
      fetchDashboard()
    }
  }, [currentUser])

  const fetchDashboard = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/dashboard?type=employee&userId=${currentUser?.id}`)
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    if (!currentUser?.referenceId) return
    try {
      setClockingIn(true)
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentUser.referenceId, action: 'clock_in' })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Clocked in successfully!')
        fetchDashboard()
      } else {
        toast.error(json.error || 'Failed to clock in')
      }
    } catch {
      toast.error('Failed to clock in')
    } finally {
      setClockingIn(false)
    }
  }

  const handleClockOut = async () => {
    if (!currentUser?.referenceId) return
    try {
      setClockingIn(true)
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentUser.referenceId, action: 'clock_out' })
      })
      const json = await res.json()
      if (res.ok) {
        toast.success('Clocked out successfully!')
        fetchDashboard()
      } else {
        toast.error(json.error || 'Failed to clock out')
      }
    } catch {
      toast.error('Failed to clock out')
    } finally {
      setClockingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  const attendanceStatus = data?.stats?.todayAttendance || 'not_clocked_in'
  const isClockedIn = attendanceStatus === 'present' || attendanceStatus === 'late'
  const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A2332]">
            {greeting}, {data?.employee?.name || currentUser?.name || 'Employee'} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          {!isClockedIn ? (
            <Button
              onClick={handleClockIn}
              disabled={clockingIn}
              className="bg-[#F37021] hover:bg-[#e06010] text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Clock In
            </Button>
          ) : (
            <Button
              onClick={handleClockOut}
              disabled={clockingIn}
              variant="outline"
              className="border-[#F37021] text-[#F37021] hover:bg-[#F37021] hover:text-white"
            >
              <Clock className="h-4 w-4 mr-2" />
              Clock Out
            </Button>
          )}
          <Badge variant={isClockedIn ? 'default' : 'secondary'}
            className={isClockedIn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
            {isClockedIn ? '🟢 Clocked In' : attendanceStatus === 'not_clocked_in' ? '⏳ Not Clocked In' : '🔴 ' + attendanceStatus}
          </Badge>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Assigned Leads</p>
                <p className="text-2xl font-bold text-[#1A2332]">{data?.stats?.assignedLeads || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#F37021]/10 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-[#F37021]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Applications</p>
                <p className="text-2xl font-bold text-[#1A2332]">{data?.stats?.applicationsCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-[#0066CC]/10 rounded-xl flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-[#0066CC]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Tasks</p>
                <p className="text-2xl font-bold text-[#1A2332]">{data?.stats?.pendingTasks || 0}</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Pending</p>
                <p className="text-2xl font-bold text-[#1A2332]">{data?.stats?.totalPendingTasks || 0}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tasks & Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A2332]">Recent Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.recent?.tasks?.length ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle2 className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No tasks assigned</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {data.recent.tasks.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A2332] truncate">{task.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <Badge variant={
                      task.status === 'completed' ? 'default' :
                      task.status === 'in_progress' ? 'secondary' : 'outline'
                    } className={
                      task.status === 'completed' ? 'bg-green-100 text-green-700 ml-2' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 ml-2' :
                      'bg-amber-100 text-amber-700 ml-2'
                    }>
                      {task.status?.replace('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Leads */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A2332]">Assigned Leads</CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.recent?.leads?.length ? (
              <div className="text-center py-8 text-gray-400">
                <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No leads assigned</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {data.recent.leads.map((lead: any) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A2332] truncate">
                        {lead.firstName} {lead.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{lead.leadId}</p>
                    </div>
                    <Badge className={
                      lead.status === 'new' ? 'bg-blue-100 text-blue-700 ml-2' :
                      lead.status === 'contacted' ? 'bg-amber-100 text-amber-700 ml-2' :
                      lead.status === 'qualified' ? 'bg-green-100 text-green-700 ml-2' :
                      lead.status === 'enrolled' ? 'bg-purple-100 text-purple-700 ml-2' :
                      'bg-gray-100 text-gray-700 ml-2'
                    }>
                      {lead.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#F37021]" />
            Performance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-[#F37021]/5 rounded-xl">
              <p className="text-2xl font-bold text-[#F37021]">{data?.stats?.assignedLeads || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Total Leads</p>
            </div>
            <div className="text-center p-4 bg-[#0066CC]/5 rounded-xl">
              <p className="text-2xl font-bold text-[#0066CC]">{data?.stats?.applicationsCount || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Applications</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-xl">
              <p className="text-2xl font-bold text-green-600">{data?.stats?.pendingTasks || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Active Tasks</p>
            </div>
            <div className="text-center p-4 bg-amber-50 rounded-xl">
              <p className="text-2xl font-bold text-amber-600">
                {data?.stats?.todayAttendance === 'present' ? '✓' : data?.stats?.todayAttendance === 'late' ? '⏰' : '—'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Today&apos;s Status</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
