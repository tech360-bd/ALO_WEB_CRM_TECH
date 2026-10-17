'use client'

import { useEffect, useState } from 'react'
import {
  Search,
  Download,
  Plus,
  ChevronLeft,
  ChevronRight,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Eye,
  MoreHorizontal,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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

interface AppStudent {
  id: string
  firstName: string
  lastName: string
  studentId: string
  email?: string
  phone?: string
}
interface AppUniversity {
  id: string
  name: string
  country?: string
  city?: string
}
interface AppCourse {
  id: string
  name: string
  level?: string
  tuitionFee?: number
}
interface AppPartner {
  id: string
  companyName: string
  partnerId: string
}
interface AppCounselor {
  id: string
  firstName: string
  lastName: string
  employeeId?: string
}
interface Application {
  id: string
  applicationId: string
  status: string
  intake: string | null
  applicationDate: string
  offerDate: string | null
  casDate: string | null
  notes: string | null
  createdAt: string
  student: AppStudent
  university: AppUniversity
  course?: AppCourse | null
  partner?: AppPartner | null
  counselor?: AppCounselor | null
}

interface AppsResponse {
  applications: Application[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  submitted: 'bg-blue-50 text-[#0057B8] border-blue-100',
  under_review: 'bg-amber-50 text-amber-600 border-amber-100',
  conditional_offer: 'bg-purple-50 text-purple-600 border-purple-100',
  unconditional_offer: 'bg-green-50 text-green-600 border-green-100',
  deposit_paid: 'bg-cyan-50 text-cyan-600 border-cyan-100',
  cas_received: 'bg-teal-50 text-teal-600 border-teal-100',
  visa_applied: 'bg-orange-50 text-[#E8501A] border-orange-100',
  visa_approved: 'bg-green-50 text-green-700 border-green-100',
  visa_refused: 'bg-red-50 text-red-600 border-red-100',
  enrolled: 'bg-green-100 text-green-700 border-green-200',
  withdrawn: 'bg-slate-100 text-slate-500 border-slate-200',
  rejected: 'bg-red-50 text-red-600 border-red-100',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
}

function exportCsv(apps: Application[]) {
  const headers = ['Application ID', 'Status', 'First Name', 'Last Name', 'Create Date', 'Submit Date', 'Intake', 'Institution', 'Country', 'Program', 'Logged By', 'Partner']
  const rows = apps.map((a) => [
    a.applicationId, a.status, a.student.firstName, a.student.lastName,
    new Date(a.createdAt).toISOString(), new Date(a.applicationDate).toISOString(),
    a.intake || '', a.university.name, a.university.country || '',
    a.course?.name || '', a.counselor ? `${a.counselor.firstName} ${a.counselor.lastName}` : '',
    a.partner?.companyName || '',
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `applications-${Date.now()}.csv`; a.click()
  URL.revokeObjectURL(url)
  toast.success(`${apps.length} applications exported`)
}

export default function CrmApplicationsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterUniversity, setFilterUniversity] = useState('')
  const [filterIntake, setFilterIntake] = useState('')
  const [filterPartner, setFilterPartner] = useState('')
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

  const { data, loading } = usePortalData<AppsResponse>({
    endpoint: '/api/applications',
    params,
  })

  const apps = data?.applications ?? []
  const pagination = data?.pagination

  // Client-side filters for university/intake/partner (API supports them but for simplicity client-filter too)
  const filteredApps = apps.filter((a) => {
    if (filterUniversity && filterUniversity !== 'all' && a.university.id !== filterUniversity) return false
    if (filterIntake && filterIntake !== 'all' && a.intake !== filterIntake) return false
    if (filterPartner && filterPartner !== 'all' && a.partner?.id !== filterPartner) return false
    return true
  })

  const universityOptions = Array.from(new Map(apps.map((a) => [a.university.id, a.university]).reverse()).values())
  const intakeOptions = Array.from(new Set(apps.map((a) => a.intake).filter(Boolean) as string[]))
  const partnerOptions = Array.from(new Map(apps.filter((a) => a.partner).map((a) => [a.partner!.id, a.partner!]).reverse()).values())

  const stats = {
    total: pagination?.total ?? 0,
    inProgress: apps.filter((a) => ['submitted', 'under_review', 'conditional_offer', 'unconditional_offer', 'deposit_paid', 'cas_received', 'visa_applied'].includes(a.status)).length,
    offers: apps.filter((a) => ['conditional_offer', 'unconditional_offer'].includes(a.status)).length,
    enrolled: apps.filter((a) => a.status === 'enrolled').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Applications"
        description="MSM-style application list with full lifecycle tracking, filters, and export."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => exportCsv(filteredApps)}>
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
            <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => toast.info('New application form')}>
              <Plus className="h-4 w-4 mr-2" /> New Application
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Applications" value={stats.total} icon={Send} accent="blue" />
        <StatCard label="In Progress" value={stats.inProgress} icon={Clock} accent="amber" />
        <StatCard label="Offers" value={stats.offers} icon={CheckCircle2} accent="purple" />
        <StatCard label="Enrolled" value={stats.enrolled} icon={CheckCircle2} accent="green" />
      </div>

      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by ID, student, university..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setPage(1) }}>
            <SelectTrigger className="w-[170px] h-10"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="submitted">Submitted</SelectItem>
              <SelectItem value="under_review">Under Review</SelectItem>
              <SelectItem value="conditional_offer">Conditional Offer</SelectItem>
              <SelectItem value="unconditional_offer">Unconditional Offer</SelectItem>
              <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
              <SelectItem value="cas_received">CAS Received</SelectItem>
              <SelectItem value="visa_applied">Visa Applied</SelectItem>
              <SelectItem value="visa_approved">Visa Approved</SelectItem>
              <SelectItem value="visa_refused">Visa Refused</SelectItem>
              <SelectItem value="enrolled">Enrolled</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterUniversity} onValueChange={setFilterUniversity}>
            <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="Institution" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All institutions</SelectItem>
              {universityOptions.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterIntake} onValueChange={setFilterIntake}>
            <SelectTrigger className="w-[140px] h-10"><SelectValue placeholder="Intake" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All intakes</SelectItem>
              {intakeOptions.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterPartner} onValueChange={setFilterPartner}>
            <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="Partner" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All partners</SelectItem>
              {partnerOptions.map((p) => <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4,5].map((i) => <div key={i} className="h-14 rounded bg-slate-100 animate-pulse" />)}</div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Send className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No applications found</h3>
            <p className="text-sm text-slate-500 mb-5">Create your first application to get started.</p>
            <Button className="bg-[#0057B8] hover:bg-[#00449a] text-white" onClick={() => toast.info('New application form')}>
              <Plus className="h-4 w-4 mr-2" /> New Application
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Application ID</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Review Status</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">App Status</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Create Date</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Submit Date</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Intake</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Institution</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Program</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Logged By</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Documents</th>
                  <th className="p-3 text-right font-semibold text-slate-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((a) => {
                  const docStatus = a.status === 'submitted' || a.status === 'under_review' ? 'Verified' : a.status === 'draft' ? 'Pending' : 'Complete'
                  return (
                    <tr key={a.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                      <td className="p-3"><span className="font-semibold text-[#0057B8]">{a.applicationId}</span></td>
                      <td className="p-3">
                        <Badge className="bg-slate-100 text-slate-600 border-0 text-xs">Reviewed</Badge>
                      </td>
                      <td className="p-3">
                        <Badge className={cn('border capitalize text-xs', statusColors[a.status] || 'bg-slate-100 text-slate-600 border-slate-200')}>
                          {a.status.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <p className="font-medium text-slate-900">{a.student.firstName} {a.student.lastName}</p>
                        <p className="text-xs text-slate-400">{a.student.studentId}</p>
                      </td>
                      <td className="p-3 text-xs text-slate-600">{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td className="p-3 text-xs text-slate-600">{new Date(a.applicationDate).toLocaleDateString()}</td>
                      <td className="p-3 text-xs text-slate-700">{a.intake || '—'}</td>
                      <td className="p-3">
                        <p className="text-xs font-medium text-slate-900">{a.university.name}</p>
                        <p className="text-xs text-slate-400">{a.university.country}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-xs text-slate-700">{a.course?.name || '—'}</p>
                        {a.course?.level && <p className="text-xs text-slate-400 capitalize">{a.course.level}</p>}
                      </td>
                      <td className="p-3 text-xs text-slate-700">
                        {a.counselor ? `${a.counselor.firstName} ${a.counselor.lastName[0]}.` : <span className="text-slate-400">—</span>}
                        {a.partner && <p className="text-[10px] text-slate-400">{a.partner.companyName}</p>}
                      </td>
                      <td className="p-3">
                        <Badge className={cn('border-0 text-xs', docStatus === 'Verified' ? 'bg-green-50 text-green-600' : docStatus === 'Complete' ? 'bg-blue-50 text-[#0057B8]' : 'bg-amber-50 text-amber-600')}>
                          {docStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => toast.info(`View application ${a.applicationId}`)}><Eye className="h-4 w-4 mr-2" /> View Details</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Edit application')}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Change status')}>Change Status</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Add note')}>Add Note</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info('Download docs')}><FileText className="h-4 w-4 mr-2" /> Documents</DropdownMenuItem>
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

      {!loading && filteredApps.length > 0 && pagination && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{(pagination.page - 1) * pagination.limit + 1}</span> –{' '}
            <span className="font-semibold text-slate-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{' '}
            <span className="font-semibold text-slate-700">{pagination.total}</span> applications
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
