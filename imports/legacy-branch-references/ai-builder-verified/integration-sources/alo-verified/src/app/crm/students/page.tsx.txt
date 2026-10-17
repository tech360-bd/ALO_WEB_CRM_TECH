'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Eye,
  Users,
  GraduationCap,
  Globe,
  Send,
  Mail,
  Phone,
  MoreHorizontal,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePortalData } from '@/hooks/use-portal-data'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Partner {
  id: string
  companyName: string
  partnerId: string
}

interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  whatsappNumber: string | null
  nationality: string | null
  preferredCountry: string | null
  preferredCourse: string | null
  preferredIntake: string | null
  status: string
  source: string
  assignedCounselor: string | null
  createdAt: string
  partner?: Partner | null
  _count?: { applications: number; documents: number }
  applications?: Array<{ id: string; status: string; university?: { name: string } }>
}

interface StudentsResponse {
  students: Student[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const statusColors: Record<string, string> = {
  active: 'bg-blue-50 text-[#0057B8] border-blue-100',
  enrolled: 'bg-green-50 text-green-600 border-green-100',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
  withdrawn: 'bg-red-50 text-red-600 border-red-100',
  graduated: 'bg-purple-50 text-purple-600 border-purple-100',
}

function exportStudentsCsv(students: Student[]) {
  const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Nationality', 'Country', 'Course', 'Intake', 'Counselor', 'Status', 'Created']
  const rows = students.map((s) => [
    s.studentId, s.firstName, s.lastName, s.email, s.phone || '',
    s.nationality || '', s.preferredCountry || '', s.preferredCourse || '',
    s.preferredIntake || '', s.assignedCounselor || '', s.status,
    new Date(s.createdAt).toISOString(),
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `students-${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
  toast.success(`${students.length} students exported`)
}

export default function CrmStudentsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCountry, setFilterCountry] = useState('')
  const [filterCounselor, setFilterCounselor] = useState('')
  const [selected, setSelected] = useState<Record<string, boolean>>({})
  const limit = 10

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const params: Record<string, string | number | undefined> = {
    page,
    limit,
    search: debouncedSearch || undefined,
    status: filterStatus && filterStatus !== 'all' ? filterStatus : undefined,
  }

  const { data, loading } = usePortalData<StudentsResponse>({
    endpoint: '/api/students',
    params,
  })

  const students = data?.students ?? []
  const pagination = data?.pagination

  // Client-side additional filters (country, counselor) — the API supports search but not country/counselor filters directly
  const filteredStudents = students.filter((s) => {
    if (filterCountry && filterCountry !== 'all' && s.preferredCountry !== filterCountry) return false
    if (filterCounselor && filterCounselor !== 'all' && s.assignedCounselor !== filterCounselor) return false
    return true
  })

  const countryOptions = Array.from(new Set(students.map((s) => s.preferredCountry).filter(Boolean) as string[]))
  const counselorOptions = Array.from(new Set(students.map((s) => s.assignedCounselor).filter(Boolean) as string[]))

  const allSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selected[s.id])
  const toggleAll = () => {
    const next = { ...selected }
    if (allSelected) filteredStudents.forEach((s) => { next[s.id] = false })
    else filteredStudents.forEach((s) => { next[s.id] = true })
    setSelected(next)
  }
  const toggleOne = (id: string) => setSelected((s) => ({ ...s, [id]: !s[id] }))
  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description="Complete student roster with search, filters, bulk selection, and CSV export."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportStudentsCsv(filteredStudents)}>
              <Download className="h-4 w-4 mr-2" /> Export CSV
            </Button>
            <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => toast.info('New student form')}>
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Students" value={pagination?.total ?? 0} icon={Users} accent="blue" />
        <StatCard label="Active" value={students.filter((s) => s.status === 'active').length} icon={GraduationCap} accent="green" />
        <StatCard label="Enrolled" value={students.filter((s) => s.status === 'enrolled').length} icon={Send} accent="purple" />
        <StatCard label="Countries" value={countryOptions.length} icon={Globe} accent="orange" />
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, phone, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
            <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterCountry} onValueChange={setFilterCountry}>
            <SelectTrigger className="w-[160px] h-10"><SelectValue placeholder="Country" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {countryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterCounselor} onValueChange={setFilterCounselor}>
            <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="Counselor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All counselors</SelectItem>
              {counselorOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {selectedCount > 0 && (
            <Button variant="outline" className="h-10" onClick={() => toast.info(`Bulk action on ${selectedCount} students`)}>
              <MoreHorizontal className="h-4 w-4 mr-2" /> Bulk ({selectedCount})
            </Button>
          )}
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-12 rounded bg-slate-100 animate-pulse" />)}</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Users className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No students found</h3>
            <p className="text-sm text-slate-500 mb-5">
              {search || filterStatus || filterCountry ? 'Try adjusting your filters.' : 'Add your first student to get started.'}
            </p>
            <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => toast.info('New student form')}>
              <Plus className="h-4 w-4 mr-2" /> Add Student
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10"><Checkbox checked={allSelected} onCheckedChange={toggleAll} aria-label="Select all" /></th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student ID</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Name</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Contact</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Nationality</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Preference</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Counselor</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Status</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Created</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => {
                  const isSelected = !!selected[s.id]
                  return (
                    <tr key={s.id} className={cn('border-b border-slate-100 hover:bg-slate-50/60', isSelected && 'bg-blue-50/40')}>
                      <td className="p-3"><Checkbox checked={isSelected} onCheckedChange={() => toggleOne(s.id)} aria-label={`Select ${s.studentId}`} /></td>
                      <td className="p-3"><span className="font-semibold text-[#0057B8]">{s.studentId}</span></td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0057B8] to-[#E8501A] flex items-center justify-center text-white text-xs font-bold">
                            {s.firstName[0]}{s.lastName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{s.firstName} {s.lastName}</p>
                            {s.partner && <p className="text-xs text-slate-400">via {s.partner.companyName}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="text-xs text-slate-600 flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone || '—'}</p>
                      </td>
                      <td className="p-3 text-xs text-slate-700">{s.nationality || 'Bangladesh'}</td>
                      <td className="p-3">
                        <p className="text-xs text-slate-700 font-medium">{s.preferredCountry || '—'}</p>
                        <p className="text-xs text-slate-500">{s.preferredCourse || '—'}</p>
                        <p className="text-xs text-slate-400">Intake: {s.preferredIntake || '—'}</p>
                      </td>
                      <td className="p-3 text-xs text-slate-600">{s.assignedCounselor ? <span className="truncate">{s.assignedCounselor}</span> : <span className="text-slate-400">—</span>}</td>
                      <td className="p-3"><Badge className={cn('border capitalize text-xs', statusColors[s.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>{s.status}</Badge></td>
                      <td className="p-3 text-xs text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => toast.info(`View profile ${s.studentId}`)}><Eye className="h-4 w-4 mr-2" /> View Profile</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Edit student')}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('New application')}><Send className="h-4 w-4 mr-2" /> New Application</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!loading && filteredStudents.length > 0 && pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> –{' '}
            <span className="font-semibold text-slate-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> students
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Prev
            </Button>
            <span className="text-sm text-slate-600">Page {pagination.page} / {pagination.totalPages || 1}</span>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
