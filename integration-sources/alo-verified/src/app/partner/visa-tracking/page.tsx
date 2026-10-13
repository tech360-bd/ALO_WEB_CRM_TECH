'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plane, FileCheck, AlertCircle, CheckCircle2, XCircle,
  Users, Send, ShieldCheck, Eye, Search, RefreshCw,
  Globe, Calendar, FileText, PoundSterling, Info, Loader2,
  AlertTriangle, ChevronRight,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types — only what the partner is allowed to see (no internal/staff fields)
// ---------------------------------------------------------------------------
interface ApplicationRef {
  id: string
  applicationId: string
  status: string
  intake: string | null
  casDate: string | null
  university: { id: string; name: string; country?: string | null }
  course?: { id: string; name: string } | null
}

interface StudentRow {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  nationality: string | null
  preferredCountry: string | null
  preferredIntake: string | null
  status: string
  createdAt: string
  applications?: ApplicationRef[]
}

interface StudentsResponse {
  students: StudentRow[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

// Visa file — only public-facing fields shown to partner (NO notes, NO risk flags,
// NO refusal reason, NO staff comments, NO audit logs)
interface VisaFilePublic {
  id: string
  studentId: string
  stage: string
  casNumber: string | null
  casDate: string | null
  visaAppointmentDate: string | null
  biometricsDate: string | null
  visaDecisionDate: string | null
  visaDecision: string | null
  status: string
  checklist: Array<{
    id: string
    itemName: string
    isRequired: boolean
    isCompleted: boolean
  }>
}

interface VisaData {
  visaFiles: VisaFilePublic[]
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

interface CommissionRef {
  id: string
  commissionId: string
  status: string
  amount: number
  currency: string
  triggerStage: string
  studentId?: string | null
  applicationId?: string | null
}

interface CommissionsResponse {
  commissions: CommissionRef[]
  summary?: { totalAmount: number; pendingAmount: number; paidAmount: number }
  pagination?: { page: number; limit: number; total: number; totalPages: number }
}

// ---------------------------------------------------------------------------
// 22-stage definitions (RBAC: partner sees only the human-readable label,
// NOT the internal notes / risk / audit attached to stages)
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

function visaLetterType(country?: string | null): string {
  if (!country) return 'Visa Letter'
  const c = country.toLowerCase()
  if (c.includes('usa') || c.includes('united states')) return 'I-20'
  if (c.includes('australia')) return 'CoE'
  if (c.includes('uk') || c.includes('united kingdom') || c.includes('england')) return 'CAS'
  return 'Visa Letter'
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PartnerVisaTrackingPage() {
  const session = getSession()
  const partnerId = session?.user.referenceId || ''

  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const [countryFilter, setCountryFilter] = useState<string>('all')
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailStudentId, setDetailStudentId] = useState<string | null>(null)

  // 1. Fetch partner's own students (RBAC scoped by partnerId on the API)
  const { data: studentsData, loading: studentsLoading } = usePortalData<StudentsResponse>({
    endpoint: '/api/students',
    params: { partnerId, limit: 200, page: 1 },
    enabled: !!partnerId,
  })

  // 2. Fetch partner's own commissions (RBAC scoped by partnerId on the API)
  const { data: commissionsData } = usePortalData<CommissionsResponse>({
    endpoint: '/api/commissions',
    params: { partnerId, limit: 200, page: 1 },
    enabled: !!partnerId,
  })

  // 3. For each student, fetch their visa file (lazy in VisaFileLoader for the visible table)
  //    — for stats we use a child hook per row to keep RBAC tight (only that student's file).
  const students = useMemo(() => studentsData?.students ?? [], [studentsData])
  const commissions = useMemo(() => commissionsData?.commissions ?? [], [commissionsData])

  // Unique target countries for filter
  const countries = useMemo(() => {
    const set = new Set<string>()
    students.forEach((s) => {
      const c = s.preferredCountry || s.applications?.[0]?.university?.country
      if (c) set.add(c)
    })
    return Array.from(set).sort()
  }, [students])

  // ---------------------------------------------------------------------------
  // For each student, derive visa info + commission status client-side
  // We need visa files per student. To keep API load reasonable, fetch in a single
  // hook per student using the dedicated VisaFileLoader child component (lazy).
  // The parent keeps a registry indexed by studentId.
  // ---------------------------------------------------------------------------
  const [visaByStudent, setVisaByStudent] = useState<Record<string, VisaFilePublic | null>>({})

  const setVisaFor = (studentId: string, file: VisaFilePublic | null) => {
    setVisaByStudent((prev) => {
      if (prev[studentId] === file) return prev
      if (prev[studentId] && !file) {
        if (prev[studentId] === file) return prev
      }
      return { ...prev, [studentId]: file }
    })
  }

  // Build derived rows combining student + visa + commission
  const rows = useMemo(() => {
    return students.map((s) => {
      const visa = visaByStudent[s.id] || null
      const primaryApp = s.applications?.[0] || null
      const targetCountry = s.preferredCountry || primaryApp?.university?.country || '—'
      const letterType = visaLetterType(targetCountry === '—' ? undefined : targetCountry)
      const appStatus = primaryApp?.status || '—'
      const offerStatus = primaryApp?.status === 'unconditional_offer'
        ? 'Unconditional'
        : primaryApp?.status === 'conditional_offer'
        ? 'Conditional'
        : primaryApp ? 'Pending' : '—'
      const casStatus = visa?.casNumber ? `${letterType} Issued` : (visa?.stage && ['cas_received', 'visa_file_preparing', 'visa_file_ready', 'visa_submitted'].includes(visa.stage) ? `${letterType} Received` : 'Pending')
      const visaStage = visa?.stage || 'not_started'
      const visaDecision = visa?.visaDecision
        ? visa.visaDecision === 'approved' ? 'Approved' : visa.visaDecision === 'refused' ? 'Refused' : visa.visaDecision
        : (visa?.stage === 'visa_approved' ? 'Approved' : visa?.stage === 'visa_rejected' ? 'Refused' : '—')

      // Required action (partner-facing only — derived from missing checklist items)
      const missingItems = visa?.checklist?.filter((c) => c.isRequired && !c.isCompleted) ?? []
      let requiredAction = 'No action required'
      if (visaStage === 'not_started') requiredAction = 'Awaiting visa file creation'
      else if (visaStage === 'documents_required' || visaStage === 'documents_under_review') requiredAction = 'Upload missing documents'
      else if (visaStage === 'financial_proof_pending') requiredAction = 'Provide financial proof documents'
      else if (visaStage === 'interview_scheduled') requiredAction = 'Attend interview as scheduled'
      else if (visaStage === 'biometrics_scheduled') requiredAction = 'Attend biometrics appointment'
      else if (visaStage === 'pre_departure') requiredAction = 'Complete pre-departure checklist'
      else if (missingItems.length > 0) requiredAction = `Submit ${missingItems.length} required document${missingItems.length > 1 ? 's' : ''}`

      // Commission status (own commission only)
      const commission = commissions.find(
        (c) => c.studentId === s.id || (c.applicationId && c.applicationId === primaryApp?.id),
      )
      const commissionStatus = commission
        ? commission.status === 'paid' ? 'Paid'
        : commission.status === 'approved' || commission.status === 'processing' ? 'Approved'
        : commission.status === 'requested' || commission.status === 'under_review' ? 'Pending'
        : commission.status === 'rejected' ? 'Not Applicable'
        : 'Pending'
        : 'Not Applicable'

      return {
        student: s,
        visa,
        primaryApp,
        targetCountry,
        letterType,
        appStatus,
        offerStatus,
        casStatus,
        visaStage,
        visaDecision,
        requiredAction,
        missingItems,
        commissionStatus,
        commission,
      }
    })
  }, [students, visaByStudent, commissions])

  // Apply filters
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const fullName = `${r.student.firstName} ${r.student.lastName}`.toLowerCase()
        if (!fullName.includes(q) && !r.student.studentId.toLowerCase().includes(q)) return false
      }
      if (stageFilter !== 'all' && r.visaStage !== stageFilter) return false
      if (countryFilter !== 'all' && r.targetCountry !== countryFilter) return false
      return true
    })
  }, [rows, search, stageFilter, countryFilter])

  // Stats (RBAC: scoped to partner's own students only)
  const stats = useMemo(() => {
    const withVisa = rows.filter((r) => r.visa).length
    const submitted = rows.filter((r) =>
      ['visa_submitted', 'biometrics_scheduled', 'interview_scheduled', 'decision_pending'].includes(r.visaStage),
    ).length
    const approved = rows.filter((r) => r.visaStage === 'visa_approved').length
    const rejected = rows.filter((r) => r.visaStage === 'visa_rejected').length
    const casReceived = rows.filter((r) =>
      ['cas_received', 'visa_file_preparing', 'visa_file_ready', 'visa_submitted', 'biometrics_scheduled', 'interview_scheduled', 'decision_pending', 'visa_approved', 'pre_departure', 'enrolled'].includes(r.visaStage),
    ).length
    const pendingAction = rows.filter((r) =>
      r.requiredAction !== 'No action required' && r.requiredAction !== 'Awaiting visa file creation',
    ).length
    return { withVisa, submitted, approved, rejected, casReceived, pendingAction }
  }, [rows])

  const detailRow = useMemo(
    () => filteredRows.find((r) => r.student.id === detailStudentId) || rows.find((r) => r.student.id === detailStudentId) || null,
    [detailStudentId, filteredRows, rows],
  )

  // Refresh handler
  useEffect(() => {
    if (refreshKey === 0) return
    // The usePortalData hook re-fetches on param identity change; nudge via state
    setVisaByStudent({})
  }, [refreshKey])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visa Tracking — My Students"
        description="Track your students' visa progress — stage, missing documents, required actions, and your commission status."
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

      {/* ---------------- Stats Row (6 StatCards) ---------------- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="My Students with Visa Files"
          value={stats.withVisa}
          icon={Users}
          accent="blue"
          hint="Of your total students"
        />
        <StatCard
          label="Visa Submitted"
          value={stats.submitted}
          icon={Send}
          accent="blue"
          hint="In progress at embassy"
        />
        <StatCard
          label="Visa Approved"
          value={stats.approved}
          icon={CheckCircle2}
          accent="green"
          hint="Successful decisions"
        />
        <StatCard
          label="Visa Rejected"
          value={stats.rejected}
          icon={XCircle}
          accent="orange"
          hint="Refusals"
        />
        <StatCard
          label="CAS/I-20/COE Received"
          value={stats.casReceived}
          icon={FileCheck}
          accent="blue"
          hint="Visa letter issued"
        />
        <StatCard
          label="Pending Action"
          value={stats.pendingAction}
          icon={AlertCircle}
          accent="amber"
          hint="Needs your attention"
        />
      </div>

      {/* ---------------- Filters ---------------- */}
      <Card className="p-3 border-0 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search student name or ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[200px] h-10"><SelectValue placeholder="All Visa Stages" /></SelectTrigger>
            <SelectContent className="max-h-80">
              <SelectItem value="all">All Visa Stages</SelectItem>
              {STAGES.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={countryFilter} onValueChange={setCountryFilter}>
            <SelectTrigger className="w-[180px] h-10"><SelectValue placeholder="All Countries" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Countries</SelectItem>
              {countries.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* ---------------- Main Table — My Students Visa Status ---------------- */}
      <Card className="border-0 shadow-sm overflow-hidden">
        {studentsLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="h-14 w-14 rounded-xl bg-[#EFF6FF] flex items-center justify-center mx-auto mb-4">
              <Plane className="h-7 w-7 text-[#0057B8]" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No students found</h3>
            <p className="text-sm text-slate-500">
              {search || stageFilter !== 'all' || countryFilter !== 'all'
                ? 'Try adjusting your filters.'
                : 'Your students will appear here once they have visa files.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto alo-scrollbar">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Student</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden md:table-cell">Target Country</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden lg:table-cell">Application Status</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden lg:table-cell">Offer Status</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden md:table-cell">CAS / I-20 / COE</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Visa Stage</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden md:table-cell">Visa Decision</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap">Required Action</th>
                  <th className="p-3 text-left font-semibold text-slate-600 whitespace-nowrap hidden lg:table-cell">Commission</th>
                  <th className="p-3 text-right font-semibold text-slate-600 whitespace-nowrap"></th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <VisaRow
                    key={r.student.id}
                    row={r}
                    onVisaLoaded={(file) => setVisaFor(r.student.id, file)}
                    onView={() => setDetailStudentId(r.student.id)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ---------------- Detail Dialog (partner-facing only) ---------------- */}
      <PartnerVisaDetailDialog
        row={detailRow}
        open={!!detailRow}
        onClose={() => setDetailStudentId(null)}
      />

      {/* ---------------- RBAC Enforcement Note ---------------- */}
      <Card className="p-4 border-0 shadow-sm bg-[#F8FAFC]">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-[#EFF6FF] flex items-center justify-center shrink-0">
            <ShieldCheck className="h-5 w-5 text-[#0057B8]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 mb-1">Partner Access Scope</p>
            <p className="text-xs text-slate-600 leading-relaxed">
              Partners can see their own students&apos; visa stage, missing documents, required action,
              application status, offer status, CAS/I-20/COE status, visa submission, visa decision,
              and own commission status. Partners cannot see internal visa risk notes, staff-only
              comments, other partner cases, full finance reports, or audit logs.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Per-row component that lazy-loads the visa file (RBAC: only that student's file)
// ---------------------------------------------------------------------------
function VisaRow({
  row,
  onVisaLoaded,
  onView,
}: {
  row: {
    student: StudentRow
    visa: VisaFilePublic | null
    primaryApp: ApplicationRef | null
    targetCountry: string
    letterType: string
    appStatus: string
    offerStatus: string
    casStatus: string
    visaStage: string
    visaDecision: string
    requiredAction: string
    missingItems: Array<{ id: string; itemName: string; isRequired: boolean; isCompleted: boolean }>
    commissionStatus: string
  }
  onVisaLoaded: (file: VisaFilePublic | null) => void
  onView: () => void
}) {
  const session = getSession()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(
          `/api/visa?studentId=${encodeURIComponent(row.student.id)}&limit=5`,
          { headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {} },
        )
        if (!res.ok) throw new Error('failed')
        const json: VisaData = await res.json()
        // Active visa file = first non-closed file
        const file = (json.visaFiles || []).find((f) => f.status === 'active') || json.visaFiles?.[0] || null
        if (!cancelled) onVisaLoaded(file)
      } catch {
        if (!cancelled) onVisaLoaded(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [row.student.id, session?.token, onVisaLoaded])

  const commissionTone =
    row.commissionStatus === 'Paid' ? 'bg-green-50 text-green-700 border-green-200'
    : row.commissionStatus === 'Approved' ? 'bg-[#EFF6FF] text-[#0057B8] border-blue-200'
    : row.commissionStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-slate-100 text-slate-500 border-slate-200'

  const decisionTone =
    row.visaDecision === 'Approved' ? 'bg-green-50 text-green-700 border-green-200'
    : row.visaDecision === 'Refused' ? 'bg-red-50 text-red-700 border-red-200'
    : 'bg-slate-100 text-slate-500 border-slate-200'

  return (
    <tr
      className="border-b border-slate-100 hover:bg-slate-50/60 cursor-pointer transition-colors"
      onClick={onView}
    >
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0057B8] to-[#E8501A] text-white text-xs font-bold flex items-center justify-center shrink-0">
            {row.student.firstName[0]}{row.student.lastName[0]}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 truncate">
              {row.student.firstName} {row.student.lastName}
            </p>
            <p className="text-xs text-slate-500">{row.student.studentId}</p>
          </div>
        </div>
      </td>
      <td className="p-3 hidden md:table-cell text-slate-700">
        {row.targetCountry === '—' ? '—' : (
          <span className="flex items-center gap-1">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            {row.targetCountry}
          </span>
        )}
      </td>
      <td className="p-3 hidden lg:table-cell">
        <Badge variant="outline" className="text-xs capitalize border-slate-200 bg-slate-50 text-slate-700">
          {row.appStatus.replace(/_/g, ' ')}
        </Badge>
      </td>
      <td className="p-3 hidden lg:table-cell text-slate-700 text-xs">{row.offerStatus}</td>
      <td className="p-3 hidden md:table-cell">
        {loading ? (
          <Skeleton className="h-5 w-20 rounded-full" />
        ) : row.visa?.casNumber ? (
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-green-700">{row.casStatus}</span>
            <span className="font-mono text-[10px] text-slate-500">{row.visa.casNumber}</span>
          </div>
        ) : (
          <Badge variant="outline" className="text-xs border-amber-200 bg-amber-50 text-amber-700">
            {row.casStatus}
          </Badge>
        )}
      </td>
      <td className="p-3">
        {loading ? (
          <Skeleton className="h-5 w-24 rounded-full" />
        ) : (
          <Badge variant="outline" className={cn('text-xs capitalize border', stageBadgeClass(row.visaStage))}>
            {stageLabel(row.visaStage)}
          </Badge>
        )}
      </td>
      <td className="p-3 hidden md:table-cell">
        {loading ? (
          <Skeleton className="h-5 w-16 rounded-full" />
        ) : (
          <Badge variant="outline" className={cn('text-xs border', decisionTone)}>
            {row.visaDecision}
          </Badge>
        )}
      </td>
      <td className="p-3">
        {loading ? (
          <Skeleton className="h-5 w-32 rounded-full" />
        ) : row.requiredAction === 'No action required' ? (
          <span className="text-xs text-slate-400">{row.requiredAction}</span>
        ) : (
          <span className="text-xs text-amber-700 flex items-center gap-1">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {row.requiredAction}
          </span>
        )}
      </td>
      <td className="p-3 hidden lg:table-cell">
        <Badge variant="outline" className={cn('text-xs border', commissionTone)}>
          {row.commissionStatus}
        </Badge>
      </td>
      <td className="p-3 text-right">
        <Button size="sm" variant="ghost" className="h-9 w-9 p-0" onClick={(e) => { e.stopPropagation(); onView() }} title="View Details">
          <Eye className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Detail Dialog (RBAC: only partner-visible fields, no internal/staff data)
// ---------------------------------------------------------------------------
function PartnerVisaDetailDialog({
  row,
  open,
  onClose,
}: {
  row: {
    student: StudentRow
    visa: VisaFilePublic | null
    primaryApp: ApplicationRef | null
    targetCountry: string
    letterType: string
    appStatus: string
    offerStatus: string
    casStatus: string
    visaStage: string
    visaDecision: string
    requiredAction: string
    missingItems: Array<{ id: string; itemName: string; isRequired: boolean; isCompleted: boolean }>
    commissionStatus: string
    commission?: CommissionRef
  } | null
  open: boolean
  onClose: () => void
}) {
  if (!row) return null
  const visa = row.visa
  const app = row.primaryApp

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto alo-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Plane className="h-5 w-5 text-[#0057B8]" />
            Visa Tracking — {row.student.firstName} {row.student.lastName}
          </DialogTitle>
          <DialogDescription>
            Student ID: <span className="font-mono">{row.student.studentId}</span> • {row.student.nationality || 'Nationality N/A'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student info */}
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-3">Student Information</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailItem icon={Users} label="Name" value={`${row.student.firstName} ${row.student.lastName}`} />
              <DetailItem icon={Globe} label="Target Country" value={row.targetCountry} />
              <DetailItem icon={Calendar} label="Target Intake" value={row.student.preferredIntake || app?.intake || '—'} />
              <DetailItem icon={FileText} label="Student ID" value={row.student.studentId} mono />
            </div>
          </Card>

          {/* Application status */}
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-3">Application &amp; Offer Status</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailItem icon={FileText} label="Application Status" value={row.appStatus === '—' ? '—' : row.appStatus.replace(/_/g, ' ')} />
              <DetailItem icon={CheckCircle2} label="Offer Status" value={row.offerStatus} />
              {app?.university?.name && (
                <DetailItem icon={Globe} label="University" value={app.university.name} />
              )}
              {app?.course?.name && (
                <DetailItem icon={FileText} label="Course" value={app.course.name} />
              )}
            </div>
          </Card>

          {/* CAS / I-20 / COE status */}
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-3">
              {row.letterType} Status
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailItem icon={FileCheck} label={`${row.letterType} Status`} value={row.casStatus} />
              <DetailItem icon={FileText} label={`${row.letterType} Number`} value={visa?.casNumber || '—'} mono />
              <DetailItem icon={Calendar} label={`${row.letterType} Date`} value={formatDate(visa?.casDate || app?.casDate)} />
            </div>
          </Card>

          {/* Visa submission + decision */}
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-3">Visa Submission &amp; Decision</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailItem icon={Send} label="Visa Stage" value={stageLabel(row.visaStage)} />
              <DetailItem icon={Calendar} label="Visa Appointment" value={formatDate(visa?.visaAppointmentDate)} />
              <DetailItem icon={Calendar} label="Biometrics Date" value={formatDate(visa?.biometricsDate)} />
              <DetailItem icon={Calendar} label="Visa Decision Date" value={formatDate(visa?.visaDecisionDate)} />
              <DetailItem
                icon={row.visaDecision === 'Approved' ? CheckCircle2 : row.visaDecision === 'Refused' ? XCircle : Info}
                label="Visa Decision"
                value={row.visaDecision}
              />
            </div>
          </Card>

          {/* Missing documents (partner-facing) */}
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" /> Missing Documents
            </p>
            {row.missingItems.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle2 className="h-4 w-4" />
                All required documents submitted.
              </div>
            ) : (
              <div className="space-y-1.5">
                {row.missingItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-2 rounded-lg border border-amber-100 bg-amber-50/40">
                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                    <span className="text-sm text-slate-700">{item.itemName}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Required action */}
          <Card className="p-4 border-0 shadow-sm bg-[#F8FAFC]">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wide text-slate-500">Required Action</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{row.requiredAction}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Please coordinate with your student to complete this step.
                </p>
              </div>
            </div>
          </Card>

          {/* Partner's own commission status */}
          <Card className="p-4 border-0 shadow-sm">
            <p className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <PoundSterling className="h-4 w-4 text-[#E8501A]" /> Your Commission Status
            </p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <DetailItem icon={PoundSterling} label="Commission Status" value={row.commissionStatus} />
              {row.commission && (
                <>
                  <DetailItem
                    icon={PoundSterling}
                    label="Amount"
                    value={`${row.commission.currency} ${row.commission.amount.toLocaleString()}`}
                  />
                  <DetailItem icon={FileText} label="Commission ID" value={row.commission.commissionId} mono />
                  <DetailItem icon={CheckCircle2} label="Trigger Stage" value={row.commission.triggerStage.replace(/_/g, ' ')} />
                </>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-3 italic">
              Only your own commission is shown. Other partners&apos; commissions are not visible to you.
            </p>
          </Card>

          {/* Privacy notice */}
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-500 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-[#0057B8] shrink-0 mt-0.5" />
              <span>
                This view shows only partner-visible information. Internal visa risk notes,
                staff-only comments, audit logs, and other partners&apos; data are not accessible
                from this view.
              </span>
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="outline" className="h-10" onClick={onClose}>
              <ChevronRight className="h-4 w-4 mr-1 rotate-180" /> Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailItem({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wide text-slate-400">{label}</p>
        <p className={cn('text-sm font-semibold text-slate-900 mt-0.5 break-words', mono && 'font-mono')}>
          {value}
        </p>
      </div>
    </div>
  )
}
