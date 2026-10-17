'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  Users, Search, MessageSquare, Eye, Plus, Phone, Mail, ChevronRight,
  GraduationCap, ClipboardList, UserCheck
} from 'lucide-react'

interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  status: string
  preferredCountry?: string
  preferredCourse?: string
  source?: string
  partnerName?: string
  applicationCount?: number
  createdAt: string
}

const statusColors: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  enrolled: 'bg-blue-50 text-blue-700',
  deferred: 'bg-amber-50 text-amber-700',
  withdrawn: 'bg-red-50 text-red-700',
}

export default function EmployeeStudents() {
  const { currentUser } = useAppStore()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [currentUser])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const counselorId = currentUser?.referenceId || currentUser?.id || ''
      const res = await fetch(`/api/students?counselorId=${counselorId}&limit=50`)
      if (res.ok) {
        const json = await res.json()
        const studentData = (json.students || []).map((s: Record<string, unknown>) => ({
          id: s.id,
          studentId: s.studentId || '',
          firstName: s.firstName || '',
          lastName: s.lastName || '',
          email: s.email || '',
          phone: s.phone || '',
          status: s.status || 'active',
          preferredCountry: s.preferredCountry || '',
          preferredCourse: s.preferredCourse || '',
          source: s.source || '',
          partnerName: (s.partner as Record<string, string>)?.companyName || '',
          applicationCount: (s._count as Record<string, number>)?.applications || (s.applications as unknown[])?.length || 0,
          createdAt: s.createdAt || new Date().toISOString(),
        }))
        setStudents(studentData)
      } else {
        setStudents([])
      }
    } catch {
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const filtered = students.filter(s => {
    const matchSearch = !search ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const statusCounts = {
    active: students.filter(s => s.status === 'active').length,
    enrolled: students.filter(s => s.status === 'enrolled').length,
    deferred: students.filter(s => s.status === 'deferred').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1A2332]">My Students</h1>
        <p className="text-sm text-gray-500 mt-1">Students assigned to you as counselor</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'Active Students', value: statusCounts.active, icon: <UserCheck className="h-5 w-5" />, bg: 'bg-green-50', textColor: 'text-green-600' },
          { label: 'Enrolled', value: statusCounts.enrolled, icon: <GraduationCap className="h-5 w-5" />, bg: 'bg-blue-50', textColor: 'text-blue-600' },
          { label: 'Deferred', value: statusCounts.deferred, icon: <Clock className="h-5 w-5" />, bg: 'bg-amber-50', textColor: 'text-amber-600' },
        ].map((stat) => (
          <Card key={stat.label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${stat.bg} ${stat.textColor}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-xl font-bold text-[#1A2332]">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="enrolled">Enrolled</SelectItem>
            <SelectItem value="deferred">Deferred</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="withdrawn">Withdrawn</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student Cards */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No students found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((student) => (
            <Card key={student.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { setSelectedStudent(student); setShowDetailDialog(true) }}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-[#1A2332] flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-white">
                      {student.firstName[0]}{student.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#1A2332] truncate">{student.firstName} {student.lastName}</p>
                      <Badge className={`text-[10px] ${statusColors[student.status] || 'bg-gray-100 text-gray-600'}`}>
                        {student.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{student.studentId}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                  {student.preferredCountry && (
                    <div>
                      <p className="text-[10px] text-gray-400">Country</p>
                      <p className="text-xs font-medium text-[#1A2332]">{student.preferredCountry}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] text-gray-400">Applications</p>
                    <p className="text-xs font-medium text-[#0066CC]">{student.applicationCount || 0}</p>
                  </div>
                </div>
                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); toast.info('Opening message...') }}>
                    <MessageSquare className="h-3.5 w-3.5 text-gray-500" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); toast.info('Viewing profile...') }}>
                    <Eye className="h-3.5 w-3.5 text-gray-500" />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); toast.info('Creating task...') }}>
                    <ClipboardList className="h-3.5 w-3.5 text-gray-500" />
                  </Button>
                  <div className="flex-1" />
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Student Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#1A2332]">Student Profile</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#1A2332] flex items-center justify-center">
                  <span className="text-lg font-bold text-white">
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-[#1A2332]">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <p className="text-sm text-gray-500">{selectedStudent.studentId}</p>
                  <Badge className={`text-xs mt-1 ${statusColors[selectedStudent.status] || 'bg-gray-100'}`}>
                    {selectedStudent.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-[#1A2332] truncate">{selectedStudent.email}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-[#1A2332]">{selectedStudent.phone || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Preferred Country</p>
                  <p className="text-sm font-medium text-[#1A2332]">{selectedStudent.preferredCountry || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Preferred Course</p>
                  <p className="text-sm font-medium text-[#1A2332]">{selectedStudent.preferredCourse || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Applications</p>
                  <p className="text-sm font-medium text-[#0066CC]">{selectedStudent.applicationCount || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="text-sm font-medium text-[#1A2332]">{selectedStudent.source || '—'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#F37021] hover:bg-[#F37021]/90 text-white" onClick={() => toast.info('Opening message...')}>
                  <MessageSquare className="h-4 w-4 mr-2" /> Message
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => toast.info('Creating task...')}>
                  <ClipboardList className="h-4 w-4 mr-2" /> Create Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Clock({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
