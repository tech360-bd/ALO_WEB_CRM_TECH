'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  CalendarDays, Plus, Clock, CheckCircle2, XCircle, AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface LeaveRecord {
  id: string
  leaveType: string
  startDate: string
  endDate: string
  reason: string
  status: string
  totalDays: number
  createdAt: string
}

export default function EmployeeLeave() {
  const { currentUser } = useAppStore()
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  })

  // Leave balance (mocked since leave balance is typically configured)
  const leaveBalance = {
    casual: 12,
    sick: 10,
    annual: 15,
    maternity: 0,
    paternity: 0,
  }

  useEffect(() => {
    fetchLeaves()
  }, [currentUser])

  const fetchLeaves = async () => {
    try {
      setLoading(true)
      const empId = currentUser?.referenceId
      if (!empId) return
      // Using attendance API with leave filter pattern
      const res = await fetch(`/api/attendance?employeeId=${empId}&limit=50&status=leave`)
      if (res.ok) {
        const json = await res.json()
        // Filter for leave-type records
        const leaveRecords = (json.attendance || []).filter((a: any) => a.status === 'leave' || a.note?.includes('leave'))
        setLeaves(leaveRecords)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!form.leaveType || !form.startDate || !form.endDate || !form.reason) {
      toast.error('Please fill all fields')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: currentUser?.referenceId,
          action: 'leave_request',
          leaveType: form.leaveType,
          startDate: form.startDate,
          endDate: form.endDate,
          reason: form.reason,
          note: `Leave request: ${form.leaveType} from ${form.startDate} to ${form.endDate} - ${form.reason}`
        })
      })

      if (res.ok) {
        toast.success('Leave request submitted successfully')
        setDialogOpen(false)
        setForm({ leaveType: '', startDate: '', endDate: '', reason: '' })
        fetchLeaves()
      } else {
        toast.error('Failed to submit leave request')
      }
    } catch {
      toast.error('Failed to submit leave request')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700'
      case 'rejected': return 'bg-red-100 text-red-700'
      case 'pending': return 'bg-amber-100 text-amber-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Leave Management</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F37021] hover:bg-[#e06010] text-white">
              <Plus className="h-4 w-4 mr-2" /> Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Leave</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select value={form.leaveType} onValueChange={v => setForm({...form, leaveType: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="casual">Casual Leave</SelectItem>
                    <SelectItem value="sick">Sick Leave</SelectItem>
                    <SelectItem value="annual">Annual Leave</SelectItem>
                    <SelectItem value="maternity">Maternity Leave</SelectItem>
                    <SelectItem value="paternity">Paternity Leave</SelectItem>
                    <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={form.reason}
                  onChange={e => setForm({...form, reason: e.target.value})}
                  placeholder="Provide reason for leave..."
                  rows={3}
                />
              </div>
              <Button onClick={handleSubmit} disabled={submitting} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">
                {submitting ? 'Submitting...' : 'Submit Leave Request'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { type: 'Casual', balance: leaveBalance.casual, icon: CalendarDays, color: '#F37021' },
          { type: 'Sick', balance: leaveBalance.sick, icon: AlertCircle, color: '#0066CC' },
          { type: 'Annual', balance: leaveBalance.annual, icon: Clock, color: '#22c55e' },
          { type: 'Maternity', balance: leaveBalance.maternity, icon: CheckCircle2, color: '#8b5cf6' },
          { type: 'Paternity', balance: leaveBalance.paternity, icon: CheckCircle2, color: '#06b6d4' },
        ].map(item => (
          <Card key={item.type} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 text-center">
              <div className="w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                <item.icon className="h-5 w-5" style={{ color: item.color }} />
              </div>
              <p className="text-2xl font-bold text-[#1A2332]">{item.balance}</p>
              <p className="text-xs text-gray-500">{item.type} Leave</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Leave History */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#1A2332]">Leave History</CardTitle>
        </CardHeader>
        <CardContent>
          {leaves.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No leave records found</p>
              <p className="text-xs mt-1">Submit a leave request to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="font-medium capitalize">{leave.leaveType || leave.status}</TableCell>
                      <TableCell>{new Date(leave.startDate || leave.date).toLocaleDateString()}</TableCell>
                      <TableCell>{leave.endDate ? new Date(leave.endDate).toLocaleDateString() : '—'}</TableCell>
                      <TableCell>{leave.totalDays || 1}</TableCell>
                      <TableCell className="max-w-48 truncate">{leave.reason || leave.note || '—'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(leave.status)}>
                          {leave.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
