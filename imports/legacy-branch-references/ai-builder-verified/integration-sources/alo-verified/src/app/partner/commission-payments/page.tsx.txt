'use client'

import { useState, useMemo } from 'react'
import {
  FileSpreadsheet, Search, ChevronLeft, ChevronRight, Filter, X,
  CheckCircle2, Clock, DollarSign, Loader2,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'

interface CommissionRow {
  id: string
  commissionId: string
  amount: number
  currency: string
  status: string
  triggerStage: string
  requestedAt: string | null
  approvedAt: string | null
  paidAt: string | null
  createdAt: string
  application: {
    id: string
    applicationId: string
    student: { firstName: string; lastName: string; studentId: string }
    university: { name: string }
  } | null
}

interface CommissionResponse {
  commissions: CommissionRow[]
  summary: { totalAmount: number; pendingAmount: number; paidAmount: number }
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'eligible', label: 'Eligible' },
  { value: 'requested', label: 'Requested' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'disputed', label: 'Disputed' },
  { value: 'not_requested', label: 'Not Requested' },
]

const statusColor: Record<string, string> = {
  paid: 'bg-green-50 text-green-700 border-green-200',
  approved: 'bg-[#EFF6FF] text-[#0057B8] border-blue-200',
  requested: 'bg-amber-50 text-amber-700 border-amber-200',
  under_review: 'bg-amber-50 text-amber-700 border-amber-200',
  eligible: 'bg-purple-50 text-purple-700 border-purple-200',
  not_requested: 'bg-slate-100 text-slate-600 border-slate-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
  disputed: 'bg-red-50 text-red-700 border-red-200',
}

export default function CommissionPaymentsPage() {
  const session = getSession()
  const partnerId = session?.user.referenceId

  const [status, setStatus] = useState('all')
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
    }),
    [partnerId, page, search, status]
  )

  const { data, loading } = usePortalData<CommissionResponse>({
    endpoint: '/api/commissions',
    params,
  })

  // Refresh trigger
  const [refreshKey, setRefreshKey] = useState(0)
  void refreshKey

  const [claimDialog, setClaimDialog] = useState<CommissionRow | null>(null)
  const [claimNote, setClaimNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const applySearch = () => { setSearch(searchInput.trim()); setPage(1) }
  const clearFilters = () => { setSearch(''); setSearchInput(''); setStatus('all'); setPage(1) }

  const commissions = data?.commissions ?? []
  const total = data?.pagination?.total ?? commissions.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const from = total === 0 ? 0 : (page - 1) * limit + 1
  const to = Math.min(page * limit, total)

  const submitClaim = async () => {
    if (!claimDialog) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/commissions', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.token}`,
        },
        body: JSON.stringify({
          id: claimDialog.id,
          status: 'requested',
          note: claimNote || 'Claim submitted by partner',
        }),
      })
      if (!res.ok) throw new Error('Failed to submit claim')
      toast.success(`Claim ${claimDialog.commissionId} submitted for review`)
      setClaimDialog(null)
      setClaimNote('')
      setRefreshKey((k) => k + 1)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  const stats = {
    eligible: commissions.filter((c) => c.status === 'eligible').length,
    requested: commissions.filter((c) => c.status === 'requested').length,
    approved: commissions.filter((c) => c.status === 'approved').length,
    paid: commissions.filter((c) => c.status === 'paid').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Payments"
        description="Track and request commission payouts for your students' enrollments."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Eligible" value={stats.eligible} icon={Clock} accent="purple" />
        <StatCard label="Requested" value={stats.requested} icon={Clock} accent="amber" />
        <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} accent="blue" />
        <StatCard label="Paid" value={stats.paid} icon={DollarSign} accent="green" />
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
              placeholder="Search by claim ID, university…"
              className="pl-9"
            />
          </div>
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={applySearch} className="bg-[#0057B8] hover:bg-[#004a99] text-white border-0">
            <Filter className="h-4 w-4 mr-1" /> Apply
          </Button>
          {(search || status !== 'all') && (
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
                <th className="px-4 py-3 font-semibold">Claim ID</th>
                <th className="px-4 py-3 font-semibold">Student</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">University</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Requested</th>
                <th className="px-4 py-3 font-semibold hidden lg:table-cell">Paid</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded bg-slate-100 animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : commissions.length > 0 ? (
                commissions.map((c) => (
                  <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.commissionId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">
                        {c.application?.student ? `${c.application.student.firstName} ${c.application.student.lastName}` : '—'}
                      </p>
                      <p className="text-xs text-slate-500">{c.application?.student.studentId || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">{c.application?.university.name || '—'}</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {c.amount.toLocaleString()} <span className="text-xs text-slate-500">{c.currency}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className={'capitalize ' + (statusColor[c.status] || statusColor.not_requested)}>
                        {c.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {c.requestedAt ? new Date(c.requestedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">
                      {c.paidAt ? new Date(c.paidAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(c.status === 'eligible' || c.status === 'not_requested') ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setClaimDialog(c); setClaimNote('') }}
                          className="border-[#0057B8] text-[#0057B8] hover:bg-[#EFF6FF]"
                        >
                          Request Payout
                        </Button>
                      ) : c.status === 'paid' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle2 className="h-3 w-3 mr-1" /> Settled
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">In review</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <FileSpreadsheet className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-1 font-medium">No commission claims yet</p>
                    <p className="text-xs text-slate-400">
                      {search || status !== 'all' ? 'Try adjusting your filters.' : 'Commission records appear here as your students progress.'}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-slate-500">Showing {from}–{to} of {total} claims</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <span className="text-xs text-slate-600 px-2">Page {page} of {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Claim dialog */}
      <Dialog open={!!claimDialog} onOpenChange={(open) => !open && setClaimDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Commission Payout</DialogTitle>
            <DialogDescription>
              Submit a payout request for claim <span className="font-mono font-semibold">{claimDialog?.commissionId}</span>.
            </DialogDescription>
          </DialogHeader>
          {claimDialog && (
            <div className="space-y-3 py-2">
              <div className="p-3 rounded-lg bg-slate-50 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Student</span>
                  <span className="font-semibold">
                    {claimDialog.application?.student.firstName} {claimDialog.application?.student.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">University</span>
                  <span className="font-semibold">{claimDialog.application?.university.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount</span>
                  <span className="font-bold text-[#0057B8]">{claimDialog.amount.toLocaleString()} {claimDialog.currency}</span>
                </div>
              </div>
              <div>
                <Label>Note (optional)</Label>
                <Textarea
                  value={claimNote}
                  onChange={(e) => setClaimNote(e.target.value)}
                  placeholder="Add any reference or context for the finance team…"
                  rows={3}
                  className="mt-1"
                />
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                <p className="text-xs text-amber-700">Once submitted, the finance team will review within 5 business days.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialog(null)}>Cancel</Button>
            <Button
              onClick={submitClaim}
              disabled={submitting}
              className="bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting…</>
              ) : (
                'Submit Claim'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
