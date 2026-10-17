'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Send, Search, ChevronLeft, ChevronRight, Filter, X, Download, Eye,
  CheckCircle2, Clock, XCircle, FileText,
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
import { toast } from 'sonner'

interface AppRow {
  id: string
  applicationId: string
  status: string
  intake: string | null
  createdAt: string
  student: { id: string; firstName: string; lastName: string; studentId: string; email: string }
  university: { id: string; name: string; country: string; city: string | null }
  course: { id: string; name: string; level: string | null; tuitionFee: number | null } | null
}

interface AppsResponse {
  applications: AppRow[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface UniResponse {
  universities: Array<{ id: string; name: string; country: string }>
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'conditional_offer', label: 'Conditional Offer' },
  { value: 'unconditional_offer', label: 'Unconditional Offer' },
  { value: 'deposit_paid', label: 'Deposit Paid' },
  { value: 'cas_received', label: 'CAS Received' },
  { value: 'visa_applied', label: 'Visa Applied' },
  { value: 'visa_approved', label: 'Visa Approved' },
  { value: 'visa_refused', label: 'Visa Refused' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'rejected', label: 'Rejected' },
]

const statusMeta: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  draft: { label: 'Draft', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
  under_review: { label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  conditional_offer: { label: 'Conditional Offer', color: 'bg-[#FFF7ED] text-[#E8501A] border-orange-200', icon: CheckCircle2 },
  unconditional_offer: { label: 'Unconditional Offer', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  deposit_paid: { label: 'Deposit Paid', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  cas_received: { label: 'CAS Received', color: 'bg-[#EFF6FF] text-[#0057B8] border-blue-200', icon: CheckCircle2 },
  visa_applied: { label: 'Visa Applied', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  visa_approved: { label: 'Visa Approved', color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
  visa_refused: { label: 'Visa Refused', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
  enrolled: { label: 'Enrolled', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
}

export default function PartnerApplicationsPage() {
  const session = getSession()
  const partnerId = session?.user.referenceId

  const [status, setStatus] = useState('all')
  const [universityId, setUniversityId] = useState('all')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 10

  const params = useMemo(
    () => ({
      partnerId: partnerId || '',
      page,
      limit,
      search,
      status: status === 'all' ? '' : status,
      universityId: universityId === 'all' ? '' : universityId,
    }),
    [partnerId, page, search, status, universityId]
  )

  const { data, loading } = usePortalData<AppsResponse>({
    endpoint: '/api/applications',
    params,
  })

  const { data: uniData } = usePortalData<UniResponse>({
    endpoint: '/api/universities',
    params: { limit: 100 },
  })

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1) }
  const clearFilters = () => {
    setSearch(''); setSearchInput(''); setStatus('all'); setUniversityId('all'); setPage(1)
  }

  const total = data?.pagination.total ?? 0
  const totalPages = data?.pagination.totalPages ?? 1
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const exportCsv = () => {
    if (!data?.applications || data.applications.length === 0) {
      toast.error('No data to export')
      return
    }
    const rows = [
      ['Application ID', 'Student', 'Email', 'University', 'Program', 'Level', 'Intake', 'Status', 'Submitted Date'],
      ...data.applications.map((a) => [
        a.applicationId,
        `${a.student.firstName} ${a.student.lastName}`,
        a.student.email,
        a.university.name,
        a.course?.name || '—',
        a.course?.level || '—',
        a.intake || '—',
        (statusMeta[a.status]?.label || a.status),
        new Date(a.createdAt).toLocaleDateString(),
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `applications-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${data.applications.length} applications to CSV`)
  }

  const stats = {
    total: total,
    offers: data?.applications?.filter((a) => ['conditional_offer', 'unconditional_offer'].includes(a.status)).length ?? 0,
    enrolled: data?.applications?.filter((a) => a.status === 'enrolled').length ?? 0,
    rejected: data?.applications?.filter((a) => ['visa_refused', 'rejected'].includes(a.status)).length ?? 0,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="Track all applications submitted on behalf of your students."
        action={
          <Button onClick={exportCsv} variant="outline">
            <Download className="h-4 w-4 mr-2" /> Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Applications" value={stats.total} icon={Send} accent="blue" />
        <StatCard label="Offers" value={stats.offers} icon={CheckCircle2} accent="green" />
        <StatCard label="Enrolled" value={stats.enrolled} icon={CheckCircle2} accent="purple" />
        <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accent="orange" />
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
              placeholder="Search by student, university, app ID…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={universityId} onValueChange={(v) => { setUniversityId(v); setPage(1) }}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All Universities" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {uniData?.universities?.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={applySearch} className="bg-[#0057B8] hover:bg-[#004a99] text-white border-0">
            <Filter className="h-4 w-4 mr-1" /> Apply
          </Button>
          {(search || status !== 'all' || universityId !== 'all') && (
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
                <th className="px-4 py-3 font-semibold">Application ID</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold">University</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Program</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Submitted</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.applications && data.applications.length > 0 ? (
                data.applications.map((a) => {
                  const meta = statusMeta[a.status] || { label: a.status, color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Clock }
                  const Icon = meta.icon
                  return (
                    <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-700">{a.applicationId}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{a.student.firstName} {a.student.lastName}</p>
                        <p className="text-xs text-slate-500">{a.student.studentId}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-900 font-medium">{a.university.name}</p>
                        <p className="text-xs text-slate-500">{a.university.country}</p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-slate-700">{a.course?.name || '—'}</p>
                        <p className="text-xs text-slate-500 capitalize">{a.course?.level || ''}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={'inline-flex items-center gap-1 ' + meta.color}>
                          <Icon className="h-3 w-3" /> {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-500 hidden lg:table-cell text-xs">
                        {new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href="/partner/students">
                            <Eye className="h-4 w-4 mr-1" /> View
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Send className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-1 font-medium">No applications yet</p>
                    <p className="text-xs text-slate-400 mb-4">
                      {search || status !== 'all' || universityId !== 'all'
                        ? 'Try adjusting your filters.'
                        : 'Once students submit applications, they will appear here.'}
                    </p>
                    <Button asChild variant="outline">
                      <Link href="/partner/register-student">Register a Student</Link>
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-slate-500">Showing {from}–{to} of {total} applications</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-xs text-slate-600 px-2">Page {page} of {Math.max(totalPages, 1)}</span>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
