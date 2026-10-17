'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Send, ArrowRight, Loader2, CheckCircle2, AlertCircle,
  Search, FileText, ChevronDown,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import { getSession } from '@/lib/session'
import { toast } from 'sonner'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'

// Mirror the server-side state machine
const TRANSITIONS: Record<string, string[]> = {
  draft: ['submitted', 'withdrawn', 'cancelled'],
  submitted: ['under_review', 'rejected', 'withdrawn', 'cancelled'],
  under_review: ['conditional_offer', 'unconditional_offer', 'rejected', 'withdrawn', 'cancelled'],
  conditional_offer: ['unconditional_offer', 'withdrawn', 'cancelled'],
  unconditional_offer: ['deposit_paid', 'withdrawn', 'cancelled'],
  deposit_paid: ['cas_received', 'withdrawn', 'cancelled'],
  cas_received: ['visa_applied', 'withdrawn', 'cancelled'],
  visa_applied: ['visa_approved', 'visa_refused', 'withdrawn', 'cancelled'],
  visa_approved: ['enrolled', 'withdrawn', 'cancelled'],
  visa_refused: ['withdrawn', 'cancelled'],
  rejected: ['withdrawn', 'cancelled'],
  enrolled: ['withdrawn', 'cancelled'],
  withdrawn: [],
  cancelled: [],
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', submitted: 'Submitted', under_review: 'Under Review',
  conditional_offer: 'Conditional Offer', unconditional_offer: 'Unconditional Offer',
  deposit_paid: 'Deposit Paid', cas_received: 'CAS Received',
  visa_applied: 'Visa Applied', visa_approved: 'Visa Approved',
  visa_refused: 'Visa Refused', enrolled: 'Enrolled',
  withdrawn: 'Withdrawn', rejected: 'Rejected', cancelled: 'Cancelled',
}

const ACTIONABLE_STATUSES = [
  'draft', 'submitted', 'under_review', 'conditional_offer',
  'unconditional_offer', 'deposit_paid', 'cas_received',
  'visa_applied', 'visa_approved',
]

interface ApplicationRow {
  id: string
  applicationId: string
  status: string
  source: string
  intake: string | null
  student: { firstName: string; lastName: string; studentId: string } | null
  university: { name: string; country: string | null } | null
  course: { name: string; level: string | null } | null
  partner: { companyName: string; partnerId: string } | null
}

export default function SubmissionQueuePage() {
  const [apps, setApps] = useState<ApplicationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const limit = 25

  const [transitionApp, setTransitionApp] = useState<ApplicationRow | null>(null)
  const [toStatus, setToStatus] = useState('')
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { setPage(1) }, [search, statusFilter])

  useEffect(() => {
    const session = getSession()
    if (!session) return
    setLoading(true)
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    })
    if (search) params.set('search', search)
    if (statusFilter) params.set('status', statusFilter)
    fetch(`/api/application-manager/applications?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session.token}` },
    })
      .then(async (r) => {
        const json = await r.json()
        if (!r.ok) throw new Error(json.error || `Request failed: ${r.status}`)
        setApps(json.applications || [])
        setTotal(json.pagination?.total || 0)
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false))
  }, [page, search, statusFilter])

  function openTransition(app: ApplicationRow) {
    setTransitionApp(app)
    const allowed = TRANSITIONS[app.status] || []
    setToStatus(allowed[0] || '')
    setNote('')
  }

  async function handleTransition() {
    const session = getSession()
    if (!session || !transitionApp || !toStatus) return

    // For terminal exits, note is required
    const isTerminal = toStatus === 'withdrawn' || toStatus === 'cancelled'
    if (isTerminal && !note.trim()) {
      toast.error('A reason note is required for withdrawn / cancelled transitions')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/application-manager/${transitionApp.id}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}` },
        body: JSON.stringify({ toStatus, note: note.trim() || null }),
      })
      const json = await res.json()
      if (!res.ok) {
        if (json.code === 'INVALID_TRANSITION') {
          toast.error(`Invalid transition: ${json.fromStatus} → ${json.attempted}. Allowed: ${json.allowed.join(', ')}`)
        } else if (json.code === 'NOTE_REQUIRED') {
          toast.error(json.error)
        } else {
          throw new Error(json.error || 'Transition failed')
        }
      } else {
        toast.success(`Status advanced: ${STATUS_LABELS[transitionApp.status]} → ${STATUS_LABELS[toStatus]}`)
        setTransitionApp(null)
        // Refresh list
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        })
        if (search) params.set('search', search)
        if (statusFilter) params.set('status', statusFilter)
        const refresh = await fetch(`/api/application-manager/applications?${params.toString()}`, {
          headers: { Authorization: `Bearer ${session.token}` },
        })
        const rj = await refresh.json()
        if (refresh.ok) {
          setApps(rj.applications || [])
          setTotal(rj.pagination?.total || 0)
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Transition failed')
    } finally {
      setSubmitting(false)
    }
  }

  const allowedTransitions = useMemo(() => {
    if (!transitionApp) return []
    return TRANSITIONS[transitionApp.status] || []
  }, [transitionApp])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Submission Queue"
        description="Advance application statuses through the pipeline. Status transitions are server-validated and audit-logged."
      />

      {/* Queue summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="In Queue" value={total} icon={Send} accent="orange" />
        <StatCard label="Ready to Submit" value={apps.filter((a) => a.status === 'draft').length} icon={FileText} accent="blue" />
        <StatCard label="Awaiting Review" value={apps.filter((a) => a.status === 'submitted').length} icon={FileText} accent="purple" />
        <StatCard label="Under Review" value={apps.filter((a) => a.status === 'under_review').length} icon={FileText} accent="amber" />
      </div>

      {/* Filters */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by ID, student, or university..."
                className="h-12 pl-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-12 px-3 rounded-md border border-slate-200 text-sm bg-white"
          >
            <option value="">All statuses</option>
            <option value="submitted">Submitted (awaiting review)</option>
            <option value="under_review">Under review</option>
            {ACTIONABLE_STATUSES.filter((s) => s !== 'submitted' && s !== 'under_review').map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Queue table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Applications Awaiting Action</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 rounded-lg bg-slate-100 animate-pulse" />)}
            </div>
          ) : apps.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Queue is empty. All actionable applications have been processed.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>University</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Current Status</TableHead>
                  <TableHead>Allowed Next</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((a) => {
                  const allowed = TRANSITIONS[a.status] || []
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.applicationId}</TableCell>
                      <TableCell>
                        <p className="font-medium text-slate-900">{a.student?.firstName} {a.student?.lastName}</p>
                        <p className="text-xs text-slate-500">{a.student?.studentId}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium truncate max-w-[160px]">{a.university?.name || '—'}</p>
                        <p className="text-xs text-slate-500">{a.university?.country}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{a.source}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="border-0 bg-slate-100 text-slate-700 capitalize text-xs">
                          {STATUS_LABELS[a.status] || a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {allowed.length === 0 ? (
                            <span className="text-xs text-slate-400 italic">terminal</span>
                          ) : (
                            allowed.slice(0, 3).map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px] capitalize">
                                {STATUS_LABELS[s] || s}
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {allowed.length === 0 ? (
                          <span className="text-xs text-slate-400">no-op</span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => openTransition(a)}
                            className="h-9 bg-[#E8501A] hover:bg-[#c8420f] text-white border-0"
                          >
                            <ArrowRight className="h-3.5 w-3.5 mr-1" /> Advance
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transition dialog */}
      <Dialog open={!!transitionApp} onOpenChange={(o) => !o && setTransitionApp(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-[#0057B8]" />
              Advance Application Status
            </DialogTitle>
          </DialogHeader>
          {transitionApp && (
            <div className="space-y-4">
              <Card className="p-4 border border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500">Application</p>
                <p className="font-mono text-sm font-semibold text-slate-900">{transitionApp.applicationId}</p>
                <p className="text-sm text-slate-700 mt-1">
                  {transitionApp.student?.firstName} {transitionApp.student?.lastName} • {transitionApp.university?.name}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-slate-500">Current:</span>
                  <Badge className="border-0 bg-slate-200 text-slate-700 capitalize">
                    {STATUS_LABELS[transitionApp.status] || transitionApp.status}
                  </Badge>
                </div>
              </Card>

              <div>
                <Label htmlFor="toStatus">New Status *</Label>
                <select
                  id="toStatus"
                  value={toStatus}
                  onChange={(e) => setToStatus(e.target.value)}
                  className="h-12 w-full mt-1 px-3 rounded-md border border-slate-200 text-sm bg-white"
                >
                  {allowedTransitions.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">
                  Allowed next statuses are enforced by the server-side state machine.
                </p>
              </div>

              <div>
                <Label htmlFor="note">
                  Note {(toStatus === 'withdrawn' || toStatus === 'cancelled') && <span className="text-red-500">*</span>}
                </Label>
                <Textarea
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder={
                    (toStatus === 'withdrawn' || toStatus === 'cancelled')
                      ? 'Reason is required for withdrawn / cancelled transitions'
                      : 'Optional context for this status change (visible in audit log + history)'
                  }
                  className="mt-1"
                />
              </div>

              {(toStatus === 'withdrawn' || toStatus === 'cancelled') && !note.trim() && (
                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-2 rounded-md">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>A reason note is required for {toStatus} transitions.</span>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setTransitionApp(null)} className="h-12">Cancel</Button>
                <Button
                  onClick={handleTransition}
                  disabled={submitting || !toStatus || ((toStatus === 'withdrawn' || toStatus === 'cancelled') && !note.trim())}
                  className="h-12 bg-[#0057B8] hover:bg-[#004a9c] text-white"
                >
                  {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Advance to {toStatus ? STATUS_LABELS[toStatus] : '...'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
