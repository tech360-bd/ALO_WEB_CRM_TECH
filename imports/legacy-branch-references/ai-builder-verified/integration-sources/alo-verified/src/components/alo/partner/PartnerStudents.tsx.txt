'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { useAppStore } from '@/lib/store'
import { toast } from 'sonner'
import {
  GraduationCap, UserPlus, Search, Filter, ChevronRight,
  Mail, Phone, MapPin, FileText, Calendar, ArrowLeft, User, Globe
} from 'lucide-react'

interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  nationality: string
  preferredCountry: string
  preferredCourse: string
  status: string
  source: string
  createdAt: string
  applications: Array<{ id: string; status: string; university?: { name: string } }>
  _count?: { applications: number; documents: number }
}

export default function PartnerStudents() {
  const { currentUser, setCurrentView } = useAppStore()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchStudents() {
      try {
        setLoading(true)
        const refId = currentUser?.referenceId || ''
        const params = new URLSearchParams({
          limit: '20',
          page: page.toString(),
          partnerId: refId,
        })
        if (search) params.set('search', search)
        if (statusFilter !== 'all') params.set('status', statusFilter)

        const res = await fetch(`/api/students?${params}`)
        if (!res.ok) throw new Error('Failed')
        const json = await res.json()
        setStudents(json.students || [])
        setTotal(json.pagination?.total || 0)
      } catch {
        setStudents([])
      } finally {
        setLoading(false)
      }
    }
    fetchStudents()
  }, [currentUser?.referenceId, page, search, statusFilter])

  const filtered = students.filter(s => {
    const matchesSearch = !search ||
      s.firstName.toLowerCase().includes(search.toLowerCase()) ||
      s.lastName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  // Student Detail View
  if (selectedStudent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Button variant="ghost" onClick={() => setSelectedStudent(null)} className="text-gray-500">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Students
        </Button>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-alo-blue/10 rounded-full flex items-center justify-center shrink-0">
                <span className="text-lg font-bold text-alo-blue">
                  {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-alo-navy">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h2>
                <p className="text-sm text-gray-500">{selectedStudent.studentId}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">{selectedStudent.status}</Badge>
                  <Badge variant="outline" className="text-xs">{selectedStudent.source}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-alo-navy">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{selectedStudent.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{selectedStudent.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{selectedStudent.nationality || 'N/A'}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-alo-navy">Study Preferences</CardTitle>
            </CardHeader>
            <CardContent className="pb-4 space-y-3">
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{selectedStudent.preferredCountry || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">{selectedStudent.preferredCourse || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-700">Registered: {new Date(selectedStudent.createdAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Applications */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-alo-navy">Applications ({selectedStudent.applications?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            {(!selectedStudent.applications || selectedStudent.applications.length === 0) ? (
              <p className="text-sm text-gray-400 text-center py-4">No applications yet</p>
            ) : (
              <div className="space-y-2">
                {selectedStudent.applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-alo-navy">{app.university?.name || 'University'}</span>
                    <Badge variant="outline" className="text-xs">{app.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-alo-navy">Students</h1>
          <p className="text-sm text-gray-500 mt-1">{total} student{total !== 1 ? 's' : ''} registered</p>
        </div>
        <Button className="bg-alo-orange hover:bg-alo-orange/90 text-white"
          onClick={() => setCurrentView('partner-submit-student')}>
          <UserPlus className="h-4 w-4 mr-2" /> Add Student
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="enrolled">Enrolled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student Table */}
      {filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No students found</p>
            <Button className="mt-4 bg-alo-orange hover:bg-alo-orange/90 text-white"
              onClick={() => setCurrentView('partner-submit-student')}>
              <UserPlus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">ID</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Country</TableHead>
                  <TableHead className="text-xs">Applications</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Registered</TableHead>
                  <TableHead className="text-xs"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((student) => (
                  <TableRow key={student.id} className="cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedStudent(student)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-alo-blue/10 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-alo-blue">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-alo-navy">{student.firstName} {student.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-gray-500">{student.studentId}</TableCell>
                    <TableCell className="text-xs text-gray-500">{student.email}</TableCell>
                    <TableCell className="text-xs text-gray-500">{student.preferredCountry || student.nationality || '-'}</TableCell>
                    <TableCell className="text-xs">
                      <Badge variant="outline">{student._count?.applications || student.applications?.length || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs ${
                        student.status === 'active' ? 'bg-green-50 text-green-700' :
                        student.status === 'enrolled' ? 'bg-blue-50 text-blue-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{student.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {total > 20 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-gray-500">Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, total)} of {total}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page * 20 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
