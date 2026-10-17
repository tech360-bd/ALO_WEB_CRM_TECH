'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  Plane, CheckCircle2, Circle, Clock, AlertCircle, ShieldAlert,
  FileText, Calendar, ArrowRight, Info, XCircle, AlertTriangle,
  User, GraduationCap, Languages, FileCheck, Banknote, Receipt,
  FileSignature, Mic, ClipboardCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/alo/portal/PortalPage'
import { StatCard } from '@/components/alo/portal/StatCard'
import { usePortalData } from '@/hooks/use-portal-data'
import { getSession } from '@/lib/session'
import { cn } from '@/lib/utils'

interface ReadinessItem {
  key: string
  label: string
  weight: number
  status: 'completed' | 'pending' | 'under_review' | 'rejected' | 'needs_correction'
  note?: string
}

interface VisaFileSummary {
  id: string
  stage: string
  casNumber: string | null
  casDate: string | null
  visaAppointmentDate: string | null
  biometricsDate: string | null
  visaDecisionDate: string | null
  visaDecision: string | null
  status: string
  notes: string | null
}

interface TimelineEntry {
  id: string
  eventType: string
  title: string
  description: string | null
  actorType: string
  createdAt: string
}

interface ReadinessData {
  items: ReadinessItem[]
  score: number
  completedWeight: number
  visaFile: VisaFileSummary | null
  timeline: TimelineEntry[]
}

const STATUS_META: Record<
  ReadinessItem['status'],
  { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }
> = {
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle2 },
  pending: { label: 'Pending', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Circle },
  under_review: { label: 'Under Review', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
  rejected: { label: 'Rejected', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: XCircle },
  needs_correction: { label: 'Needs Correction', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle },
}

const ITEM_ICONS: Record<string, typeof User> = {
  profile: User,
  academic_documents: GraduationCap,
  english_test: Languages,
  offer_letter: FileCheck,
  deposit_receipt: Receipt,
  cas_document: FileText,
  financial_proof: Banknote,
  visa_sop: FileSignature,
  interview_practice: Mic,
  final_review: ClipboardCheck,
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return '—'
  }
}

function scoreColor(score: number): { text: string; ring: string; bg: string; label: string } {
  if (score < 40) return { text: 'text-red-600', ring: 'stroke-red-500', bg: 'bg-red-50', label: 'Needs Work' }
  if (score <= 70) return { text: 'text-amber-600', ring: 'stroke-amber-500', bg: 'bg-amber-50', label: 'On Track' }
  return { text: 'text-green-600', ring: 'stroke-green-500', bg: 'bg-green-50', label: 'Ready' }
}

const TIMELINE_EVENT_META: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  lead_created: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100' },
  document_uploaded: { icon: FileText, color: 'text-[#0057B8]', bg: 'bg-[#EFF6FF]' },
  application_submitted: { icon: FileCheck, color: 'text-[#0057B8]', bg: 'bg-[#EFF6FF]' },
  offer_received: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
  visa_update: { icon: Plane, color: 'text-[#E8501A]', bg: 'bg-[#FFF7ED]' },
  interview_session: { icon: Mic, color: 'text-purple-600', bg: 'bg-purple-50' },
  pre_departure_init: { icon: ClipboardCheck, color: 'text-[#0057B8]', bg: 'bg-[#EFF6FF]' },
  default: { icon: Info, color: 'text-slate-500', bg: 'bg-slate-100' },
}

export default function VisaReadinessPage() {
  const session = getSession()
  const refId = session?.user.referenceId || ''

  const { data, loading } = usePortalData<ReadinessData>({
    endpoint: '/api/visa/readiness',
    params: { studentId: refId },
    enabled: !!refId,
  })

  const items = data?.items ?? []
  const score = data?.score ?? 0
  const visaFile = data?.visaFile ?? null
  const timeline = data?.timeline ?? []

  const counts = useMemo(() => {
    return {
      completed: items.filter((i) => i.status === 'completed').length,
      pending: items.filter((i) => i.status === 'pending').length,
      under_review: items.filter((i) => i.status === 'under_review').length,
      flagged: items.filter((i) => i.status === 'rejected' || i.status === 'needs_correction').length,
    }
  }, [items])

  const scoreMeta = scoreColor(score)
  const circumference = 2 * Math.PI * 52
  const dashOffset = circumference - (score / 100) * circumference

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visa Readiness Tracker"
        description="Track the weighted readiness of every visa-critical milestone in one dashboard."
      />

      {/* Compliance warning */}
      <Alert className="border-amber-200 bg-amber-50/60">
        <ShieldAlert className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">Country-specific guidance required</AlertTitle>
        <AlertDescription className="text-amber-800/90 text-sm">
          Visa requirements vary by country and can change. Final checklist must be verified by ALO staff against official embassy / immigration guidance before submission.
        </AlertDescription>
      </Alert>

      {/* Hero score + Visa file stage */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="p-6 border-0 shadow-sm lg:col-span-2 h-full">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Circular score */}
            <div className="relative h-32 w-32 shrink-0">
              <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-slate-100" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  strokeWidth="10"
                  strokeLinecap="round"
                  className={cn('transition-all duration-700', scoreMeta.ring)}
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {loading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <>
                    <span className={cn('text-3xl font-extrabold', scoreMeta.text)}>{score}%</span>
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">Ready</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="text-sm text-slate-500">Overall Visa Readiness Score</p>
              <h2 className={cn('text-2xl font-bold mt-1', scoreMeta.text)}>{scoreMeta.label}</h2>
              <p className="text-xs text-slate-500 mt-2 max-w-md">
                Weighted across 10 mandatory milestones (Profile, Academics, English, Offer, Deposit, CAS, Financial, SOP, Interview, Final Review).
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {counts.completed} Completed
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                  <Clock className="h-3 w-3 mr-1" /> {counts.under_review} Review
                </Badge>
                <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                  <Circle className="h-3 w-3 mr-1" /> {counts.pending} Pending
                </Badge>
                {counts.flagged > 0 && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    <AlertCircle className="h-3 w-3 mr-1" /> {counts.flagged} Flagged
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Visa file current stage */}
        <Card className="p-6 border-0 shadow-sm h-full">
          <div className="flex items-center gap-2 mb-3">
            <Plane className="h-5 w-5 text-[#E8501A]" />
            <p className="text-sm font-semibold text-slate-900">Visa File Stage</p>
          </div>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : visaFile ? (
            <>
              <p className="text-lg font-bold text-slate-900 capitalize">{visaFile.stage.replace(/_/g, ' ')}</p>
              <p className="text-xs text-slate-500 mt-1">File ref: <span className="font-mono">{visaFile.id.slice(-8).toUpperCase()}</span></p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-400">CAS Number</p>
                  <p className="font-semibold text-slate-700 font-mono">{visaFile.casNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-slate-400">CAS Date</p>
                  <p className="font-semibold text-slate-700">{formatDate(visaFile.casDate)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Appointment</p>
                  <p className="font-semibold text-slate-700">{formatDate(visaFile.visaAppointmentDate)}</p>
                </div>
                <div>
                  <p className="text-slate-400">Biometrics</p>
                  <p className="font-semibold text-slate-700">{formatDate(visaFile.biometricsDate)}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-slate-900">Not Started</p>
              <p className="text-xs text-slate-500 mt-1">No visa file created yet. Reach out to your counselor.</p>
              <Button asChild size="sm" variant="outline" className="mt-4 h-12">
                <Link href="/student/messages">Contact Counselor <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </>
          )}
        </Card>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Completed Items" value={counts.completed} icon={CheckCircle2} accent="green" hint={`of ${items.length || 10} total`} />
        <StatCard label="In Review" value={counts.under_review} icon={Clock} accent="amber" hint="Awaiting staff" />
        <StatCard label="Flagged" value={counts.flagged} icon={AlertTriangle} accent="orange" hint="Needs correction" />
        <StatCard label="Weight Done" value={`${data?.completedWeight ?? 0}%`} icon={ClipboardCheck} accent="blue" hint="Sum of weights" />
      </div>

      {/* Readiness items grid */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Readiness Breakdown</h3>
            <p className="text-xs text-slate-500 mt-0.5">10 weighted milestones contributing to your overall score</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-10">
            <Circle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">No readiness data yet. Complete your profile to begin scoring.</p>
            <Button asChild size="sm" className="h-12 bg-[#0057B8] hover:bg-[#004a99]">
              <Link href="/student/profile">Complete Profile <ArrowRight className="h-3.5 w-3.5 ml-1" /></Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => {
              const meta = STATUS_META[item.status]
              const Icon = ITEM_ICONS[item.key] || FileText
              const StatusIcon = meta.icon
              return (
                <div
                  key={item.key}
                  className={cn(
                    'flex items-start gap-3 p-4 rounded-lg border transition-colors',
                    meta.bg, meta.border,
                  )}
                >
                  <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-white/80')}>
                    <Icon className="h-4.5 w-4.5 text-slate-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{item.label}</p>
                      <Badge variant="outline" className={cn('shrink-0', meta.color, meta.border, 'bg-white')}>
                        <StatusIcon className="h-3 w-3 mr-1" /> {meta.label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      <span>Weight: <strong className="text-slate-700">{item.weight}%</strong></span>
                      <span className="text-slate-300">•</span>
                      <span className="capitalize">{item.key.replace(/_/g, ' ')}</span>
                    </div>
                    {item.note && <p className="text-xs text-slate-600 mt-2 italic">{item.note}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Application Journey Timeline */}
      <Card className="p-6 border-0 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Application Journey Timeline</h3>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-10">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No timeline events yet. Activity will appear here as your application progresses.</p>
          </div>
        ) : (
          <div className="relative pl-6 max-h-[480px] overflow-y-auto alo-scrollbar pr-2">
            <div className="absolute top-1.5 bottom-1.5 left-2 w-px bg-slate-200" />
            <div className="space-y-4">
              {timeline.map((entry) => {
                const meta = TIMELINE_EVENT_META[entry.eventType] || TIMELINE_EVENT_META.default
                const Icon = meta.icon
                return (
                  <div key={entry.id} className="relative">
                    <div className={cn('absolute -left-[18px] top-1 h-4 w-4 rounded-full flex items-center justify-center ring-2 ring-white', meta.bg)}>
                      <Icon className={cn('h-2.5 w-2.5', meta.color)} />
                    </div>
                    <div className="ml-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-slate-900">{entry.title}</p>
                        <Badge variant="outline" className="text-[10px] capitalize bg-slate-50 text-slate-500 border-slate-200">
                          {entry.actorType}
                        </Badge>
                      </div>
                      {entry.description && <p className="text-xs text-slate-500 mt-0.5">{entry.description}</p>}
                      <p className="text-[11px] text-slate-400 mt-1">{formatDate(entry.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
