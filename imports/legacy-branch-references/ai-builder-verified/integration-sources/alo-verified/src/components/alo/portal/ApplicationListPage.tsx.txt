'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search, ChevronLeft, ChevronRight, FileText, Building2,
  Send, ArrowRight, Lock, AlertCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'

type SourceFilter = 'DIRECT' | 'PARTNER' | 'B2B'

interface ApplicationRow {
  id: string
  applicationId: string
  status: string
  source: string
  intake: string | null
  createdAt: string
  student: { id: string; firstName: string; lastName: string; studentId: string; email: string | null } | null
  university: { id: string; name: string; country: string | null; city: string | null } | null
  course: { id: string; name: string; level: string | null; tuitionFee: number | null } | null
  partner: { id: string; companyName: string; partnerId: string } | null
  counselor: { id: string; firstName: string; lastName: string; employeeId: string } | null
}

interface AppsResponse {
  applications: ApplicationRow[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
  conditional_offer: 'Conditional Offer', unconditional_offer: 'Unconditional Offer',
  deposit_paid: 'Deposit Paid', cas_received: 'CAS Received',
  visa_applied: 'Visa Applied', visa_approved: 'Visa Approved',
  visa_refused: 'Visa Refused', enrolled: 'Enrolled',
  withdrawn: 'Withdrawn', rejected: 'Rejected', cancelled: 'Cancelled',
}

interface ApplicationListPageProps {
  source: SourceFilter
  title: string
  description: string
  accentColor: string
  icon: 'send' | 'fileText' | 'building2'
  confidential?: boolean
}

export function ApplicationListPage({
  source, title, description, accentColor, icon, confidential,
}: ApplicationListPageProps) {
  const [data, setData] = useState<AppsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const limit = 25

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleStatusChange(value: string) {
    setStatusFilter(value)
    setPage(1)
  }

  useEffect(() => {
    const session = getSession()
    if (!session) return
    let cancelled = false

    // Defer state updates to avoid synchronous setState in effect body.
    // Set loading=true, fetch, then setLoading(false) — all inside the async chain.
    const fetchData = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          source,
          page: String(page),
          limit: String(limit),
        })
        if (search) params.set('search', search)
        if (statusFilter) params.set('status', statusFilter)

        const res = await fetch(`/api/application-manager/applications?${params.toString()}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        const json = await res.json()
        if (!res.ok) {
          throw new Error(json.error || `Request failed: ${res.status}`)
        }
        if (!cancelled) {
          setData(json)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Fetch failed')
          toast.error(e instanceof Error ? e.message : 'Fetch failed')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [source, page, search, statusFilter])

  const Icon = icon === 'send' ? Send : icon === 'fileText' ? FileText : Building2

  const totalPages = data?.pagination.totalPages ?? 1
  const total = data?.pagination.total ?? 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        action={
          confidential ? (
            <Badge className="bg-amber-50 text-amber-700 border border-amber-200">
              <Lock className="h-3 w-3 mr-1" /> Confidential
            </Badge>
          ) : null
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total" value={total} icon={Icon} accent={accentColor as 'blue' | 'orange' | 'purple'} />
        <StatCard label="In Review" value={data?.applications.filter((a) => a.status === 'under_review').length ?? 0} icon={FileText} accent="blue" />
        <StatCard label="Offers" value={data?.applications.filter((a) => ['conditional_offer', 'unconditional_offer'].includes(a.status)).length ?? 0} icon={ArrowRight} accent="green" />
        <StatCard label="Enrolled" value={data?.applications.filter((a) => a.status === 'enrolled').length ?? 0} icon={ArrowRight} accent="purple" />
      </div>

      {confidential && (
        <Card className="p-4 border-0 shadow-sm bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Confidential — B2B applications</p>
              <p className="text-xs text-slate-600 mt-1">
                B2B partner relationships are commercially sensitive. Student names are masked for non-application_manager viewers.
                Status transitions are restricted to application_manager, admin, and super_admin roles.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search by ID, student, or university..."
                className="h-12 pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-12 px-3 rounded-md border border-slate-200 text-sm bg-white"
          >
            <option value="">All statuses</option>
            {Object.keys(STATUS_LABELS).map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-sm text-red-600">{error}</div>
          ) : data?.applications.length === 0 ? (
            <div className="text-center py-12">
              <Icon className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No applications match the current filters.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Course</TableHead>
                  {source !== 'DIRECT' && <TableHead>Partner</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.applications.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.applicationId}</TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900">{a.student?.firstName} {a.student?.lastName}</p>
                      <p className="text-xs text-slate-500">{a.student?.studentId}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-900 truncate max-w-[180px]">{a.university?.name}</p>
                      <p className="text-xs text-slate-500">{a.university?.country}{a.university?.city ? `, ${a.university.city}` : ''}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium text-slate-900 truncate max-w-[180px]">{a.course?.name || '—'}</p>
                      <p className="text-xs text-slate-500">{a.course?.level || ''}</p>
                    </TableCell>
                    {source !== 'DIRECT' && (
                      <TableCell>
                        {a.partner ? (
                          <>
                            <p className="text-sm font-medium text-slate-900 truncate max-w-[140px]">{a.partner.companyName}</p>
                            <p className="text-xs text-slate-500">{a.partner.partnerId}</p>
                          </>
                        ) : <span className="text-xs text-slate-400">—</span>}
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-xs">
                        {STATUS_LABELS[a.status] || a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild size="sm" variant="outline" className="h-9">
                        <Link href={`/application-manager/submission-queue?id=${a.id}`}>
                          <ArrowRight className="h-3.5 w-3.5" /> Advance
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-500">
            Page {page} of {totalPages} — {total} applications
          </p>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-9">
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-9">
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
