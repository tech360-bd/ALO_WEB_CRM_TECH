'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plane, FileCheck, AlertTriangle, CalendarClock, FileText,
  CheckCircle2, Clock, XCircle, ShieldCheck, Send, Stethoscope,
  RefreshCw, Eye, ChevronDown, Search, Loader2, FileWarning,
  ListChecks, UserCog, Flag, StickyNote,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface VisaChecklistItem {
  id: string
  itemName: string
  isRequired: boolean
  isCompleted: boolean
  note: string | null
}

interface VisaOfficerRef {
  id: string
  firstName: string
  lastName: string
  employeeId: string
}

interface StudentRef {
  id: string
  firstName: string
  lastName: string
  studentId: string
  nationality: string | null
}

interface VisaFile {
  id: string
  studentId: string
  applicationId: string | null
  assignedTo: string | null
  stage: string
  casNumber: string | null
  casDate: string | null
  visaAppointmentDate: string | null
  biometricsDate: string | null
  visaDecisionDate: string | null
  visaDecision: string | null
  refusalReason: string | null
  notes: string | null
  status: string
  createdAt: string
  updatedAt: string
  student: StudentRef
  visaOfficer: VisaOfficerRef | null
  checklist: VisaChecklistItem[]
}

interface VisaData {
  visaFiles: VisaFile[]
  stageDistribution: Array<{ stage: string; count: number }>
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

interface ReadinessItem {
  key: string
  label: string
  weight: number
  status: 'completed' | 'pending' | 'under_review' | 'rejected' | 'needs_correction'
  note?: string
}

interface ReadinessResponse {
  items: ReadinessItem[]
  score: number
  visaFile?: VisaFile
  timeline?: Array<unknown>
}

interface FinancialProofResponse {
  review?: {
    id: string
    bankStatementStatus: string
    bankSolvencyStatus: string
    sponsorLetterStatus: string
    affidavitStatus: string
    taxDocumentStatus: string
    incomeSourceStatus: string
    depositReceiptStatus: string
    fundsMaturityNote: string | null
    reviewerNote: string | null
    riskFlag: string
    finalFinanceStatus: string
  }
}

// ---------------------------------------------------------------------------
// 22-stage definitions (exact labels per spec; snake_case ids for storage)
// ---------------------------------------------------------------------------
const STAGES: Array<{ id: string; label: string; phase: string }> = [
  { id: 'not_started',            label: 'Not Started',              phase: 'initial' },
  { id: 'profile_review',         label: 'Profile Review',           phase: 'initial' },
  { id: 'documents_required',     label: 'Documents Required',       phase: 'documents' },
  { id: 'documents_under_review', label: 'Documents Under Review',   phase: 'documents' },
  { id: 'application_submitted',  label: 'Application Submitted',    phase: 'application' },
  { id: 'offer_received',         label: 'Offer Received',           phase: 'application' },
  { id: 'deposit_pending',        label: 'Deposit Pending',          phase: 'application' },
  { id: 'deposit_paid',           label: 'Deposit Paid',             phase: 'application' },
  { id: 'cas_pending',            label: 'CAS/I-20/COE Pending',     phase: 'cas' },
  { id: 'cas_received',           label: 'CAS/I-20/COE Received',    phase: 'cas' },
  { id: 'financial_proof_pending', label: 'Financial Proof Pending', phase: 'finance' },
  { id: 'visa_file_preparing',    label: 'Visa File Preparing',      phase: 'visa' },
  { id: 'visa_file_ready',        label: 'Visa File Ready',          phase: 'visa' },
  { id: 'visa_submitted',         label: 'Visa Submitted',           phase: 'visa' },
  { id: 'biometrics_scheduled',   label: 'Biometrics Scheduled',     phase: 'visa' },
  { id: 'interview_scheduled',    label: 'Interview Scheduled',      phase: 'visa' },
  { id: 'decision_pending',       label: 'Decision Pending',         phase: 'decision' },
  { id: 'visa_approved',          label: 'Visa Approved',            phase: 'decision' },
  { id: 'visa_rejected',          label: 'Visa Rejected',            phase: 'decision' },
  { id: 'deferred',               label: 'Deferred',                 phase: 'decision' },
  { id: 'pre_departure',          label: 'Pre-Departure',            phase: 'post' },
  { id: 'enrolled',               label: 'Enrolled',                 phase: 'post' },
]

const STAGE_LABEL: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.id, s.label]))

const PHASE_COLOR: Record<string, string> = {
  initial:    'bg-slate-100 text-slate-700 border-slate-200',
  documents:  'bg-amber-50 text-amber-700 border-amber-200',
  application:'bg-sky-50 text-sky-700 border-sky-200',
  cas:        'bg-cyan-50 text-cyan-700 border-cyan-200',
  finance:    'bg-orange-50 text-orange-700 border-orange-200',
  visa:       'bg-[#EFF6FF] text-[#0057B8] border-blue-200',
  decision:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  post:       'bg-purple-50 text-purple-700 border-purple-200',
}

function stageBadgeClass(stage: string): string {
  const meta = STAGES.find((s) => s.id === stage)
  return meta ? PHASE_COLOR[meta.phase] : 'bg-slate-100 text-slate-600 border-slate-200'
}

function stageLabel(stage: string): string {
  return STAGE_LABEL[stage] || stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function formatDateTime(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch {
    return '—'
  }
}

function isThisMonth(d: string | null | undefined): boolean {
  if (!d) return false
  const date = new Date(d)
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function VisaFilesPage() {
  const session = getSession()

  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [officerFilter, setOfficerFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const limit = 20

  const [detailId, setDetailId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const params = useMemo(
    () => ({
      page,
      limit,
      stage: stageFilter === 'all' ? '' : stageFilter,
      status: statusFilter === 'all' ? '' : statusFilter,
      assignedTo: officerFilter === 'all' ? '' : officerFilter,
    }),
    [page, limit, stageFilter, statusFilter, officerFilter],
  )

  const { data, loading, error } = usePortalData<VisaData>({
    endpoint: '/api/visa',
    params,
  })

  // Build list of unique visa officers from current page of files
  const officers = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    data?.visaFiles?.forEach((f) => {
      if (f.visaOfficer) {
        map.set(f.visaOfficer.id, {
          id: f.visaOfficer.id,
          name: `${f.visaOfficer.firstName} ${f.visaOfficer.lastName}`,
        })
      }
    })
    return Array.from(map.values())
  }, [data])

  // Filter by search on client side (student name / studentId)
  const filteredFiles = useMemo(() => {
    const all = data?.visaFiles ?? []
    if (!search.trim()) return all
    const q = search.trim().toLowerCase()
    return all.filter((f) => {
      const fullName = `${f.student?.firstName ?? ''} ${f.student?.lastName ?? ''}`.toLowerCase()
      const studentId = (f.student?.studentId ?? '').toLowerCase()
      const cas = (f.casNumber ?? '').toLowerCase()
      return fullName.includes(q) || studentId.includes(q) || cas.includes(q)
    })
  }, [data, search])

  // Stats derived from current page
  const stats = useMemo(() => {
    const all = data?.visaFiles ?? []
    const pendingDocs = all.filter((f) =>
      ['documents_required', 'documents_under_review', 'profile_review'].includes(f.stage),
    ).length
    const financialPending = all.filter((f) =>
      ['financial_proof_pending', 'documents_required'].includes(f.stage),
    ).length
    const interviewPending = all.filter((f) =>
      ['interview_scheduled'].includes(f.stage),
    ).length
    const casPending = all.filter((f) =>
      ['cas_pending'].includes(f.stage),
    ).length
    const visaFileReady = all.filter((f) => f.stage === 'visa_file_ready').length
    const visaSubmitted = all.filter((f) =>
      ['visa_submitted', 'biometrics_scheduled', 'interview_scheduled', 'decision_pending'].includes(f.stage),
    ).length
    const decisionPending = all.filter((f) => f.stage === 'decision_pending').length
    const approvedThisMonth = all.filter(
      (f) => f.stage === 'visa_approved' && isThisMonth(f.visaDecisionDate || f.updatedAt),
    ).length
    const rejectedThisMonth = all.filter(
      (f) => f.stage === 'visa_rejected' && isThisMonth(f.visaDecisionDate || f.updatedAt),
    ).length
    const preDeparture = all.filter((f) => f.stage === 'pre_departure').length
    return {
      pendingDocs,
      financialPending,
      interviewPending,
      casPending,
      visaFileReady,
      visaSubmitted,
      decisionPending,
      approvedThisMonth,
      rejectedThisMonth,
      preDeparture,
    }
  }, [data])

  // ------------------------------------------------------------------
  // Stage update (PUT — show toast if endpoint not implemented)
  // ------------------------------------------------------------------
  async function updateStage(file: VisaFile, nextStage: string) {
    const sessionToken = session?.token
    try {
      const res = await fetch('/api/visa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        },
        body: JSON.stringify({ id: file.id, stage: nextStage }),
      })
      if (res.status === 405) {
        toast.error('Stage update endpoint pending', {
          description: 'PUT /api/visa is not implemented yet. The dropdown UI is ready.',
        })
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Request failed: ${res.status}`)
      }
      toast.success(`Stage updated to "${stageLabel(nextStage)}"`, {
        description: `${file.student?.firstName} ${file.student?.lastName} • ${file.student?.studentId}`,
      })
      setRefreshKey((k) => k + 1)
    } catch (e) {
      toast.error('Stage update endpoint pending', {
        description: e instanceof Error ? e.message : 'PUT /api/visa not yet available.',
      })
    }
  }

  // ------------------------------------------------------------------
  // Action handlers (mark ready, submit, etc.)
  // ------------------------------------------------------------------
  function handleAction(file: VisaFile, stage: string, label: string) {
    updateStage(file, stage)
    toast.info(label, {
      description: `Moving ${file.student?.firstName} ${file.student?.lastName} → ${stageLabel(stage)}`,
    })
  }

  function placeholderAction(label: string) {
    toast.info(`${label} (placeholder)`, {
      description: 'This action will be wired to its dedicated endpoint in a follow-up.',
    })
  }

  // Refresh data when refreshKey changes
  useEffect(() => {
    if (refreshKey === 0) return
    setPage((p) => p)
  }, [refreshKey])

  const pagination = data?.pagination
  const totalPages = pagination?.totalPages ?? 1

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visa Files — Visa Officer Module"
        description="Manage all visa files across stages: from document collection to pre-departure. Review readiness, financial proof, and decisions."
        action={
          <Button
            variant="outline"
            className="h-12"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
        }
      />

      {/* ---------------- Stats Row (10 StatCards) ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Visa Files Pending"
          value={stats.pendingDocs}
          icon={FileText}
          accent="amber"
          hint="Document collection / review"
        />
        <StatCard
          label="Financial Proof Pending"
          value={stats.financialPending}
          icon={AlertTriangle}
          accent="orange"
          hint="Awaiting finance review"
        />
        <StatCard
          label="Interview Pending"
          value={stats.interviewPending}
          icon={UserCog}
          accent="purple"
          hint="UKVI / mock interviews"
        />
        <StatCard
          label="CAS/I-20/COE Pending"
          value={stats.casPending}
          icon={FileCheck}
          accent="blue"
          hint="Awaiting issue"
        />
        <StatCard
          label="Visa File Ready"
          value={stats.visaFileReady}
          icon={CheckCircle2}
          accent="green"
          hint="Ready to submit"
        />
        <StatCard
          label="Visa Submitted"
          value={stats.visaSubmitted}
          icon={Send}
          accent="blue"
          hint="In progress at embassy"
        />
        <StatCard
          label="Decision Pending"
          value={stats.decisionPending}
          icon={CalendarClock}
          accent="amber"
          hint="Awaiting decision"
        />
        <StatCard
          label="Visa Approved (This Month)"
          value={stats.approvedThisMonth}
          icon={ShieldCheck}
          accent="green"
          hint="Successful decisions"
        />
        <StatCard
          label="Visa Rejected (This Month)"
          value={stats.rejectedThisMonth}
          icon={XCircle}
          accent="orange"
          hint="Refusals to review"
        />
        <StatCard
          label="Pre-Departure Pending"
          value={stats.preDeparture}
          icon={Plane}
          accent="purple"
          hint="Pre-departure checklist"
        />
      </div>

      {/* ---------------- Filters Bar ---------------- */}
      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search student name, ID, or CAS number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={stageFilter} onValueChange={(v) => { setStageFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[200px] h-10"><SelectValue placeholder="All Stages" /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">All Stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={officerFilter} onValueChange={(v) => { setOfficerFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="All Officers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Visa Officers</SelectItem>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {officers.map((o) => (
                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
            <SelectTrigger className="w-[140px] h-10"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* ---------------- Main Table ---------------- */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <FileWarning className="h-12 w-12 mx-auto mb-3 text-red-400" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Plane className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No visa files found</h3>
            <p className="text-sm text-slate-500">
              {search || stageFilter !== 'all' || officerFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Visa files will appear here as students progress through the application pipeline.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto alo-scrollbar">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Stage</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden md:table-cell">CAS / I-20 / COE #</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden lg:table-cell">Visa Officer</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Readiness</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden md:table-cell">Fin. Risk</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden lg:table-cell">Last Updated</th>
                  <th className="p-3 text-right font-semibold text-slate-600 whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFiles.map((file) => (
                  <tr
                    key={file.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors"
                    onClick={() => setDetailId(file.id)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {(file.student?.firstName?.[0] || '?')}{(file.student?.lastName?.[0] || '')}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate">
                            {file.student?.firstName} {file.student?.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {file.student?.studentId} • {file.student?.nationality || '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className={cn('text-xs capitalize border', stageBadgeClass(file.stage))}>
                        {stageLabel(file.stage)}
                      </Badge>
                    </td>
                    <td className="p-3 hidden md:table-cell">
                      {file.casNumber ? (
                        <span className="font-mono text-xs text-slate-700">{file.casNumber}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 hidden lg:table-cell text-slate-700">
                      {file.visaOfficer
                        ? `${file.visaOfficer.firstName} ${file.visaOfficer.lastName}`
                        : <span className="text-xs text-slate-400">Unassigned</span>}
                    </td>
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <ReadinessMiniBadge studentId={file.studentId} />
                    </td>
                    <td className="p-3 hidden md:table-cell" onClick={(e) => e.stopPropagation()}>
                      <FinRiskMiniBadge studentId={file.studentId} />
                    </td>
                    <td className="p-3 hidden lg:table-cell text-xs text-slate-500">
                      {formatDateTime(file.updatedAt)}
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-9 w-9 p-0"
                          onClick={() => setDetailId(file.id)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9"
                              title="Update Stage"
                            >
                              Update Stage <ChevronDown className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto">
                            <DropdownMenuLabel>Move to Stage</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {STAGES.map((s) => (
                              <DropdownMenuItem
                                key={s.id}
                                disabled={s.id === file.stage}
                                onClick={() => updateStage(file, s.id)}
                                className={cn('cursor-pointer text-sm', s.id === file.stage && 'opacity-50')}
                              >
                                <span className="flex items-center gap-2">
                                  {s.id === file.stage && <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />}
                                  {s.label}
                                </span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} visa files
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-600 px-2">
                Page {page} of {Math.max(totalPages, 1)}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ---------------- Detail Sheet ---------------- */}
      <VisaFileDetailSheet
        visaFileId={detailId}
        visaFiles={data?.visaFiles ?? []}
        onClose={() => setDetailId(null)}
        onAction={handleAction}
        onPlaceholder={placeholderAction}
      />

      {/* ---------------- RBAC Note ---------------- */}
      <Card className="p-4 border-0 shadow-sm bg-[#F8FAFC]">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-[#0057B8]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-1">Visa Officer Access</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Visa Officers can review visa documents, approve readiness checklist, add risk notes,
              request corrected documents, schedule interview practice, mark visa file ready,
              update visa submission status, upload visa decision, start refusal review, and start
              pre-departure checklist.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Readiness mini badge — lazy fetch per student
// ---------------------------------------------------------------------------
function ReadinessMiniBadge({ studentId }: { studentId: string }) {
  const session = getSession()
  const [score, setScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/visa/readiness?studentId=${encodeURIComponent(studentId)}`, {
          headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
        })
        if (!res.ok) throw new Error('failed')
        const json: ReadinessResponse = await res.json()
        if (!cancelled) setScore(json.score ?? 0)
      } catch {
        if (!cancelled) setScore(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [studentId, session?.token])

  if (loading) {
    return <div className="h-5 w-10 rounded bg-slate-100 animate-pulse" />
  }
  if (score === null) {
    return <span className="text-xs text-slate-400">N/A</span>
  }
  const tone =
    score >= 75 ? 'text-green-700 bg-green-50'
    : score >= 50 ? 'text-amber-700 bg-amber-50'
    : 'text-red-600 bg-red-50'
  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', tone)}>{score}%</span>
      <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden hidden sm:block">
        <div
          className={cn(
            'h-full rounded-full',
            score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500',
          )}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Financial risk mini badge — lazy fetch per student
// ---------------------------------------------------------------------------
function FinRiskMiniBadge({ studentId }: { studentId: string }) {
  const session = getSession()
  const [risk, setRisk] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/visa/financial-proof?studentId=${encodeURIComponent(studentId)}`, {
          headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
        })
        if (!res.ok) throw new Error('failed')
        const json: FinancialProofResponse = await res.json()
        if (!cancelled) setRisk(json.review?.riskFlag || 'low')
      } catch {
        if (!cancelled) setRisk(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [studentId, session?.token])

  if (loading) return <div className="h-5 w-12 rounded bg-slate-100 animate-pulse" />
  if (!risk) return <span className="text-xs text-slate-400">—</span>

  const meta = {
    low: { label: 'Low', cls: 'bg-green-50 text-green-700' },
    medium: { label: 'Medium', cls: 'bg-amber-50 text-amber-700' },
    high: { label: 'High', cls: 'bg-red-50 text-red-700' },
  }[risk] || { label: risk, cls: 'bg-slate-100 text-slate-600' }

  return (
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', meta.cls)}>
      {meta.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Detail Sheet (slide-over drawer)
// ---------------------------------------------------------------------------
interface DetailSheetProps {
  visaFileId: string | null
  visaFiles: VisaFile[]
  onClose: () => void
  onAction: (file: VisaFile, stage: string, label: string) => void
  onPlaceholder: (label: string) => void
}

function VisaFileDetailSheet({ visaFileId, visaFiles, onClose, onAction, onPlaceholder }: DetailSheetProps) {
  const file = useMemo(
    () => visaFiles.find((f) => f.id === visaFileId) || null,
    [visaFileId, visaFiles],
  )
  const open = !!file

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto alo-scrollbar">
        {file ? (
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl">Visa File — {file.student?.firstName} {file.student?.lastName}</SheetTitle>
            <SheetDescription>
              {file.student?.studentId} • {file.student?.nationality || 'Nationality N/A'}
            </SheetDescription>
          </SheetHeader>
        ) : null}

        {file && (
          <VisaFileDetailBody file={file} onAction={onAction} onPlaceholder={onPlaceholder} />
        )}
      </SheetContent>
    </Sheet>
  )
}

function VisaFileDetailBody({
  file,
  onAction,
  onPlaceholder,
}: {
  file: VisaFile
  onAction: (file: VisaFile, stage: string, label: string) => void
  onPlaceholder: (label: string) => void
}) {
  const session = getSession()
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null)
  const [readinessLoading, setReadinessLoading] = useState(true)
  const [financial, setFinancial] = useState<FinancialProofResponse | null>(null)
  const [financialLoading, setFinancialLoading] = useState(true)
  const [notesDraft, setNotesDraft] = useState(file.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function loadReadiness() {
      try {
        setReadinessLoading(true)
        const res = await fetch(`/api/visa/readiness?studentId=${encodeURIComponent(file.studentId)}`, {
          headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
        })
        if (!res.ok) throw new Error('failed')
        const json: ReadinessResponse = await res.json()
        if (!cancelled) setReadiness(json)
      } catch {
        if (!cancelled) setReadiness(null)
      } finally {
        if (!cancelled) setReadinessLoading(false)
      }
    }
    async function loadFinancial() {
      try {
        setFinancialLoading(true)
        const res = await fetch(`/api/visa/financial-proof?studentId=${encodeURIComponent(file.studentId)}`, {
          headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
        })
        if (!res.ok) throw new Error('failed')
        const json: FinancialProofResponse = await res.json()
        if (!cancelled) setFinancial(json)
      } catch {
        if (!cancelled) setFinancial(null)
      } finally {
        if (!cancelled) setFinancialLoading(false)
      }
    }
    loadReadiness()
    loadFinancial()
    return () => { cancelled = true }
  }, [file.studentId, session?.token])

  // Re-sync notes if file changes
  useEffect(() => {
    setNotesDraft(file.notes || '')
  }, [file.id, file.notes])

  async function saveNotes() {
    setSavingNotes(true)
    try {
      const res = await fetch('/api/visa', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
        },
        body: JSON.stringify({ id: file.id, notes: notesDraft }),
      })
      if (res.status === 405) {
        toast.error('Notes save endpoint pending', {
          description: 'PUT /api/visa not yet implemented. Notes are kept locally only.',
        })
        return
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `Request failed: ${res.status}`)
      }
      toast.success('Risk notes saved')
    } catch (e) {
      toast.error('Failed to save risk notes', {
        description: e instanceof Error ? e.message : 'Unknown error',
      })
    } finally {
      setSavingNotes(false)
    }
  }

  const readinessScore = readiness?.score ?? 0
  const riskFlag = financial?.review?.riskFlag || 'low'
  const riskMeta = {
    low: { label: 'Low Risk', cls: 'bg-green-50 text-green-700 border-green-200', icon: ShieldCheck },
    medium: { label: 'Medium Risk', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
    high: { label: 'High Risk', cls: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  }[riskFlag] || { label: riskFlag, cls: 'bg-slate-100 text-slate-700 border-slate-200', icon: AlertTriangle }
  const RiskIcon = riskMeta.icon

  return (
    <div className="space-y-5">
      {/* Student info card */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white font-bold flex items-center justify-center shrink-0">
            {(file.student?.firstName?.[0] || '?')}{(file.student?.lastName?.[0] || '')}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-slate-900">
              {file.student?.firstName} {file.student?.lastName}
            </p>
            <p className="text-xs text-slate-500">
              Student ID: <span className="font-mono">{file.student?.studentId}</span> • {file.student?.nationality || 'Nationality N/A'}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className={cn('text-xs border', stageBadgeClass(file.stage))}>
                {stageLabel(file.stage)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Status: <span className="capitalize ml-1">{file.status}</span>
              </Badge>
              {file.visaOfficer && (
                <Badge variant="outline" className="text-xs">
                  Officer: {file.visaOfficer.firstName} {file.visaOfficer.lastName}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Readiness + Financial Risk row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-[#0057B8]" /> Visa Readiness
            </p>
            <span className={cn(
              'text-sm font-bold',
              readinessScore >= 75 ? 'text-green-600' :
              readinessScore >= 50 ? 'text-amber-600' : 'text-red-600',
            )}>
              {readinessLoading ? '—' : `${readinessScore}%`}
            </span>
          </div>
          {readinessLoading ? (
            <Skeleton className="h-2.5 w-full rounded-full" />
          ) : (
            <>
              <Progress value={readinessScore} className="h-2.5" />
              <div className="mt-3 space-y-1 max-h-44 overflow-y-auto alo-scrollbar pr-1">
                {readiness?.items?.map((item) => {
                  const dot = {
                    completed: 'bg-green-500',
                    pending: 'bg-slate-300',
                    under_review: 'bg-amber-500',
                    rejected: 'bg-red-500',
                    needs_correction: 'bg-orange-500',
                  }[item.status] || 'bg-slate-300'
                  return (
                    <div key={item.key} className="flex items-center gap-2 text-xs">
                      <span className={cn('h-2 w-2 rounded-full shrink-0', dot)} />
                      <span className="flex-1 text-slate-700">{item.label}</span>
                      <span className="text-slate-400">{item.weight}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </Card>

        <Card className="p-4 border-0 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#E8501A]" /> Financial Proof
            </p>
            {financialLoading ? (
              <Skeleton className="h-5 w-16 rounded-full" />
            ) : (
              <Badge variant="outline" className={cn('text-xs border', riskMeta.cls)}>
                <RiskIcon className="h-3 w-3 mr-1" /> {riskMeta.label}
              </Badge>
            )}
          </div>
          {financialLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : financial?.review ? (
            <div className="space-y-1.5 text-xs">
              <FinRow label="Bank Statement" status={financial.review.bankStatementStatus} />
              <FinRow label="Bank Solvency" status={financial.review.bankSolvencyStatus} />
              <FinRow label="Sponsor Letter" status={financial.review.sponsorLetterStatus} />
              <FinRow label="Affidavit" status={financial.review.affidavitStatus} />
              <FinRow label="Tax Document" status={financial.review.taxDocumentStatus} />
              <FinRow label="Income Source" status={financial.review.incomeSourceStatus} />
              <FinRow label="Deposit Receipt" status={financial.review.depositReceiptStatus} />
              <div className="mt-2 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-500">Final Finance Status</p>
                <p className="text-sm font-semibold text-slate-900 capitalize">
                  {financial.review.finalFinanceStatus.replace(/_/g, ' ')}
                </p>
              </div>
              {financial.review.reviewerNote && (
                <p className="mt-2 text-xs italic text-slate-500">
                  &ldquo;{financial.review.reviewerNote}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-400">No financial proof review on record.</p>
          )}
        </Card>
      </div>

      {/* Key dates */}
      <Card className="p-4 border-0 shadow-sm">
        <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[#0057B8]" /> Key Dates
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <DetailItem label="CAS Date" value={formatDate(file.casDate)} />
          <DetailItem label="CAS / I-20 / COE #" value={file.casNumber || '—'} mono />
          <DetailItem label="Visa Appointment" value={formatDate(file.visaAppointmentDate)} />
          <DetailItem label="Biometrics" value={formatDate(file.biometricsDate)} />
          <DetailItem label="Visa Decision Date" value={formatDate(file.visaDecisionDate)} />
          <DetailItem label="Visa Decision" value={file.visaDecision ? file.visaDecision.toUpperCase() : '—'} />
          <DetailItem label="Created" value={formatDate(file.createdAt)} />
          <DetailItem label="Last Updated" value={formatDateTime(file.updatedAt)} />
        </div>
      </Card>

      {/* Document checklist */}
      <Card className="p-4 border-0 shadow-sm">
        <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-[#0057B8]" /> Document Checklist
        </p>
        {file.checklist && file.checklist.length > 0 ? (
          <div className="space-y-1.5 max-h-60 overflow-y-auto alo-scrollbar pr-1">
            {file.checklist.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:bg-slate-50/60"
              >
                {item.isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-slate-300 shrink-0" />
                )}
                <span
                  className={cn(
                    'flex-1 text-sm',
                    item.isCompleted ? 'text-slate-400 line-through' : 'text-slate-800',
                  )}
                >
                  {item.itemName}
                </span>
                {item.isRequired && !item.isCompleted && (
                  <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">
                    Required
                  </Badge>
                )}
                {item.note && (
                  <span className="text-xs text-slate-400 italic hidden md:block">{item.note}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-3">No checklist items yet.</p>
        )}
      </Card>

      {/* Refusal reason (if refused) */}
      {file.visaDecision === 'refused' && file.refusalReason && (
        <Card className="p-4 border-0 shadow-sm bg-red-50/40 border border-red-100">
          <p className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
            <FileWarning className="h-4 w-4" /> Refusal Reason
          </p>
          <p className="text-xs text-slate-700 whitespace-pre-line">{file.refusalReason}</p>
        </Card>
      )}

      {/* Risk notes */}
      <Card className="p-4 border-0 shadow-sm">
        <p className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <StickyNote className="h-4 w-4 text-[#E8501A]" /> Internal Risk Notes
        </p>
        <Textarea
          placeholder="Add internal risk notes (visible to visa officers only)…"
          value={notesDraft}
          onChange={(e) => setNotesDraft(e.target.value)}
          rows={4}
          className="text-sm"
        />
        <div className="flex justify-end mt-2">
          <Button
            size="sm"
            className="h-10 bg-[#0057B8] hover:bg-[#004a99] text-white border-0"
            onClick={saveNotes}
            disabled={savingNotes}
          >
            {savingNotes ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Risk Notes
          </Button>
        </div>
      </Card>

      {/* Action buttons */}
      <Card className="p-4 border-0 shadow-sm">
        <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Flag className="h-4 w-4 text-[#0057B8]" /> Officer Actions
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <ActionButton
            icon={FileWarning}
            label="Request Corrected Document"
            onClick={() => onPlaceholder('Request Corrected Document')}
          />
          <ActionButton
            icon={UserCog}
            label="Schedule Interview Practice"
            onClick={() => onPlaceholder('Schedule Interview Practice')}
          />
          <ActionButton
            icon={CheckCircle2}
            label="Mark Visa File Ready"
            tone="green"
            disabled={file.stage === 'visa_file_ready'}
            onClick={() => onAction(file, 'visa_file_ready', 'Mark Visa File Ready')}
          />
          <ActionButton
            icon={Send}
            label="Update Visa Submission Status"
            tone="blue"
            disabled={file.stage === 'visa_submitted'}
            onClick={() => onAction(file, 'visa_submitted', 'Update Visa Submission Status')}
          />
          <ActionButton
            icon={FileText}
            label="Upload Visa Decision"
            onClick={() => onPlaceholder('Upload Visa Decision')}
          />
          {file.visaDecision === 'refused' && (
            <ActionButton
              icon={FileWarning}
              label="Start Refusal Review"
              tone="red"
              onClick={() => onPlaceholder('Start Refusal Review')}
            />
          )}
          {file.stage === 'visa_approved' && (
            <ActionButton
              icon={Plane}
              label="Start Pre-Departure Checklist"
              tone="purple"
              onClick={() => onAction(file, 'pre_departure', 'Start Pre-Departure Checklist')}
            />
          )}
        </div>
      </Card>
    </div>
  )
}

function FinRow({ label, status }: { label: string; status: string }) {
  const meta = {
    approved: 'text-green-700 bg-green-50',
    uploaded: 'text-sky-700 bg-sky-50',
    under_review: 'text-amber-700 bg-amber-50',
    rejected: 'text-red-700 bg-red-50',
    expired: 'text-orange-700 bg-orange-50',
    missing: 'text-slate-500 bg-slate-100',
  }[status] || 'text-slate-500 bg-slate-100'
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-600">{label}</span>
      <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize', meta)}>
        {status.replace(/_/g, ' ')}
      </span>
    </div>
  )
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
      <p className={cn('text-sm font-semibold text-slate-900 mt-0.5', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  tone = 'slate',
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick: () => void
  tone?: 'slate' | 'blue' | 'green' | 'red' | 'purple'
  disabled?: boolean
}) {
  const tones: Record<string, string> = {
    slate: 'border-slate-200 text-slate-700 hover:bg-slate-50',
    blue: 'border-blue-200 text-[#0057B8] hover:bg-[#EFF6FF]',
    green: 'border-green-200 text-green-700 hover:bg-green-50',
    red: 'border-red-200 text-red-700 hover:bg-red-50',
    purple: 'border-purple-200 text-purple-700 hover:bg-purple-50',
  }
  return (
    <Button
      variant="outline"
      className={cn('h-12 justify-start', tones[tone])}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon className="h-4 w-4 mr-2" /> {label}
    </Button>
  )
}
