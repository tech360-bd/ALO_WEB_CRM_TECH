'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Users, Search, Eye, ChevronLeft, ChevronRight, UserPlus, Filter, X,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'

interface StudentRow {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  preferredCountry: string | null
  preferredCourse: string | null
  preferredIntake: string | null
  status: string
  createdAt: string
  _count?: { applications: number; documents: number }
  applications?: Array<{ id: string; status: string }>
}

interface StudentsResponse {
  students: StudentRow[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'graduated', label: 'Graduated' },
]

const statusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-50 text-green-700 border-green-200'
    case 'enrolled': return 'bg-[#EFF6FF] text-[#0057B8] border-blue-200'
    case 'graduated': return 'bg-purple-50 text-purple-700 border-purple-200'
    case 'withdrawn': return 'bg-red-50 text-red-700 border-red-200'
    case 'inactive': return 'bg-slate-100 text-slate-600 border-slate-200'
    default: return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

export default function PartnerStudentsPage() {
  const session = getSession()
  const partnerId = session?.user.referenceId

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const limit = 10

  const params = useMemo(
    () => ({
      partnerId: partnerId || '',
      page,
      limit,
      search,
      status,
    }),
    [partnerId, page, search, status]
  )

  const { data, loading } = usePortalData<StudentsResponse>({
    endpoint: '/api/students',
    params,
  })

  const applySearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setSearchInput('')
    setStatus('')
    setPage(1)
  }

  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Students"
        description="All students registered under your partner network."
        action={
          <Button asChild className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0">
            <Link href="/partner/register-student">
              <UserPlus className="h-4 w-4 mr-2" /> Register Student
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Students" value={total} icon={Users} accent="blue" />
        <StatCard label="Active" value={data?.students?.filter((s) => s.status === 'active').length ?? 0} icon={Users} accent="green" />
        <StatCard label="Enrolled" value={data?.students?.filter((s) => s.status === 'enrolled').length ?? 0} icon={Users} accent="purple" />
        <StatCard label="On This Page" value={data?.students?.length ?? 0} icon={Users} accent="orange" />
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        {/* Filter bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applySearch()}
              placeholder="Search by name, email, student ID…"
              className="pl-9"
            />
          </div>
          <Select value={status || 'all'} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value || 'all'} value={o.value || 'all'}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={applySearch} className="bg-[#0057B8] hover:bg-[#004a99] text-white border-0">
            <Filter className="h-4 w-4 mr-1" /> Apply
          </Button>
          {(search || status) && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear
            </Button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3 font-semibold">Student ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Email</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Phone</th>
                <th className="px-4 py-3 font-semibold">Preferred Country</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Created</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 rounded bg-slate-100 animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.students && data.students.length > 0 ? (
                data.students.map((s) => (
                  <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{s.studentId}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {s.firstName[0]}{s.lastName[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-slate-500 md:hidden truncate">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell truncate max-w-[200px]">{s.email}</td>
                    <td className="px-4 py-3 text-slate-600 hidden lg:table-cell">{s.phone || '—'}</td>
                    <td className="px-4 py-3 text-slate-700">{s.preferredCountry || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={'capitalize ' + statusColor(s.status)}>
                        {s.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500 hidden lg:table-cell text-xs">
                      {new Date(s.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button asChild size="sm" variant="ghost">
                        <Link href="/partner/applications">
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-1 font-medium">No students found</p>
                    <p className="text-xs text-slate-400 mb-4">
                      {search || status ? 'Try adjusting your filters.' : 'Get started by registering your first student.'}
                    </p>
                    <Button asChild className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0">
                      <Link href="/partner/register-student">
                        <UserPlus className="h-4 w-4 mr-2" /> Register Student
                      </Link>
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-slate-500">
              Showing {from}–{to} of {total} students
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-xs text-slate-600 px-2">Page {page} of {Math.max(totalPages, 1)}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
