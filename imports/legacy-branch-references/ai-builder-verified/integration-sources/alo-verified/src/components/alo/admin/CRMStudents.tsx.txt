'use client'

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Search, Plus, Filter, Eye, GraduationCap, Mail, Phone } from 'lucide-react'
import { toast } from 'sonner'

interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: string
  source: string
  country: string
  preferredCountry: string
  partner?: { id: string; companyName: string; partnerId: string }
  _count?: { applications: number; documents: number }
}

export default function CRMStudents() {
  const { currentUser } = useAppStore()
  const [students, setStudents] = useState<Student[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '',
    gender: '', dateOfBirth: '', nationality: '', country: 'Bangladesh',
    preferredCountry: '', preferredCourse: '', source: 'DIRECT', status: 'active',
    createUserAccount: true
  })

  useEffect(() => { fetchStudents() }, [search, statusFilter, sourceFilter, countryFilter, pagination.page])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      let url = `/api/students?page=${pagination.page}&limit=${pagination.limit}`
      if (search) url += `&search=${search}`
      if (statusFilter && statusFilter !== 'all') url += `&status=${statusFilter}`
      if (sourceFilter && sourceFilter !== 'all') url += `&source=${sourceFilter}`
      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setStudents(json.students || [])
        setPagination(json.pagination || pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddStudent = async () => {
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error('First name, last name, and email are required')
      return
    }
    try {
      setSubmitting(true)
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        toast.success('Student added successfully')
        setAddDialogOpen(false)
        setForm({ firstName: '', lastName: '', email: '', phone: '', whatsappNumber: '', gender: '', dateOfBirth: '', nationality: '', country: 'Bangladesh', preferredCountry: '', preferredCourse: '', source: 'DIRECT', status: 'active', createUserAccount: true })
        fetchStudents()
      } else {
        const json = await res.json()
        toast.error(json.error || 'Failed to add student')
      }
    } catch {
      toast.error('Failed to add student')
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'inactive': return 'bg-gray-100 text-gray-700'
      case 'enrolled': return 'bg-blue-100 text-blue-700'
      case 'graduated': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[#1A2332]">Students Management</h1>
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#F37021] hover:bg-[#e06010] text-white">
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Add New Student</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>First Name *</Label><Input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} /></div>
                <div><Label>Last Name *</Label><Input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} /></div>
              </div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div><Label>WhatsApp</Label><Input value={form.whatsappNumber} onChange={e => setForm({...form, whatsappNumber: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Gender</Label>
                  <Select value={form.gender} onValueChange={v => setForm({...form, gender: v})}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Nationality</Label><Input value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} /></div>
                <div><Label>Country</Label><Input value={form.country} onChange={e => setForm({...form, country: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Preferred Country</Label><Input value={form.preferredCountry} onChange={e => setForm({...form, preferredCountry: e.target.value})} /></div>
                <div><Label>Preferred Course</Label><Input value={form.preferredCourse} onChange={e => setForm({...form, preferredCourse: e.target.value})} /></div>
              </div>
              <div><Label>Source</Label>
                <Select value={form.source} onValueChange={v => setForm({...form, source: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="DIRECT">Direct</SelectItem><SelectItem value="WEBSITE">Website</SelectItem><SelectItem value="PARTNER">Partner</SelectItem><SelectItem value="REFERRAL">Referral</SelectItem><SelectItem value="SOCIAL_MEDIA">Social Media</SelectItem></SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddStudent} disabled={submitting} className="w-full bg-[#F37021] hover:bg-[#e06010] text-white">{submitting ? 'Adding...' : 'Add Student'}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="inactive">Inactive</SelectItem><SelectItem value="enrolled">Enrolled</SelectItem></SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Source" /></SelectTrigger>
              <SelectContent><SelectItem value="all">All Sources</SelectItem><SelectItem value="DIRECT">Direct</SelectItem><SelectItem value="PARTNER_INBOUND">Partner</SelectItem><SelectItem value="WEBSITE">Website</SelectItem></SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : students.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" /><p>No students found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Partner</TableHead>
                    <TableHead className="hidden lg:table-cell">Apps</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-mono text-xs">{student.studentId}</TableCell>
                      <TableCell>
                        <p className="font-medium">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-gray-500">{student.preferredCountry || student.country}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-col gap-0.5">
                          {student.email && <span className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" />{student.email}</span>}
                          {student.phone && <span className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" />{student.phone}</span>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{student.source}</Badge></TableCell>
                      <TableCell><Badge className={getStatusColor(student.status)}>{student.status}</Badge></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{student.partner?.companyName || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{student._count?.applications || 0}</TableCell>
                      <TableCell><Button variant="ghost" size="icon" onClick={() => { setSelectedStudent(student); setDetailDialogOpen(true) }}><Eye className="h-4 w-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Showing {students.length} of {pagination.total}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPagination({...pagination, page: pagination.page - 1})}>Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination({...pagination, page: pagination.page + 1})}>Next</Button>
          </div>
        </div>
      )}

      {/* Student Detail */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Student Details</DialogTitle></DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                <Badge className={getStatusColor(selectedStudent.status)}>{selectedStudent.status}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Student ID</p><p className="font-medium">{selectedStudent.studentId}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-medium">{selectedStudent.email}</p></div>
                <div><p className="text-gray-500">Phone</p><p className="font-medium">{selectedStudent.phone || 'N/A'}</p></div>
                <div><p className="text-gray-500">Country</p><p className="font-medium">{selectedStudent.country}</p></div>
                <div><p className="text-gray-500">Source</p><p className="font-medium capitalize">{selectedStudent.source}</p></div>
                <div><p className="text-gray-500">Partner</p><p className="font-medium">{selectedStudent.partner?.companyName || 'None'}</p></div>
                <div><p className="text-gray-500">Applications</p><p className="font-medium">{selectedStudent._count?.applications || 0}</p></div>
                <div><p className="text-gray-500">Documents</p><p className="font-medium">{selectedStudent._count?.documents || 0}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
