'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Clock, CheckCircle2, XCircle, AlertTriangle, CalendarDays,
  ArrowRight, Plus, Timer, LogIn, LogOut, Coffee,
} from 'lucide-react'
import { toast } from 'sonner'

interface AttendanceRecord {
  id: string
  date: string
  clockIn: string
  clockOut: string
  status: string
  totalHours: number
  note: string
  source: string
}

const mockCalendarData: Record<string, string> = {
  '1': 'present', '2': 'present', '3': 'late', '4': 'present', '5': 'present',
  '6': 'absent', '7': 'present', '8': 'present', '9': 'present', '10': 'leave',
  '11': 'leave', '12': 'present', '13': 'present', '14': 'late', '15': 'present',
  '16': 'present', '17': 'present', '18': 'absent', '19': 'present', '20': 'present',
  '21': 'present', '22': 'present', '23': 'present', '24': 'late', '25': 'present',
  '26': 'present', '27': 'present', '28': 'present',
}

export default function EmployeeAttendance() {
  const { currentUser } = useAppStore()
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [clockingIn, setClockingIn] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [correctionNote, setCorrectionNote] = useState('')
  const [correctionDialogOpen, setCorrectionDialogOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => { fetchAttendance() }, [currentUser])

  const fetchAttendance = async () => {
    try {
      setLoading(true)
      const empId = currentUser?.referenceId
      if (!empId) { setLoading(false); return }
      const res = await fetch(`/api/attendance?employeeId=${empId}&limit=31`)
      if (res.ok) {
        const json = await res.json()
        setRecords(json.attendance || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClockIn = async () => {
    try {
      setClockingIn(true)
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentUser?.referenceId, action: 'clock_in' }),
      })
      if (res.ok) { toast.success('Clocked in successfully!'); fetchAttendance() }
      else { const json = await res.json(); toast.error(json.error || 'Failed to clock in') }
    } catch { toast.error('Failed to clock in') }
    finally { setClockingIn(false) }
  }

  const handleClockOut = async () => {
    try {
      setClockingIn(true)
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: currentUser?.referenceId, action: 'clock_out' }),
      })
      if (res.ok) { toast.success('Clocked out successfully!'); fetchAttendance() }
      else { const json = await res.json(); toast.error(json.error || 'Failed to clock out') }
    } catch { toast.error('Failed to clock out') }
    finally { setClockingIn(false) }
  }

  const submitCorrection = async () => {
    if (!correctionNote.trim()) { toast.error('Please provide a reason'); return }
    toast.success('Correction request submitted')
    setCorrectionDialogOpen(false)
    setCorrectionNote('')
  }

  const todayRecord = records.find(r => new Date(r.date).toDateString() === new Date().toDateString())
  const isClockedIn = todayRecord && !todayRecord.clockOut

  const presentCount = records.filter(r => r.status === 'present').length
  const lateCount = records.filter(r => r.status === 'late').length
  const absentCount = records.filter(r => r.status === 'absent').length
  const leaveCount = Object.values(mockCalendarData).filter(v => v === 'leave').length

  const filteredRecords = filterStatus === 'all' ? records : records.filter(r => r.status === filterStatus)

  const presentDates = records.filter(r => r.status === 'present').map(r => new Date(r.date))
  const lateDates = records.filter(r => r.status === 'late').map(r => new Date(r.date))
  const absentDates = records.filter(r => r.status === 'absent').map(r => new Date(r.date))

  const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Attendance</h1>
        <Dialog open={correctionDialogOpen} onOpenChange={setCorrectionDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="text-[#F37021] border-[#F37021]">
              <Plus className="h-4 w-4 mr-1" /> Request Correction
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Attendance Correction Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Date</Label>
                <p className="text-sm p-2 bg-gray-50 rounded-md">{selectedDate?.toLocaleDateString() || 'Select a date'}</p>
              </div>
              <div>
                <Label>Correction Type</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clock-in">Clock In Correction</SelectItem>
                    <SelectItem value="clock-out">Clock Out Correction</SelectItem>
                    <SelectItem value="absent-to-present">Absent to Present</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reason</Label>
                <Textarea value={correctionNote} onChange={e => setCorrectionNote(e.target.value)} placeholder="Explain why you need a correction..." rows={3} />
              </div>
              <Button onClick={submitCorrection} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">Submit Request</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Time + Clock In/Out */}
      <Card className="border-0 shadow-sm bg-gradient-to-r from-[#1A2332] to-[#0066CC] text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                <Timer className="h-7 w-7 text-[#F37021]" />
              </div>
              <div>
                <p className="text-sm text-gray-300">Current Time</p>
                <p className="text-3xl font-bold font-mono">{formatTime(currentTime)}</p>
                <p className="text-xs text-gray-400">{currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <div>
              {!todayRecord ? (
                <Button onClick={handleClockIn} disabled={clockingIn} className="bg-[#F37021] hover:bg-[#e06010] text-white h-12 px-6 text-base">
                  <LogIn className="h-5 w-5 mr-2" /> Clock In
                </Button>
              ) : isClockedIn ? (
                <Button onClick={handleClockOut} disabled={clockingIn} className="bg-white text-[#1A2332] hover:bg-gray-100 h-12 px-6 text-base">
                  <LogOut className="h-5 w-5 mr-2" /> Clock Out
                </Button>
              ) : (
                <Badge className="bg-green-500/20 text-green-300 px-4 py-2 text-sm">✓ Clocked Out Today</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <LogIn className="h-5 w-5 text-[#0066CC] mx-auto mb-2" />
            <p className="text-xs text-[#555555]">In Time</p>
            <p className="text-lg font-bold text-[#1A2332]">{todayRecord?.clockIn ? new Date(todayRecord.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <LogOut className="h-5 w-5 text-[#F37021] mx-auto mb-2" />
            <p className="text-xs text-[#555555]">Out Time</p>
            <p className="text-lg font-bold text-[#1A2332]">{todayRecord?.clockOut ? new Date(todayRecord.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Clock className="h-5 w-5 text-purple-600 mx-auto mb-2" />
            <p className="text-xs text-[#555555]">Hours Worked</p>
            <p className="text-lg font-bold text-[#1A2332]">{todayRecord?.totalHours ? `${todayRecord.totalHours}h` : '0h'}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto mb-2" />
            <p className="text-xs text-[#555555]">Status</p>
            <p className="text-lg font-bold text-[#1A2332]">
              {todayRecord?.status === 'present' ? 'Present' : todayRecord?.status === 'late' ? 'Late' : 'Not Clocked In'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CheckCircle2 className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-2xl font-bold text-[#1A2332]">{presentCount}</p><p className="text-xs text-gray-500">Present</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-2xl font-bold text-[#1A2332]">{lateCount}</p><p className="text-xs text-gray-500">Late</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-2xl font-bold text-[#1A2332]">{absentCount}</p><p className="text-xs text-gray-500">Absent</p></div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Coffee className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-2xl font-bold text-[#1A2332]">{leaveCount}</p><p className="text-xs text-gray-500">Leave</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendar View */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-[#1A2332] flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#F37021]" /> Monthly Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md"
              modifiers={{
                present: presentDates,
                late: lateDates,
                absent: absentDates,
              }}
              modifiersStyles={{
                present: { backgroundColor: '#dcfce7', color: '#166534' },
                late: { backgroundColor: '#fef3c7', color: '#92400e' },
                absent: { backgroundColor: '#fee2e2', color: '#991b1b' },
              }}
            />
            <div className="flex gap-4 mt-3 text-xs flex-wrap">
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-200" /> Present</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-200" /> Late</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-200" /> Absent</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-200" /> Leave</div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance History */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-[#1A2332]">Attendance History</CardTitle>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
              {filteredRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No records found</p>
                </div>
              ) : (
                filteredRecords.map(record => (
                  <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-[#1A2332]">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {record.clockIn ? new Date(record.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        {' → '}
                        {record.clockOut ? new Date(record.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        {record.totalHours ? ` (${record.totalHours}h)` : ''}
                      </p>
                    </div>
                    <Badge className={
                      record.status === 'present' ? 'bg-green-100 text-green-700' :
                      record.status === 'late' ? 'bg-amber-100 text-amber-700' :
                      record.status === 'absent' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }>
                      {record.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
